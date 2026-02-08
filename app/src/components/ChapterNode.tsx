import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { useDoctrineStore } from '../store';
import { type ChapterData } from '../data/doctrine';

interface Props {
  chapter: ChapterData;
}

export default function ChapterNode({ chapter }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const activeChapter = useDoctrineStore((s) => s.activeChapter);
  const flyToChapter = useDoctrineStore((s) => s.flyToChapter);

  const isActive = activeChapter === chapter.id;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      const scale = isActive
        ? 1.4 + Math.sin(t * 2) * 0.2
        : hovered
        ? 1.2 + Math.sin(t * 3) * 0.1
        : 1.0 + Math.sin(t * 1.5 + chapter.id) * 0.05;
      meshRef.current.scale.setScalar(scale);
    }
    if (glowRef.current) {
      const glowScale = isActive
        ? 3.5 + Math.sin(t * 1.5) * 0.5
        : hovered
        ? 2.8
        : 2.2 + Math.sin(t + chapter.id * 2) * 0.3;
      glowRef.current.scale.setScalar(glowScale);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        isActive ? 0.25 : hovered ? 0.18 : 0.1;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    flyToChapter(chapter.id);
  };

  return (
    <Float
      position={chapter.position}
      speed={1.5}
      rotationIntensity={0.2}
      floatIntensity={0.5}
    >
      <group>
        {/* Core orb */}
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerOver={() => {
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'default';
          }}
        >
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial
            color={chapter.color}
            emissive={chapter.emissiveColor}
            emissiveIntensity={isActive ? 3 : hovered ? 2 : 1}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>

        {/* Glow sphere */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial
            color={chapter.color}
            transparent
            opacity={0.1}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Point light for local illumination */}
        <pointLight
          color={chapter.color}
          intensity={isActive ? 8 : 2}
          distance={isActive ? 30 : 15}
          decay={2}
        />
      </group>
    </Float>
  );
}
