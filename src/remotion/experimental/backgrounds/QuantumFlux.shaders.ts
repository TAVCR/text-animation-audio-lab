export const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform float uSpeed;
  uniform float uComplexity;
  uniform float uSeed;
  uniform float uHue;
  uniform float uSaturation;
  uniform float uLightness;
  uniform vec2 uResolution;

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }

  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n = dot(i, vec3(1.0, 57.0, 113.0));

    float a = hash11(n + 0.0);
    float b = hash11(n + 1.0);
    float c = hash11(n + 57.0);
    float d = hash11(n + 58.0);
    float e = hash11(n + 113.0);
    float g = hash11(n + 114.0);
    float h = hash11(n + 170.0);
    float k = hash11(n + 171.0);

    float x1 = mix(a, b, f.x);
    float x2 = mix(c, d, f.x);
    float x3 = mix(e, g, f.x);
    float x4 = mix(h, k, f.x);
    float y1 = mix(x1, x2, f.y);
    float y2 = mix(x3, x4, f.y);
    return mix(y1, y2, f.z);
  }

  float fbm(vec3 p) {
    float total = 0.0;
    float amp = 0.5;
    float freq = 1.0;

    for (int i = 0; i < 6; i++) {
      total += noise3(p * freq) * amp;
      freq *= 2.02;
      amp *= 0.5;
    }

    return total;
  }

  vec3 hsl2rgb(vec3 hsl) {
    vec3 rgb = clamp(abs(mod(hsl.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    float c = (1.0 - abs(2.0 * hsl.z - 1.0)) * hsl.y;
    return (rgb - 0.5) * c + hsl.z;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uResolution.x / max(1.0, uResolution.y);

    float t = uTime * uSpeed;
    float complexity = clamp(uComplexity, 0.5, 3.0);

    vec3 ro = vec3(0.0, 0.0, -4.0 + sin(t * 0.18) * 0.22);
    vec3 rd = normalize(vec3(uv, 1.75));

    rd.xy += vec2(
      sin(t * 0.17 + uSeed * 0.001),
      cos(t * 0.13 + uSeed * 0.0013)
    ) * 0.06;

    vec3 base = hsl2rgb(vec3(fract(uHue), clamp(uSaturation, 0.0, 1.0), clamp(uLightness, 0.0, 1.0)));
    vec3 accent = hsl2rgb(vec3(fract(uHue + 0.11), clamp(uSaturation * 0.92, 0.0, 1.0), clamp(uLightness * 1.15, 0.0, 1.0)));

    vec3 col = vec3(0.0);
    float transmittance = 1.0;

    const int STEPS = 80;
    for (int i = 0; i < STEPS; i++) {
      float fi = float(i);
      float depth = fi / float(STEPS);
      float dist = 0.25 + depth * 22.0;
      vec3 p = ro + rd * dist;

      vec3 warp = vec3(
        fbm(p * 0.65 + vec3(t * 0.22, -t * 0.17, t * 0.11)),
        fbm(p.yzx * 0.72 + vec3(-t * 0.16, t * 0.13, -t * 0.09)),
        fbm(p.zxy * 0.78 + vec3(t * 0.12, t * 0.07, -t * 0.18))
      );

      p += (warp - 0.5) * (0.75 + complexity * 0.75);

      float rings = sin(length(p.xy) * (3.4 + complexity * 2.2) - p.z * (1.6 + complexity * 0.8));
      float lanes = sin((p.x + p.y) * (2.7 + complexity * 1.5) + p.z * 1.3 + t * 0.9);
      float structure = smoothstep(0.15, 0.95, fbm(p * (0.65 + complexity * 0.25)));

      float density = max(0.0, rings * 0.38 + lanes * 0.32 + structure * 1.2 - 0.45);
      density *= 0.08 + 0.12 * (1.0 - depth);

      vec3 local = mix(base, accent, clamp(density * 2.1 + depth * 0.45, 0.0, 1.0));

      col += local * density * transmittance;
      transmittance *= exp(-density * 1.6);

      if (transmittance < 0.02) {
        break;
      }
    }

    vec3 baseFog = mix(base, accent, clamp(length(uv) * 0.45 + 0.2, 0.0, 1.0)) * 0.09;
    col += baseFog;

    vec2 starGrid = floor((uv + 1.0) * uResolution * 0.42 + vec2(t * 14.0, -t * 9.0));
    float stars = step(0.9978, hash21(starGrid + uSeed * 0.13));
    col += vec3(stars) * (0.6 + 0.4 * hash21(starGrid + 12.7));

    col = 1.0 - exp(-col * 1.55);

    float vignette = smoothstep(1.55, 0.25, length(uv));
    col *= vignette;

    gl_FragColor = vec4(col, 1.0);
  }
`;
