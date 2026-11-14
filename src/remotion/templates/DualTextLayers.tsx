import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import type { AnimationProps } from '@/lib/types/animation';
import { InkStampPrint } from './InkStampPrint';
import { getCenteredLayerTransform } from '@/lib/editor/dualTextLayers';

export const DualTextLayers: React.FC<AnimationProps> = (props) => {
  const secondary = props.secondaryTextLayer;
  const primary = <Sequence from={Math.max(0, props.dualPrimaryDelayFrames ?? 0)}><div style={{ position: 'absolute', ...getCenteredLayerTransform(props.textPositionX, props.textPositionY), opacity: Math.max(0, Math.min(1, props.opacity)) }}><InkStampPrint {...props} inkStampColor={props.inkStampColor} /></div></Sequence>;
  const secondaryNode = secondary?.enabled ? <Sequence from={Math.max(0, secondary.delayFrames)}><div style={{ position: 'absolute', ...getCenteredLayerTransform(secondary.positionX, secondary.positionY), opacity: Math.max(0, Math.min(1, secondary.opacity)) }}><InkStampPrint {...props} speed={secondary.speed} text={secondary.text} fontFamily={secondary.fontFamily} fontWeight={secondary.fontWeight} fontSize={secondary.fontSize} color={secondary.color} inkStampColor={secondary.color} enableFill={secondary.enableFill} enableBorder={secondary.enableBorder} borderColor={secondary.borderColor} borderWidth={secondary.borderWidth} enableShadow={secondary.enableShadow} shadowColor={secondary.shadowColor} shadowBlur={secondary.shadowBlur} /></div></Sequence> : null;
  return <AbsoluteFill>{props.dualLayerOrder === 'secondary-front' ? <>{primary}{secondaryNode}</> : <>{secondaryNode}{primary}</>}</AbsoluteFill>;
};
