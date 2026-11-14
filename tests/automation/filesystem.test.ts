import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { cleanupJob, validateOutputName } from '@/automation/filesystem';

describe('N02 filesystem boundary', () => {
  it.each(['../escape','..\\escape','C:\\absolute','\\\\server\\share','name:stream','CON','file.','file ','a/b'])('rejects %s', (name) => expect(() => validateOutputName(name)).toThrow());
  it('accepts basename', () => expect(validateOutputName('title_01')).toBe('title_01'));

  it('rejects jobDir outside tempRoot', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-test-'));
    const tempRoot = path.join(root, 'tmp');
    const outsideDir = path.join(root, 'outside');
    await fs.mkdir(tempRoot, { recursive: true });
    await fs.mkdir(outsideDir, { recursive: true });

    await expect(cleanupJob(outsideDir, undefined, tempRoot)).rejects.toMatchObject({
      code: 'OUTPUT_OUTSIDE_ROOT',
    });

    await fs.rm(root, { recursive: true, force: true });
  });

  it('rejects jobDir that is tempRoot itself (not a child)', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-test-'));
    const tempRoot = path.join(root, 'tmp');
    await fs.mkdir(tempRoot, { recursive: true });

    await expect(cleanupJob(tempRoot, undefined, tempRoot)).rejects.toMatchObject({
      code: 'OUTPUT_OUTSIDE_ROOT',
    });

    await fs.rm(root, { recursive: true, force: true });
  });

  it('cleans up own reservation correctly (Test A)', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-test-'));
    const host = { outputRoot: path.join(root, 'out'), tempRoot: path.join(root, 'tmp') };
    const pathsA = await (await import('@/automation/filesystem')).createJobPaths(host, 'a', '.mov');

    expect(await fs.stat(pathsA.reservation).catch(() => null)).not.toBeNull();
    expect(await fs.stat(pathsA.staging).catch(() => null)).not.toBeNull();

    await expect(cleanupJob(pathsA.staging, pathsA.reservation, pathsA.tempRoot)).resolves.toBeUndefined();

    // Both staging and its own reservation must be removed
    expect(await fs.stat(pathsA.reservation).catch(() => null)).toBeNull();
    expect(await fs.stat(pathsA.staging).catch(() => null)).toBeNull();

    await fs.rm(root, { recursive: true, force: true });
  });

  it('rejects other-job reservation and leaves other lock intact (Test B)', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-test-'));
    const host = { outputRoot: path.join(root, 'out'), tempRoot: path.join(root, 'tmp') };
    const { createJobPaths } = await import('@/automation/filesystem');
    const pathsA = await createJobPaths(host, 'a', '.mov');
    const pathsB = await createJobPaths(host, 'b', '.mov');

    // Job A attempts to clean up Job B's reservation
    await expect(cleanupJob(pathsA.staging, pathsB.reservation, pathsA.tempRoot)).rejects.toMatchObject({
      code: 'OUTPUT_OUTSIDE_ROOT',
    });

    // Job B's lock MUST still exist!
    expect(await fs.stat(pathsB.reservation).catch(() => null)).not.toBeNull();

    // Job A's lock must also still exist (operation aborted before removing own resources)
    expect(await fs.stat(pathsA.reservation).catch(() => null)).not.toBeNull();

    // Clean up both properly
    await cleanupJob(pathsA.staging, pathsA.reservation, pathsA.tempRoot);
    await cleanupJob(pathsB.staging, pathsB.reservation, pathsB.tempRoot);

    expect(await fs.stat(pathsA.reservation).catch(() => null)).toBeNull();
    expect(await fs.stat(pathsB.reservation).catch(() => null)).toBeNull();

    await fs.rm(root, { recursive: true, force: true });
  });

  it('rejects reservation outside outputRoot and does not delete external path (Test C)', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-test-'));
    const host = { outputRoot: path.join(root, 'out'), tempRoot: path.join(root, 'tmp') };
    const { createJobPaths } = await import('@/automation/filesystem');
    const pathsA = await createJobPaths(host, 'a', '.mov');
    const rogueLock = path.join(root, 'rogue.lock');
    await fs.writeFile(rogueLock, 'rogue-lock');

    await expect(cleanupJob(pathsA.staging, rogueLock, pathsA.tempRoot)).rejects.toMatchObject({
      code: 'OUTPUT_OUTSIDE_ROOT',
    });

    // Rogue lock must NOT be deleted
    expect(await fs.stat(rogueLock).catch(() => null)).not.toBeNull();

    await cleanupJob(pathsA.staging, pathsA.reservation, pathsA.tempRoot);
    await fs.rm(root, { recursive: true, force: true });
  });

  it('performs idempotent cleanup on own resources without unexpected errors (Test D)', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-test-'));
    const host = { outputRoot: path.join(root, 'out'), tempRoot: path.join(root, 'tmp') };
    const { createJobPaths } = await import('@/automation/filesystem');
    const paths = await createJobPaths(host, 'test-idempotent', '.mp4');

    // First cleanup succeeds
    await expect(cleanupJob(paths.staging, paths.reservation, paths.tempRoot)).resolves.toBeUndefined();
    expect(await fs.stat(paths.reservation).catch(() => null)).toBeNull();
    expect(await fs.stat(paths.staging).catch(() => null)).toBeNull();

    // Second cleanup on already-cleaned resources must resolve cleanly (idempotent)
    await expect(cleanupJob(paths.staging, paths.reservation, paths.tempRoot)).resolves.toBeUndefined();

    await fs.rm(root, { recursive: true, force: true });
  });

  it('never deletes published artifact during cleanup', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-test-'));
    const host = { outputRoot: path.join(root, 'out'), tempRoot: path.join(root, 'tmp') };
    const { createJobPaths, publish } = await import('@/automation/filesystem');
    const paths = await createJobPaths(host, 'artifact-safe', '.mp4');

    const stagingFile = path.join(paths.staging, 'video.mp4');
    await fs.writeFile(stagingFile, 'video-bytes');
    const published = await publish(stagingFile, paths.finalPath, paths.reservation);

    expect(await fs.stat(published).catch(() => null)).not.toBeNull();

    // Cleanup after publish
    await expect(cleanupJob(paths.staging, paths.reservation, paths.tempRoot)).resolves.toBeUndefined();

    // Published file must remain intact!
    expect(await fs.stat(published).catch(() => null)).not.toBeNull();

    await fs.rm(root, { recursive: true, force: true });
  });

  it('rejects unverified reservation when called directly without ownership metadata', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-test-'));
    const tempRoot = path.join(root, 'tmp');
    const outputRoot = path.join(root, 'out');
    const jobDir = path.join(tempRoot, 'manual-job');
    const unverifiedLock = path.join(outputRoot, 'unverified.lock');

    await fs.mkdir(tempRoot, { recursive: true });
    await fs.mkdir(outputRoot, { recursive: true });
    await fs.mkdir(jobDir, { recursive: true });
    await fs.writeFile(unverifiedLock, 'lock');

    // Without ownership metadata in jobDir and without expectedOwner, it cannot prove ownership
    await expect(cleanupJob(jobDir, unverifiedLock, tempRoot)).rejects.toMatchObject({
      code: 'OUTPUT_OUTSIDE_ROOT',
    });

    expect(await fs.stat(unverifiedLock).catch(() => null)).not.toBeNull();

    // But with explicit expectedOwner finalPath matching the lock, it succeeds
    await expect(
      cleanupJob(jobDir, unverifiedLock, tempRoot, path.join(outputRoot, 'unverified'))
    ).resolves.toBeUndefined();

    expect(await fs.stat(unverifiedLock).catch(() => null)).toBeNull();

    await fs.rm(root, { recursive: true, force: true });
  });
});
