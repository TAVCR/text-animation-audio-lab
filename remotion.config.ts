import { Config } from '@remotion/cli/config';
import path from 'node:path';

type GlBackend = 'angle' | 'egl' | 'swiftshader' | 'vulkan' | 'angle-egl' | 'swangle';

const allowed: ReadonlySet<GlBackend> = new Set<GlBackend>([
  'angle',
  'egl',
  'swiftshader',
  'vulkan',
  'angle-egl',
  'swangle',
]);

const envGl = (process.env.REMOTION_GL ?? '').trim().toLowerCase();
const platformDefault: GlBackend = process.platform === 'linux' ? 'angle-egl' : 'angle';
const renderer = allowed.has(envGl as GlBackend) ? (envGl as GlBackend) : platformDefault;

Config.setChromiumOpenGlRenderer(renderer);

// Remotion hardware accelerated encoding is currently platform-limited.
// Enable where supported.
if (process.platform === 'darwin') {
  Config.setHardwareAcceleration('if-possible');
}

Config.overrideWebpackConfig((currentConfiguration) => {
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: {
        ...(currentConfiguration.resolve?.alias ?? {}),
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
  };
});
