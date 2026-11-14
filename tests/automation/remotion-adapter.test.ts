import { describe, expect, it, vi } from 'vitest';

vi.mock('@remotion/bundler', () => ({
  bundle: vi.fn(async () => 'http://localhost:3000/bundle'),
}));

vi.mock('@remotion/renderer', () => ({
  getCompositions: vi.fn(async () => [{ id: 'Main', width: 1920, height: 1080, durationInFrames: 60 }]),
  renderMedia: vi.fn(async () => undefined),
  renderFrames: vi.fn(async () => undefined),
}));

import { createRemotionRenderer, bundleRemotionRoot } from '@/automation/remotion-adapter';

describe('Remotion real headless adapter unit contract', () => {
  it('exports bundleRemotionRoot and createRemotionRenderer', () => {
    expect(bundleRemotionRoot).toBeTypeOf('function');
    expect(createRemotionRenderer).toBeTypeOf('function');
  });

  it('creates a renderer conforming to the Automation Renderer interface', async () => {
    const renderer = await createRemotionRenderer();
    expect(renderer).toBeDefined();
    expect(renderer.getCompositions).toBeTypeOf('function');
    expect(renderer.renderVideo).toBeTypeOf('function');
    expect(renderer.renderStill).toBeTypeOf('function');
  });
});

