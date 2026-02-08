import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDoctrineStore } from '../store';
import { CHAPTERS } from '../data/doctrine';

const chapter = CHAPTERS[3];
const FALLING_PARTICLES = 3000;
const GRID_RES = 50;
const GRAVITATIONAL_WAVE_RINGS = 8;
const LIGHT_BEAM_PARTICLES = 600;
const WATERFALL_PARTICLES = 1500;

/**
 * Chapter IV: The Mechanism of the Return — Gravity and Light
 *
 * Light falling back to Zero. The universe inhaling.
 * Features:
 * - Massive space-time funnel warping dramatically
 * - Light beams curving around the gravity well
 * - Cascading particle waterfall spiraling into the well
 * - Gravitational wave rings propagating outward
 * - Central attractor pulsing with accumulated light
 * - Elastic tension lines stretching from center
 */
export default function GravityWellScene() {
  const groupRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.Mesh>(null);
  const fallingRef = useRef<THREE.Points>(null);
  const waterfallRef = useRef<THREE.Points>(null);
  const beamRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);
  const waveRingsRef = useRef<THREE.Group>(null);

  const activeChapter = useDoctrineStore((s) => s.activeChapter);
  const isActive = activeChapter === chapter.id;

  // Warped grid surface — deeper, more dramatic funnel
  const gridGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(40, 40, GRID_RES, GRID_RES);
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      const dist = Math.sqrt(x * x + z * z);
      // Deep gravity well with smooth falloff
      const depth = -14 / (1 + dist * 0.3) + Math.sin(dist * 0.5) * 0.3;
      positions.setZ(i, depth);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Spiraling light particles falling into the well
  const fallingData = useMemo(() => {
    const pos = new Float32Array(FALLING_PARTICLES * 3);
    const col = new Float32Array(FALLING_PARTICLES * 3);
    const radii = new Float32Array(FALLING_PARTICLES);
    const angles = new Float32Array(FALLING_PARTICLES);
    const speeds = new Float32Array(FALLING_PARTICLES);
    const heights = new Float32Array(FALLING_PARTICLES);

    for (let i = 0; i < FALLING_PARTICLES; i++) {
      const i3 = i * 3;
      radii[i] = 1 + Math.random() * 18;
      angles[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.3 + Math.random() * 0.7;
      heights[i] = Math.random() * 8;

      // Color: golden at edges → white-hot in center
      const t = radii[i] / 18;
      col[i3] = 1.0;
      col[i3 + 1] = 0.6 + (1 - t) * 0.4;
      col[i3 + 2] = 0.2 + (1 - t) * 0.6;
    }
    return { positions: pos, colors: col, radii, angles, speeds, heights };
  }, []);

  // Waterfall particles — cascading straight down
  const waterfallData = useMemo(() => {
    const pos = new Float32Array(WATERFALL_PARTICLES * 3);
    const offsets = new Float32Array(WATERFALL_PARTICLES);
    const ringRadii = new Float32Array(WATERFALL_PARTICLES);
    for (let i = 0; i < WATERFALL_PARTICLES; i++) {
      offsets[i] = Math.random();
      ringRadii[i] = Math.random() * 3;
    }
    return { positions: pos, offsets, ringRadii };
  }, []);

  // Light beams curving around the well
  const beamData = useMemo(() => {
    const pos = new Float32Array(LIGHT_BEAM_PARTICLES * 3);
    const offsets = new Float32Array(LIGHT_BEAM_PARTICLES);
    for (let i = 0; i < LIGHT_BEAM_PARTICLES; i++) {
      offsets[i] = Math.random();
    }
    return { positions: pos, offsets };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = isActive ? 1.0 : 0.3;

    // Grid pulsing
    if (gridRef.current) {
      const mat = gridRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = isActive ? 0.35 + Math.sin(t * 0.5) * 0.1 : 0.12;
      mat.emissiveIntensity = isActive ? 0.6 + Math.sin(t) * 0.3 : 0.15;
    }

    // Spiraling falling particles
    if (fallingRef.current) {
      const pos = fallingRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      const fd = fallingData;

      for (let i = 0; i < FALLING_PARTICLES; i++) {
        const i3 = i * 3;
        fd.angles[i] += fd.speeds[i] * speed * 0.025;
        fd.radii[i] -= fd.speeds[i] * speed * 0.008;

        if (fd.radii[i] < 0.3) {
          fd.radii[i] = 12 + Math.random() * 8;
          fd.heights[i] = 3 + Math.random() * 6;
        }

        const r = fd.radii[i];
        const a = fd.angles[i];
        const wellDepth = -10 / (1 + r * 0.3);
        arr[i3] = r * Math.cos(a);
        arr[i3 + 1] = wellDepth + fd.heights[i] * (r / 18);
        arr[i3 + 2] = r * Math.sin(a);
      }
      pos.needsUpdate = true;
    }

    // Waterfall — particles streaming down into the center
    if (waterfallRef.current) {
      const pos = waterfallRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      const wd = waterfallData;

      for (let i = 0; i < WATERFALL_PARTICLES; i++) {
        const i3 = i * 3;
        const pct = (wd.offsets[i] + t * speed * 0.2) % 1;
        const height = 10 - pct * 24;
        const angle = t * 0.3 * speed + i * 0.01;
        const radius = wd.ringRadii[i] * (1 - pct * 0.8);
        arr[i3] = Math.cos(angle) * radius;
        arr[i3 + 1] = height;
        arr[i3 + 2] = Math.sin(angle) * radius;
      }
      pos.needsUpdate = true;
    }

    // Light beams curving
    if (beamRef.current) {
      const pos = beamRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      const bd = beamData;

      for (let i = 0; i < LIGHT_BEAM_PARTICLES; i++) {
        const i3 = i * 3;
        const pct = (bd.offsets[i] + t * speed * 0.3) % 1;
        // Light comes from far away, curves around the well
        const startAngle = (i / LIGHT_BEAM_PARTICLES) * Math.PI * 2;
        const startR = 20;
        const curveAngle = startAngle + pct * Math.PI;
        const curveR = startR * (1 - pct * 0.7);
        const curveY = -pct * pct * 12;

        arr[i3] = curveR * Math.cos(curveAngle);
        arr[i3 + 1] = curveY + 5;
        arr[i3 + 2] = curveR * Math.sin(curveAngle);
      }
      pos.needsUpdate = true;
    }

    // Core attractor
    if (coreRef.current) {
      const pulse = Math.sin(t * 1.5) * 0.3 + 1;
      coreRef.current.scale.setScalar(isActive ? 1.5 * pulse : 0.8);
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isActive ? 5 + Math.sin(t * 2) * 3 : 1.5;
    }

    if (coreLightRef.current) {
      coreLightRef.current.intensity = isActive ? 25 + Math.sin(t * 1.5) * 10 : 5;
    }

    // Gravitational wave rings
    if (waveRingsRef.current) {
      waveRingsRef.current.children.forEach((child, idx) => {
        const ring = child as THREE.Mesh;
        const offset = idx / GRAVITATIONAL_WAVE_RINGS;
        const scale = ((t * speed * 0.2 + offset) % 1) * 20;
        ring.scale.set(scale, scale, 1);
        const mat = ring.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, (1 - scale / 20) * (isActive ? 0.15 : 0.04));
      });
    }
  });

  return (
    <group ref={groupRef} position={chapter.position}>
      {/* Warped space-time grid */}
      <mesh ref={gridRef} geometry={gridGeometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#aa6600"
          emissive="#ffaa22"
          emissiveIntensity={0.2}
          transparent
          opacity={0.15}
          wireframe
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Spiraling light particles */}
      <points ref={fallingRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fallingData.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[fallingData.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={isActive ? 0.15 : 0.06}
          transparent
          opacity={isActive ? 0.85 : 0.35}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Waterfall cascade */}
      <points ref={waterfallRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[waterfallData.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffdd88"
          size={0.12}
          transparent
          opacity={isActive ? 0.6 : 0.15}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Curving light beams */}
      <points ref={beamRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[beamData.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffeecc"
          size={0.2}
          transparent
          opacity={isActive ? 0.5 : 0.12}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Central attractor */}
      <mesh ref={coreRef} position={[0, -12, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#ffaa22"
          emissive="#ffcc44"
          emissiveIntensity={3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Gravitational wave rings */}
      <group ref={waveRingsRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -12, 0]}>
        {Array.from({ length: GRAVITATIONAL_WAVE_RINGS }).map((_, i) => (
          <mesh key={i}>
            <torusGeometry args={[1, 0.05, 8, 64]} />
            <meshBasicMaterial
              color="#ffaa44"
              transparent
              opacity={0.1}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* Well lighting */}
      <pointLight ref={coreLightRef} position={[0, -10, 0]} color="#ffaa22" intensity={12} distance={50} decay={2} />
      <pointLight color="#ffcc44" intensity={isActive ? 8 : 2} distance={35} decay={2} position={[0, 5, 0]} />
    </group>
  );
}
