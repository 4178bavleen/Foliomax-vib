/**
 * @yourorg/protected-content - Protection Overlay & Black-Screen Mechanism
 * Steps 3 & 9: Full-page protection overlay (z-index 2147483647)
 */

export const OVERLAY_ID = '__protected_content_overlay__';

let overlayElement: HTMLDivElement | null = null;
let blackoutTimer: ReturnType<typeof setTimeout> | null = null;
let isBlackout = false;

/**
 * Creates and injects the invisible full-screen protection overlay into the DOM.
 * Base properties:
 * - position: fixed; inset: 0;
 * - z-index: 2147483647; (maximum 32-bit signed integer)
 * - Normally: display: none (or invisible), pointer-events: none
 * - Triggered: display: block, background: black, opacity: 1
 */
export function createProtectionOverlay(): HTMLDivElement {
  if (typeof document === 'undefined') {
    return null as unknown as HTMLDivElement;
  }

  const existing = document.getElementById(OVERLAY_ID) as HTMLDivElement | null;
  if (existing) {
    overlayElement = existing;
    applyOverlayStyles(existing, isBlackout);
    return existing;
  }

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('data-protected-element', 'overlay');

  applyOverlayStyles(overlay, isBlackout);

  const target = document.body || document.documentElement;
  if (target) {
    target.appendChild(overlay);
  }

  overlayElement = overlay;
  return overlay;
}

/**
 * Applies the precise styles required for the overlay based on current state.
 */
export function applyOverlayStyles(el: HTMLElement, active: boolean): void {
  el.style.setProperty('position', 'fixed', 'important');
  el.style.setProperty('top', '0', 'important');
  el.style.setProperty('left', '0', 'important');
  el.style.setProperty('right', '0', 'important');
  el.style.setProperty('bottom', '0', 'important');
  el.style.setProperty('width', '100vw', 'important');
  el.style.setProperty('height', '100vh', 'important');
  el.style.setProperty('margin', '0', 'important');
  el.style.setProperty('padding', '0', 'important');
  el.style.setProperty('border', 'none', 'important');
  el.style.setProperty('z-index', '2147483647', 'important');
  el.style.setProperty('box-sizing', 'border-box', 'important');

  if (active) {
    // When protection is triggered -> Turn it black!
    el.style.setProperty('display', 'block', 'important');
    el.style.setProperty('background', '#000000', 'important');
    el.style.setProperty('background-color', '#000000', 'important');
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('pointer-events', 'auto', 'important');
    el.style.setProperty('visibility', 'visible', 'important');
  } else {
    // Normally invisible
    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('background', 'transparent', 'important');
    el.style.setProperty('opacity', '0', 'important');
    el.style.setProperty('pointer-events', 'none', 'important');
    el.style.setProperty('visibility', 'hidden', 'important');
  }
}

/**
 * Trigger the black screen mechanism.
 * Turns the overlay black for the specified duration (default ~800ms within 500-1000ms),
 * then automatically restores the website.
 */
export function triggerBlackout(durationMs = 800): void {
  if (typeof document === 'undefined') return;

  const overlay = overlayElement || createProtectionOverlay();
  if (!overlay) return;

  isBlackout = true;
  applyOverlayStyles(overlay, true);

  // Clear any existing timer so re-triggers extend the blackout properly
  if (blackoutTimer !== null) {
    clearTimeout(blackoutTimer);
    blackoutTimer = null;
  }

  blackoutTimer = setTimeout(() => {
    hideBlackout();
  }, durationMs);
}

/**
 * Restores the website from blackout immediately.
 */
export function hideBlackout(): void {
  if (blackoutTimer !== null) {
    clearTimeout(blackoutTimer);
    blackoutTimer = null;
  }

  isBlackout = false;
  if (overlayElement) {
    applyOverlayStyles(overlayElement, false);
  }
}

/**
 * Returns whether blackout is currently active.
 */
export function isBlackoutActive(): boolean {
  return isBlackout;
}

/**
 * Returns the current overlay DOM element, if any.
 */
export function getOverlayElement(): HTMLDivElement | null {
  return overlayElement;
}

/**
 * Removes the overlay from the DOM and resets state.
 */
export function removeProtectionOverlay(): void {
  hideBlackout();
  if (overlayElement && overlayElement.parentNode) {
    overlayElement.parentNode.removeChild(overlayElement);
  }
  overlayElement = null;
}
