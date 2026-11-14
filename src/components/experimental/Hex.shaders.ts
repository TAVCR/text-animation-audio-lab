export const vertexShaderSource = `
attribute vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const fragmentShaderSource = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) +
    (c - a) * u.y * (1.0 - u.x) +
    (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 5; i++) {
    value += noise(p * frequency) * amplitude;
    frequency *= 2.03;
    amplitude *= 0.5;
  }

  return value;
}

vec2 pixelToHex(vec2 p) {
  return vec2(
    0.577350269 * p.x - 0.333333333 * p.y,
    0.666666667 * p.y
  );
}

vec2 hexToPixel(vec2 h) {
  return vec2(
    1.732050808 * (h.x + 0.5 * h.y),
    1.5 * h.y
  );
}

vec2 hexRound(vec2 h) {
  float x = h.x;
  float z = h.y;
  float y = -x - z;

  vec3 rounded = floor(vec3(x, y, z) + 0.5);
  vec3 diff = abs(rounded - vec3(x, y, z));

  if (diff.x > diff.y && diff.x > diff.z) {
    rounded.x = -rounded.y - rounded.z;
  } else if (diff.y > diff.z) {
    rounded.y = -rounded.x - rounded.z;
  } else {
    rounded.z = -rounded.x - rounded.y;
  }

  return vec2(rounded.x, rounded.z);
}

float hexSdf(vec2 p, float r) {
  const vec3 k = vec3(-0.8660254, 0.5, 0.577350269);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}

void main() {
  vec2 suv = gl_FragCoord.xy / uResolution.xy;
  vec2 uv = suv * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;

  // Depth scaling to emulate an angled wall while preserving hex shape.
  float depth = pow(clamp(suv.y, 0.0, 1.0), 1.1);
  vec2 p;
  p.x = uv.x * mix(9.2, 13.8, depth);
  p.y = mix(-8.4, 10.8, depth);
  p.x += (depth - 0.5) * 1.4;

  vec2 axial = pixelToHex(p);
  vec2 cell = hexRound(axial);
  vec2 center = hexToPixel(cell);
  vec2 local = p - center;

  float sdf = hexSdf(local, 0.96);
  float inside = 1.0 - smoothstep(0.0, 0.03, sdf);
  float edge = 1.0 - smoothstep(0.005, 0.055, abs(sdf));
  float halo = exp(-abs(sdf) * 12.0);
  float bevel = smoothstep(-0.2, -0.015, sdf) * inside;

  float n1 = fbm(cell * 0.19 + vec2(uTime * 0.26, -uTime * 0.18));
  float n2 = fbm((cell + local * 0.55) * 0.31 + vec2(-uTime * 0.16, uTime * 0.12));
  float wave = smoothstep(0.24, 0.92, mix(n1, n2, 0.35));

  float pulse = 0.5 + 0.5 * sin(uTime * 1.2 + cell.x * 0.92 + cell.y * 1.08);
  float activity = clamp(0.6 + wave * 0.28 + pulse * 0.12, 0.0, 1.0);

  vec3 pseudoNormal = normalize(vec3(local * 0.8, 1.0 - bevel * 0.7));
  vec3 lightDir = normalize(vec3(-0.62, -0.36, 0.7));
  float light = dot(pseudoNormal, lightDir) * 0.5 + 0.5;

  vec3 faceColor = uColor * (0.74 + activity * 0.18) * mix(0.78, 1.12, light);
  vec3 edgeColor = uColor * (0.95 + activity * 0.4);
  vec3 glowColor = uColor * (0.4 + activity * 0.5);

  vec3 color = faceColor * (inside * 0.62) + edgeColor * (edge * 0.82) + glowColor * (halo * 0.18);

  float alpha = inside * 0.52 + edge * 0.58 + halo * 0.18;
  alpha *= mix(0.86, 1.0, depth);
  alpha = clamp(alpha, 0.0, 1.0);

  // Transparent background outside edge/glow regions.
  gl_FragColor = vec4(color, alpha);
}
`;
