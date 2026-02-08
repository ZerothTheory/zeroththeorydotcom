import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDoctrineStore } from '../store';
import { CHAPTERS } from '../data/doctrine';

const FALLING_PARTICLE_COUNT = 1200;
const GRID_RES = 40;
const chapter = CHAPTERS[3];

/**
 * Chapter IV: The Mechanism of the Return (Gravity and Light)
 * A warped space-time grid forming a deep gravity funnel,
 * with luminous particles spiraling down toward the center.
 */
export default function GravityWellScene() {
  const groupRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const activeChapter = useDoctrineStore((s) => s.activeChapter);
  const isActive = activeChapter === chapter.id;

  // Create the warped grid surface
  const gridGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(30, 30, GRID_RES, GRID_RES);
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i); // PlaneGeometry uses XY, we'll rotate
      const dist = Math.sqrt(x * x + z * z);
      // Gravity well depression
      const depth = -8 / (1 + dist * 0.5);
      positions.setZ(i, depth);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  // Particle data for spiraling light
  const particleData = useMemo(() => {
    const positions = new Float32Array(FALLING_PARTICLE_COUNT * 3);
    const radii = new Float32Array(FALLING_PARTICLE_COUNT);
    const angles = new Float32Array(FALLING_PARTICLE_COUNT);
    const speeds = new Float32Array(FALLING_PARTICLE_COUNT);
    const heights = new Float32Array(FALLING_PARTICLE_COUNT);

    for (let i = 0; i < FALLING_PARTICLE_COUNT; i++) {
      radii[i] = 1 + Math.random() * 12;
      angles[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.3 + Math.random() * 0.7;
      heights[i] = Math.random() * 5;
    }

    return { positions, radii, angles, speeds, heights };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = isActive ? 1.0 : 0.3;

    // Animate grid pulsing
    if (gridRef.current) {
      const mat = gridRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = isActive ? 0.4 : 0.15;
      mat.emissiveIntensity = isActive ? 0.5 + Math.sin(t) * 0.2 : 0.1;
    }

    // Animate spiraling particles
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      const pd = particleData;

      for (let i = 0; i < FALLING_PARTICLE_COUNT; i++) {
        const i3 = i * 3;

        // Spiral inward
        pd.angles[i] += pd.speeds[i] * speed * 0.02;
        pd.radii[i] -= pd.speeds[i] * speed * 0.005;

        // Reset when reaching center
        if (pd.radii[i] < 0.3) {
          pd.radii[i] = 8 + Math.random() * 5;
          pd.heights[i] = 2 + Math.random() * 4;
        }

        const r = pd.radii[i];
        const angle = pd.angles[i];
        // Height follows the gravity well shape
        const wellDepth = -6 / (1 + r * 0.5);

        arr[i3] = r * Math.cos(angle);
        arr[i3 + 1] = wellDepth + pd.heights[i] * (r / 12);
        arr[i3 + 2] = r * Math.sin(angle);
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={chapter.position}>
      {/* Warped space-time grid */}
      <mesh ref={gridRef} geometry={gridGeometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#aa6600"
          emissive="#ffaa22"
          emissiveIntensity={0.1}
          transparent
          opacity={0.15}
          wireframe
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Spiraling light particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.positions}
            count={FALLING_PARTICLE_COUNT}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ffcc44"
          size={isActive ? 0.12 : 0.06}
          transparent
          opacity={isActive ? 0.9 : 0.4}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Central attractor */}
      <mesh position={[0, -8, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color="#ffaa22"
          emissive="#ffaa22"
          emissiveIntensity={isActive ? 5 : 1}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Well light */}
      <pointLight
        position={[0, -6, 0]}
        color="#ffaa22"
        intensity={isActive ? 12 : 3}
        distance={30}
        decay={2}
      />
    </group>
  );
}
