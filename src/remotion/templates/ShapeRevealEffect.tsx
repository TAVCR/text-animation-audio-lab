import React from 'react';
import { useVideoConfig, interpolate, Easing } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const ShapeRevealEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { durationInFrames } = useVideoConfig();

  const extremeEasing = Easing.bezier(0.8, 0, 0.2, 1);
  const entranceDuration = 40;
  let progress = 0;

  if (frame < entranceDuration) {
    progress = interpolate(frame, [0, entranceDuration], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: getEasing(props.easingStyle)
    });
  } else if (frame > durationInFrames - entranceDuration) {
    progress = interpolate(
      frame,
      [durationInFrames - entranceDuration, durationInFrames],
      [1, 0],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: extremeEasing
      }
    );
  } else {
    progress = 1;
  }

  // Y axis drop
  const translateY = interpolate(progress, [0, 1], [150, 0]);

  // letterSpacing: deeply compressed to normal
  const startLetterSpacing = -props.fontSize * 0.4;
  const targetLetterSpacing = props.letterSpacing || 0;
  const currentLetterSpacing = interpolate(progress, [0, 1], [startLetterSpacing, targetLetterSpacing]);

  // Width Expansion (clip path based, center out)
  const targetVisibleWidth = Math.min(100, Math.max(10, props.shapeGradientWidth || 100));
  const clipPercent = interpolate(progress, [0, 1], [50, 0]);
  const clipPath = `inset(0% ${clipPercent}% 0% ${clipPercent}%)`;
  const shapeScaleX = clamp01(progress);
  const lineHeight = props.lineHeight || 1.2;

  // Gradient animation (moving across the shape)
  const bgPos = interpolate(frame, [0, durationInFrames], [0, 100]);

  // Motion Blur directionally peaking at mid animation
  const blurAmt = interpolate(progress, [0, 0.5, 1], [20, 10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const filter = progress < 1 ? `blur(${blurAmt}px)` : 'none';

  // Overall composition zoom out inverse (applied to text only so mask width remains true 0-100%)
  const zoom = interpolate(frame, [0, durationInFrames], [1, 0.85]);

  return (
    <div style={{
      width: '100%', height: '100%', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      willChange: 'transform, opacity',
    }}>
      <div style={{
        width: `${targetVisibleWidth}%`,
        background: `linear-gradient(90deg, ${props.gradientStart}, ${props.gradientEnd})`,
        borderRadius: `${props.shapeBorderRadius || 10}px`,
        backgroundPosition: `${bgPos}% ${bgPos}%`,
        overflow: 'hidden',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        clipPath: clipPath,
        WebkitClipPath: clipPath,
        filter: filter,
        transform: `translate3d(0, 0, 0) scaleX(${shapeScaleX})`,
        transformOrigin: 'center center',
        willChange: 'transform, clip-path, filter, opacity',
      }}>
        {/* Invisible placeholder for bounding box size */}
        <div style={{
          fontFamily: `"${props.fontFamily}", sans-serif`,
          fontSize: `${props.fontSize}px`,
          fontWeight: props.fontWeight || 'bold',
          whiteSpace: 'pre-wrap',
          textAlign: 'center',
          lineHeight,
          letterSpacing: `${props.letterSpacing}px`,
          visibility: 'hidden'
        }}>
          {props.text}
        </div>

        {/* Actual moving text */}
        <div style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: `"${props.fontFamily}", sans-serif`,
          fontSize: `${props.fontSize}px`,
          fontWeight: props.fontWeight || 'bold',
          textAlign: 'center',
          whiteSpace: 'pre-wrap',
          lineHeight,
          color: props.enableFill ? props.color : 'transparent',
          WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
          textShadow: props.enableShadow && props.shadowBlur > 0 ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}` : 'none',
          transform: `translate3d(0, ${translateY}%, 0) scale(${zoom})`,
          transformOrigin: 'center center',
          letterSpacing: `${currentLetterSpacing}px`,
          filter: filter, // apply blur to text internally as well for depth
          willChange: 'transform, filter, opacity',
        }}>
          <StyledRangeText text={props.text} props={props} />
        </div>
      </div>
    </div>
  );
};

const clamp01 = (value: number): number => {
  return Math.min(1, Math.max(0, value));
};
