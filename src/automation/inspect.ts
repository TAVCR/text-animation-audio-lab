import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { promises as fs } from 'node:fs';

const execFileAsync = promisify(execFile);

export interface ProbeStream {
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

export interface ProbeFormat {
  format_name?: string;
  duration?: string;
  size?: string;
}

export interface MediaInspection {
  path: string;
  container?: string;
  codec?: string;
  codecProfile?: string;
  pixelFormat?: string;
  colorRange?: string;
  alpha: boolean;
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  fileSize: number;
}

export async function inspectMedia(filePath: string): Promise<MediaInspection> {
  const resolved = path.resolve(filePath);
  const stat = await fs.stat(resolved);

  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'stream=index,codec_name,codec_type,profile,width,height,pix_fmt,color_range,r_frame_rate,duration:stream_tags=alpha_mode:format=duration,size,format_name',
    '-of', 'json',
    resolved,
  ]);

  const probe = JSON.parse(stdout) as {
    streams: (ProbeStream & { tags?: { alpha_mode?: string } })[];
    format: ProbeFormat;
  };

  const videoStream = probe.streams.find((s) => s.codec_type === 'video') ?? probe.streams[0];
  const pixFmt = videoStream?.pix_fmt ?? '';
  const isAlpha =
    pixFmt.includes('a') ||
    videoStream?.tags?.alpha_mode === '1' ||
    videoStream?.codec_name === 'png';

  let fps: number | undefined;
  if (videoStream?.r_frame_rate) {
    const parts = videoStream.r_frame_rate.split('/');
    if (parts.length === 2 && Number(parts[1]) > 0) {
      fps = Math.round(Number(parts[0]) / Number(parts[1]));
    } else {
      fps = Number(videoStream.r_frame_rate);
    }
  }

  const duration = videoStream?.duration
    ? Number(videoStream.duration)
    : probe.format.duration
    ? Number(probe.format.duration)
    : undefined;

  return {
    path: resolved,
    container: probe.format.format_name,
    codec: videoStream?.codec_name,
    codecProfile: videoStream?.profile,
    pixelFormat: videoStream?.pix_fmt,
    colorRange: videoStream?.color_range,
    alpha: isAlpha,
    width: videoStream?.width,
    height: videoStream?.height,
    fps,
    duration,
    fileSize: stat.size,
  };
}
