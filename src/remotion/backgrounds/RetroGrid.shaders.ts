export const GRID_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const GRID_FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform vec3 uGridColor;
uniform float uGridScaleX;
uniform float uGridScaleY;
uniform float uMinorThickness;
uniform float uTime;
uniform float uScrollSpeed;
uniform float uGridBrightness;
uniform float uOpacity;
uniform float uThicknessMultiplier;

float lineMask(float coord, float scale, float thickness, float aaMul) {
  float scaled = coord * scale;
  float dist = abs(fract(scaled) - 0.5);
  float aa = clamp(fwidth(scaled) * 4.6 * aaMul, 0.008, 0.06);
  return 1.0 - smoothstep(thickness, thickness + aa, dist);
}

void main() {
  float yScroll = vUv.y + uTime * uScrollSpeed;

  float topStab = smoothstep(0.80, 1.0, vUv.y);
  float thickness = mix(uMinorThickness, uMinorThickness * 2.2, topStab) * max(0.15, uThicknessMultiplier);
  float aaMul = mix(1.0, 3.1, topStab);

  float minorX = lineMask(vUv.x, uGridScaleX, thickness, aaMul);
  float minorY = lineMask(yScroll, uGridScaleY, thickness, aaMul);
  float minorGrid = max(minorX, minorY);

  // Stable horizon blur/fade inspired by the experimental reference.
  float topBlur = smoothstep(0.72, 0.985, vUv.y);
  float blurOffset = (fwidth(yScroll) + fwidth(vUv.x)) * 7.4;
  float yBlurA = lineMask(yScroll - blurOffset, uGridScaleY, thickness * 1.04, aaMul * 1.2);
  float yBlurB = lineMask(yScroll + blurOffset, uGridScaleY, thickness * 1.04, aaMul * 1.2);
  float xBlurA = lineMask(vUv.x - blurOffset, uGridScaleX, thickness * 1.04, aaMul * 1.2);
  float xBlurB = lineMask(vUv.x + blurOffset, uGridScaleX, thickness * 1.04, aaMul * 1.2);
  float yBlurC = lineMask(yScroll - blurOffset * 1.9, uGridScaleY, thickness * 1.1, aaMul * 1.35);
  float yBlurD = lineMask(yScroll + blurOffset * 1.9, uGridScaleY, thickness * 1.1, aaMul * 1.35);
  float blurredGrid = max(max(xBlurA, xBlurB), max(yBlurA, yBlurB));
  blurredGrid = max(blurredGrid, max(yBlurC, yBlurD));
  minorGrid = mix(minorGrid, max(minorGrid, blurredGrid), topBlur);

  float perspectiveFade = pow(1.0 - vUv.y, 1.08);
  float horizonFade = smoothstep(0.03, 0.18, vUv.y);
  float topCut = 1.0 - smoothstep(0.97, 1.0, vUv.y);
  float mask = perspectiveFade * horizonFade * topCut;
  float farFade = smoothstep(0.03, 0.12, vUv.y);
  float horizonSuppression = 1.0 - topBlur * 0.65;
  // Canvas is flipped vertically in CSS, so top-of-screen maps to low vUv.y.
  float topBandFade = smoothstep(0.06, 0.34, vUv.y);

  // Apply a smooth alpha fade to the top of the screen (the near-clipping plane near vUv.y=0.68)
  float nearFade = 1.0 - smoothstep(0.40, 0.68, vUv.y);

  float lineAlpha = clamp(minorGrid * mask * 2.15, 0.0, 1.0) * farFade * horizonSuppression * topBandFade * nearFade * clamp(uOpacity, 0.0, 1.0);
  vec3 color = uGridColor * uGridBrightness;
  gl_FragColor = vec4(color, lineAlpha);
}
`;
