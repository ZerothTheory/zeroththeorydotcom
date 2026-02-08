import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDoctrineStore } from '../store';
import { CHAPTERS } from '../data/doctrine';

const chapter = CHAPTERS[2];
const ACCRETION_PARTICLES = 4000;
const INFALLING_STARS = 1500;
const JET_PARTICLES = 800;
const LENSING_SEGMENTS = 128;

/**
 * Chapter III: The Fallacy of Infinity — The Zeroth Dimension
 *
 * A black hole singularity where all of 3D space collapses
 * into a single zero-dimensional point.
 * Features:
 * - Massive accretion disk with glowing hot particles
 * - Event horizon (dark sphere with distorted boundary)
 * - Einstein ring / photon sphere glow
 * - Stars being spaghettified and pulled inward
 * - Relativistic jets shooting from poles
 * - Grid collapse showing 3D→0D
 */
export default function ZerothDimensionScene() {
  const groupRef = useRef<THREE.Group>(null);
  const eventHorizonRef = useRef<THREE.Mesh>(null);
  const photonSphereRef = useRef<THREE.Mesh>(null);
  const accretionRef = useRef<THREE.Points>(null);
  const infallingRef = useRef<THREE.Points>(null);
  const jet1Ref = useRef<THREE.Points>(null);
  const jet2Ref = useRef<THREE.Points>(null);
  const lensingRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.LineSegments>(null);

  const activeChapter = useDoctrineStore((s) => s.activeChapter);
  const isActive = activeChapter === chapter.id;
  const collapseProgress = useRef(0);

  // Accretion disk particles
  const [accretionPositions, accretionData] = useMemo(() => {
    const pos = new Float32Array(ACCRETION_PARTICLES * 3);
    const data = {
      radii: new Float32Array(ACCRETION_PARTICLES),
      angles: new Float32Array(ACCRETION_PARTICLES),
      speeds: new Float32Array(ACCRETION_PARTICLES),
      heights: new Float32Array(ACCRETION_PARTICLES),
    };
    for (let i = 0; i < ACCRETION_PARTICLES; i++) {
      // Inner particles faster, denser; outer particles slower
      data.radii[i] = 3 + Math.pow(Math.random(), 0.7) * 12;
      data.angles[i] = Math.random() * Math.PI * 2;
      data.speeds[i] = 1 / (data.radii[i] * 0.15); // Keplerian: faster near center
      data.heights[i] = (Math.random() - 0.5) * (data.radii[i] < 5 ? 0.3 : 1.5);
    }
    return [pos, data];
  }, []);

  // Accretion disk colors (hot blue inner → orange outer)
  const accretionColors = useMemo(() => {
    const col = new Float32Array(ACCRETION_PARTICLES * 3);
    for (let i = 0; i < ACCRETION_PARTICLES; i++) {
      const i3 = i * 3;
      const r = accretionData.radii[i];
      const t = Math.min((r - 3) / 12, 1); // 0=inner, 1=outer
      if (t < 0.3) {
        // Inner: white-blue
        col[i3] = 0.7 + (1 - t / 0.3) * 0.3;
        col[i3 + 1] = 0.8 + (1 - t / 0.3) * 0.2;
        col[i3 + 2] = 1.0;
      } else if (t < 0.6) {
        // Mid: cyan-yellow
        const u = (t - 0.3) / 0.3;
        col[i3] = 0.7 + u * 0.3;
        col[i3 + 1] = 0.8 - u * 0.2;
        col[i3 + 2] = 1.0 - u * 0.6;
      } else {
        // Outer: orange-red
        const u = (t - 0.6) / 0.4;
        col[i3] = 1.0;
        col[i3 + 1] = 0.5 - u * 0.3;
        col[i3 + 2] = 0.2 - u * 0.15;
      }
    }
    return col;
  }, [accretionData]);

  // Infalling stars being pulled toward singularity
  const [infallingPositions, infallingData] = useMemo(() => {
    const pos = new Float32Array(INFALLING_STARS * 3);
    const data = {
      origPositions: new Float32Array(INFALLING_STARS * 3),
      radii: new Float32Array(INFALLING_STARS),
      angles: new Float32Array(INFALLING_STARS),
      fallSpeed: new Float32Array(INFALLING_STARS),
    };
    for (let i = 0; i < INFALLING_STARS; i++) {
      const i3 = i * 3;
      const r = 8 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);
      data.origPositions[i3] = pos[i3];
      data.origPositions[i3 + 1] = pos[i3 + 1];
      data.origPositions[i3 + 2] = pos[i3 + 2];
      data.radii[i] = r;
      data.angles[i] = Math.random() * Math.PI * 2;
      data.fallSpeed[i] = 0.3 + Math.random() * 0.7;
    }
    return [pos, data];
  }, []);

  // Relativistic jets
  const jetPositions1 = useMemo(() => new Float32Array(JET_PARTICLES * 3), []);
  const jetPositions2 = useMemo(() => new Float32Array(JET_PARTICLES * 3), []);
  const jetOffsets = useMemo(() => {
    const off = new Float32Array(JET_PARTICLES);
    for (let i = 0; i < JET_PARTICLES; i++) off[i] = Math.random();
    return off;
  }, []);

  // Photon sphere / Einstein ring
  const lensingGeo = useMemo(() => {
    const geo = new THREE.TorusGeometry(3, 0.2, 16, LENSING_SEGMENTS);
    return geo;
  }, []);

  // Grid for 3D→0D collapse
  const [gridGeometry, gridOriginal] = useMemo(() => {
    const verts: number[] = [];
    const size = 20;
    const div = 15;
    const step = size / div;
    const half = size / 2;
    for (let i = 0; i <= div; i++) {
      const p = -half + i * step;
      verts.push(p, 0, -half, p, 0, half);
      verts.push(-half, 0, p, half, 0, p);
    }
    for (let i = 0; i <= div; i++) {
      const p = -half + i * step;
      verts.push(p, -half, 0, p, half, 0);
      verts.push(-half, p, 0, half, p, 0);
    }
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(verts);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    return [geo, new Float32Array(arr)];
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const speed = isActive ? 1.0 : 0.3;
    const targetCollapse = isActive ? 0.8 : 0.0;
    collapseProgress.current += (targetCollapse - collapseProgress.current) * delta * 1.5;
    const cp = collapseProgress.current;

    // Event horizon pulse
    if (eventHorizonRef.current) {
      const s = 2.5 + (isActive ? Math.sin(t * 0.5) * 0.1 : 0);
      eventHorizonRef.current.scale.setScalar(s);
    }

    // Photon sphere glow
    if (photonSphereRef.current) {
      photonSphereRef.current.rotation.x = t * 0.3;
      photonSphereRef.current.rotation.y = t * 0.2;
      const mat = photonSphereRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isActive ? 3 + Math.sin(t * 2) * 1.5 : 0.8;
    }

    // Lensing ring
    if (lensingRef.current) {
      lensingRef.current.rotation.x = Math.PI / 2;
      lensingRef.current.rotation.z = t * 0.1;
      const mat = lensingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isActive ? 0.4 + Math.sin(t * 1.5) * 0.15 : 0.1;
    }

    // Accretion disk rotation
    if (accretionRef.current) {
      const pos = accretionRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < ACCRETION_PARTICLES; i++) {
        const i3 = i * 3;
        accretionData.angles[i] += accretionData.speeds[i] * speed * 0.02;
        const r = accretionData.radii[i];
        const a = accretionData.angles[i];
        const wobble = Math.sin(t * 0.5 + i * 0.01) * 0.3;
        arr[i3] = r * Math.cos(a);
        arr[i3 + 1] = accretionData.heights[i] + wobble;
        arr[i3 + 2] = r * Math.sin(a);
      }
      pos.needsUpdate = true;
    }

    // Infalling stars: collapse toward singularity
    if (infallingRef.current) {
      const pos = infallingRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < INFALLING_STARS; i++) {
        const i3 = i * 3;
        // Lerp toward center based on collapse progress
        arr[i3] = infallingData.origPositions[i3] * (1 - cp) +
          Math.sin(t * 0.5 + i * 0.01) * 0.1 * cp;
        arr[i3 + 1] = infallingData.origPositions[i3 + 1] * (1 - cp) +
          Math.cos(t * 0.3 + i * 0.02) * 0.1 * cp;
        arr[i3 + 2] = infallingData.origPositions[i3 + 2] * (1 - cp) +
          Math.sin(t * 0.7 + i * 0.015) * 0.1 * cp;
      }
      pos.needsUpdate = true;
    }

    // Relativistic jets
    const animateJet = (ref: React.RefObject<THREE.Points | null>, direction: number) => {
      if (!ref.current) return;
      const pos = ref.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < JET_PARTICLES; i++) {
        const i3 = i * 3;
        const pct = (jetOffsets[i] + t * speed * 0.4) % 1;
        const dist = pct * 20;
        const spread = pct * 2;
        arr[i3] = (Math.random() - 0.5) * spread;
        arr[i3 + 1] = dist * direction;
        arr[i3 + 2] = (Math.random() - 0.5) * spread;
      }
      pos.needsUpdate = true;
      (ref.current.material as THREE.PointsMaterial).opacity =
        isActive ? 0.6 : 0.15;
    };
    animateJet(jet1Ref, 1);
    animateJet(jet2Ref, -1);

    // Grid collapse
    if (gridRef.current) {
      const pos = gridRef.current.geometry.attributes.position;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] = gridOriginal[i] * (1 - cp * 0.9);
        arr[i + 1] = gridOriginal[i + 1] * (1 - cp * 0.9);
        arr[i + 2] = gridOriginal[i + 2] * (1 - cp * 0.9);
      }
      pos.needsUpdate = true;
      (gridRef.current.material as THREE.LineBasicMaterial).opacity =
        isActive ? 0.15 : 0.04;
    }
  });

  return (
    <group ref={groupRef} position={chapter.position}>
      {/* Event Horizon - pitch black sphere */}
      <mesh ref={eventHorizonRef}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Photon sphere - glowing boundary */}
      <mesh ref={photonSphereRef} scale={2.8}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#0044aa"
          emissive="#4488ff"
          emissiveIntensity={1.5}
          transparent
          opacity={isActive ? 0.12 : 0.04}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Einstein ring / lensing ring */}
      <mesh ref={lensingRef} geometry={lensingGeo}>
        <meshBasicMaterial
          color="#88ccff"
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Second lensing ring - perpendicular */}
      <mesh rotation={[0, 0, 0]} scale={3.5}>
        <torusGeometry args={[1, 0.08, 16, 64]} />
        <meshBasicMaterial
          color="#aaddff"
          transparent
          opacity={isActive ? 0.2 : 0.05}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Accretion disk */}
      <points ref={accretionRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[accretionPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[accretionColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={isActive ? 0.18 : 0.08}
          transparent
          opacity={isActive ? 0.85 : 0.3}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Infalling stars */}
      <points ref={infallingRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[infallingPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#88ccff"
          size={0.12}
          transparent
          opacity={isActive ? 0.7 : 0.25}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Relativistic jet - up */}
      <points ref={jet1Ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[jetPositions1, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#44aaff"
          size={0.2}
          transparent
          opacity={0.3}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Relativistic jet - down */}
      <points ref={jet2Ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[jetPositions2, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#44aaff"
          size={0.2}
          transparent
          opacity={0.3}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Converging grid */}
      <lineSegments ref={gridRef} geometry={gridGeometry}>
        <lineBasicMaterial color="#2244aa" transparent opacity={0.06} />
      </lineSegments>

      {/* Lighting */}
      <pointLight color="#4488ff" intensity={isActive ? 20 : 4} distance={45} decay={2} />
      <pointLight color="#88ccff" intensity={isActive ? 8 : 2} distance={30} decay={2} position={[0, 3, 0]} />
    </group>
  );
}
