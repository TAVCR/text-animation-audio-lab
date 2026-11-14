import { textTemplateCatalog } from '@/lib/editor/catalog';
import { backgroundCatalog } from '@/lib/editor/catalog';
import { textControlContracts } from '@/lib/editor/templateControlContracts';
import type { AnimationStyle } from '@/lib/types/animation';

export const animationIds = Object.keys(textTemplateCatalog) as AnimationStyle[];
export const backgroundIds = Object.keys(backgroundCatalog);
export const animationCatalog = animationIds.map((id) => ({
  ...textTemplateCatalog[id],
  schema: textControlContracts[id].controls,
}));

export const isAnimationId = (value: unknown): value is AnimationStyle =>
  typeof value === 'string' && animationIds.includes(value as AnimationStyle);

export const describeAnimation = (id: AnimationStyle) => animationCatalog.find((item) => item.id === id)!;
