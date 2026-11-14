import React from 'react';
import { AbsoluteFill } from 'remotion';
import { AnimationProps, getAdaptiveBorderWidth } from '@/lib/AnimationContext';
import { templateRegistry } from './templates/registry';
import { MasterMotionLayer } from './MasterMotionLayer';
import { ParticleBackground } from './backgrounds/ParticleBackground';

export const MainComposition: React.FC<AnimationProps> = (props) => {
  const adaptedProps: AnimationProps = {
    ...props,
    borderWidth: getAdaptiveBorderWidth(props.borderWidth, props.fontSize),
    borderWidthTwo: getAdaptiveBorderWidth(props.borderWidthTwo, props.fontSizeTwo),
    borderWidthThree: getAdaptiveBorderWidth(props.borderWidthThree, props.fontSizeThree),
  };

  const ActiveTemplate = templateRegistry[adaptedProps.animationStyle] ?? templateRegistry.typewriter;
  const activeEffect: React.ReactNode = <ActiveTemplate {...adaptedProps} />;

  const isAiCircuitHud = false;
  const showTextLayer = adaptedProps.showTextLayer !== false;
  const isDualTextLayers = adaptedProps.animationStyle === 'dual-text-layers';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: props.isTransparent ? 'transparent' : props.backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        perspective: '1600px',
      }}
    >
      {/* 
        CRITICAL: Remotion v4 injects a "twerking broccoli" (checkerboard) into the `body` via CSS during headless renders if the format supports alpha.
        This <style> block violently strips it out so it doesn't get baked into the .webm output! 
      */}
      <style>
        {`
          body, html {
            background-color: transparent !important;
            background-image: none !important;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            /* Promotion to hardware layer to prevent sub-pixel jitter during motion */
            transform: translateZ(0);
          }
        `}
      </style>

      {!isAiCircuitHud ? (
        <ParticleBackground
          enabled={props.enableParticles}
          preset={props.particlePreset}
          count={props.particleCount}
          opacity={props.particleOpacity}
          speed={props.particleSpeed}
          flowDirection={props.particleFlowDirection}
          sizeMin={props.particleSizeMin}
          sizeMax={props.particleSizeMax}
          lineThickness={props.particleLineThickness}
          gridAngle={props.particleGridAngle}
          blur={props.particleBlur}
          colorA={props.particleColorA}
          colorB={props.particleColorB}
          backdropColor={props.particleBackdropColor}
          backdropOpacity={props.particleBackdropOpacity}
          lightIntensityA={props.particleLightIntensityA}
          lightIntensityB={props.particleLightIntensityB}
          lightIntensityC={props.particleLightIntensityC}
          metalness={props.particleMetalness}
          roughness={props.particleRoughness}
          transparentBackground={props.isTransparent}
          lowpolyLightA={props.lowpolyLightA}
          lowpolyLightB={props.lowpolyLightB}
          lowpolyLightC={props.lowpolyLightC}
          lowpolyDustA={props.lowpolyDustA}
          lowpolyDustB={props.lowpolyDustB}
          lowpolyShowMirror={props.lowpolyShowMirror}
          halftoneSpacingPx={props.halftoneSpacingPx}
          halftoneRadiusMinPx={props.halftoneRadiusMinPx}
          halftoneRadiusMaxPx={props.halftoneRadiusMaxPx}
          halftoneWaveLengthPx={props.halftoneWaveLengthPx}
          halftoneDirectionDegrees={props.halftoneDirectionDegrees}
          halftoneCenterClearPercent={props.halftoneCenterClearPercent}
          neonBulbColorA={props.neonBulbColorA}
          neonBulbColorB={props.neonBulbColorB}
          neonBulbDensity={props.neonBulbDensity}
          neonBulbSizePx={props.neonBulbSizePx}
          neonBulbBrightness={props.neonBulbBrightness}
          neonBulbSpeed={props.neonBulbSpeed}
          neonBulbPattern={props.neonBulbPattern}
          neonBulbCombinePattern={props.neonBulbCombinePattern}
          neonBulbSecondaryPattern={props.neonBulbSecondaryPattern}
          neonBulbPatternMix={props.neonBulbPatternMix}
          neonBulbHomogeneity={props.neonBulbHomogeneity}
          neonBulbWaveLength={props.neonBulbWaveLength}
          neonBulbPatternSpeed={props.neonBulbPatternSpeed}
          neonBulbContrast={props.neonBulbContrast}
          neonBulbSoftness={props.neonBulbSoftness}
          neonBulbReverse={props.neonBulbReverse}
          neonBulbPatternAngle={props.neonBulbPatternAngle}
          neonBulbCenterX={props.neonBulbCenterX}
          neonBulbCenterY={props.neonBulbCenterY}
          stellarDensity={props.stellarDensity}
          stellarDistribution={props.stellarDistribution}
          stellarSize={props.stellarSize}
          stellarSizeVariation={props.stellarSizeVariation}
          stellarDepth={props.stellarDepth}
          stellarPerspective={props.stellarPerspective}
          stellarMotionMode={props.stellarMotionMode}
          stellarSpeed={props.stellarSpeed}
          stellarDriftAngle={props.stellarDriftAngle}
          stellarParallax={props.stellarParallax}
          stellarCameraMotion={props.stellarCameraMotion}
          stellarSway={props.stellarSway}
          stellarRotation={props.stellarRotation}
          stellarZSpeed={props.stellarZSpeed}
          stellarStreaks={props.stellarStreaks}
          stellarBrightness={props.stellarBrightness}
          stellarGlow={props.stellarGlow}
          stellarTwinkle={props.stellarTwinkle}
          stellarColorMode={props.stellarColorMode}
          stellarColorA={props.stellarColorA}
          stellarColorB={props.stellarColorB}
          stellarTemperatureVariation={props.stellarTemperatureVariation}
          stellarDof={props.stellarDof}
          stellarFocusPlane={props.stellarFocusPlane}
          stellarDepthFog={props.stellarDepthFog}
          stellarDust={props.stellarDust}
          stellarNebula={props.stellarNebula}
          stellarNebulaScale={props.stellarNebulaScale}
          stellarNebulaSpeed={props.stellarNebulaSpeed}
          stellarNebulaIntensity={props.stellarNebulaIntensity}
          stellarNebulaColor={props.stellarNebulaColor}
          stellarSeed={props.stellarSeed}
        />
      ) : null}
      {showTextLayer
        ? (isDualTextLayers ? activeEffect : isAiCircuitHud ? (
            activeEffect
          ) : (
            <MasterMotionLayer
              motionPhase={props.motionPhase}
              reverseOutAnimation={props.reverseOutAnimation}
              easingStyle={props.easingStyle}
              textPositionX={props.textPositionX}
              textPositionY={props.textPositionY}
              startZ={props.startZ}
              endZ={props.endZ}
            >
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.max(0, Math.min(1, props.opacity)) }}>{activeEffect}</div>
            </MasterMotionLayer>
          ))
        : null}
    </AbsoluteFill>
  );
};
