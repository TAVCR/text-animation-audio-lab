import React from 'react';
import { useVideoConfig, interpolate, AbsoluteFill } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const FlyThroughEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { durationInFrames } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: getEasing(props.easingStyle)
  });

  // Calculate deep Z-Space Fly Through translation
  // It starts far back (negative Z) or standard, and flies PAST the camera (positive huge Z)
  const zTranslation = props.cinematicDirection === 'zoom-in' ? 
    interpolate(frame, [0, durationInFrames], [-2000, 1500], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: getEasing(props.easingStyle)
    }) :
    interpolate(frame, [0, durationInFrames], [1500, -2000], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: getEasing(props.easingStyle)
    });

  return (
    <AbsoluteFill style={{ 
      backgroundColor: props.isTransparent ? 'transparent' : props.backgroundColor,
      perspective: '1000px', // Crucial for CSS 3D depth perception
      overflow: 'hidden'
    }}>
      
      {/* Background Gradient Layer */}
      {!props.isTransparent && (
        <AbsoluteFill style={{ opacity: 0.2 }}>
           <div style={{ width: '100%', height: '100%', background: `radial-gradient(circle, ${props.gradientStart} 0%, ${props.gradientEnd} 100%)` }} />
        </AbsoluteFill>
      )}
      
      {/* 3D CSS Text Layer Container */}
      <AbsoluteFill style={{ 
        justifyContent: 'center', 
        alignItems: 'center', 
        opacity,
        transformStyle: 'preserve-3d',
        transform: `translate3d(0, 0, ${zTranslation}px)`,
        willChange: 'transform, opacity',
      }}>
        <div style={{
          fontFamily: `"${props.fontFamily}", sans-serif`,
          fontSize: `${props.fontSize}px`, 
          fontWeight: props.fontWeight || 'bold',
          letterSpacing: `${props.letterSpacing}px`,
          lineHeight: props.lineHeight || 1.2,
          color: props.enableFill ? props.color : 'transparent',
          WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
          textShadow: props.enableShadow && props.shadowBlur > 0 ? `0px 10px ${props.shadowBlur}px ${props.shadowColor}` : 'none',
          textAlign: 'center',
          whiteSpace: 'pre-wrap'
        }}>
          <StyledRangeText text={props.text} props={props} />
        </div>
      </AbsoluteFill>
      
    </AbsoluteFill>
  );
};
