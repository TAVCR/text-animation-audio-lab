import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

const RotatingRedCube: React.FC = () => {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <mesh ref={meshRef} rotation={[t * 0.9, t * 1.15, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color="#ff0000" />
    </mesh>
  );
};

export const Check3D: React.FC = () => {
  return (
    <AbsoluteFill>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <color attach="background" args={['#080808']} />
        <RotatingRedCube />
      </Canvas>
    </AbsoluteFill>
  );
};

export default Check3D;
