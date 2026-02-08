import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDoctrineStore } from '../store';
import { CHAPTERS } from '../data/doctrine';

const chapter = CHAPTERS[1];
const STARBURST_PARTICLES = 3000;
const RING_PARTICLES = 1500;
const DEBRIS_PARTICLES = 1000;

/**
 * Chapter II: The Eternal Return — The Ricochet
 *
 * Two cosmic forces colliding in a perpetual Big Bang cycle.
 * Features:
 * - Massive starburst explosion expanding and contracting
 * - Shockwave ring expanding outward
 * - Two colliding nebula masses (-1 x -1 = 1)
 * - Ouroboros torus knot wreathed in fire
 * - Dramatic flash lighting on collision
 */
export default function RicochetScene() {
  const groupRef = useRef<THREE.Group>(null);
  const starburstRef = useRef<THREE.Points>(null);
  const ringRef = useRef<THREE.Points>(null);
  const debrisRef = useRef<THREE.Points>(null);
  const torusRef = useRef<THREE.Mesh>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const orb1Ref = useRef<THREE.Mesh>(null);
  const orb2Ref = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const coreRef = useRef<THREE.PointLight>(null);

  const activeChapter = useDoctrineStore((s) => s.activeChapter);
  const isActive = activeChapter === chapter.id;

  // Starburst explosion particles
  const [burstPositions, burstDirections, burstColors] = useMemo(() => {
    const pos = new Float32Array(STARBURST_PARTICLES * 3);
    const dir = new Float32Array(STARBURST_PARTICLES * 3);
    const col = new Float32Array(STARBURST_PARTICLES * 3);

    for (let i = 0; i < STARBURST_PARTICLES; i++) {
      const i3 = i * 3;
      // Direction: radially outward
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dir[i3] = Math.sin(phi) * Math.cos(theta);
      dir[i3 + 1] = Math.sin(phi) * Math.sin(theta);
      dir[i3 + 2] = Math.cos(phi);
      pos[i3] = dir[i3] * 0.1;
      pos[i3 + 1] = dir[i3 + 1] * 0.1;
      pos[i3 + 2] = dir[i3 + 2] * 0.1;

      // Colors: hot white center -> orange -> red at edges
      const t = Math.random();
      if (t < 0.3) {
        col[i3] = 1; col[i3 + 1] = 0.95; col[i3 + 2] = 0.8; // White-hot
      } else if (t < 0.6) {
        col[i3] = 1; col[i3 + 1] = 0.6; col[i3 + 2] = 0.1; // Orange
      } else {
        col[i3] = 1; col[i3 + 1] = 0.2; col[i3 + 2] = 0.1; // Red
      }
    }
    return [pos, dir, col];
  }, []);

  // Shockwave ring particles
  const ringData = useMemo(() => {
    const pos = new Float32Array(RING_PARTICLES * 3);
    const angles = new Float32Array(RING_PARTICLES);
    for (let i = 0; i < RING_PARTICLES; i++) {
      angles[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, angles };
  }, []);

  // Debris field
  const [debrisPositions, debrisVelocities] = useMemo(() => {
    const pos = new Float32Array(DEBRIS_PARTICLES * 3);
    const vel = new Float32Array(DEBRIS_PARTICLES * 3);
    for (let i = 0; i < DEBRIS_PARTICLES; i++) {
      const i3 = i * 3;
      const r = 6 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.3;
      pos[i3 + 2] = r * Math.cos(phi);
      vel[i3] = (Math.random() - 0.5) * 0.02;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    return [pos, vel];
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = isActive ? 1.0 : 0.3;

    // Collision cycle: ~8 second cycle
    const cycle = (t * speed * 0.125) % 1; // 0→1 over 8 seconds
    const collisionPhase = cycle < 0.15 ? cycle / 0.15 : 1; // Quick collision
    const explosionPhase = cycle < 0.15 ? 0 : Math.min((cycle - 0.15) / 0.4, 1);
    const fadePhase = cycle > 0.55 ? (cycle - 0.55) / 0.45 : 0;

    // Starburst: expand then fade
    if (starburstRef.current) {
      const pos = starburstRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      const radius = explosionPhase * 15;
      const opacity = explosionPhase > 0 ? (1 - fadePhase) : 0;

      for (let i = 0; i < STARBURST_PARTICLES; i++) {
        const i3 = i * 3;
        const speed_i = 0.5 + (i / STARBURST_PARTICLES) * 0.8;
        arr[i3] = burstDirections[i3] * radius * speed_i;
        arr[i3 + 1] = burstDirections[i3 + 1] * radius * speed_i;
        arr[i3 + 2] = burstDirections[i3 + 2] * radius * speed_i;
      }
      pos.needsUpdate = true;
      (starburstRef.current.material as THREE.PointsMaterial).opacity =
        Math.max(0, opacity * (isActive ? 0.9 : 0.3));
    }

    // Shockwave ring
    if (ringRef.current) {
      const pos = ringRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      const ringRadius = explosionPhase * 18;

      for (let i = 0; i < RING_PARTICLES; i++) {
        const i3 = i * 3;
        const a = ringData.angles[i];
        const scatter = (Math.random() - 0.5) * 0.8;
        arr[i3] = ringRadius * Math.cos(a) + scatter;
        arr[i3 + 1] = scatter * 0.3;
        arr[i3 + 2] = ringRadius * Math.sin(a) + scatter;
      }
      pos.needsUpdate = true;
      (ringRef.current.material as THREE.PointsMaterial).opacity =
        Math.max(0, (1 - fadePhase) * 0.6 * (isActive ? 1 : 0.3));
    }

    // Shockwave mesh ring
    if (shockwaveRef.current) {
      const ringScale = explosionPhase * 16;
      shockwaveRef.current.scale.set(ringScale, ringScale, 0.3);
      const mat = shockwaveRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, (1 - fadePhase * 1.5) * 0.15 * (isActive ? 1 : 0.3));
    }

    // Colliding orbs: two masses that collide
    if (orb1Ref.current && orb2Ref.current) {
      const separation = (1 - collisionPhase) * 10;
      const orbScale = isActive ? 2.0 + Math.sin(t * 3) * 0.3 : 1.2;
      orb1Ref.current.position.set(-separation, 0, 0);
      orb2Ref.current.position.set(separation, 0, 0);
      orb1Ref.current.scale.setScalar(orbScale * (1 - explosionPhase * 0.5));
      orb2Ref.current.scale.setScalar(orbScale * (1 - explosionPhase * 0.5));
      const glow = separation < 1 ? 5 : 1.5;
      (orb1Ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow;
      (orb2Ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow;
    }

    // Ouroboros torus knot
    if (torusRef.current) {
      torusRef.current.rotation.x = t * 0.1 * speed;
      torusRef.current.rotation.y = t * 0.15 * speed;
      torusRef.current.rotation.z = t * 0.08 * speed;
      const mat = torusRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isActive ? 1.5 + Math.sin(t * 2) * 0.5 : 0.4;
      mat.opacity = isActive ? 0.6 : 0.15;
    }

    // Debris field rotation
    if (debrisRef.current) {
      debrisRef.current.rotation.y += 0.002 * speed;
      const pos = debrisRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < DEBRIS_PARTICLES; i++) {
        const i3 = i * 3;
        arr[i3] += debrisVelocities[i3] * speed;
        arr[i3 + 1] += debrisVelocities[i3 + 1] * speed;
        arr[i3 + 2] += debrisVelocities[i3 + 2] * speed;
        const dist = Math.sqrt(arr[i3] ** 2 + arr[i3 + 1] ** 2 + arr[i3 + 2] ** 2);
        if (dist > 16) {
          const s = 6 / dist;
          arr[i3] *= s;
          arr[i3 + 1] *= s;
          arr[i3 + 2] *= s;
        }
      }
      pos.needsUpdate = true;
    }

    // Flash light on collision
    if (flashRef.current) {
      const flashIntensity = collisionPhase > 0.9 ? (1 - (collisionPhase - 0.9) / 0.1) * 80 :
        explosionPhase < 0.3 ? explosionPhase / 0.3 * 50 : Math.max(0, (1 - explosionPhase) * 20);
      flashRef.current.intensity = isActive ? flashIntensity : flashIntensity * 0.15;
    }

    if (coreRef.current) {
      coreRef.current.intensity = isActive ? 15 + Math.sin(t * 2) * 5 : 4;
    }
  });

  return (
    <group ref={groupRef} position={chapter.position}>
      {/* Ouroboros torus knot - the eternal cycle */}
      <mesh ref={torusRef}>
        <torusKnotGeometry args={[6, 0.6, 200, 48, 2, 3]} />
        <meshStandardMaterial
          color="#cc2222"
          emissive="#ff4444"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.9}
          wireframe
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Colliding mass: Void (-1) */}
      <mesh ref={orb1Ref} position={[-5, 0, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color="#880000"
          emissive="#ff2200"
          emissiveIntensity={1.5}
          transparent
          opacity={isActive ? 0.85 : 0.3}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Colliding mass: Void (-1) */}
      <mesh ref={orb2Ref} position={[5, 0, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color="#880000"
          emissive="#ff4400"
          emissiveIntensity={1.5}
          transparent
          opacity={isActive ? 0.85 : 0.3}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Starburst explosion particles */}
      <points ref={starburstRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[burstPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[burstColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={isActive ? 0.25 : 0.1}
          transparent
          opacity={0}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Shockwave ring particles */}
      <points ref={ringRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ringData.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffaa44"
          size={0.3}
          transparent
          opacity={0}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Shockwave ring mesh */}
      <mesh ref={shockwaveRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.15, 16, 64]} />
        <meshBasicMaterial
          color="#ffcc88"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Debris field */}
      <points ref={debrisRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[debrisPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ff8844"
          size={isActive ? 0.15 : 0.06}
          transparent
          opacity={isActive ? 0.6 : 0.2}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Collision flash */}
      <pointLight ref={flashRef} color="#ffffff" intensity={0} distance={60} decay={2} />
      {/* Core glow */}
      <pointLight ref={coreRef} color="#ff4422" intensity={8} distance={45} decay={2} />
      <pointLight color="#ff8844" intensity={isActive ? 6 : 1.5} distance={30} decay={2} position={[0, 5, 0]} />
    </group>
  );
}
