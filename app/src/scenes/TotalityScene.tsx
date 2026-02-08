import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDoctrineStore } from '../store';
import { CHAPTERS } from '../data/doctrine';

const chapter = CHAPTERS[0];
const GALAXY_ARMS = 4;
const PARTICLES_PER_ARM = 1500;
const CORE_PARTICLES = 2000;
const HALO_PARTICLES = 1200;

/**
 * Chapter I: The Nature of the Container — The Totality
 *
 * A massive cosmic nebula representing "the sum of all frequencies."
 * Features:
 * - Galaxy-arm spiral of rainbow-spectrum particles
 * - Pulsing central core with god-ray glow
 * - Outer halo of softly glowing particles
 * - Spectrum color shifting through all colors (all frequencies)
 * - Multiple dynamic point lights
 */
export default function TotalityScene() {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const innerShellRef = useRef<THREE.Mesh>(null);
  const outerShellRef = useRef<THREE.Mesh>(null);
  const spiralRef = useRef<THREE.Points>(null);
  const coreParticlesRef = useRef<THREE.Points>(null);
  const haloRef = useRef<THREE.Points>(null);
  const light1Ref = useRef<THREE.PointLight>(null);
  const light2Ref = useRef<THREE.PointLight>(null);

  const activeChapter = useDoctrineStore((s) => s.activeChapter);
  const isActive = activeChapter === chapter.id;

  // Galaxy spiral arms
  const [spiralPositions, spiralColors] = useMemo(() => {
    const total = GALAXY_ARMS * PARTICLES_PER_ARM;
    const pos = new Float32Array(total * 3);
    const col = new Float32Array(total * 3);

    for (let arm = 0; arm < GALAXY_ARMS; arm++) {
      const armAngle = (arm / GALAXY_ARMS) * Math.PI * 2;
      const hue = arm / GALAXY_ARMS;

      for (let i = 0; i < PARTICLES_PER_ARM; i++) {
        const idx = (arm * PARTICLES_PER_ARM + i) * 3;
        const t = i / PARTICLES_PER_ARM;
        const angle = armAngle + t * Math.PI * 3; // 1.5 full turns
        const r = 2 + t * 12;
        const scatter = (Math.random() - 0.5) * (1 + t * 3);
        const yScatter = (Math.random() - 0.5) * (0.5 + t * 1.5);

        pos[idx] = r * Math.cos(angle) + scatter;
        pos[idx + 1] = yScatter;
        pos[idx + 2] = r * Math.sin(angle) + scatter;

        // Rainbow spectrum colors - each arm has different base hue
        const h = (hue + t * 0.3 + Math.random() * 0.1) % 1;
        const c = new THREE.Color().setHSL(h, 0.9, 0.5 + Math.random() * 0.3);
        col[idx] = c.r;
        col[idx + 1] = c.g;
        col[idx + 2] = c.b;
      }
    }
    return [pos, col];
  }, []);

  // Central core particles - dense, bright, swirling
  const [corePositions, coreVelocities] = useMemo(() => {
    const pos = new Float32Array(CORE_PARTICLES * 3);
    const vel = new Float32Array(CORE_PARTICLES * 3);
    for (let i = 0; i < CORE_PARTICLES; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 2) * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.4; // flattened
      pos[i3 + 2] = r * Math.cos(phi);
      vel[i3] = (Math.random() - 0.5) * 0.03;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.03;
    }
    return [pos, vel];
  }, []);

  // Outer halo
  const haloPositions = useMemo(() => {
    const pos = new Float32Array(HALO_PARTICLES * 3);
    for (let i = 0; i < HALO_PARTICLES; i++) {
      const i3 = i * 3;
      const r = 8 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      pos[i3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = isActive ? 1.0 : 0.3;

    // Rotate spiral arms
    if (spiralRef.current) {
      spiralRef.current.rotation.y += 0.002 * speed;
    }

    // Pulse the core
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      const pulse = Math.sin(t * 1.2) * 0.3 + 0.7;
      coreRef.current.scale.setScalar(isActive ? 1.5 + pulse * 0.5 : 0.8 + pulse * 0.2);
      mat.emissiveIntensity = isActive ? 3 + Math.sin(t * 2) * 1.5 : 0.8;
      // Cycle through all colors (all frequencies)
      const hue = (t * 0.05) % 1;
      mat.emissive.setHSL(hue, 0.8, 0.5);
      mat.color.setHSL(hue, 0.6, 0.3);
    }

    // Inner translucent shell
    if (innerShellRef.current) {
      innerShellRef.current.rotation.y = t * 0.05;
      innerShellRef.current.rotation.x = t * 0.03;
      const mat = innerShellRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = isActive ? 0.08 + Math.sin(t * 0.8) * 0.03 : 0.03;
      mat.emissiveIntensity = isActive ? 0.8 : 0.2;
    }

    // Outer shell
    if (outerShellRef.current) {
      outerShellRef.current.rotation.y = -t * 0.02;
      const mat = outerShellRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = isActive ? 0.04 : 0.015;
    }

    // Animate core particles
    if (coreParticlesRef.current) {
      const pos = coreParticlesRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < CORE_PARTICLES; i++) {
        const i3 = i * 3;
        const x = arr[i3];
        const z = arr[i3 + 2];
        const angle = Math.atan2(z, x) + 0.008 * speed;
        const r = Math.sqrt(x * x + z * z);
        arr[i3] = r * Math.cos(angle) + coreVelocities[i3] * speed;
        arr[i3 + 1] += coreVelocities[i3 + 1] * speed;
        arr[i3 + 2] = r * Math.sin(angle) + coreVelocities[i3 + 2] * speed;
        const dist = Math.sqrt(arr[i3] ** 2 + arr[i3 + 1] ** 2 + arr[i3 + 2] ** 2);
        if (dist > 5) {
          const s = 5 / dist * 0.95;
          arr[i3] *= s;
          arr[i3 + 1] *= s;
          arr[i3 + 2] *= s;
        }
      }
      pos.needsUpdate = true;
    }

    // Halo rotation
    if (haloRef.current) {
      haloRef.current.rotation.y -= 0.001 * speed;
    }

    // Dynamic lights
    if (light1Ref.current) {
      const h1 = (t * 0.1) % 1;
      light1Ref.current.color.setHSL(h1, 0.9, 0.5);
      light1Ref.current.intensity = isActive ? 20 + Math.sin(t * 1.5) * 8 : 5;
    }
    if (light2Ref.current) {
      const h2 = (t * 0.1 + 0.5) % 1;
      light2Ref.current.color.setHSL(h2, 0.8, 0.5);
      light2Ref.current.intensity = isActive ? 12 + Math.cos(t * 1.2) * 5 : 3;
      light2Ref.current.position.set(
        Math.cos(t * 0.3) * 6,
        Math.sin(t * 0.2) * 3,
        Math.sin(t * 0.3) * 6
      );
    }
  });

  return (
    <group ref={groupRef} position={chapter.position}>
      {/* Central glowing core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.2, 48, 48]} />
        <meshStandardMaterial
          color="#8844ff"
          emissive="#8844ff"
          emissiveIntensity={1}
          transparent
          opacity={0.9}
          roughness={0}
          metalness={1}
        />
      </mesh>

      {/* Inner translucent container shell */}
      <mesh ref={innerShellRef} scale={7}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial
          color="#6622cc"
          emissive="#aa66ff"
          emissiveIntensity={0.3}
          transparent
          opacity={0.04}
          roughness={0}
          metalness={1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer wireframe shell - the Container boundary */}
      <mesh ref={outerShellRef} scale={14}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial
          color="#aa88ff"
          wireframe
          transparent
          opacity={0.03}
          depthWrite={false}
        />
      </mesh>

      {/* Galaxy spiral arms - rainbow spectrum */}
      <points ref={spiralRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[spiralPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[spiralColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={isActive ? 0.2 : 0.1}
          transparent
          opacity={isActive ? 0.85 : 0.35}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Dense central core particles */}
      <points ref={coreParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[corePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ddbbff"
          size={isActive ? 0.12 : 0.05}
          transparent
          opacity={isActive ? 0.9 : 0.4}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Outer halo */}
      <points ref={haloRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[haloPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#9966dd"
          size={0.5}
          transparent
          opacity={isActive ? 0.25 : 0.08}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Dynamic colored lights */}
      <pointLight ref={light1Ref} color="#8844ff" intensity={8} distance={50} decay={2} />
      <pointLight ref={light2Ref} color="#ff44aa" intensity={5} distance={35} decay={2} />
    </group>
  );
}
