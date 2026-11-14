import React from 'react';
import { useVideoConfig, interpolate, random } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const FlickerEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { fps } = useVideoConfig();
  const easing = getEasing(props.easingStyle);

  const chars = Array.from(props.text ?? '');
  const flickerCycles = 3; // Puedes configurar cuántas veces repite la secuencia de 12 frames
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
    }}>
      {chars.map((char, index) => {
        // startFrame único y aleatorio para cada letra (ej. de 0 a 1.5 segundos)
        const startFrame = random(`flicker-${index}`) * fps * 1.5;
        const localFrame = Math.max(0, frame - startFrame);

        const cycleDuration = 12;
        const totalFlickerDuration = cycleDuration * flickerCycles;

        let opacity = 0;

        if (frame < startFrame) {
          opacity = 0; // Aún no llega a su startFrame
        } else if (localFrame >= totalFlickerDuration) {
          opacity = 1; // Permanente luego de completar los ciclos
        } else {
          // Fase de parpadeo (ciclos de 12 frames)
          const cycleFrame = localFrame % cycleDuration;
          
          opacity = interpolate(
            cycleFrame,
            [0, 4, 8, 12],
            [0, 1, 0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing }
          );
        }

        return (
          <span key={index} style={{
            display: 'inline-block',
            fontFamily: `"${props.fontFamily}", sans-serif`,
            fontSize: `${props.fontSize}px`,
            fontWeight: props.fontWeight || 'bold',
            letterSpacing: `${props.letterSpacing}px`,
            color: props.enableFill ? props.color : 'transparent',
            WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
            textShadow: props.enableShadow && props.shadowBlur > 0 ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}` : 'none',
            opacity: opacity,
            willChange: 'opacity'
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
