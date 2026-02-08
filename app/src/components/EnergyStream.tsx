import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHAPTERS } from '../data/doctrine';

const STREAM_PARTICLES = 400;

/**
 * Creates a flowing energy stream between two 3D points.
 * Particles flow along a curved path with color and glow.
 */
function Stream({
  from,
  to,
  color,
  particleCount = STREAM_PARTICLES,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  particleCount?: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const offsets = useRef<Float32Array>(new Float32Array(0));

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    offsets.current = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      offsets.current[i] = Math.random(); // position along path 0-1
    }
    return pos;
  }, [particleCount]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const pos = ref.current.geometry.attributes.position;
    const arr = pos.array as Float32Array;
    const mid = from.clone().add(to).multiplyScalar(0.5);
    // Create a bezier-like arc
    const perpUp = new THREE.Vector3(0, 1, 0);
    const dir = to.clone().sub(from);
    const len = dir.length();
    const midOffset = perpUp.clone().multiplyScalar(len * 0.15);
    mid.add(midOffset);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Advance particle along the path
      const pct = (offsets.current[i] + t * 0.08) % 1;
      
      // Quadratic bezier: from -> mid -> to
      const invPct = 1 - pct;
      const x = invPct * invPct * from.x + 2 * invPct * pct * mid.x + pct * pct * to.x;
      const y = invPct * invPct * from.y + 2 * invPct * pct * mid.y + pct * pct * to.y;
      const z = invPct * invPct * from.z + 2 * invPct * pct * mid.z + pct * pct * to.z;

      // Add a bit of scatter
      const scatter = Math.sin(t * 2 + i * 0.5) * 0.5;
      arr[i3] = x + scatter * Math.sin(i);
      arr[i3 + 1] = y + scatter * Math.cos(i);
      arr[i3 + 2] = z + scatter * Math.sin(i * 0.7);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={particleCount} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.4}
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * Energy streams connecting all chapters in a web-like pattern.
 */
export default function EnergyStreams() {
  const connections = useMemo(() => {
    const conns: { from: THREE.Vector3; to: THREE.Vector3; color: string }[] = [];
    // Connect sequential chapters
    for (let i = 0; i < CHAPTERS.length - 1; i++) {
      const fromPos = new THREE.Vector3(...CHAPTERS[i].position);
      const toPos = new THREE.Vector3(...CHAPTERS[i + 1].position);
      // Blend colors between chapters
      const c1 = new THREE.Color(CHAPTERS[i].color);
      const c2 = new THREE.Color(CHAPTERS[i + 1].color);
      const blended = c1.clone().lerp(c2, 0.5);
      conns.push({ from: fromPos, to: toPos, color: '#' + blended.getHexString() });
    }
    // Connect last to first (the Ouroboros loop)
    const last = new THREE.Vector3(...CHAPTERS[CHAPTERS.length - 1].position);
    const first = new THREE.Vector3(...CHAPTERS[0].position);
    const c1 = new THREE.Color(CHAPTERS[CHAPTERS.length - 1].color);
    const c2 = new THREE.Color(CHAPTERS[0].color);
    conns.push({ from: last, to: first, color: '#' + c1.clone().lerp(c2, 0.5).getHexString() });
    return conns;
  }, []);

  return (
    <group>
      {connections.map((conn, i) => (
        <Stream key={i} from={conn.from} to={conn.to} color={conn.color} particleCount={300} />
      ))}
    </group>
  );
}
