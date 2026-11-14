#!/usr/bin/env node
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { animationCatalog, describeAnimation, isAnimationId } from './catalog';
import { AutomationCore } from './core';
import { createRemotionRenderer } from './remotion-adapter';
import { inspectMedia } from './inspect';
import type { HostContext } from './contracts';

interface CliOptions {
  json: boolean;
  outputRoot?: string;
  tempRoot?: string;
}

function parseFlags(args: string[]): { command: string; positional: string[]; options: CliOptions } {
  const positional: string[] = [];
  let json = false;
  let outputRoot: string | undefined;
  let tempRoot: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--json') {
      json = true;
    } else if (arg === '--output-root' && i + 1 < args.length) {
      outputRoot = args[++i];
    } else if (arg === '--temp-root' && i + 1 < args.length) {
      tempRoot = args[++i];
    } else {
      positional.push(arg);
    }
  }

  const command = positional[0] ?? 'help';
  return { command, positional: positional.slice(1), options: { json, outputRoot, tempRoot } };
}

function outputResult(data: unknown, options: CliOptions) {
  if (options.json) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  } else {
    if (typeof data === 'string') {
      console.log(data);
    } else {
      console.dir(data, { depth: null, colors: true });
    }
  }
}

function outputError(message: string, code: string = 'CLI_ERROR', options: CliOptions, exitCode: number = 1) {
  if (options.json) {
    process.stdout.write(JSON.stringify({ success: false, error: { code, message } }, null, 2) + '\n');
  } else {
    console.error(`[Error ${code}] ${message}`);
  }
  process.exit(exitCode);
}

async function getHost(options: CliOptions): Promise<HostContext> {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const outputRoot = options.outputRoot
    ? path.resolve(options.outputRoot)
    : path.resolve(projectRoot, 'public', 'renders');
  const tempRoot = options.tempRoot
    ? path.resolve(options.tempRoot)
    : path.resolve(projectRoot, '.automation-runtime', 'jobs');

  await fs.mkdir(outputRoot, { recursive: true });
  await fs.mkdir(tempRoot, { recursive: true });

  return {
    outputRoot,
    tempRoot,
    platform: process.platform,
    gpuEnabled: !['0', 'false'].includes((process.env.REMOTION_USE_GPU ?? '').toLowerCase()),
  };
}

async function loadRequestJson(pathOrJson: string): Promise<unknown> {
  const baseDir = process.env.INVOKER_CWD || process.cwd();
  const resolvedPath = path.isAbsolute(pathOrJson) ? pathOrJson : path.resolve(baseDir, pathOrJson);
  try {
    const stat = await fs.stat(resolvedPath);
    if (stat.isFile()) {
      const content = await fs.readFile(resolvedPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // If not a readable file path, attempt parsing directly as inline JSON string
  }
  return JSON.parse(pathOrJson);
}

export async function runCli(argv: string[] = process.argv.slice(2)) {
  const { command, positional, options } = parseFlags(argv);

  switch (command) {
    case 'list': {
      const list = animationCatalog.map((item) => ({
        id: item.id,
        name: item.name,
        family: item.family,
        description: item.description,
      }));
      outputResult({ success: true, animations: list }, options);
      break;
    }

    case 'describe': {
      const id = positional[0];
      if (!id) {
        outputError('Missing animationId argument. Usage: text-animation describe <animationId>', 'MISSING_ARGUMENT', options);
      }
      if (!isAnimationId(id)) {
        outputError(`Unknown animationId: "${id}". Use "text-animation list" to view supported animations.`, 'UNKNOWN_ANIMATION', options);
      } else {
        const desc = describeAnimation(id);
        outputResult({ success: true, animation: desc }, options);
      }
      break;
    }

    case 'render': {
      const inputArg = positional[0];
      if (!inputArg) {
        outputError('Missing request input. Usage: text-animation render <request.json>', 'MISSING_ARGUMENT', options);
      }
      let requestData: unknown;
      try {
        requestData = await loadRequestJson(inputArg);
      } catch (err) {
        outputError(`Invalid JSON input: ${err instanceof Error ? err.message : String(err)}`, 'INVALID_JSON', options);
      }

      try {
        const host = await getHost(options);
        const projectRoot = path.resolve(__dirname, '..', '..');
        const renderer = await createRemotionRenderer({ rootDir: projectRoot });
        const core = new AutomationCore({ renderer });
        const result = await core.render(requestData, host);

        if (result.status === 'succeeded' && result.artifact) {
          outputResult(
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
            options
          );
        } else {
          outputResult(
            {
              success: false,
              jobId: result.jobId,
              status: result.status,
              error: 'error' in result ? result.error : { code: 'UNKNOWN_ERROR', message: 'Render failed' },
              diagnostics: result.diagnostics,
            },
            options
          );
          process.exit(1);
        }
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err), 'RENDER_EXCEPTION', options);
      }
      break;
    }

    case 'still': {
      const inputArg = positional[0];
      if (!inputArg) {
        outputError('Missing request input. Usage: text-animation still <request.json>', 'MISSING_ARGUMENT', options);
      }
      let requestData: unknown;
      try {
        requestData = await loadRequestJson(inputArg);
      } catch (err) {
        outputError(`Invalid JSON input: ${err instanceof Error ? err.message : String(err)}`, 'INVALID_JSON', options);
      }

      try {
        const host = await getHost(options);
        const projectRoot = path.resolve(__dirname, '..', '..');
        const renderer = await createRemotionRenderer({ rootDir: projectRoot });
        const core = new AutomationCore({ renderer });
        const result = await core.still(requestData, host);

        if (result.status === 'succeeded' && result.artifact) {
          outputResult(
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
            options
          );
        } else {
          outputResult(
            {
              success: false,
              jobId: result.jobId,
              status: result.status,
              error: 'error' in result ? result.error : { code: 'UNKNOWN_ERROR', message: 'Render still failed' },
              diagnostics: result.diagnostics,
            },
            options
          );
          process.exit(1);
        }
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err), 'RENDER_EXCEPTION', options);
      }
      break;
    }

    case 'inspect': {
      const artifactPath = positional[0];
      if (!artifactPath) {
        outputError('Missing artifact path. Usage: text-animation inspect <artifactPath>', 'MISSING_ARGUMENT', options);
      }
      try {
        const info = await inspectMedia(artifactPath);
        outputResult({ success: true, media: info }, options);
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err), 'INSPECT_FAILED', options);
      }
      break;
    }

    case 'help':
    default: {
      console.log(`Text Animation Automation CLI

Usage:
  text-animation list [--json]
  text-animation describe <animationId> [--json]
  text-animation render <request.json|inline-json> [--json] [--output-root <dir>] [--temp-root <dir>]
  text-animation still <request.json|inline-json> [--json] [--output-root <dir>] [--temp-root <dir>]
  text-animation inspect <artifactPath> [--json]

Options:
  --json          Machine-readable JSON output on stdout
  --output-root   Directory for published artifacts
  --temp-root     Directory for staging and temporary job data
`);
      break;
    }
  }
}

if (require.main === module || (typeof process.env.RUN_CLI !== 'undefined' && process.env.RUN_CLI === 'true')) {
  runCli().catch((err) => {
    console.error('Fatal CLI exception:', err);
    process.exit(1);
  });
}
