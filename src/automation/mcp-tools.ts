import path from 'node:path';
import { promises as fs } from 'node:fs';
import { animationCatalog, describeAnimation, isAnimationId } from './catalog';
import { AutomationCore } from './core';
import { createRemotionRenderer } from './remotion-adapter';
import { inspectMedia } from './inspect';
import type { HostContext } from './contracts';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const TEXT_ANIMATION_TOOLS: McpToolDefinition[] = [
  {
    name: 'list_animations',
    description: 'Lists all available Text Animation animation styles and their metadata.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'describe_animation',
    description: 'Returns the parameter schema, capabilities, and accepted controls for a specific animation style.',
    inputSchema: {
      type: 'object',
      properties: {
        animationId: {
          type: 'string',
          description: 'The unique identifier of the animation (e.g. "typewriter", "bubble-pop").',
        },
      },
      required: ['animationId'],
    },
  },
  {
    name: 'render_animation',
    description: 'Renders an animated text video headlessly via Automation Core.',
    inputSchema: {
      type: 'object',
      properties: {
        animationId: {
          type: 'string',
          description: 'Supported animation identifier.',
        },
        text: {
          type: 'string',
          description: 'The text string to animate.',
        },
        aspectRatio: {
          type: 'string',
          enum: ['16:9', '9:16', '1:1'],
          description: 'Video aspect ratio. Defaults to 9:16.',
        },
        resolutionPreset: {
          type: 'string',
          enum: ['1080p', '1440p', '4k', '8k'],
          description: 'Resolution preset. Defaults to 1080p.',
        },
        profile: {
          type: 'string',
          enum: ['h264-opaque', 'prores4444-alpha', 'vp9-alpha'],
          description: 'Video profile. Use prores4444-alpha or vp9-alpha for transparent video.',
        },
        durationInFrames: {
          type: 'number',
          description: 'Total video duration in frames at 30 fps (e.g. 60 = 2.0 seconds).',
        },
        parameters: {
          type: 'object',
          description: 'Custom animation parameters corresponding to the animation schema.',
        },
        outputName: {
          type: 'string',
          description: 'Optional clean file name for the output artifact without extension.',
        },
      },
      required: ['animationId', 'text'],
    },
  },
  {
    name: 'render_still',
    description: 'Renders a single frame still image (PNG with alpha) headlessly via Automation Core.',
    inputSchema: {
      type: 'object',
      properties: {
        animationId: {
          type: 'string',
          description: 'Supported animation identifier.',
        },
        text: {
          type: 'string',
          description: 'The text string to animate.',
        },
        aspectRatio: {
          type: 'string',
          enum: ['16:9', '9:16', '1:1'],
          description: 'Image aspect ratio. Defaults to 9:16.',
        },
        resolutionPreset: {
          type: 'string',
          enum: ['1080p', '1440p', '4k', '8k'],
          description: 'Resolution preset. Defaults to 1080p.',
        },
        frameIndex: {
          type: 'number',
          description: '0-based frame index to capture.',
        },
        durationInFrames: {
          type: 'number',
          description: 'Timeline duration context. Defaults to 60.',
        },
        parameters: {
          type: 'object',
          description: 'Custom animation parameters.',
        },
        outputName: {
          type: 'string',
          description: 'Optional clean file name for the output artifact without extension.',
        },
      },
      required: ['animationId', 'text', 'frameIndex'],
    },
  },
  {
    name: 'inspect_render',
    description: 'Inspects a rendered media artifact using ffprobe and verifies its codec, dimensions, and alpha channel.',
    inputSchema: {
      type: 'object',
      properties: {
        artifactPath: {
          type: 'string',
          description: 'Absolute or relative path to the artifact file.',
        },
      },
      required: ['artifactPath'],
    },
  },
];

