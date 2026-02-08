import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDoctrineStore } from '../store';
import { CHAPTERS } from '../data/doctrine';

const RING_PARTICLE_COUNT = 1500;
const chapter = CHAPTERS[1];

/**
 * Chapter II: The Eternal Return / The Ricochet
 * An Ouroboros ring (torus knot) with particles flowing
 * endlessly around it. Collision flash when -1 meets -1.
 */
export default function RicochetScene() {
  const groupRef = useRef<THREE.Group>(null);
  const torusRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const orb1Ref = useRef<THREE.Mesh>(null);
  const orb2Ref = useRef<THREE.Mesh>(null);

  const activeChapter = useDoctrineStore((s) => s.activeChapter);
  const isActive = activeChapter === chapter.id;

  const particleData = useMemo(() => {
    const positions = new Float32Array(RING_PARTICLE_COUNT * 3);
    const offsets = new Float32Array(RING_PARTICLE_COUNT);
    for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
      offsets[i] = Math.random() * Math.PI * 2;
    }
    return { positions, offsets };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = isActive ? 1.0 : 0.3;

    // Rotate the torus
    if (torusRef.current) {
      torusRef.current.rotation.x = t * 0.1 * speed;
      torusRef.current.rotation.y = t * 0.15 * speed;
      const mat = torusRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isActive ? 1.5 + Math.sin(t * 2) * 0.5 : 0.3;
    }

    // Animate particles flowing along torus knot path
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      const R = 4; // Major radius
      const r = 1.5; // Minor radius

      for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const angle = (t * speed * 0.5 + particleData.offsets[i]) % (Math.PI * 2);
        const p = 2, q = 3; // Torus knot parameters
        const phi = angle * p;
        const theta = angle * q;
        const noise = Math.sin(t * 3 + i) * 0.2;

        const rr = R + r * Math.cos(theta);
        arr[i3] = rr * Math.cos(phi) + noise;
        arr[i3 + 1] = rr * Math.sin(phi) + noise;
        arr[i3 + 2] = r * Math.sin(theta) + noise;
      }
      pos.needsUpdate = true;
    }

    // Collision flash cycle (every ~4 seconds)
    const cycle = (t * speed) % 4;
    const flashIntensity = cycle < 0.3 ? (1 - cycle / 0.3) * 40 : 0;
    if (flashRef.current) {
      flashRef.current.intensity = isActive ? flashIntensity : flashIntensity * 0.2;
    }

    // Animate the two colliding orbs (-1 and -1)
    if (orb1Ref.current && orb2Ref.current) {
      const phase = (t * speed * 0.25) % 1; // 0 to 1 cycle
      const sep = Math.abs(Math.sin(phase * Math.PI)) * 6;
      orb1Ref.current.position.set(-sep, 3, 0);
      orb2Ref.current.position.set(sep, 3, 0);

      const collisionGlow = sep < 0.5 ? 5 : 1;
      (orb1Ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = collisionGlow;
      (orb2Ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = collisionGlow;
    }
  });

  return (
    <group ref={groupRef} position={chapter.position}>
      {/* Torus knot - the Ouroboros */}
      <mesh ref={torusRef}>
        <torusKnotGeometry args={[4, 0.4, 128, 32, 2, 3]} />
        <meshStandardMaterial
          color="#cc2222"
          emissive="#ff4444"
          emissiveIntensity={0.3}
          transparent
          opacity={isActive ? 0.6 : 0.2}
          roughness={0.2}
          metalness={0.9}
          wireframe
        />
      </mesh>

      {/* Flowing particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.positions}
            count={RING_PARTICLE_COUNT}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ff6644"
          size={isActive ? 0.1 : 0.05}
          transparent
          opacity={isActive ? 0.8 : 0.3}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Colliding orbs: -1 and -1 */}
      <mesh ref={orb1Ref} position={[-3, 3, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial
          color="#ff2222"
          emissive="#ff4444"
          emissiveIntensity={1}
          transparent
          opacity={isActive ? 0.9 : 0.3}
        />
      </mesh>
      <mesh ref={orb2Ref} position={[3, 3, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial
          color="#ff2222"
          emissive="#ff4444"
          emissiveIntensity={1}
          transparent
          opacity={isActive ? 0.9 : 0.3}
        />
      </mesh>

      {/* Collision flash */}
      <pointLight ref={flashRef} position={[0, 3, 0]} color="#ffffff" intensity={0} distance={30} decay={2} />

      {/* Ambient scene light */}
      <pointLight color="#ff4444" intensity={isActive ? 8 : 2} distance={25} decay={2} />
    </group>
  );
}
