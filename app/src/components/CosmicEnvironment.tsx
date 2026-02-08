import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Nebula Cloud ────────────────────────────────────────────
// Creates a volumetric-looking nebula from layered billboard particles
interface NebulaProps {
  position: [number, number, number];
  color1: string;
  color2: string;
  scale?: number;
  particleCount?: number;
  opacity?: number;
  rotationSpeed?: number;
}

function NebulaCloud({
  position,
  color1,
  color2,
  scale = 1,
  particleCount = 800,
  opacity = 0.35,
  rotationSpeed = 0.01,
}: NebulaProps) {
  const ref = useRef<THREE.Points>(null);

  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    const tmp = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Gaussian-ish distribution for cloud shape
      const r = (Math.random() + Math.random() + Math.random()) / 3 * 20 * scale;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      // Flatten slightly for disk-like nebula shape
      const flatten = 0.3 + Math.random() * 0.4;
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * flatten;
      pos[i3 + 2] = r * Math.cos(phi);

      // Color gradient from center to edge
      const t = Math.min(r / (15 * scale), 1);
      tmp.copy(c1).lerp(c2, t + (Math.random() - 0.5) * 0.3);
      col[i3] = tmp.r;
      col[i3 + 1] = tmp.g;
      col[i3 + 2] = tmp.b;

      // Larger particles in the center for glow effect
      sz[i] = (1.5 + Math.random() * 3.0) * (1 - t * 0.5) * scale;
    }
    return [pos, col, sz];
  }, [particleCount, color1, color2, scale]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * rotationSpeed;
      ref.current.rotation.z += delta * rotationSpeed * 0.3;
    }
  });

  return (
    <points ref={ref} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={2.0 * scale}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Cosmic Dust Lanes ───────────────────────────────────────
// Long, thin particle clouds that create depth and atmosphere
function DustLane({
  start,
  end,
  color,
  count = 600,
  width = 8,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  count?: number;
  width?: number;
}) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const dir = e.clone().sub(s);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const t = Math.random();
      const point = s.clone().add(dir.clone().multiplyScalar(t));
      // Perpendicular scatter
      pos[i3] = point.x + (Math.random() - 0.5) * width;
      pos[i3 + 1] = point.y + (Math.random() - 0.5) * width * 0.4;
      pos[i3 + 2] = point.z + (Math.random() - 0.5) * width;
    }
    return pos;
  }, [start, end, count, width]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.002;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.8}
        transparent
        opacity={0.12}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Galaxy Arm ──────────────────────────────────────────────
// Spiral arm of particles creating a distant galaxy effect
function GalaxyArm({
  position,
  color,
  count = 2000,
  radius = 30,
  turns = 2.5,
  tilt = 0,
  armWidth = 4,
}: {
  position: [number, number, number];
  color: string;
  count?: number;
  radius?: number;
  turns?: number;
  tilt?: number;
  armWidth?: number;
}) {
  const ref = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color(color);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const t = i / count;
      const angle = t * Math.PI * 2 * turns;
      const r = t * radius;
      const scatter = (Math.random() - 0.5) * armWidth * (0.5 + t);

      pos[i3] = r * Math.cos(angle) + scatter;
      pos[i3 + 1] = (Math.random() - 0.5) * 2 * (0.3 + t * 0.5);
      pos[i3 + 2] = r * Math.sin(angle) + scatter;

      // Brighter toward center
      const brightness = 1 - t * 0.6;
      col[i3] = c.r * brightness;
      col[i3 + 1] = c.g * brightness;
      col[i3 + 2] = c.b * brightness;
    }
    return [pos, col];
  }, [count, color, radius, turns, armWidth]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.008;
    }
  });

  return (
    <points ref={ref} position={position} rotation={[tilt, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.6}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Star Cluster ────────────────────────────────────────────
function StarCluster({
  position,
  color = '#ffffff',
  count = 300,
  radius = 5,
}: {
  position: [number, number, number];
  color?: string;
  count?: number;
  radius?: number;
}) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Concentrated toward center
      const r = Math.pow(Math.random(), 2) * radius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count, radius]);

  return (
    <points position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.4}
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Dense Background Stars ──────────────────────────────────
function DeepStarField({ count = 8000 }: { count?: number }) {
  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const starColors = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#ffeedd'),
      new THREE.Color('#aaccff'),
      new THREE.Color('#ffccaa'),
      new THREE.Color('#ccddff'),
      new THREE.Color('#ffaacc'),
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = 100 + Math.random() * 350;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);

      const c = starColors[Math.floor(Math.random() * starColors.length)];
      const brightness = 0.5 + Math.random() * 0.5;
      col[i3] = c.r * brightness;
      col[i3 + 1] = c.g * brightness;
      col[i3 + 2] = c.b * brightness;

      // Most stars small, a few bright ones
      sz[i] = Math.random() < 0.05 ? 1.5 + Math.random() * 2 : 0.3 + Math.random() * 0.7;
    }
    return [pos, col, sz];
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.8}
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ─── Twinkling Stars ─────────────────────────────────────────
function TwinklingStars({ count = 500 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const baseOpacities = useRef<Float32Array>(new Float32Array(0));

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    baseOpacities.current = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = 80 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);

      col[i3] = 0.9 + Math.random() * 0.1;
      col[i3 + 1] = 0.9 + Math.random() * 0.1;
      col[i3 + 2] = 1.0;

      baseOpacities.current[i] = Math.random() * Math.PI * 2;
    }
    return [pos, col];
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.PointsMaterial;
      const t = clock.getElapsedTime();
      // Simulate twinkling by modulating opacity
      mat.opacity = 0.5 + Math.sin(t * 1.5) * 0.3;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={2.5}
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COSMIC ENVIRONMENT
// ═══════════════════════════════════════════════════════════════

