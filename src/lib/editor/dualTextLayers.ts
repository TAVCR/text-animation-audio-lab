import type { AnimationProps, TextLayer } from '@/lib/types/animation';

export const getCenteredLayerTransform = (positionX: number, positionY: number): { left: string; top: string; transform: string } => ({
  left: '50%',
  top: '50%',
  transform: positionX === 0 && positionY === 0 ? 'translate(-50%, -50%)' : `translate(calc(-50% ${positionX < 0 ? '-' : '+'} ${Math.abs(positionX)}px), calc(-50% ${positionY < 0 ? '-' : '+'} ${Math.abs(positionY)}px))`,
});

export const createPrimaryTextLayer = (props: AnimationProps): TextLayer => ({
  enabled: true,
  text: props.text,
  animationStyle: props.animationStyle,
  fontFamily: props.fontFamily,
  fontWeight: props.fontWeight,
  fontSize: props.fontSize,
  positionX: props.textPositionX,
  positionY: props.textPositionY,
  color: props.color,
  opacity: 1,
  enableFill: props.enableFill,
  enableBorder: props.enableBorder,
  borderColor: props.borderColor,
  borderWidth: props.borderWidth,
  enableShadow: props.enableShadow,
  shadowColor: props.shadowColor,
  shadowBlur: props.shadowBlur,
  motionDurationFrames: props.motionDurationFrames,
  speed: props.speed,
  delayFrames: 0,
  templateOptions: {},
});

export const createDisabledSecondaryTextLayer = (props: AnimationProps): TextLayer => ({
  ...createPrimaryTextLayer(props),
  enabled: false,
  text: '',
});

export const normalizeTextLayers = (props: AnimationProps & { secondaryTextLayer?: Partial<TextLayer> }): AnimationProps & { secondaryTextLayer: TextLayer } => ({
  ...props,
  secondaryTextLayer: {
    ...createDisabledSecondaryTextLayer(props),
    ...(props.secondaryTextLayer ?? {}),
    templateOptions: { ...(props.secondaryTextLayer?.templateOptions ?? {}) },
  },
});
