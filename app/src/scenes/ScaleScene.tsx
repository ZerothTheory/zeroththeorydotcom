import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDoctrineStore } from '../store';
import { CHAPTERS } from '../data/doctrine';

const chapter = CHAPTERS[4];
const MIND_PARTICLES = 1500;
const WORLD_PARTICLES = 1500;
const FLOW_PARTICLES = 400;
const ARM_LENGTH = 8;

/**
 * Chapter V: The Law of the Scale — Perspective
 *
 * A cosmic balance between Mind (-1) and World (+1).
 * Features:
 * - Left: Dark matter nebula (Mind / Shadow / -1)
 * - Right: Brilliant star cluster (World / Wakefulness / +1)
 * - Central fulcrum glowing at the Zero point
 * - Energy flowing between the two sides through the fulcrum
 * - Beam of light connecting the pans
 * - Interactive hover tilts the cosmic balance
 */
export default function ScaleScene() {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const fulcrumRef = useRef<THREE.Mesh>(null);
  const leftGroupRef = useRef<THREE.Group>(null);
  const rightGroupRef = useRef<THREE.Group>(null);
  const mindRef = useRef<THREE.Points>(null);
  const worldRef = useRef<THREE.Points>(null);
  const flowRef = useRef<THREE.Points>(null);
  const fulcrumLightRef = useRef<THREE.PointLight>(null);

  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);
  const activeChapter = useDoctrineStore((s) => s.activeChapter);
  const isActive = activeChapter === chapter.id;
  const tiltAngle = useRef(0);

  // Mind (-1) particles - dark, mysterious, purple/indigo
  const [mindPositions, mindColors] = useMemo(() => {
    const pos = new Float32Array(MIND_PARTICLES * 3);
    const col = new Float32Array(MIND_PARTICLES * 3);
    for (let i = 0; i < MIND_PARTICLES; i++) {
      const i3 = i * 3;
      // Cloud shape
      const r = (Math.random() + Math.random()) / 2 * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7 + 2;
      pos[i3 + 2] = r * Math.cos(phi);

      // Dark purple/indigo colors
      const t = Math.random();
      col[i3] = 0.2 + t * 0.3;
      col[i3 + 1] = 0.05 + t * 0.15;
      col[i3 + 2] = 0.4 + t * 0.5;
    }
    return [pos, col];
  }, []);

  // World (+1) particles - brilliant, golden, luminous
  const [worldPositions, worldColors] = useMemo(() => {
    const pos = new Float32Array(WORLD_PARTICLES * 3);
    const col = new Float32Array(WORLD_PARTICLES * 3);
    for (let i = 0; i < WORLD_PARTICLES; i++) {
      const i3 = i * 3;
      // Star cluster shape - concentrated center
      const r = Math.pow(Math.random(), 1.5) * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7 + 2;
      pos[i3 + 2] = r * Math.cos(phi);

      // Golden/warm colors
      const t = Math.random();
      col[i3] = 1.0;
      col[i3 + 1] = 0.7 + t * 0.3;
      col[i3 + 2] = 0.2 + t * 0.3;
    }
    return [pos, col];
  }, []);

  // Energy flow particles between pans
  const flowData = useMemo(() => {
    const pos = new Float32Array(FLOW_PARTICLES * 3);
    const offsets = new Float32Array(FLOW_PARTICLES);
    for (let i = 0; i < FLOW_PARTICLES; i++) {
      offsets[i] = Math.random();
    }
    return { positions: pos, offsets };
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const speed = isActive ? 1.0 : 0.3;

    // Tilt calculation
    const targetTilt = hoverSide === 'left' ? 0.12 : hoverSide === 'right' ? -0.12 : 0;
    tiltAngle.current += (targetTilt - tiltAngle.current) * delta * 3;
    const tilt = tiltAngle.current;

    // Beam rotation
    if (beamRef.current) {
      beamRef.current.rotation.z = tilt + Math.sin(t * 0.3 * speed) * 0.015;
      const mat = beamRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isActive ? 0.8 + Math.sin(t * 1.5) * 0.3 : 0.2;
    }

    // Pan positions based on tilt
    if (leftGroupRef.current) {
      leftGroupRef.current.position.set(-ARM_LENGTH, -1 + tilt * ARM_LENGTH, 0);
    }
    if (rightGroupRef.current) {
      rightGroupRef.current.position.set(ARM_LENGTH, -1 - tilt * ARM_LENGTH, 0);
    }

    // Fulcrum glow
    if (fulcrumRef.current) {
      const mat = fulcrumRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isActive ? 4 + Math.sin(t * 2) * 2 : 1;
      // Pulse scale
      fulcrumRef.current.scale.setScalar(isActive ? 1 + Math.sin(t * 1.5) * 0.1 : 0.8);
    }

    if (fulcrumLightRef.current) {
      fulcrumLightRef.current.intensity = isActive ? 20 + Math.sin(t * 2) * 8 : 4;
      // Cycle green hue
      const h = (0.35 + Math.sin(t * 0.3) * 0.05);
      fulcrumLightRef.current.color.setHSL(h, 0.9, 0.5);
    }

    // Mind particles - slow, mysterious rotation
    if (mindRef.current) {
      const pos = mindRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < MIND_PARTICLES; i++) {
        const i3 = i * 3;
        const x = arr[i3];
        const z = arr[i3 + 2];
        const angle = Math.atan2(z, x) + 0.005 * speed;
        const r = Math.sqrt(x * x + z * z);
        arr[i3] = r * Math.cos(angle);
        arr[i3 + 1] += Math.sin(t * 0.5 + i * 0.01) * 0.003 * speed;
        arr[i3 + 2] = r * Math.sin(angle);
      }
      pos.needsUpdate = true;
    }

    // World particles - vibrant, lively rotation
    if (worldRef.current) {
      const pos = worldRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < WORLD_PARTICLES; i++) {
        const i3 = i * 3;
        const x = arr[i3];
        const z = arr[i3 + 2];
        const angle = Math.atan2(z, x) - 0.008 * speed;
        const r = Math.sqrt(x * x + z * z);
        arr[i3] = r * Math.cos(angle);
        arr[i3 + 1] += Math.sin(t * 0.7 + i * 0.01) * 0.003 * speed;
        arr[i3 + 2] = r * Math.sin(angle);
      }
      pos.needsUpdate = true;
    }

    // Energy flow between pans
    if (flowRef.current) {
      const pos = flowRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < FLOW_PARTICLES; i++) {
        const i3 = i * 3;
        const pct = (flowData.offsets[i] + t * speed * 0.15) % 1;
        // Flow from left to right through fulcrum
        const x = -ARM_LENGTH + pct * ARM_LENGTH * 2;
        const archHeight = Math.sin(pct * Math.PI) * 3;
        const scatter = Math.sin(t + i * 0.5) * 0.3;
        arr[i3] = x;
        arr[i3 + 1] = archHeight + 1 + scatter;
        arr[i3 + 2] = scatter;
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={chapter.position}>
      {/* Fulcrum / Zero Point */}
      <mesh ref={fulcrumRef} position={[0, -2, 0]}>
        <octahedronGeometry args={[1.5, 2]} />
        <meshStandardMaterial
          color="#22cc55"
          emissive="#44ff88"
          emissiveIntensity={2}
          transparent
          opacity={isActive ? 0.85 : 0.4}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Fulcrum inner glow */}
      <mesh position={[0, -2, 0]} scale={2.5}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#44ff88"
          transparent
          opacity={isActive ? 0.06 : 0.02}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Beam of light connecting pans */}
      <mesh ref={beamRef} position={[0, 0.5, 0]}>
        <boxGeometry args={[ARM_LENGTH * 2 + 2, 0.15, 0.15]} />
        <meshStandardMaterial
          color="#aaffcc"
          emissive="#44ff88"
          emissiveIntensity={0.5}
          transparent
          opacity={isActive ? 0.7 : 0.3}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* LEFT PAN: Mind (-1) — Dark Matter Nebula */}
      <group ref={leftGroupRef} position={[-ARM_LENGTH, -1, 0]}>
        {/* Pan base */}
        <mesh
          onPointerOver={() => setHoverSide('left')}
          onPointerOut={() => setHoverSide(null)}
        >
          <cylinderGeometry args={[3, 2.5, 0.3, 32]} />
          <meshStandardMaterial
            color="#1a1a44"
            emissive="#4444aa"
            emissiveIntensity={hoverSide === 'left' ? 2.5 : 0.5}
            transparent
            opacity={0.6}
            metalness={0.9}
          />
        </mesh>

        {/* Shadow nebula particles */}
        <points ref={mindRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[mindPositions, 3]} />
            <bufferAttribute attach="attributes-color" args={[mindColors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            vertexColors
            size={isActive ? 0.15 : 0.07}
            transparent
            opacity={isActive ? 0.7 : 0.25}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* Shadow sphere */}
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[1.5, 24, 24]} />
          <meshStandardMaterial
            color="#110022"
            emissive="#4422aa"
            emissiveIntensity={isActive ? 1.5 : 0.3}
            transparent
            opacity={isActive ? 0.4 : 0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        <pointLight color="#6644cc" intensity={isActive ? 8 : 2} distance={20} />
      </group>

      {/* RIGHT PAN: World (+1) — Star Cluster */}
      <group ref={rightGroupRef} position={[ARM_LENGTH, -1, 0]}>
        {/* Pan base */}
        <mesh
          onPointerOver={() => setHoverSide('right')}
          onPointerOut={() => setHoverSide(null)}
        >
          <cylinderGeometry args={[3, 2.5, 0.3, 32]} />
          <meshStandardMaterial
            color="#443300"
            emissive="#ffcc44"
            emissiveIntensity={hoverSide === 'right' ? 2.5 : 0.5}
            transparent
            opacity={0.6}
            metalness={0.9}
          />
        </mesh>

        {/* Star cluster particles */}
        <points ref={worldRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[worldPositions, 3]} />
            <bufferAttribute attach="attributes-color" args={[worldColors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            vertexColors
            size={isActive ? 0.15 : 0.07}
            transparent
            opacity={isActive ? 0.8 : 0.3}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* Bright core star */}
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.8, 24, 24]} />
          <meshStandardMaterial
            color="#ffcc44"
            emissive="#ffdd66"
            emissiveIntensity={isActive ? 4 : 1}
            transparent
            opacity={0.9}
          />
        </mesh>

        <pointLight color="#ffcc44" intensity={isActive ? 10 : 2.5} distance={20} />
      </group>

      {/* Energy flow particles */}
      <points ref={flowRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[flowData.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#66ffaa"
          size={0.15}
          transparent
          opacity={isActive ? 0.5 : 0.12}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Chain lines */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-ARM_LENGTH, 0.5, 0, -ARM_LENGTH, -1, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#88ffaa" transparent opacity={0.3} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([ARM_LENGTH, 0.5, 0, ARM_LENGTH, -1, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#88ffaa" transparent opacity={0.3} />
      </line>

      {/* Scene lighting */}
      <pointLight ref={fulcrumLightRef} color="#44ff88" intensity={10} distance={40} decay={2} />
    </group>
  );
}
