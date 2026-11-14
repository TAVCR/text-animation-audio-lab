import React from 'react';
import { useVideoConfig, interpolate, Easing } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const CinematicText: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { durationInFrames } = useVideoConfig();

  const easing = getEasing(props.easingStyle);
  const isApproach = props.cinematicDirection === 'zoom-out'; // "Aproximarse Hacia la Cámara"
  const farScale = 0.78;
  const nearScale = 2.45;

  const scaleMultiplier = interpolate(frame, [0, durationInFrames], isApproach ? [farScale, nearScale] : [nearScale, farScale], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const currentSpacing = interpolate(
    frame,
    [0, durationInFrames],
    isApproach
      ? [props.letterSpacing + props.fontSize * 0.35, props.letterSpacing || 0]
      : [props.letterSpacing || 0, props.letterSpacing + props.fontSize * 0.35],
    {
      easing,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const introProgress = interpolate(frame, [0, durationInFrames * 0.14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const outroProgress = interpolate(frame, [durationInFrames * 0.8, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });

  const introBlur = interpolate(introProgress, [0, 1], [16, 0]);
  const outroBlur = interpolate(outroProgress, [0, 1], [0, 34]);
  const blurPx = introBlur + outroBlur;
  const opacity = introProgress * (1 - outroProgress);

  return (
    <div style={{
      display: 'inline-block',
      textAlign: 'center',
      whiteSpace: 'pre-wrap',
      lineHeight: props.lineHeight || 1.2,
      fontFamily: `"${props.fontFamily}", sans-serif`,
      fontSize: `${props.fontSize}px`,
      fontWeight: props.fontWeight || 'bold',
      letterSpacing: `${currentSpacing}px`,
      color: props.enableFill ? props.color : 'transparent',
      WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
      textShadow: props.enableShadow && props.shadowBlur > 0 ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}` : 'none',
      transform: `scale(${scaleMultiplier})`,
      filter: `blur(${blurPx}px)`,
      opacity,
      willChange: 'transform, opacity, filter',
    }}>
      <StyledRangeText text={props.text} props={props} />
    </div>
  );
};
