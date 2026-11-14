import React from 'react';
import { useVideoConfig, interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const CleanModernText: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { fps } = useVideoConfig();

  // letter-spacing expands across 2 secs
  const compressDuration = fps * 2; 
  const progressSpacing = interpolate(frame, [0, compressDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: getEasing(props.easingStyle)
  });

  const startSpacing = -props.fontSize * 0.5;
  const endSpacing = props.letterSpacing || 0;
  const currentSpacing = interpolate(progressSpacing, [0, 1], [startSpacing, endSpacing]);

  const chars = Array.from(props.text ?? '');
  const getRangesForIndex = (index: number) =>
    (props.textRangeStyles ?? [])
      .filter((style) => index >= style.start && index < style.end)
      .map((style) => ({ ...style, start: 0, end: 1 }));

  return (
    <div style={{
      display: 'inline-block',
      textAlign: 'center',
      whiteSpace: 'pre-wrap',
      lineHeight: props.lineHeight || 1.2,
      letterSpacing: `${currentSpacing}px`, // Master container controls tracking physics
    }}>
      {chars.map((char, index) => {
        if (char === '\n') return <br key={`clean-modern-br-${index}`} />;

        const delay = index * 2;
        const opacityProgress = interpolate(
          frame - delay,
          [0, 10],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        // Sombras dinámicas: desplazadas a la izquierda en dependencia del indice, convergiendo a 0 (X=0)
        // Esto imita la prioridad de la distancia
        const distanceFactor = chars.length - index;
        const blurFactor = props.shadowBlur > 0 ? props.shadowBlur : 10;
        const shadowOffsetX = interpolate(progressSpacing, [0, 1], [-distanceFactor * 5, 0]);
        
        const finalShadow = props.enableShadow 
            ? `${shadowOffsetX}px 5px ${blurFactor}px ${props.shadowColor}` 
            : 'none';

        return (
          <span key={index} style={{
            display: 'inline-block',
            fontFamily: `"${props.fontFamily}", sans-serif`,
            fontSize: `${props.fontSize}px`,
            fontWeight: props.fontWeight || 'bold',
            color: props.enableFill ? props.color : 'transparent',
            WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
            textShadow: finalShadow,
            opacity: opacityProgress,
            willChange: 'opacity',
          }}>
            <StyledRangeText
              text={char === ' ' ? '\u00A0' : char}
              props={{ ...props, textRangeStyles: getRangesForIndex(index) }}
            />
          </span>
        );
      })}
    </div>
  );
};
