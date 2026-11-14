import path from 'node:path';
import { promises as fs } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { AutomationCore } from '../../src/automation/core';
import { createRemotionRenderer } from '../../src/automation/remotion-adapter';
import type { HostContext } from '../../src/automation/contracts';

const execFileAsync = promisify(execFile);

async function probeMedia(filePath: string) {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'stream=index,codec_name,codec_type,width,height,pix_fmt,r_frame_rate,duration:format=duration,size,format_name',
      '-of', 'json',
      filePath,
    ]);
    return JSON.parse(stdout);
  } catch (error) {
    return { error: String(error) };
  }
}

async function run() {
  console.log('--- STARTING HEADLESS POC ---');
  console.log(`Node version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Process cwd: ${process.cwd()}`);

  const outputRoot = path.resolve(process.cwd(), '.automation-runtime', 'poc-renders');
  const tempRoot = path.resolve(process.cwd(), '.automation-runtime', 'poc-temp');

  await fs.mkdir(outputRoot, { recursive: true });
  await fs.mkdir(tempRoot, { recursive: true });

  const host: HostContext = {
    outputRoot,
    tempRoot,
    platform: process.platform,
    gpuEnabled: false, // Ensure deterministic CPU execution for first POC steps
  };

  console.log('\n[1/3] Initializing Remotion real adapter...');
  const renderer = await createRemotionRenderer();
  const core = new AutomationCore({ renderer });

  // STEP 2: REAL PNG
  console.log('\n[2/3] Executing STEP 2: Real PNG Still (typewriter, 1080x1920, png-alpha, frame 30)...');
  const pngResult = await core.still(
    {
      schemaVersion: 1,
      animationId: 'typewriter',
      text: 'HEADLESS TEST',
      aspectRatio: '9:16',
      resolutionPreset: '1080p',
      profile: 'png-alpha',
      durationInFrames: 60,
      frameIndex: 30,
      gpuPolicy: 'auto',
      parameters: {},
      outputName: 'headless-poc-typewriter',
    },
    host
  );

  console.log('PNG Result Status:', pngResult.status);
  if (pngResult.status !== 'succeeded' || !pngResult.artifact) {
    if (pngResult.status === 'failed') console.error('PNG Render Failed:', pngResult.error);
    process.exit(1);
  }
  console.log('PNG Artifact Output Path:', pngResult.artifact.outputPath);
  console.log('PNG Artifact Bytes:', pngResult.artifact.bytes);

  const pngProbe = await probeMedia(pngResult.artifact.outputPath);
  console.log('PNG ffprobe details:', JSON.stringify(pngProbe, null, 2));

  // STEP 3: REAL H264 MP4
  console.log('\n[3/3] Executing STEP 3: Real Video H264 (typewriter, 1080x1920, h264-opaque, 60 frames)...');
  const h264Result = await core.render(
    {
      schemaVersion: 1,
      animationId: 'typewriter',
      text: 'HEADLESS TEST',
      aspectRatio: '9:16',
      resolutionPreset: '1080p',
      profile: 'h264-opaque',
      durationInFrames: 60,
      gpuPolicy: 'auto',
      parameters: {},
      outputName: 'headless-poc-typewriter-h264',
    },
    host
  );

  console.log('H264 Result Status:', h264Result.status);
  if (h264Result.status !== 'succeeded' || !h264Result.artifact) {
    if (h264Result.status === 'failed') console.error('H264 Render Failed:', h264Result.error);
    process.exit(1);
  }
  console.log('H264 Artifact Output Path:', h264Result.artifact.outputPath);
  console.log('H264 Artifact Bytes:', h264Result.artifact.bytes);

  const h264Probe = await probeMedia(h264Result.artifact.outputPath);
  console.log('H264 ffprobe details:', JSON.stringify(h264Probe, null, 2));

  // STEP 4: ALPHA PROBE (prores4444-alpha)
  console.log('\n[4/4] Executing STEP 4: Real Alpha Video ProRes4444 (typewriter, 1080x1920, prores4444-alpha, 60 frames)...');
  try {
    const proresResult = await core.render(
      {
        schemaVersion: 1,
        animationId: 'typewriter',
        text: 'HEADLESS TEST',
        aspectRatio: '9:16',
        resolutionPreset: '1080p',
        profile: 'prores4444-alpha',
        durationInFrames: 60,
        gpuPolicy: 'auto',
        parameters: {},
        outputName: 'headless-poc-typewriter-prores',
      },
      host
    );

    console.log('ProRes Result Status:', proresResult.status);
    if (proresResult.status === 'succeeded' && proresResult.artifact) {
      console.log('ProRes Artifact Output Path:', proresResult.artifact.outputPath);
      console.log('ProRes Artifact Bytes:', proresResult.artifact.bytes);
      const proresProbe = await probeMedia(proresResult.artifact.outputPath);
      console.log('ProRes ffprobe details:', JSON.stringify(proresProbe, null, 2));
    } else if (proresResult.status === 'failed') {
      console.log('ProRes Render Error:', proresResult.error);
    }
  } catch (err) {
    console.log('ProRes execution exception:', err);
  }

  console.log('\n--- HEADLESS POC FINISHED ---');
}

run().catch((err) => {
  console.error('Fatal POC error:', err);
  process.exit(1);
});
