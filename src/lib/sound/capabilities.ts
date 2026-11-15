import registry from './capabilities.json';
export type Voice = keyof typeof registry.voices;
export const voices = registry.voices;
export function motionFor(template: string) {
  return Object.entries(registry.motions).find(([, motion]) => motion.templates.includes(template));
}
export function compatibleVoices(template: string): Voice[] {
  return (motionFor(template)?.[1].voices ?? []) as Voice[];
}
export function soundAsset(voice: Voice, seed: number) {
  return '/audio-lab/' + voices[voice].asset.replace('#', String(seed % 4)) + '.wav';
}