export async function executeMcpTool(
  name: string,
  args: Record<string, unknown> = {},
  hostContext?: Partial<HostContext>
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const outputRoot = hostContext?.outputRoot ?? path.resolve(projectRoot, 'public', 'renders');
  const tempRoot = hostContext?.tempRoot ?? path.resolve(projectRoot, '.automation-runtime', 'jobs');

  await fs.mkdir(outputRoot, { recursive: true });
  await fs.mkdir(tempRoot, { recursive: true });

  const host: HostContext = {
    outputRoot,
    tempRoot,
    platform: hostContext?.platform ?? process.platform,
    gpuEnabled: hostContext?.gpuEnabled ?? !['0', 'false'].includes((process.env.REMOTION_USE_GPU ?? '').toLowerCase()),
  };

  switch (name) {
    case 'list_animations': {
      const list = animationCatalog.map((item) => ({
        id: item.id,
        name: item.name,
        family: item.family,
        description: item.description,
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, count: list.length, animations: list }, null, 2) }],
      };
    }

    case 'describe_animation': {
      const id = String(args.animationId ?? '');
      if (!isAnimationId(id)) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: false, error: `Unknown animationId: "${id}". Use list_animations to see supported IDs.` },
                null,
                2
              ),
            },
          ],
        };
      }
      const desc = describeAnimation(id);
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, animation: desc }, null, 2) }],
      };
    }

    case 'render_animation': {
      const animationId = String(args.animationId ?? '');
      const text = String(args.text ?? '');
      const aspectRatio = (args.aspectRatio ?? '9:16') as '16:9' | '9:16' | '1:1';
      const resolutionPreset = (args.resolutionPreset ?? '1080p') as '1080p' | '1440p' | '4k' | '8k';
      const profile = (args.profile ?? 'h264-opaque') as 'h264-opaque' | 'prores4444-alpha' | 'vp9-alpha';
      const durationInFrames = typeof args.durationInFrames === 'number' ? args.durationInFrames : 60;
      const parameters = (args.parameters && typeof args.parameters === 'object' && !Array.isArray(args.parameters))
        ? (args.parameters as Record<string, unknown>)
        : {};
      const outputName = typeof args.outputName === 'string' ? args.outputName : undefined;

      // Defensive check: disallow path traversal characters in outputName
      if (outputName && (outputName.includes('..') || outputName.includes('/') || outputName.includes('\\'))) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: false, error: 'Invalid outputName: path separators and traversal are forbidden.' },
                null,
                2
              ),
            },
          ],
        };
      }

      const renderer = await createRemotionRenderer({ rootDir: projectRoot });
      const core = new AutomationCore({ renderer });

      const requestPayload = {
        schemaVersion: 1 as const,
        animationId,
        text,
        aspectRatio,
        resolutionPreset,
        durationInFrames,
        profile,
        gpuPolicy: 'auto' as const,
        parameters,
        ...(outputName ? { outputName } : {}),
      };

      const result = await core.render(requestPayload, host);
      if (result.status === 'succeeded' && result.artifact) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  jobId: result.jobId,
                  artifact: {
                    path: result.artifact.outputPath,
                    profile: result.artifact.profile,
                    width: result.artifact.width,
                    height: result.artifact.height,
                    fps: result.artifact.compositionFps,
                    duration: result.artifact.durationSeconds,
                    codec: result.artifact.codec,
                    pixelFormat: result.artifact.pixelFormat,
                    alpha: result.artifact.alpha === 'configured',
                    size: result.artifact.bytes,
                  },
                  diagnostics: result.diagnostics,
                },
                null,
                2
              ),
            },
          ],
        };
      } else {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  jobId: result.jobId,
                  status: result.status,
                  error: 'error' in result ? result.error : { code: 'UNKNOWN_ERROR', message: 'Render failed' },
                  diagnostics: result.diagnostics,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }

    case 'render_still': {
      const animationId = String(args.animationId ?? '');
      const text = String(args.text ?? '');
      const aspectRatio = (args.aspectRatio ?? '9:16') as '16:9' | '9:16' | '1:1';
      const resolutionPreset = (args.resolutionPreset ?? '1080p') as '1080p' | '1440p' | '4k' | '8k';
      const frameIndex = typeof args.frameIndex === 'number' ? args.frameIndex : 0;
      const durationInFrames = typeof args.durationInFrames === 'number' ? args.durationInFrames : 60;
      const parameters = (args.parameters && typeof args.parameters === 'object' && !Array.isArray(args.parameters))
        ? (args.parameters as Record<string, unknown>)
        : {};
      const outputName = typeof args.outputName === 'string' ? args.outputName : undefined;

      if (outputName && (outputName.includes('..') || outputName.includes('/') || outputName.includes('\\'))) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: false, error: 'Invalid outputName: path separators and traversal are forbidden.' },
                null,
                2
              ),
            },
          ],
        };
      }

      const renderer = await createRemotionRenderer({ rootDir: projectRoot });
      const core = new AutomationCore({ renderer });

      const requestPayload = {
        schemaVersion: 1 as const,
        animationId,
        text,
        aspectRatio,
        resolutionPreset,
        durationInFrames,
        frameIndex,
        profile: 'png-alpha' as const,
        gpuPolicy: 'auto' as const,
        parameters,
        ...(outputName ? { outputName } : {}),
      };

      const result = await core.still(requestPayload, host);
      if (result.status === 'succeeded' && result.artifact) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  jobId: result.jobId,
                  artifact: {
                    path: result.artifact.outputPath,
                    profile: result.artifact.profile,
                    frameIndex: result.artifact.frameIndex,
                    width: result.artifact.width,
                    height: result.artifact.height,
                    codec: result.artifact.codec,
                    alpha: result.artifact.alpha === 'configured',
                    size: result.artifact.bytes,
                  },
                  diagnostics: result.diagnostics,
                },
                null,
                2
              ),
            },
          ],
        };
      } else {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  jobId: result.jobId,
                  status: result.status,
                  error: 'error' in result ? result.error : { code: 'UNKNOWN_ERROR', message: 'Render still failed' },
                  diagnostics: result.diagnostics,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }

    case 'inspect_render': {
      const artifactPath = String(args.artifactPath ?? '');
      if (!artifactPath) {
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: 'Missing artifactPath.' }, null, 2) }],
        };
      }
      try {
        const info = await inspectMedia(artifactPath);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, media: info }, null, 2) }],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: false, error: err instanceof Error ? err.message : String(err) },
                null,
                2
              ),
            },
          ],
        };
      }
    }

    default:
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: `Unknown tool: "${name}"` }, null, 2) }],
      };
  }
}
