import { useRef, useEffect, useState, useCallback, type CSSProperties } from 'react';
import { useDoctrineStore } from '../store';
import { touchMove, touchLook, isTouchDevice } from '../touchInput';

const JOYSTICK_RADIUS = 56;
const THUMB_RADIUS = 24;
const DEADZONE = 0.12;

const abs: CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };

/**
 * Mobile-game-style touch controls.
 * Left half: floating virtual joystick for movement.
 * Right half: touch-drag for camera look.
 * Only renders on touch-capable devices during free explore.
 */
export default function TouchControls() {
  const tourPhase = useDoctrineStore((s) => s.tourPhase);
  const pauseTour = useDoctrineStore((s) => s.pauseTour);

  // Joystick state
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickCenter, setJoystickCenter] = useState({ x: 0, y: 0 });
  const [thumbOffset, setThumbOffset] = useState({ x: 0, y: 0 });
  const joystickTouchId = useRef<number | null>(null);

  // Look state
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef({ x: 0, y: 0 });

  // Reset touch input when leaving free explore
  useEffect(() => {
    if (tourPhase !== 'freeExplore') {
      touchMove.x = 0;
      touchMove.y = 0;
      touchLook.dx = 0;
      touchLook.dy = 0;
      setJoystickActive(false);
      joystickTouchId.current = null;
      lookTouchId.current = null;
    }
  }, [tourPhase]);

  // ── Touch handlers ──

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
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

      if (isLeftHalf && joystickTouchId.current === null) {
        // Start joystick
        joystickTouchId.current = touch.identifier;
        setJoystickCenter({ x: touch.clientX, y: touch.clientY });
        setThumbOffset({ x: 0, y: 0 });
        setJoystickActive(true);
        touchMove.x = 0;
        touchMove.y = 0;
      } else if (!isLeftHalf && lookTouchId.current === null) {
        // Start look
        lookTouchId.current = touch.identifier;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  }, [pauseTour]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      if (touch.identifier === joystickTouchId.current) {
        // Update joystick
        let dx = touch.clientX - joystickCenter.x;
        let dy = touch.clientY - joystickCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Clamp to radius
        if (dist > JOYSTICK_RADIUS) {
          dx = (dx / dist) * JOYSTICK_RADIUS;
          dy = (dy / dist) * JOYSTICK_RADIUS;
        }

        setThumbOffset({ x: dx, y: dy });

        // Normalize to -1..1
        const nx = dx / JOYSTICK_RADIUS;
        const ny = dy / JOYSTICK_RADIUS;
        touchMove.x = Math.abs(nx) > DEADZONE ? nx : 0;
        touchMove.y = Math.abs(ny) > DEADZONE ? ny : 0;
      }

      if (touch.identifier === lookTouchId.current) {
        // Update look
        const dx = touch.clientX - lastLookPos.current.x;
        const dy = touch.clientY - lastLookPos.current.y;
        touchLook.dx += dx;
        touchLook.dy += dy;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  }, [joystickCenter]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      if (touch.identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        setJoystickActive(false);
        setThumbOffset({ x: 0, y: 0 });
        touchMove.x = 0;
        touchMove.y = 0;
      }

      if (touch.identifier === lookTouchId.current) {
        lookTouchId.current = null;
        touchLook.dx = 0;
        touchLook.dy = 0;
      }
    }
  }, []);

  // Don't render on non-touch devices
  if (!isTouchDevice) return null;

  // Only show controls during free explore (but keep the touch layer for tour interruption)
  const showControls = tourPhase === 'freeExplore';

  return (
    <div
      style={{
        ...abs,
        zIndex: 20,
        touchAction: 'none',
        // Allow pointer events for touch, but let taps through to canvas for orb clicks
        pointerEvents: showControls ? 'auto' : tourPhase === 'touring' ? 'auto' : 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Virtual joystick (only during free explore) */}
      {showControls && joystickActive && (
        <>
          {/* Joystick base */}
          <div
            style={{
              position: 'absolute',
              left: joystickCenter.x - JOYSTICK_RADIUS,
              top: joystickCenter.y - JOYSTICK_RADIUS,
              width: JOYSTICK_RADIUS * 2,
              height: JOYSTICK_RADIUS * 2,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              pointerEvents: 'none',
            }}
          />
          {/* Joystick thumb */}
          <div
            style={{
              position: 'absolute',
              left: joystickCenter.x + thumbOffset.x - THUMB_RADIUS,
              top: joystickCenter.y + thumbOffset.y - THUMB_RADIUS,
              width: THUMB_RADIUS * 2,
              height: THUMB_RADIUS * 2,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              border: '1px solid rgba(255,255,255,0.35)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {/* Subtle zone indicators (only during free explore, always visible) */}
      {showControls && !joystickActive && (
        <>
          {/* Left zone hint - small joystick icon */}
          <div
            style={{
              position: 'absolute',
              left: 40,
              bottom: 60,
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
