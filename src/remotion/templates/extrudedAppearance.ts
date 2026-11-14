import type { AnimationProps } from '@/lib/AnimationContext';

export type ExtrudedAppearance = {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  transparent: boolean;
  opacity: number;
};

export function resolveExtrudedAppearance(props: Pick<AnimationProps, 'color' | 'borderColor' | 'shadowColor' | 'enableFill' | 'enableBorder' | 'enableShadow'>): ExtrudedAppearance {
  const color = props.enableFill ? props.color : props.enableBorder ? props.borderColor : '#05070f';
  return {
    color,
    emissive: props.enableShadow ? props.shadowColor : color,
    emissiveIntensity: props.enableShadow ? 0.28 : 0.08,
    transparent: !props.enableFill,
    opacity: props.enableFill ? 1 : props.enableBorder ? 0.92 : 0.18,
  };
}
