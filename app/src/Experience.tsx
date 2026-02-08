import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

import PostProcessing from './components/PostProcessing';
import ParticleField from './components/ParticleField';
import ChapterNode from './components/ChapterNode';
import DoctrineText from './components/DoctrineText';
import TotalityScene from './scenes/TotalityScene';
import RicochetScene from './scenes/RicochetScene';
import ZerothDimensionScene from './scenes/ZerothDimensionScene';
import GravityWellScene from './scenes/GravityWellScene';
import ScaleScene from './scenes/ScaleScene';

import { CHAPTERS, ACTIVATION_DISTANCE } from './data/doctrine';
import { useDoctrineStore } from './store';

function CameraController() {
  const { camera } = useThree();
  const cameraTarget = useDoctrineStore((s) => s.cameraTarget);
  const isTransitioning = useDoctrineStore((s) => s.isTransitioning);
  const clearTarget = useDoctrineStore((s) => s.clearTarget);
  const setActiveChapter = useDoctrineStore((s) => s.setActiveChapter);

  const velocity = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0));
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const yaw = useRef(0);
  const pitch = useRef(-0.1);
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    camera.position.set(0, 5, 30);

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      yaw.current -= dx * 0.003;
      pitch.current -= dy * 0.003;
      pitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch.current));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleContextMenu = (e: Event) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [camera]);

  useFrame((_, delta) => {
    const speed = 20;
    const damping = 0.92;

    // Fly-to-chapter transition
    if (isTransitioning && cameraTarget) {
      const targetPos = cameraTarget.clone().add(new THREE.Vector3(0, 3, 12));
      const dir = targetPos.clone().sub(camera.position);
      const dist = dir.length();

      if (dist < 1) {
        clearTarget();
      } else {
        const moveSpeed = Math.max(2, dist * 3) * delta;
        camera.position.add(dir.normalize().multiplyScalar(moveSpeed));
        // Smoothly look at target
        lookTarget.current.lerp(cameraTarget, delta * 3);
        camera.lookAt(lookTarget.current);
        // Update yaw/pitch to match
        const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        yaw.current = euler.y;
        pitch.current = euler.x;
      }
      return;
    }

    // Free-fly controls (WASD + QE for up/down)
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ'));
    const right = new THREE.Vector3(1, 0, 0);
    right.applyEuler(new THREE.Euler(0, yaw.current, 0, 'YXZ'));
    const up = new THREE.Vector3(0, 1, 0);

    const accel = new THREE.Vector3();
    if (keys.current['w'] || keys.current['arrowup']) accel.add(forward);
    if (keys.current['s'] || keys.current['arrowdown']) accel.sub(forward);
    if (keys.current['a'] || keys.current['arrowleft']) accel.sub(right);
    if (keys.current['d'] || keys.current['arrowright']) accel.add(right);
    if (keys.current['q'] || keys.current['shift']) accel.sub(up);
    if (keys.current['e'] || keys.current[' ']) accel.add(up);

    if (accel.lengthSq() > 0) {
      accel.normalize().multiplyScalar(speed * delta);
      velocity.current.add(accel);
    }

    velocity.current.multiplyScalar(damping);
    camera.position.add(velocity.current);

    // Apply rotation
    camera.quaternion.setFromEuler(
      new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ')
    );

    // Proximity detection
    let closestId: number | null = null;
    let closestDist = ACTIVATION_DISTANCE;
    for (const ch of CHAPTERS) {
      const d = camera.position.distanceTo(new THREE.Vector3(...ch.position));
      if (d < closestDist) {
        closestDist = d;
        closestId = ch.id;
      }
    }
    setActiveChapter(closestId);
  });

  return null;
}

function ConnectorLines() {
  const lineRef = useRef<THREE.LineSegments>(null);

  const geometry = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts: number[] = [];
    // Connect chapters in order, plus last to first
    for (let i = 0; i < CHAPTERS.length; i++) {
      const a = CHAPTERS[i].position;
      const b = CHAPTERS[(i + 1) % CHAPTERS.length].position;
      verts.push(...a, ...b);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    return geo;
  }, []);

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#222244" transparent opacity={0.3} />
    </lineSegments>
  );
}

function SceneContent() {
  return (
    <>
      <CameraController />

      {/* Ambient environment */}
      <color attach="background" args={['#000005']} />
      <fog attach="fog" args={['#000005', 60, 200]} />
      <ambientLight intensity={0.15} />

      {/* Background stars */}
      <Stars radius={150} depth={80} count={5000} factor={3} saturation={0.1} fade speed={0.5} />
      <ParticleField />
      <ConnectorLines />

      {/* Chapter Nodes (clickable orbs) */}
      {CHAPTERS.map((ch) => (
        <ChapterNode key={ch.id} chapter={ch} />
      ))}

      {/* Chapter Scenes */}
      <TotalityScene />
      <RicochetScene />
      <ZerothDimensionScene />
      <GravityWellScene />
      <ScaleScene />

      {/* Doctrine text panels */}
      <DoctrineText />

      {/* Post processing */}
      <PostProcessing />
    </>
  );
}

export default function Experience() {
  return (
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 500, position: [0, 5, 30] }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#000' }}
    >
      <SceneContent />
    </Canvas>
  );
}
