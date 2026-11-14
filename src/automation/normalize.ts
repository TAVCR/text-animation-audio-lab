import { getCompositionDimensions, REMOTION_FPS, sanitizeDurationInFrames, type AspectRatio, type ResolutionPreset } from '@/lib/videoConfig';
import { animationCatalog, backgroundIds, describeAnimation, isAnimationId } from './catalog';
import type { AutomationRenderRequest, AutomationStillRequest, GpuPolicy, OutputProfile } from './contracts';

const aspects = new Set<AspectRatio>(['16:9', '9:16', '1:1']);
const resolutions = new Set<ResolutionPreset>(['1080p', '1440p', '4k', '8k']);
const profiles = new Set<OutputProfile>(['h264-opaque', 'prores4444-alpha', 'vp9-alpha', 'png-alpha']);
const commonKeys = new Set(['text','aspectRatio','resolutionPreset','durationInFrames','gpuPolicy','profile','outputName','frameIndex','animationId','schemaVersion','parameters']);
const commonParameterKeys = new Set(animationCatalog[0]?.schema.map((control) => control.key) ?? []);
for (const key of ['backgroundColor', 'particlePreset', 'typewriterCharactersPerSecond', 'boxSequenceDurationOne', 'boxSequenceDurationTwo', 'speedControlsDuration']) commonParameterKeys.add(key);
const fail = (message: string): never => { throw Object.assign(new Error(message), { code: 'INVALID_REQUEST' }); };
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : fail('Expected an object');

function base(value: unknown, still: boolean): AutomationRenderRequest | AutomationStillRequest {
  const input = object(value);
  const allowed = new Set(Array.from(commonKeys));
  for (const key of Object.keys(input)) if (!allowed.has(key)) fail(`Unknown request key: ${key}`);
  if (input.schemaVersion !== 1) fail('schemaVersion must be 1');
  if (!isAnimationId(input.animationId)) fail('Unknown animationId');
  if (typeof input.text !== 'string' || input.text.length === 0 || input.text.length > 10000) fail('text must be a non-empty string of at most 10000 characters');
  if (!aspects.has(input.aspectRatio as AspectRatio)) fail('Invalid aspectRatio');
  if (!resolutions.has(input.resolutionPreset as ResolutionPreset)) fail('Invalid resolutionPreset');
  if (!['auto','gpu','cpu'].includes(input.gpuPolicy as string)) fail('Invalid gpuPolicy');
  if (!profiles.has(input.profile as OutputProfile) || still !== (input.profile === 'png-alpha')) fail('Invalid output profile for operation');
  const parameters = object(input.parameters);
  const descriptor = describeAnimation(input.animationId as Parameters<typeof describeAnimation>[0]);
  const keys = new Set(descriptor.schema.map((item) => item.key));
  for (const key of Object.keys(parameters)) { const value = parameters[key]; if (!keys.has(key) && !commonParameterKeys.has(key)) fail(`Unknown parameter key: ${key}`); if (value !== null && typeof value === 'object') fail(`Invalid nested parameter: ${key}`); if (key === 'particlePreset' && (typeof value !== 'string' || !backgroundIds.includes(value))) fail(`Invalid parameter value: ${key}`); if ((key === 'backgroundColor' || key === 'color' || key.endsWith('Color')) && typeof value !== 'string') fail(`Invalid parameter value: ${key}`); const control = descriptor.schema.find((item) => item.key === key); if (control?.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value) || (control.min !== undefined && value < control.min) || (control.max !== undefined && value > control.max))) fail(`Invalid parameter value: ${key}`); if (control?.type === 'boolean' && typeof value !== 'boolean') fail(`Invalid parameter value: ${key}`); }
  if (input.animationId === 'typewriter' && parameters.typewriterCharactersPerSecond !== undefined && (typeof parameters.typewriterCharactersPerSecond !== 'number' || parameters.typewriterCharactersPerSecond < 1 || parameters.typewriterCharactersPerSecond > 60)) fail('Invalid parameter value: typewriterCharactersPerSecond');
  if (input.animationId !== 'typewriter' && parameters.typewriterCharactersPerSecond !== undefined) fail('Unknown parameter key: typewriterCharactersPerSecond');
  if (input.animationId === 'kinetic-box-sequence') for (const key of ['boxSequenceDurationOne', 'boxSequenceDurationTwo']) if (parameters[key] !== undefined && (typeof parameters[key] !== 'number' || parameters[key] < 0)) fail(`Invalid parameter value: ${key}`);
  if (input.animationId !== 'kinetic-box-sequence' && (parameters.boxSequenceDurationOne !== undefined || parameters.boxSequenceDurationTwo !== undefined)) fail('Unknown parameter key: boxSequenceDurationOne');
  if (input.outputName !== undefined && (typeof input.outputName !== 'string' || input.outputName.length === 0)) fail('outputName must be a non-empty string');
  const durationInFrames = sanitizeDurationInFrames(input.durationInFrames);
  if (still && (!Number.isInteger(input.frameIndex) || (input.frameIndex as number) < 0 || (input.frameIndex as number) >= durationInFrames)) fail('frameIndex must be within duration');
  return { schemaVersion: 1, animationId: input.animationId, text: input.text, parameters, aspectRatio: input.aspectRatio, resolutionPreset: input.resolutionPreset, durationInFrames, gpuPolicy: input.gpuPolicy as GpuPolicy, profile: input.profile as OutputProfile, ...(input.outputName === undefined ? {} : { outputName: input.outputName }), ...(still ? { frameIndex: input.frameIndex as number } : {}) } as AutomationRenderRequest;
}
export const normalizeRenderRequest = (value: unknown) => base(value, false) as AutomationRenderRequest;
export const normalizeStillRequest = (value: unknown) => base(value, true) as AutomationStillRequest;
export const dimensionsFor = (request: AutomationRenderRequest) => getCompositionDimensions(request.aspectRatio, request.resolutionPreset);
export const REMOTION_FPS_V1 = REMOTION_FPS;
