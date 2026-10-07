/**
 * @yourorg/protected-content - Clipboard & Content Interaction Protection
 * Prevents text selection, context menu (right-click), copy, cut, and drag.
 */

import { CaptureEvent } from './types';

export const CLIPBOARD_STYLE_ID = '__protected_content_clipboard_style__';

let cleanupFn: (() => void) | null = null;

/**
 * Injects user-select: none styles across the document.
 */
function injectSelectionStyles(): HTMLStyleElement | null {
  if (typeof document === 'undefined') return null;

  let styleEl = document.getElementById(CLIPBOARD_STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = CLIPBOARD_STYLE_ID;
    styleEl.setAttribute('data-protected-element', 'clipboard-style');
    (document.head || document.documentElement).appendChild(styleEl);
  }

  styleEl.textContent = `
    body, html, * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    }

    input, textarea, [contenteditable="true"] {
      -webkit-user-select: auto !important;
      user-select: auto !important;
    }
  `;

  return styleEl;
}

/**
 * Enables copy, cut, contextmenu, drag, and select prevention.
 */
export function enableClipboardProtection(
  onAttempt?: (event: CaptureEvent) => void
): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }

  injectSelectionStyles();

  // 1. Context menu prevention (disables right-click save image, inspect, copy)
  const handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
    if (onAttempt) {
      onAttempt({
        type: 'clipboard',
        timestamp: Date.now(),
        detail: 'contextmenu prevented',
      });
    }
  };

  // 2. Copy prevention
  const handleCopy = (e: ClipboardEvent): void => {
    e.preventDefault();
    if (e.clipboardData) {
      e.clipboardData.setData('text/plain', '');
    }
    if (onAttempt) {
      onAttempt({
        type: 'clipboard',
        timestamp: Date.now(),
        detail: 'copy event intercepted and scrubbed',
      });
    }
  };

  // 3. Cut prevention
  const handleCut = (e: ClipboardEvent): void => {
    e.preventDefault();
    if (e.clipboardData) {
      e.clipboardData.setData('text/plain', '');
    }
    if (onAttempt) {
      onAttempt({
        type: 'clipboard',
        timestamp: Date.now(),
        detail: 'cut event intercepted',
      });
    }
  };

  // 4. Dragstart prevention
  const handleDragStart = (e: DragEvent): void => {
    e.preventDefault();
  };

  // 5. Selectstart prevention
  const handleSelectStart = (e: Event): void => {
    const target = e.target as HTMLElement | null;
    const isInput =
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.getAttribute('contenteditable') === 'true');

    if (!isInput) {
      e.preventDefault();
    }
  };

  document.addEventListener('contextmenu', handleContextMenu, true);
  document.addEventListener('copy', handleCopy, true);
  document.addEventListener('cut', handleCut, true);
  document.addEventListener('dragstart', handleDragStart, true);
  document.addEventListener('selectstart', handleSelectStart, true);

  cleanupFn = () => {
    document.removeEventListener('contextmenu', handleContextMenu, true);
    document.removeEventListener('copy', handleCopy, true);
    document.removeEventListener('cut', handleCut, true);
    document.removeEventListener('dragstart', handleDragStart, true);
    document.removeEventListener('selectstart', handleSelectStart, true);

    const styleEl = document.getElementById(CLIPBOARD_STYLE_ID);
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
  };

  return cleanupFn;
}

/**
 * Disables clipboard and interaction protection.
 */
export function disableClipboardProtection(): void {
  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }
}
