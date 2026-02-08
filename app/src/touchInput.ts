// Shared mutable input state for touch controls.
// Both TouchControls (UI) and CinematicDirector (camera) read/write these.

/** Joystick movement vector, normalized -1..1 */
export const touchMove = { x: 0, y: 0 };

/** Accumulated look delta per frame (consumed and zeroed by camera loop) */
export const touchLook = { dx: 0, dy: 0 };

/** Whether the device supports touch input */
export const isTouchDevice =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);
