/**
 * @yourorg/protected-content - Tamper Detection
 * Step 7: MutationObserver monitoring to detect and auto-recreate removed or modified protection elements.
 */

import { OVERLAY_ID, createProtectionOverlay, isBlackoutActive, applyOverlayStyles } from './overlay';
import { WATERMARK_ID, WATERMARK_STYLE_ID, createWatermark } from './watermark';
import { PRINT_STYLE_ID, PRINT_SHIELD_ID, injectPrintStyles, ensurePrintShield } from './print';
import { CaptureEvent, WatermarkOptions } from './types';

let observer: MutationObserver | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let isRecreating = false;

interface TamperConfig {
  watermarkEnabled?: boolean;
  watermarkOptions?: WatermarkOptions;
  printProtectionEnabled?: boolean;
  onAttempt?: (event: CaptureEvent) => void;
}

/**
 * Checks if required elements are present and properly styled in the DOM.
 * If missing or tampered with, recreates/restores them.
 */
export function verifyAndRestoreElements(config: TamperConfig): void {
  if (isRecreating || typeof document === 'undefined') return;
  isRecreating = true;

  try {
    let tampered = false;

    // 1. Check Protection Overlay
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) {
      createProtectionOverlay();
      tampered = true;
    } else {
      // Check if critical style was tampered with
      const zIndex = window.getComputedStyle(overlay).zIndex;
      if (zIndex !== '2147483647') {
        applyOverlayStyles(overlay, isBlackoutActive());
        tampered = true;
      }
    }

    // 2. Check Watermark if enabled
    if (config.watermarkEnabled) {
      const watermark = document.getElementById(WATERMARK_ID);
      const watermarkStyle = document.getElementById(WATERMARK_STYLE_ID);
      if (!watermark || !watermarkStyle) {
        createWatermark(config.watermarkOptions);
        tampered = true;
      } else {
        const computed = window.getComputedStyle(watermark);
        if (computed.display === 'none' || computed.visibility === 'hidden' || parseFloat(computed.opacity) < 0.05) {
          createWatermark(config.watermarkOptions);
          tampered = true;
        }
      }
    }

    // 3. Check Print Protection if enabled
    if (config.printProtectionEnabled) {
      const printStyle = document.getElementById(PRINT_STYLE_ID);
      const printShield = document.getElementById(PRINT_SHIELD_ID);
      if (!printStyle) {
        injectPrintStyles();
        tampered = true;
      }
      if (!printShield) {
        ensurePrintShield();
        tampered = true;
      }
    }

    if (tampered && config.onAttempt) {
      config.onAttempt({
        type: 'tamper',
        timestamp: Date.now(),
        detail: 'Protection DOM elements were tampered with and automatically restored',
      });
    }
  } finally {
    isRecreating = false;
  }
}

/**
 * Enables MutationObserver to watch for removal or alteration of protection elements.
 */
export function enableTamperDetection(config: TamperConfig): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  disableTamperDetection();

  const protectedIds = new Set([
    OVERLAY_ID,
    WATERMARK_ID,
    WATERMARK_STYLE_ID,
    PRINT_STYLE_ID,
    PRINT_SHIELD_ID,
  ]);

  observer = new MutationObserver((mutations) => {
    if (isRecreating) return;

    for (const mutation of mutations) {
      // Check removed nodes
      if (mutation.type === 'childList') {
        for (const removed of Array.from(mutation.removedNodes)) {
          if (removed instanceof HTMLElement) {
            if (protectedIds.has(removed.id) || removed.hasAttribute('data-protected-element')) {
              verifyAndRestoreElements(config);
              return;
            }
          }
        }
      }

      // Check modified attributes (e.g. style, class, hidden) on protected nodes
      if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLElement;
        if (target && (protectedIds.has(target.id) || target.hasAttribute('data-protected-element'))) {
          verifyAndRestoreElements(config);
          return;
        }
      }
    }
  });

  const root = document.documentElement || document.body;
  if (root) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden', 'id', 'aria-hidden'],
    });
  }

  // Periodic heartbeat as fallback (every 1000ms)
  heartbeatTimer = setInterval(() => {
    verifyAndRestoreElements(config);
  }, 1000);

  return () => {
    disableTamperDetection();
  };
}

/**
 * Disables tamper detection observer and timer.
 */
export function disableTamperDetection(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}
