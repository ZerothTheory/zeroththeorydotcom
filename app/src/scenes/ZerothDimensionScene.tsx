import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDoctrineStore } from '../store';
import { CHAPTERS } from '../data/doctrine';

const STAR_COUNT = 2000;
const GRID_SIZE = 20;
const GRID_DIVISIONS = 20;
const chapter = CHAPTERS[2];

/**
 * Chapter III: The Fallacy of Infinity / The Zeroth Dimension
 * A vast star field that compresses into a single luminous point
 * when the user approaches. Gridlines converge showing 3D to 0D collapse.
 */
export default function ZerothDimensionScene() {
  const groupRef = useRef<THREE.Group>(null);
  const starsRef = useRef<THREE.Points>(null);
  const gridRef = useRef<THREE.LineSegments>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const collapseProgress = useRef(0);

  const activeChapter = useDoctrineStore((s) => s.activeChapter);
  const isActive = activeChapter === chapter.id;

  const [starPositions, originalPositions] = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const orig = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      // Spread in a cube
      pos[i3] = (Math.random() - 0.5) * 30;
      pos[i3 + 1] = (Math.random() - 0.5) * 30;
      pos[i3 + 2] = (Math.random() - 0.5) * 30;
      orig[i3] = pos[i3];
      orig[i3 + 1] = pos[i3 + 1];
      orig[i3 + 2] = pos[i3 + 2];
    }
    return [pos, orig];
  }, []);

  // Grid geometry
  const gridGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts: number[] = [];
    const step = GRID_SIZE / GRID_DIVISIONS;
    const half = GRID_SIZE / 2;

    // XZ plane grid
    for (let i = 0; i <= GRID_DIVISIONS; i++) {
      const pos = -half + i * step;
      verts.push(pos, 0, -half, pos, 0, half);
      verts.push(-half, 0, pos, half, 0, pos);
    }
    // XY plane grid
    for (let i = 0; i <= GRID_DIVISIONS; i++) {
      const pos = -half + i * step;
      verts.push(pos, -half, 0, pos, half, 0);
      verts.push(-half, pos, 0, half, pos, 0);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    return geo;
  }, []);

  const gridOriginalPositions = useMemo(() => {
    return new Float32Array(gridGeometry.attributes.position.array);
  }, [gridGeometry]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const targetCollapse = isActive ? 0.85 : 0.0;
    collapseProgress.current += (targetCollapse - collapseProgress.current) * delta * 1.5;
    const cp = collapseProgress.current;

    // Collapse stars toward center
    if (starsRef.current) {
      const pos = starsRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;

      for (let i = 0; i < STAR_COUNT; i++) {
        const i3 = i * 3;
        arr[i3] = originalPositions[i3] * (1 - cp) + Math.sin(t * 0.5 + i * 0.01) * 0.1 * cp;
        arr[i3 + 1] = originalPositions[i3 + 1] * (1 - cp) + Math.cos(t * 0.3 + i * 0.02) * 0.1 * cp;
        arr[i3 + 2] = originalPositions[i3 + 2] * (1 - cp) + Math.sin(t * 0.7 + i * 0.015) * 0.1 * cp;
      }
      pos.needsUpdate = true;
    }

    // Collapse grid toward center
    if (gridRef.current) {
      const pos = gridRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;

      for (let i = 0; i < arr.length; i += 3) {
        arr[i] = gridOriginalPositions[i] * (1 - cp * 0.9);
        arr[i + 1] = gridOriginalPositions[i + 1] * (1 - cp * 0.9);
        arr[i + 2] = gridOriginalPositions[i + 2] * (1 - cp * 0.9);
      }
      pos.needsUpdate = true;
    }

    // Glow the core point
    if (coreRef.current) {
      const scale = 0.2 + cp * 2 + Math.sin(t * 3) * 0.2 * cp;
      coreRef.current.scale.setScalar(scale);
      (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1 + cp * 8;
    }
  });

  return (
    <group ref={groupRef} position={chapter.position}>
      {/* Collapsing stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={starPositions}
            count={STAR_COUNT}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#88ccff"
          size={0.12}
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Converging grid */}
      <lineSegments ref={gridRef} geometry={gridGeometry}>
        <lineBasicMaterial
          color="#2244aa"
          transparent
          opacity={isActive ? 0.2 : 0.06}
        />
      </lineSegments>

      {/* Central singularity point */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#44aaff"
          emissive="#44aaff"
          emissiveIntensity={1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Core light */}
      <pointLight
        color="#44aaff"
        intensity={isActive ? 15 : 3}
        distance={30}
        decay={2}
      />
    </group>
  );
}
