import { useRef, useEffect, useState, useCallback, type CSSProperties } from 'react';
import { useDoctrineStore } from '../store';
import { touchMove, touchLook, isTouchDevice } from '../touchInput';

const JOYSTICK_RADIUS = 56;
const THUMB_RADIUS = 24;
const DEADZONE = 0.12;

// Fixed anchor positions for the joystick idle hints
const MOVE_CENTER = { x: 80, y: -90 }; // from left, from bottom
const LOOK_CENTER = { x: -80, y: -90 }; // from right, from bottom

const abs: CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
const mono: CSSProperties = { fontFamily: "'Courier New', Courier, monospace" };

// ─── Fullscreen helpers ──────────────────────────────────────
function requestFullscreen() {
  const el = document.documentElement as any;
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.msRequestFullscreen) return el.msRequestFullscreen();
  return Promise.reject();
}

function isFullscreenAvailable(): boolean {
  return !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).msFullscreenEnabled
  );
}

// ─── Joystick visual (reused for both sides) ─────────────────
function JoystickVisual({
  centerX,
  centerY,
  thumbDx,
  thumbDy,
}: {
  centerX: number;
  centerY: number;
  thumbDx: number;
  thumbDy: number;
}) {
  return (
    <>
      {/* Base ring */}
      <div
        style={{
          position: 'absolute',
          left: centerX - JOYSTICK_RADIUS,
          top: centerY - JOYSTICK_RADIUS,
          width: JOYSTICK_RADIUS * 2,
          height: JOYSTICK_RADIUS * 2,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.15)',
          pointerEvents: 'none',
        }}
      />
      {/* Thumb */}
      <div
        style={{
          position: 'absolute',
          left: centerX + thumbDx - THUMB_RADIUS,
          top: centerY + thumbDy - THUMB_RADIUS,
          width: THUMB_RADIUS * 2,
          height: THUMB_RADIUS * 2,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          border: '1px solid rgba(255,255,255,0.35)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

// ─── Idle hint (small ghost joystick) ────────────────────────
function IdleHint({
  side,
  label,
}: {
  side: 'left' | 'right';
  label: string;
}) {
  const posStyle: CSSProperties =
    side === 'left'
      ? { left: MOVE_CENTER.x - 28, bottom: -MOVE_CENTER.y - 28 }
      : { right: -LOOK_CENTER.x - 28, bottom: -LOOK_CENTER.y - 28 };

  return (
    <div
      style={{
        position: 'absolute',
        ...posStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
          }}
        />
      </div>
      <span
        style={{
          ...mono,
          fontSize: 9,
          letterSpacing: 1,
          color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function TouchControls() {
  const tourPhase = useDoctrineStore((s) => s.tourPhase);
  const pauseTour = useDoctrineStore((s) => s.pauseTour);

  // ── Fullscreen prompt ──
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);

  useEffect(() => {
    if (isTouchDevice && isFullscreenAvailable()) {
      setShowFullscreenPrompt(true);
    }
  }, []);

  const handleFullscreen = useCallback(() => {
    requestFullscreen().catch(() => {});
    setShowFullscreenPrompt(false);
  }, []);

  const dismissPrompt = useCallback(() => {
    setShowFullscreenPrompt(false);
  }, []);

  // ── Move joystick state (left) ──
  const [moveActive, setMoveActive] = useState(false);
  const [moveCenter, setMoveCenter] = useState({ x: 0, y: 0 });
  const [moveThumb, setMoveThumb] = useState({ x: 0, y: 0 });
  const moveTouchId = useRef<number | null>(null);

  // ── Look joystick state (right) ──
  const [lookActive, setLookActive] = useState(false);
  const [lookCenter, setLookCenter] = useState({ x: 0, y: 0 });
  const [lookThumb, setLookThumb] = useState({ x: 0, y: 0 });
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef({ x: 0, y: 0 });

  // Reset touch input when leaving free explore
  useEffect(() => {
    if (tourPhase !== 'freeExplore') {
      touchMove.x = 0;
      touchMove.y = 0;
      touchLook.dx = 0;
      touchLook.dy = 0;
      setMoveActive(false);
      setLookActive(false);
      moveTouchId.current = null;
      lookTouchId.current = null;
    }
  }, [tourPhase]);

  // ── Touch handlers ──

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // During touring, any tap pauses the tour
      const phase = useDoctrineStore.getState().tourPhase;
      if (phase === 'touring') {
        pauseTour();
        return;
      }
      if (phase !== 'freeExplore') return;

      const screenW = window.innerWidth;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const isLeftHalf = touch.clientX < screenW / 2;

        if (isLeftHalf && moveTouchId.current === null) {
          // Start move joystick
          moveTouchId.current = touch.identifier;
          setMoveCenter({ x: touch.clientX, y: touch.clientY });
          setMoveThumb({ x: 0, y: 0 });
          setMoveActive(true);
          touchMove.x = 0;
          touchMove.y = 0;
        } else if (!isLeftHalf && lookTouchId.current === null) {
          // Start look joystick
          lookTouchId.current = touch.identifier;
          setLookCenter({ x: touch.clientX, y: touch.clientY });
          setLookThumb({ x: 0, y: 0 });
          setLookActive(true);
          lastLookPos.current = { x: touch.clientX, y: touch.clientY };
        }
      }
    },
    [pauseTour],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // ── Move joystick ──
        if (touch.identifier === moveTouchId.current) {
          let dx = touch.clientX - moveCenter.x;
          let dy = touch.clientY - moveCenter.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > JOYSTICK_RADIUS) {
            dx = (dx / dist) * JOYSTICK_RADIUS;
            dy = (dy / dist) * JOYSTICK_RADIUS;
          }
          setMoveThumb({ x: dx, y: dy });

          const nx = dx / JOYSTICK_RADIUS;
          const ny = dy / JOYSTICK_RADIUS;
          touchMove.x = Math.abs(nx) > DEADZONE ? nx : 0;
          touchMove.y = Math.abs(ny) > DEADZONE ? ny : 0;
        }

        // ── Look joystick ──
        if (touch.identifier === lookTouchId.current) {
          const dx = touch.clientX - lastLookPos.current.x;
          const dy = touch.clientY - lastLookPos.current.y;
          touchLook.dx += dx;
          touchLook.dy += dy;
          lastLookPos.current = { x: touch.clientX, y: touch.clientY };

          // Visual: offset from initial center, clamped
          let vdx = touch.clientX - lookCenter.x;
          let vdy = touch.clientY - lookCenter.y;
          const vdist = Math.sqrt(vdx * vdx + vdy * vdy);
          if (vdist > JOYSTICK_RADIUS) {
            vdx = (vdx / vdist) * JOYSTICK_RADIUS;
            vdy = (vdy / vdist) * JOYSTICK_RADIUS;
          }
          setLookThumb({ x: vdx, y: vdy });
        }
      }
    },
    [moveCenter, lookCenter],
  );

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      if (touch.identifier === moveTouchId.current) {
        moveTouchId.current = null;
        setMoveActive(false);
        setMoveThumb({ x: 0, y: 0 });
        touchMove.x = 0;
        touchMove.y = 0;
      }

      if (touch.identifier === lookTouchId.current) {
        lookTouchId.current = null;
        setLookActive(false);
        setLookThumb({ x: 0, y: 0 });
        touchLook.dx = 0;
        touchLook.dy = 0;
      }
    }
  }, []);

  // Don't render on non-touch devices
  if (!isTouchDevice) return null;

  const showControls = tourPhase === 'freeExplore';

  return (
    <>
      {/* ── Fullscreen prompt ── */}
      {showFullscreenPrompt && (
        <div
          style={{
            ...abs,
            zIndex: 100,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 24,
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
        >
          <button
            onClick={handleFullscreen}
            style={{
              ...mono,
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 16,
              padding: '20px 36px',
              color: '#fff',
              fontSize: 16,
              letterSpacing: 3,
              cursor: 'pointer',
              textShadow: '0 0 8px rgba(0,0,0,0.9)',
            }}
          >
            TAP FOR FULLSCREEN
          </button>
          <button
            onClick={dismissPrompt}
            style={{
              ...mono,
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.35)',
              fontSize: 11,
              letterSpacing: 2,
              cursor: 'pointer',
              padding: '8px 16px',
            }}
          >
            SKIP
          </button>
        </div>
      )}

      {/* ── Touch control layer ── */}
      <div
        style={{
          ...abs,
          zIndex: 20,
          touchAction: 'none',
          pointerEvents:
            showControls ? 'auto' : tourPhase === 'touring' ? 'auto' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* ── Active move joystick (left, floating) ── */}
        {showControls && moveActive && (
          <JoystickVisual
            centerX={moveCenter.x}
            centerY={moveCenter.y}
            thumbDx={moveThumb.x}
            thumbDy={moveThumb.y}
          />
        )}

        {/* ── Active look joystick (right, floating) ── */}
        {showControls && lookActive && (
          <JoystickVisual
            centerX={lookCenter.x}
            centerY={lookCenter.y}
            thumbDx={lookThumb.x}
            thumbDy={lookThumb.y}
          />
        )}

        {/* ── Idle hints (bottom-left = move, bottom-right = look) ── */}
        {showControls && !moveActive && (
          <IdleHint side="left" label="Move" />
        )}
        {showControls && !lookActive && (
          <IdleHint side="right" label="Look" />
        )}
      </div>
    </>
  );
}
