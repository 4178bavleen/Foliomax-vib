/**
 * @yourorg/protected-content - Print Protection
 * Step 5: @media print shielding, beforeprint & afterprint handlers, Ctrl/Cmd+P interception.
 */

import { triggerBlackout } from './overlay';
import { CaptureEvent } from './types';

export const PRINT_STYLE_ID = '__protected_content_print_style__';
export const PRINT_SHIELD_ID = '__protected_content_print_shield__';

let cleanupFn: (() => void) | null = null;

/**
 * Injects CSS rules that completely hide html and body during printing.
 */
export function injectPrintStyles(): HTMLStyleElement | null {
  if (typeof document === 'undefined') return null;

  let styleEl = document.getElementById(PRINT_STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = PRINT_STYLE_ID;
    styleEl.setAttribute('data-protected-element', 'print-style');
    (document.head || document.documentElement).appendChild(styleEl);
  }

  styleEl.textContent = `
    @media print {
      /* Step 5: Hide html and body entirely */
      html, body {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }

      /* Print shield replaces content with a solid protected banner */
      #${PRINT_SHIELD_ID} {
        display: block !important;
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: #000000 !important;
        color: #ffffff !important;
        z-index: 2147483647 !important;
      }
    }
  `;

  return styleEl;
}

/**
 * Ensures the print shield placeholder exists in DOM for print media.
 */
export function ensurePrintShield(): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  let shield = document.getElementById(PRINT_SHIELD_ID);
  if (!shield) {
    shield = document.createElement('div');
    shield.id = PRINT_SHIELD_ID;
    shield.setAttribute('aria-hidden', 'true');
    shield.setAttribute('data-protected-element', 'print-shield');
    shield.style.cssText = 'display: none;';
    (document.body || document.documentElement).appendChild(shield);
  }
  return shield;
}

/**
 * Sets up print event listeners (beforeprint, afterprint, key shortcuts).
 */
export function enablePrintProtection(
  onAttempt?: (event: CaptureEvent) => void
): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }

  injectPrintStyles();
  ensurePrintShield();

  // beforeprint handler
  const handleBeforePrint = (): void => {
    triggerBlackout(1200);
    if (onAttempt) {
      onAttempt({
        type: 'print',
        timestamp: Date.now(),
        detail: 'window.beforeprint fired',
      });
    }
  };

  // afterprint handler
  const handleAfterPrint = (): void => {
    // Give browser a moment before restoring
    setTimeout(() => {
      triggerBlackout(300);
    }, 100);
  };

  // Keyboard shortcut interception (Ctrl+P / Cmd+P)
  const handleKeyDown = (e: KeyboardEvent): void => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    if (isCtrlOrCmd && (e.key === 'p' || e.key === 'P' || e.code === 'KeyP')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();

      triggerBlackout(1000);

      if (onAttempt) {
        onAttempt({
          type: 'print',
          timestamp: Date.now(),
          detail: 'Print shortcut (Ctrl/Cmd+P) intercepted',
        });
      }
    }
  };

  window.addEventListener('beforeprint', handleBeforePrint);
  window.addEventListener('afterprint', handleAfterPrint);
  window.addEventListener('keydown', handleKeyDown, true);

  cleanupFn = () => {
    window.removeEventListener('beforeprint', handleBeforePrint);
    window.removeEventListener('afterprint', handleAfterPrint);
    window.removeEventListener('keydown', handleKeyDown, true);

    const styleEl = document.getElementById(PRINT_STYLE_ID);
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }

    const shieldEl = document.getElementById(PRINT_SHIELD_ID);
    if (shieldEl && shieldEl.parentNode) {
      shieldEl.parentNode.removeChild(shieldEl);
    }
  };

  return cleanupFn;
}

/**
 * Disables print protection.
 */
export function disablePrintProtection(): void {
  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }
}