export default function CosmicEnvironment() {
  return (
    <group>
      {/* Dense background star field */}
      <DeepStarField count={10000} />
      <TwinklingStars count={400} />

      {/* Major nebula clouds - scattered throughout the cosmic space */}
      {/* Purple emission nebula near origin */}
      <NebulaCloud
        position={[15, 10, -20]}
        color1="#8844ff"
        color2="#ff44aa"
        scale={1.8}
        particleCount={1200}
        opacity={0.25}
        rotationSpeed={0.008}
      />

      {/* Red/orange nebula between chapters I and II */}
      <NebulaCloud
        position={[45, -5, 15]}
        color1="#ff6622"
        color2="#ff2244"
        scale={1.5}
        particleCount={900}
        opacity={0.2}
        rotationSpeed={0.006}
      />

      {/* Blue nebula near the Zeroth Dimension chapter */}
      <NebulaCloud
        position={[-15, 8, -55]}
        color1="#2266ff"
        color2="#44ffcc"
        scale={2.0}
        particleCount={1000}
        opacity={0.22}
        rotationSpeed={0.01}
      />

      {/* Golden nebula below (near gravity well) */}
      <NebulaCloud
        position={[20, -45, -10]}
        color1="#ffaa22"
        color2="#ff4400"
        scale={1.4}
        particleCount={800}
        opacity={0.18}
        rotationSpeed={0.007}
      />

      {/* Green/teal nebula near the Scale chapter */}
      <NebulaCloud
        position={[-55, 12, 20]}
        color1="#22ffaa"
        color2="#2288ff"
        scale={1.6}
        particleCount={900}
        opacity={0.2}
        rotationSpeed={0.009}
      />

      {/* Massive background nebula for depth */}
      <NebulaCloud
        position={[0, 30, -80]}
        color1="#6633aa"
        color2="#aa2255"
        scale={4.0}
        particleCount={2000}
        opacity={0.1}
        rotationSpeed={0.003}
      />

      <NebulaCloud
        position={[-80, -20, 40]}
        color1="#224488"
        color2="#882244"
        scale={3.5}
        particleCount={1500}
        opacity={0.08}
        rotationSpeed={0.004}
      />

      {/* Galaxy arms for epic background */}
      <GalaxyArm
        position={[0, -60, -120]}
        color="#8866ff"
        count={3000}
        radius={60}
        turns={2}
        tilt={Math.PI / 4}
        armWidth={6}
      />

      <GalaxyArm
        position={[100, 40, -80]}
        color="#ff8844"
        count={2000}
        radius={40}
        turns={1.5}
        tilt={-Math.PI / 3}
        armWidth={5}
      />

      {/* Cosmic dust lanes connecting regions */}
      <DustLane start={[-20, 5, 10]} end={[50, -5, -15]} color="#6644aa" count={800} width={12} />
      <DustLane start={[30, 0, 5]} end={[-10, 0, -50]} color="#2244aa" count={600} width={10} />
      <DustLane start={[-50, 5, -10]} end={[10, -35, 5]} color="#44aa66" count={500} width={8} />
      <DustLane start={[10, -20, -20]} end={[-30, 10, 15]} color="#aa6622" count={400} width={10} />

      {/* Star clusters scattered in the space */}
      <StarCluster position={[25, 15, -10]} color="#aabbff" count={200} radius={4} />
      <StarCluster position={[-20, -10, 20]} color="#ffddaa" count={150} radius={3} />
      <StarCluster position={[10, -20, -30]} color="#ffaacc" count={180} radius={3.5} />
      <StarCluster position={[-35, 5, -25]} color="#aaffcc" count={160} radius={3} />
      <StarCluster position={[55, 8, -5]} color="#ffccaa" count={140} radius={3} />
    </group>
  );
}
