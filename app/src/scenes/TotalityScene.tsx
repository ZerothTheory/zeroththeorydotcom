import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDoctrineStore } from '../store';
import { CHAPTERS } from '../data/doctrine';

const INNER_PARTICLE_COUNT = 3000;
const chapter = CHAPTERS[0];

/**
 * Chapter I: The Nature of the Container
 * A large translucent sphere pulsing with inner glow,
 * thousands of particles swirling inside representing
 * "all that was, is, and will be."
 */
export default function TotalityScene() {
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const innerParticlesRef = useRef<THREE.Points>(null);
  const activeChapter = useDoctrineStore((s) => s.activeChapter);
  const isActive = activeChapter === chapter.id;

  // Inner swirling particles
  const [particlePositions, particleVelocities] = useMemo(() => {
    const pos = new Float32Array(INNER_PARTICLE_COUNT * 3);
    const vel = new Float32Array(INNER_PARTICLE_COUNT * 3);
    for (let i = 0; i < INNER_PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const r = Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);

      // Orbital velocity (tangential)
      vel[i3] = (Math.random() - 0.5) * 0.02;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.02;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    return [pos, vel];
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const targetOpacity = isActive ? 0.15 : 0.06;

    // Pulse the sphere
    if (sphereRef.current) {
      const mat = sphereRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity += (targetOpacity - mat.opacity) * 0.05;
      mat.emissiveIntensity = isActive
        ? 1.5 + Math.sin(t * 1.5) * 0.5
        : 0.3 + Math.sin(t * 0.8) * 0.1;
      sphereRef.current.scale.setScalar(
        isActive ? 5.0 + Math.sin(t * 0.7) * 0.3 : 4.5
      );
    }

    // Animate inner particles
    if (innerParticlesRef.current) {
      const positions = innerParticlesRef.current.geometry.attributes.position;
      const arr = positions.array as Float32Array;
      const speed = isActive ? 1.5 : 0.4;

      for (let i = 0; i < INNER_PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        // Swirl around center
        const x = arr[i3];
        const z = arr[i3 + 2];
        const angle = Math.atan2(z, x) + 0.005 * speed;
        const r = Math.sqrt(x * x + z * z);
        arr[i3] = r * Math.cos(angle) + particleVelocities[i3] * speed;
        arr[i3 + 1] += particleVelocities[i3 + 1] * speed;
        arr[i3 + 2] = r * Math.sin(angle) + particleVelocities[i3 + 2] * speed;

        // Keep particles within sphere
        const dist = Math.sqrt(
          arr[i3] ** 2 + arr[i3 + 1] ** 2 + arr[i3 + 2] ** 2
        );
        if (dist > 4.5) {
          const scale = 4.5 / dist;
          arr[i3] *= scale * 0.95;
          arr[i3 + 1] *= scale * 0.95;
          arr[i3 + 2] *= scale * 0.95;
        }
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={chapter.position}>
      {/* The Container - translucent sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#6622cc"
          emissive="#8844ff"
          emissiveIntensity={0.3}
          transparent
          opacity={0.06}
          roughness={0.0}
          metalness={1.0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Inner wireframe sphere */}
      <mesh scale={4.2}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color="#8844ff"
          wireframe
          transparent
          opacity={isActive ? 0.08 : 0.03}
          depthWrite={false}
        />
      </mesh>

      {/* Inner swirling particles */}
      <points ref={innerParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particlePositions}
            count={INNER_PARTICLE_COUNT}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#bb88ff"
          size={isActive ? 0.08 : 0.04}
          transparent
          opacity={isActive ? 0.9 : 0.4}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Inner point light */}
      <pointLight
        color="#8844ff"
        intensity={isActive ? 15 : 3}
        distance={30}
        decay={2}
      />
    </group>
  );
}
