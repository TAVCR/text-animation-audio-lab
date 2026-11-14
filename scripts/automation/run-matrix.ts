import path from 'node:path';
import { promises as fs } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { AutomationCore } from '../../src/automation/core';
import { createRemotionRenderer } from '../../src/automation/remotion-adapter';
import type { HostContext, OutputProfile } from '../../src/automation/contracts';
import type { AspectRatio } from '../../src/lib/videoConfig';

const execFileAsync = promisify(execFile);

interface ProbeStream {
  index: number;
  codec_name?: string;
  codec_type?: string;
  width?: number;
  height?: number;
  pix_fmt?: string;
  r_frame_rate?: string;
  duration?: string;
  color_range?: string;
  profile?: string;
}

interface ProbeFormat {
  format_name?: string;
  duration?: string;
  size?: string;
}

interface ProbeOutput {
  streams: ProbeStream[];
  format: ProbeFormat;
}

async function probeMedia(filePath: string): Promise<ProbeOutput> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'stream=index,codec_name,codec_type,profile,width,height,pix_fmt,color_range,r_frame_rate,duration:format=duration,size,format_name',
    '-of', 'json',
    filePath,
  ]);
  return JSON.parse(stdout);
}

const ratios: Array<{ ratio: AspectRatio; expectedDims: { width: number; height: number } }> = [
  { ratio: '9:16', expectedDims: { width: 1080, height: 1920 } },
  { ratio: '16:9', expectedDims: { width: 1920, height: 1080 } },
  { ratio: '1:1', expectedDims: { width: 1080, height: 1080 } },
];

const profiles: OutputProfile[] = [
  'png-alpha',
  'h264-opaque',
  'prores4444-alpha',
  'vp9-alpha',
];

interface MatrixRow {
  profile: OutputProfile;
  ratio: AspectRatio;
  status: 'succeeded' | 'failed';
  error?: string;
  container?: string;
  codec?: string;
  codecProfile?: string;
  pixFmt?: string;
  colorRange?: string;
  alpha: 'YES' | 'NO' | 'UNKNOWN';
  width?: number;
  height?: number;
  fps?: string;
  duration?: string;
  size?: number;
}

async function runMatrix() {
  console.log('=== STARTING REAL MEDIA PROFILE MATRIX (PHASE C1) ===\n');

  const outputRoot = path.resolve(process.cwd(), '.automation-runtime', 'matrix-renders');
  const tempRoot = path.resolve(process.cwd(), '.automation-runtime', 'matrix-temp');

  await fs.mkdir(outputRoot, { recursive: true });
  await fs.mkdir(tempRoot, { recursive: true });

  const host: HostContext = {
    outputRoot,
    tempRoot,
    platform: process.platform,
    gpuEnabled: false, // Deterministic software CPU rendering
  };

  const renderer = await createRemotionRenderer();
  const core = new AutomationCore({ renderer });

  const results: MatrixRow[] = [];

  for (const profile of profiles) {
    for (const { ratio, expectedDims } of ratios) {
      const outputName = `matrix-${profile}-${ratio.replace(':', 'x')}`;
      console.log(`Rendering [${profile}] @ [${ratio}] (${expectedDims.width}x${expectedDims.height})...`);

      try {
        let res;
        if (profile === 'png-alpha') {
          res = await core.still(
            {
              schemaVersion: 1,
              animationId: 'typewriter',
              text: 'MEDIA PROFILE TEST',
              aspectRatio: ratio,
              resolutionPreset: '1080p',
              profile,
              durationInFrames: 60,
              frameIndex: 30,
              gpuPolicy: 'auto',
              parameters: {},
              outputName,
            },
            host
          );
        } else {
          res = await core.render(
            {
              schemaVersion: 1,
              animationId: 'typewriter',
              text: 'MEDIA PROFILE TEST',
              aspectRatio: ratio,
              resolutionPreset: '1080p',
              profile,
              durationInFrames: 60,
              gpuPolicy: 'auto',
              parameters: {},
              outputName,
            },
            host
          );
        }

        if (res.status === 'succeeded' && res.artifact) {
          const probe = await probeMedia(res.artifact.outputPath);
          const videoStream = probe.streams.find((s) => s.codec_type === 'video') ?? probe.streams[0];

          let alpha: 'YES' | 'NO' | 'UNKNOWN' = 'NO';
          if (profile === 'png-alpha') {
            alpha = videoStream?.pix_fmt?.includes('a') ? 'YES' : 'NO';
          } else if (profile === 'prores4444-alpha') {
            alpha = videoStream?.pix_fmt?.includes('a') ? 'YES' : 'NO';
          } else if (profile === 'vp9-alpha') {
            alpha = videoStream?.pix_fmt?.includes('a') ? 'YES' : 'UNKNOWN';
          }

          results.push({
            profile,
            ratio,
            status: 'succeeded',
            container: probe.format.format_name,
            codec: videoStream?.codec_name,
            codecProfile: videoStream?.profile,
            pixFmt: videoStream?.pix_fmt,
            colorRange: videoStream?.color_range,
            alpha,
            width: videoStream?.width,
            height: videoStream?.height,
            fps: videoStream?.r_frame_rate,
            duration: videoStream?.duration ?? probe.format.duration,
            size: res.artifact.bytes,
          });
          console.log(`  -> SUCCESS: ${res.artifact.outputPath} (${res.artifact.bytes} bytes, ${videoStream?.codec_name}, ${videoStream?.pix_fmt})`);
        } else {
          const errMsg = res.status === 'failed' ? res.error.message : 'Not succeeded';
          console.error(`  -> FAILED: ${errMsg}`);
          results.push({
            profile,
            ratio,
            status: 'failed',
            error: errMsg,
            alpha: 'UNKNOWN',
          });
        }
      } catch (err) {
        console.error(`  -> EXCEPTION:`, err);
        results.push({
          profile,
          ratio,
          status: 'failed',
          error: String(err),
          alpha: 'UNKNOWN',
        });
      }
    }
  }

  console.log('\n=== MATRIX EXECUTION COMPLETE ===\n');
  console.log(JSON.stringify(results, null, 2));

  await fs.writeFile(
    path.join(outputRoot, 'matrix-results.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );
}

runMatrix().catch((err) => {
  console.error('Fatal Matrix Error:', err);
  process.exit(1);
});
