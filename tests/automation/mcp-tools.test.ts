import { describe, expect, it, vi } from 'vitest';

vi.mock('@remotion/bundler', () => ({
  bundle: vi.fn(async () => 'http://localhost:3000/bundle'),
}));

vi.mock('@remotion/renderer', () => ({
  getCompositions: vi.fn(async () => [{ id: 'Main', width: 1920, height: 1080, durationInFrames: 60 }]),
  renderMedia: vi.fn(async () => undefined),
  renderFrames: vi.fn(async () => undefined),
}));

import { TEXT_ANIMATION_TOOLS, executeMcpTool } from '@/automation/mcp-tools';

describe('MCP Tools Unit Contract', () => {
  it('exposes exactly 5 closed tools', () => {
    expect(TEXT_ANIMATION_TOOLS).toHaveLength(5);
    const names = TEXT_ANIMATION_TOOLS.map((t) => t.name);
    expect(names).toEqual([
      'list_animations',
      'describe_animation',
      'render_animation',
      'render_still',
      'inspect_render',
    ]);
  });

  it('lists 32 animations in list_animations', async () => {
    const res = await executeMcpTool('list_animations', {});
    expect(res.isError).toBeFalsy();
    const data = JSON.parse(res.content[0].text);
    expect(data.success).toBe(true);
    expect(data.count).toBe(32);
    expect(data.animations.some((a: { id: string }) => a.id === 'typewriter')).toBe(true);
  });

  it('describes an animation schema in describe_animation', async () => {
    const res = await executeMcpTool('describe_animation', { animationId: 'typewriter' });
    expect(res.isError).toBeFalsy();
    const data = JSON.parse(res.content[0].text);
    expect(data.success).toBe(true);
    expect(data.animation.id).toBe('typewriter');
    expect(Array.isArray(data.animation.schema)).toBe(true);
  });

  it('rejects unknown animation in describe_animation', async () => {
    const res = await executeMcpTool('describe_animation', { animationId: 'unknown-one' });
    expect(res.isError).toBe(true);
    const data = JSON.parse(res.content[0].text);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unknown animationId');
  });

  it('rejects path traversal in outputName for render_animation', async () => {
    const res = await executeMcpTool('render_animation', {
      animationId: 'typewriter',
      text: 'TRAVERSAL TEST',
      outputName: '../../malicious',
    });
    expect(res.isError).toBe(true);
    const data = JSON.parse(res.content[0].text);
    expect(data.success).toBe(false);
    expect(data.error).toContain('path separators and traversal');
  });

  it('rejects invalid animation parameter via Core validation', async () => {
    const res = await executeMcpTool('render_animation', {
      animationId: 'typewriter',
      text: 'BAD PARAM',
      parameters: {
        unknownCustomKey: 'forbidden',
      },
    });
    expect(res.isError).toBe(true);
    const data = JSON.parse(res.content[0].text);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_REQUEST');
  });
});
