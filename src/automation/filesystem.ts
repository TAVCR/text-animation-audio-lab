import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { HostContext } from './contracts';
const reserved = /^(con|prn|aux|nul|clock\$|com[0-9]|lpt[0-9])(?:\..*)?$/i;
const canonical = (value: string) => path.resolve(value);
const contained = (root: string, candidate: string) => { const rel = path.relative(canonical(root), canonical(candidate)); return rel === '' || (rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel)); };
const rejectLinks = async (value: string) => { let cursor = canonical(value); for (;;) { const stat = await fs.lstat(cursor).catch(() => null); if (stat?.isSymbolicLink()) throw Object.assign(new Error('Reparse/link path is not allowed'), { code: 'OUTPUT_OUTSIDE_ROOT' }); const parent = path.dirname(cursor); if (parent === cursor) return; cursor = parent; } };
export const validateOutputName = (value: string) => { if (!value || value === '.' || value === '..' || value.includes('/') || value.includes('\\') || value.includes(':') || value.endsWith('.') || value.endsWith(' ') || reserved.test(value)) throw Object.assign(new Error('Invalid outputName'), { code: 'OUTPUT_OUTSIDE_ROOT' }); return value; };
export const assertRoots = async (host: HostContext) => { const output = canonical(host.outputRoot), temp = canonical(host.tempRoot); if (!contained(output, output) || !contained(temp, temp) || path.parse(output).root.toLowerCase() !== path.parse(temp).root.toLowerCase()) throw new Error('Invalid host roots'); await fs.mkdir(output, { recursive: true }); await fs.mkdir(temp, { recursive: true }); await rejectLinks(output); await rejectLinks(temp); return { output, temp }; };
export const reservationPathFor = (finalPath: string) => `${canonical(finalPath)}.lock`;
export const createJobPaths = async (host: HostContext, outputName: string, extension: string) => {
  const roots = await assertRoots(host);
  const safe = validateOutputName(outputName);
  const jobId = crypto.randomUUID();
  const staging = path.join(roots.temp, jobId);
  const finalPath = path.join(roots.output, `${safe}${extension}`);
  const reservation = reservationPathFor(finalPath);
  if (!contained(roots.output, finalPath) || !contained(roots.temp, staging))
    throw Object.assign(new Error('Output outside root'), { code: 'OUTPUT_OUTSIDE_ROOT' });
  try {
    if (await fs.lstat(finalPath).catch(() => null))
      throw Object.assign(new Error('Output collision'), { code: 'OUTPUT_COLLISION' });
    await fs.mkdir(staging);
    const handle = await fs.open(reservation, 'wx');
    await handle.close();
    await fs.writeFile(
      path.join(staging, '.reservation'),
      JSON.stringify({ finalPath: canonical(finalPath), reservation: canonical(reservation), outputRoot: roots.output }),
      'utf-8'
    );
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true }).catch(() => undefined);
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      throw Object.assign(new Error('Output collision'), { code: 'OUTPUT_COLLISION' });
    throw error;
  }
  return { jobId, staging, finalPath, reservation, outputRoot: roots.output, tempRoot: roots.temp };
};
export const publish = async (stagingPath: string, finalPath: string, reservation: string) => { if (await fs.stat(finalPath).catch(() => null)) throw Object.assign(new Error('Output collision'), { code: 'OUTPUT_COLLISION' }); await fs.rename(stagingPath, finalPath); await fs.rm(reservation, { force: true }); return finalPath; };
export interface CleanupOptions { finalPath?: string; outputRoot?: string; }
export const cleanupJob = async (jobDir: string, reservation?: string, tempRoot?: string, expectedOwner?: string | CleanupOptions) => {
  if (!tempRoot || !contained(tempRoot, jobDir) || path.dirname(path.resolve(jobDir)) !== path.resolve(tempRoot)) {
    throw Object.assign(new Error('Invalid cleanup path'), { code: 'OUTPUT_OUTSIDE_ROOT' });
  }
  const jobDirExists = await fs.stat(jobDir).catch(() => null);
  const resExists = reservation ? await fs.stat(reservation).catch(() => null) : null;
  if (!jobDirExists && !resExists) {
    return;
  }
  if (reservation) {
    const resCanonical = canonical(reservation);
    let meta: { finalPath?: string; reservation?: string; outputRoot?: string } | null = null;
    if (jobDirExists) {
      try {
        const raw = await fs.readFile(path.join(jobDir, '.reservation'), 'utf-8');
        meta = JSON.parse(raw);
      } catch {
        meta = null;
      }
    }
    let expectedRes: string | null = meta?.reservation ? canonical(meta.reservation) : null;
    let allowedOutputRoot: string | null = meta?.outputRoot ? canonical(meta.outputRoot) : null;
    if (expectedOwner) {
      if (typeof expectedOwner === 'string') {
        const expectedFinal = canonical(expectedOwner);
        if (expectedFinal.endsWith('.lock')) {
          expectedRes = expectedRes ?? expectedFinal;
          allowedOutputRoot = allowedOutputRoot ?? path.dirname(expectedFinal);
        } else {
          expectedRes = expectedRes ?? reservationPathFor(expectedFinal);
          allowedOutputRoot = allowedOutputRoot ?? path.dirname(expectedFinal);
        }
      } else {
        if (expectedOwner.finalPath) {
          const expectedFinal = canonical(expectedOwner.finalPath);
          expectedRes = expectedRes ?? reservationPathFor(expectedFinal);
          allowedOutputRoot = allowedOutputRoot ?? (expectedOwner.outputRoot ? canonical(expectedOwner.outputRoot) : path.dirname(expectedFinal));
        } else if (expectedOwner.outputRoot) {
          allowedOutputRoot = allowedOutputRoot ?? canonical(expectedOwner.outputRoot);
        }
      }
    }
    if (!expectedRes || resCanonical !== expectedRes) {
      throw Object.assign(new Error('Reservation does not belong to this job'), { code: 'OUTPUT_OUTSIDE_ROOT' });
    }
    if (allowedOutputRoot && !contained(allowedOutputRoot, resCanonical)) {
      throw Object.assign(new Error('Invalid cleanup reservation'), { code: 'OUTPUT_OUTSIDE_ROOT' });
    }
    await fs.rm(reservation, { force: true });
  }
  await fs.rm(jobDir, { recursive: true, force: true });
};
