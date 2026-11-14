import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { fragmentShaderSource, vertexShaderSource } from './Hex.shaders';

type ShaderResources = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  uniforms: {
    resolution: WebGLUniformLocation;
    time: WebGLUniformLocation;
    color: WebGLUniformLocation;
  };
};

export type HexShaderBackgroundProps = {
  color: string;
};

const compileShader = (
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('No se pudo crear shader WebGL.');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader) || 'Error de compilacion de shader.';
    gl.deleteShader(shader);
    throw new Error(error);
  }

  return shader;
};

const createProgram = (gl: WebGLRenderingContext): ShaderResources => {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error('No se pudo crear programa WebGL.');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program) || 'Error al enlazar programa WebGL.';
    gl.deleteProgram(program);
    throw new Error(error);
  }

  const positionLocation = gl.getAttribLocation(program, 'aPosition');
  const resolution = gl.getUniformLocation(program, 'uResolution');
  const time = gl.getUniformLocation(program, 'uTime');
  const color = gl.getUniformLocation(program, 'uColor');

  if (
    positionLocation < 0 ||
    resolution === null ||
    time === null ||
    color === null
  ) {
    gl.deleteProgram(program);
    throw new Error('No se pudieron resolver atributos/uniforms del shader.');
  }

  const buffer = gl.createBuffer();
  if (!buffer) {
    gl.deleteProgram(program);
    throw new Error('No se pudo crear buffer de pantalla completa.');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]),
    gl.STATIC_DRAW
  );

  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  return {
    gl,
    program,
    buffer,
    uniforms: {
      resolution,
      time,
      color,
    },
  };
};

const hexToUniformColor = (input: string): [number, number, number] => {
  const safeHex = new THREE.Color(input || '#ffffff');
  return [safeHex.r, safeHex.g, safeHex.b];
};

export const HexShaderBackground: React.FC<HexShaderBackgroundProps> = ({
  color,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const resourcesRef = React.useRef<ShaderResources | null>(null);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const time = frame / fps;
  const colorUniform = React.useMemo(() => hexToUniformColor(color), [color]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      console.error('WebGL no disponible para HexShaderBackground.');
      return;
    }

    let resources: ShaderResources;
    try {
      resources = createProgram(gl);
    } catch (error) {
      console.error(error);
      return;
    }

    resourcesRef.current = resources;

    return () => {
      const current = resourcesRef.current;
      if (!current) return;

      current.gl.deleteBuffer(current.buffer);
      current.gl.deleteProgram(current.program);
      resourcesRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const resources = resourcesRef.current;
    const canvas = canvasRef.current;
    if (!resources || !canvas) {
      return;
    }

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const { gl, program, uniforms } = resources;

    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform2f(uniforms.resolution, width, height);
    gl.uniform1f(uniforms.time, time);
    gl.uniform3f(uniforms.color, colorUniform[0], colorUniform[1], colorUniform[2]);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, [colorUniform, height, time, width]);

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          background: 'transparent',
        }}
      />
    </AbsoluteFill>
  );
};

export default HexShaderBackground;
