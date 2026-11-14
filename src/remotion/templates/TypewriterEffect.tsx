import React from 'react';
import { useVideoConfig } from 'remotion';
import { AnimationProps } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
import { segmentGraphemes } from './typewriterUtils';
import {visibleCount} from './visibleCount';
export const TypewriterEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { fps } = useVideoConfig();


  // Reveal one character every 2 frames
  const graphemes = segmentGraphemes(props.text);
  const totalChars = graphemes.length;
  const charsShown = visibleCount(frame,totalChars,props,fps);
  const textToShow = graphemes.slice(0, charsShown).join('');
  const showCursor = props.typewriterShowCursor ?? true;
  const cursorStyle = props.typewriterCursorStyle ?? 'bar';
  const cursorAfterEnd = props.typewriterCursorAfterEnd ?? 'blink';
  const cursorGlyph = cursorStyle === 'underscore' ? '_' : cursorStyle === 'block' ? '█' : '|';
  const isComplete = charsShown >= totalChars;
  const cursorOpacity = cursorAfterEnd === 'hide' && isComplete ? 0 : cursorAfterEnd === 'hold' && isComplete ? 1 : frame % (fps / 2) < fps / 4 ? 1 : 0;
  const cursorFollowsTextStyle = props.typewriterCursorFollowTextStyle !== false;
  const cursorShouldUseOutline = cursorFollowsTextStyle && !props.enableFill && props.enableBorder;
  const cursorColor = cursorShouldUseOutline ? 'transparent' : props.color;
  const cursorStroke = cursorShouldUseOutline ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent';

  return (
    <div
      style={{
        fontFamily: `"${props.fontFamily}", sans-serif`,
        fontSize: `${props.fontSize}px`,
      letterSpacing: `${props.letterSpacing}px`,
        color: props.enableFill ? props.color : 'transparent',
        WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
        textShadow: props.enableShadow && props.shadowBlur > 0 ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}` : 'none',
        fontWeight: props.fontWeight || 'bold',
        textAlign: 'center',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.2,
      }}
    >
      <StyledRangeText text={textToShow} props={props} />
      <span
        style={{
          opacity: showCursor ? cursorOpacity : 0,
          color: cursorColor,
          WebkitTextStroke: cursorStroke,
          willChange: 'opacity',
        }}
      >
        {cursorGlyph}
      </span>
    </div>
  );
};

