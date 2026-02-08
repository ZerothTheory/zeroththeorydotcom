import React, { useRef, useEffect, useCallback } from 'react';
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

import {
  CHAPTERS,
  ACTIVATION_DISTANCE,
  INTRO_DURATION,
  APPROACH_DURATION,
  DWELL_DURATION,
  DEPART_DURATION,
  OUTRO_DURATION,
} from './data/doctrine';
import { useDoctrineStore } from './store';

// ─── Easing ──────────────────────────────────────────────────
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

// ─── Cinematic Director ──────────────────────────────────────
function CinematicDirector() {
  const { camera } = useThree();

  const tourPhase = useDoctrineStore((s) => s.tourPhase);
  const tourChapterIndex = useDoctrineStore((s) => s.tourChapterIndex);
  const tourSubPhase = useDoctrineStore((s) => s.tourSubPhase);
  const phaseElapsed = useDoctrineStore((s) => s.phaseElapsed);
  const addPhaseElapsed = useDoctrineStore((s) => s.addPhaseElapsed);
  const startTour = useDoctrineStore((s) => s.startTour);
  const advanceTour = useDoctrineStore((s) => s.advanceTour);
  const pauseTour = useDoctrineStore((s) => s.pauseTour);
  const enterFreeExplore = useDoctrineStore((s) => s.enterFreeExplore);
  const setActiveChapter = useDoctrineStore((s) => s.setActiveChapter);
  const nextQuote = useDoctrineStore((s) => s.nextQuote);

  // Free-explore refs
  const velocity = useRef(new THREE.Vector3());
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const yaw = useRef(0);
  const pitch = useRef(-0.05);
  const keys = useRef<Record<string, boolean>>({});

  // Camera animation refs
  const introStartPos = useRef(new THREE.Vector3(0, 2, 80));
  const introEndPos = useRef(new THREE.Vector3(0, 4, 22));
  const prevCamPos = useRef(new THREE.Vector3());
  const prevLookAt = useRef(new THREE.Vector3());
  const quoteTimer = useRef(0);

  // Fly-to refs (free explore click-to-fly)
  const cameraTarget = useDoctrineStore((s) => s.cameraTarget);
  const isTransitioning = useDoctrineStore((s) => s.isTransitioning);
  const clearTarget = useDoctrineStore((s) => s.clearTarget);

  // ── Set initial camera position ──
  useEffect(() => {
    camera.position.copy(introStartPos.current);
    camera.lookAt(0, 0, 0);
    prevCamPos.current.copy(camera.position);
    prevLookAt.current.set(0, 0, 0);
  }, [camera]);

  // ── Input listeners (for free explore + tour interrupt) ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      // Interrupt tour on WASD
      const phase = useDoctrineStore.getState().tourPhase;
      if (phase === 'touring' && ['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
        syncYawPitchFromCamera();
        pauseTour();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    const onMouseDown = (e: MouseEvent) => {
      const phase = useDoctrineStore.getState().tourPhase;
      if (phase === 'touring') {
        syncYawPitchFromCamera();
        pauseTour();
        return;
      }
      if (e.button === 0 || e.button === 2) {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }
    };
    const onMouseUp = () => {
      isDragging.current = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const phase = useDoctrineStore.getState().tourPhase;
      if (phase !== 'freeExplore') return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      yaw.current -= dx * 0.003;
      pitch.current -= dy * 0.003;
      pitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch.current));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onContext = (e: Event) => e.preventDefault();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('contextmenu', onContext);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('contextmenu', onContext);
    };
  }, [pauseTour]);

  const syncYawPitchFromCamera = useCallback(() => {
    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    yaw.current = euler.y;
    pitch.current = euler.x;
  }, [camera]);

  // ── Main frame loop ──
  useFrame((_, delta) => {
    // Cap delta to avoid huge jumps on tab refocus
    const dt = Math.min(delta, 0.1);
    addPhaseElapsed(dt);

    const state = useDoctrineStore.getState();

    switch (state.tourPhase) {
      case 'intro':
        animateIntro(dt, state.phaseElapsed);
        break;
      case 'touring':
        animateTouring(dt, state);
        break;
      case 'freeExplore':
        animateFreeExplore(dt, state);
        break;
      case 'outro':
        animateOutro(dt, state.phaseElapsed);
        break;
    }
  });

  // ─── INTRO ───
  function animateIntro(dt: number, elapsed: number) {
    const t = clamp01(elapsed / INTRO_DURATION);
    const e = easeInOutCubic(t);

    const pos = introStartPos.current.clone().lerp(introEndPos.current, e);
    camera.position.copy(pos);
    camera.lookAt(0, 0, 0);

    if (elapsed >= INTRO_DURATION) {
      startTour();
    }
  }

  // ─── TOURING ───
  function animateTouring(dt: number, state: ReturnType<typeof useDoctrineStore.getState>) {
    const chapter = CHAPTERS[state.tourChapterIndex];
    if (!chapter) return;

    const chapterPos = new THREE.Vector3(...chapter.position);
    const orbit = chapter.cameraOrbit;

    switch (state.tourSubPhase) {
      case 'approach': {
        const t = clamp01(state.phaseElapsed / APPROACH_DURATION);
        const e = easeInOutCubic(t);

        // Approach start = chapter.cameraApproach (absolute position)
        const approachStart = new THREE.Vector3(...chapter.cameraApproach);
        // Approach end = first orbit position
        const angle0 = 0;
        const orbitPos = new THREE.Vector3(
          chapterPos.x + orbit.radius * Math.cos(angle0),
          orbit.height + chapterPos.y,
          chapterPos.z + orbit.radius * Math.sin(angle0)
        );

        const pos = approachStart.clone().lerp(orbitPos, e);
        camera.position.copy(pos);

        const lookAt = prevLookAt.current.clone().lerp(chapterPos, e * 0.8 + 0.2);
        camera.lookAt(lookAt);
        prevLookAt.current.copy(lookAt);

        if (state.phaseElapsed >= APPROACH_DURATION) {
          advanceTour(); // -> dwell
        }
        break;
      }

      case 'dwell': {
        const angle = state.phaseElapsed * orbit.speed;
        const pos = new THREE.Vector3(
          chapterPos.x + orbit.radius * Math.cos(angle),
          orbit.height + chapterPos.y + Math.sin(state.phaseElapsed * 0.3) * 0.5,
          chapterPos.z + orbit.radius * Math.sin(angle)
        );
        camera.position.copy(pos);
        camera.lookAt(chapterPos);
        prevLookAt.current.copy(chapterPos);

        // Cycle quotes every 4 seconds during dwell
        quoteTimer.current += dt;
        if (quoteTimer.current > 4) {
          quoteTimer.current = 0;
          nextQuote();
        }

        if (state.phaseElapsed >= DWELL_DURATION) {
          quoteTimer.current = 0;
          advanceTour(); // -> depart
        }
        break;
      }

      case 'depart': {
        const t = clamp01(state.phaseElapsed / DEPART_DURATION);
        const e = easeInOutCubic(t);

        // Depart from current orbit position toward the next chapter's approach
        const currentAngle = DWELL_DURATION * orbit.speed;
        const departStart = new THREE.Vector3(
          chapterPos.x + orbit.radius * Math.cos(currentAngle),
          orbit.height + chapterPos.y,
          chapterPos.z + orbit.radius * Math.sin(currentAngle)
        );

        const nextIdx = state.tourChapterIndex + 1;
        let departEnd: THREE.Vector3;
        if (nextIdx < CHAPTERS.length) {
          departEnd = new THREE.Vector3(...CHAPTERS[nextIdx].cameraApproach);
        } else {
          // Last chapter -> pull out for outro
          departEnd = new THREE.Vector3(0, 15, 50);
        }

        const pos = departStart.clone().lerp(departEnd, e);
        camera.position.copy(pos);

        // Look transitions from current chapter toward next
        let lookTarget: THREE.Vector3;
        if (nextIdx < CHAPTERS.length) {
          lookTarget = chapterPos.clone().lerp(
            new THREE.Vector3(...CHAPTERS[nextIdx].position),
            e
          );
        } else {
          lookTarget = chapterPos.clone().lerp(new THREE.Vector3(0, 0, 0), e);
        }
        camera.lookAt(lookTarget);
        prevLookAt.current.copy(lookTarget);

        if (state.phaseElapsed >= DEPART_DURATION) {
          advanceTour(); // -> next chapter approach, or outro
        }
        break;
      }
    }
  }

  // ─── FREE EXPLORE ───
  function animateFreeExplore(dt: number, state: any) {
    const speed = 20;
    const damping = 0.92;

    // Fly-to-chapter transition (clicking nav)
    if (state.isTransitioning && state.cameraTarget) {
      const targetPos = (state.cameraTarget as THREE.Vector3).clone().add(new THREE.Vector3(0, 3, 12));
      const dir = targetPos.clone().sub(camera.position);
      const dist = dir.length();

      if (dist < 1) {
        clearTarget();
        syncYawPitchFromCamera();
      } else {
        const moveSpeed = Math.max(2, dist * 3) * dt;
        camera.position.add(dir.normalize().multiplyScalar(moveSpeed));
        const lookAt = prevLookAt.current.lerp(state.cameraTarget as THREE.Vector3, dt * 3);
        camera.lookAt(lookAt);
        prevLookAt.current.copy(lookAt);
      }
      return;
    }

    // WASD free-fly
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
      accel.normalize().multiplyScalar(speed * dt);
      velocity.current.add(accel);
    }

    velocity.current.multiplyScalar(damping);
    camera.position.add(velocity.current);
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
  }

  // ─── OUTRO ───
  function animateOutro(dt: number, elapsed: number) {
    const t = clamp01(elapsed / OUTRO_DURATION);
    const e = easeInOutCubic(t);

    // Pull back to a wide view
    const outroStart = prevCamPos.current.clone().length() < 1
      ? new THREE.Vector3(0, 10, 40)
      : prevCamPos.current.clone();
    const outroEnd = new THREE.Vector3(0, 12, 55);

    if (elapsed < 0.1) {
      prevCamPos.current.copy(camera.position);
      outroStart.copy(camera.position);
    }

    const pos = outroStart.clone().lerp(outroEnd, e);
    camera.position.copy(pos);
    camera.lookAt(0, 0, 0);

    if (elapsed >= OUTRO_DURATION) {
      syncYawPitchFromCamera();
      enterFreeExplore();
    }
  }

  return null;
}

// ─── Connector Lines ─────────────────────────────────────────
function ConnectorLines() {
  const geometry = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts: number[] = [];
    for (let i = 0; i < CHAPTERS.length; i++) {
      const a = CHAPTERS[i].position;
      const b = CHAPTERS[(i + 1) % CHAPTERS.length].position;
      verts.push(...a, ...b);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    return geo;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#222244" transparent opacity={0.15} />
    </lineSegments>
  );
}

// ─── Scene Content ───────────────────────────────────────────
function SceneContent() {
  const tourPhase = useDoctrineStore((s) => s.tourPhase);

  return (
    <>
      <CinematicDirector />

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

      {/* 3D doctrine text (only in free explore) */}
      {tourPhase === 'freeExplore' && <DoctrineText />}

      {/* Post processing */}
      <PostProcessing />
    </>
  );
}

export default function Experience() {
  return (
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 500, position: [0, 2, 80] }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#000' }}
    >
      <SceneContent />
    </Canvas>
  );
}
