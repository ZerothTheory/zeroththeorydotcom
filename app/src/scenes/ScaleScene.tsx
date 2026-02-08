import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDoctrineStore } from '../store';
import { CHAPTERS } from '../data/doctrine';

const PAN_PARTICLE_COUNT = 500;
const chapter = CHAPTERS[4];
const ARM_LENGTH = 6;

/**
 * Chapter V: The Law of the Scale / Perspective
 * A cosmic balance scale with Mind (-1) and World (+1) on either side,
 * fulcrum glowing at Zero. Interactive hover tilts the scale.
 */
export default function ScaleScene() {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const fulcrumRef = useRef<THREE.Mesh>(null);
  const leftPanGroupRef = useRef<THREE.Group>(null);
  const rightPanGroupRef = useRef<THREE.Group>(null);
  const leftParticlesRef = useRef<THREE.Points>(null);
  const rightParticlesRef = useRef<THREE.Points>(null);
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);

  const activeChapter = useDoctrineStore((s) => s.activeChapter);
  const isActive = activeChapter === chapter.id;
  const tiltAngle = useRef(0);

  // Pan particles
  const [leftPositions, rightPositions] = useMemo(() => {
    const makeParticles = () => {
      const pos = new Float32Array(PAN_PARTICLE_COUNT * 3);
      for (let i = 0; i < PAN_PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const r = Math.random() * 1.5;
        const theta = Math.random() * Math.PI * 2;
        pos[i3] = r * Math.cos(theta);
        pos[i3 + 1] = Math.random() * 3;
        pos[i3 + 2] = r * Math.sin(theta);
      }
      return pos;
    };
    return [makeParticles(), makeParticles()];
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const speed = isActive ? 1.0 : 0.3;

    // Calculate tilt
    const targetTilt = hoverSide === 'left' ? 0.15 : hoverSide === 'right' ? -0.15 : 0;
    tiltAngle.current += (targetTilt - tiltAngle.current) * delta * 3;
    const tilt = tiltAngle.current;

    // Beam rotation (tilt)
    if (beamRef.current) {
      beamRef.current.rotation.z = tilt + Math.sin(t * 0.5 * speed) * 0.02;
    }

    // Update pan positions based on tilt
    if (leftPanGroupRef.current) {
      leftPanGroupRef.current.position.set(
        -ARM_LENGTH,
        -0.5 + tilt * ARM_LENGTH,
        0
      );
    }
    if (rightPanGroupRef.current) {
      rightPanGroupRef.current.position.set(
        ARM_LENGTH,
        -0.5 - tilt * ARM_LENGTH,
        0
      );
    }

    // Fulcrum glow
    if (fulcrumRef.current) {
      (fulcrumRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        isActive ? 3 + Math.sin(t * 2) * 1 : 0.5;
    }

    // Animate particles in pans
    const animateParticles = (ref: React.RefObject<THREE.Points | null>, srcPositions: Float32Array) => {
      if (!ref.current) return;
      const pos = ref.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < PAN_PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const angle = Math.atan2(arr[i3 + 2], arr[i3]) + 0.01 * speed;
        const r = Math.sqrt(arr[i3] ** 2 + arr[i3 + 2] ** 2);
        arr[i3] = r * Math.cos(angle);
        arr[i3 + 1] = srcPositions[i3 + 1] + Math.sin(t * speed + i * 0.1) * 0.5;
        arr[i3 + 2] = r * Math.sin(angle);
      }
      pos.needsUpdate = true;
    };

    animateParticles(leftParticlesRef, leftPositions);
    animateParticles(rightParticlesRef, rightPositions);
  });

  return (
    <group ref={groupRef} position={chapter.position}>
      {/* Fulcrum / Pivot */}
      <mesh ref={fulcrumRef} position={[0, -1, 0]}>
        <coneGeometry args={[0.8, 2, 6]} />
        <meshStandardMaterial
          color="#22cc55"
          emissive="#44ff88"
          emissiveIntensity={0.5}
          transparent
          opacity={isActive ? 0.9 : 0.4}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Beam */}
      <mesh ref={beamRef} position={[0, 0.5, 0]}>
        <boxGeometry args={[ARM_LENGTH * 2 + 1, 0.1, 0.3]} />
        <meshStandardMaterial
          color="#aaaaaa"
          emissive="#44ff88"
          emissiveIntensity={0.2}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Left Pan: Mind (-1) - Dark/Shadow */}
      <group ref={leftPanGroupRef} position={[-ARM_LENGTH, -0.5, 0]}>
        {/* Pan dish */}
        <mesh
          onPointerOver={() => setHoverSide('left')}
          onPointerOut={() => setHoverSide(null)}
        >
          <cylinderGeometry args={[2, 1.8, 0.2, 24]} />
          <meshStandardMaterial
            color="#333366"
            emissive="#4444aa"
            emissiveIntensity={hoverSide === 'left' ? 2 : 0.3}
            transparent
            opacity={0.6}
            metalness={0.8}
          />
        </mesh>

        {/* Shadow particles */}
        <points ref={leftParticlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={leftPositions}
              count={PAN_PARTICLE_COUNT}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#6644cc"
            size={isActive ? 0.08 : 0.04}
            transparent
            opacity={isActive ? 0.7 : 0.3}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>

        <pointLight color="#6644cc" intensity={isActive ? 4 : 1} distance={10} />
      </group>

      {/* Right Pan: World (+1) - Bright/Golden */}
      <group ref={rightPanGroupRef} position={[ARM_LENGTH, -0.5, 0]}>
        {/* Pan dish */}
        <mesh
          onPointerOver={() => setHoverSide('right')}
          onPointerOut={() => setHoverSide(null)}
        >
          <cylinderGeometry args={[2, 1.8, 0.2, 24]} />
          <meshStandardMaterial
            color="#665533"
            emissive="#ffcc44"
            emissiveIntensity={hoverSide === 'right' ? 2 : 0.3}
            transparent
            opacity={0.6}
            metalness={0.8}
          />
        </mesh>

        {/* World particles */}
        <points ref={rightParticlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={rightPositions}
              count={PAN_PARTICLE_COUNT}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#ffcc44"
            size={isActive ? 0.08 : 0.04}
            transparent
            opacity={isActive ? 0.7 : 0.3}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>

        <pointLight color="#ffcc44" intensity={isActive ? 4 : 1} distance={10} />
      </group>

      {/* Chain lines from beam to pans */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array([-ARM_LENGTH, 0.5, 0, -ARM_LENGTH, -0.5, 0])}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#888" transparent opacity={0.4} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array([ARM_LENGTH, 0.5, 0, ARM_LENGTH, -0.5, 0])}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#888" transparent opacity={0.4} />
      </line>

      {/* Scene light */}
      <pointLight
        color="#44ff88"
        intensity={isActive ? 6 : 1.5}
        distance={25}
        decay={2}
      />
    </group>
  );
}
