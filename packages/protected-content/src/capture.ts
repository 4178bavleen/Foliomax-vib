/**
 * @yourorg/protected-content - Capture Detection
 * Steps 4 & 8: PrintScreen detection, screenshot shortcuts, focus/visibility/fullscreen monitoring.
 */

import { triggerBlackout } from './overlay';
import { CaptureEvent } from './types';

let captureCleanup: (() => void) | null = null;

/**
 * Checks if a keyboard event corresponds to PrintScreen.
 */
export function isPrintScreenKey(e: KeyboardEvent): boolean {
  return (
    e.key === 'PrintScreen' ||
    e.code === 'PrintScreen' ||
    e.key === 'Snapshot' ||
    (e as unknown as { keyCode: number }).keyCode === 44
  );
}

/**
 * Checks if a keyboard event corresponds to common OS screenshot shortcuts.
 */
export function isScreenshotShortcut(e: KeyboardEvent): boolean {
  // Windows: Win + Shift + S (Meta + Shift + S)
  if (e.shiftKey && (e.metaKey || (e.ctrlKey && e.altKey)) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
    return true;
  }

  // macOS: Cmd + Shift + 3 / 4 / 5
  if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
    return true;
  }

  // Alt + PrintScreen (active window screenshot)
  if (e.altKey && isPrintScreenKey(e)) {
    return true;
  }

  return false;
}

/**
 * Clears or overwrites the system clipboard if browser permission permits.
 */
export async function attemptClipboardScrub(): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText('');
    } catch {
      // Browsers often require active document focus or user gesture to write to clipboard
    }
  }
}

/**
 * Enables screenshot and capture detection listeners.
 */
export function enableCaptureDetection(options: {
  blackoutDuration?: number;
  blurProtection?: boolean;
  onAttempt?: (event: CaptureEvent) => void;
}): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  if (captureCleanup) {
    captureCleanup();
    captureCleanup = null;
  }

  const blackoutDuration = options.blackoutDuration ?? 800;
  const blurProtection = options.blurProtection ?? false;
  const onAttempt = options.onAttempt;

  const handleCaptureTrigger = (source: string): void => {
    // Step 4: PrintScreen -> Black screen -> ~500-1000ms -> Restore website
    triggerBlackout(blackoutDuration);
    attemptClipboardScrub();

    if (onAttempt) {
      onAttempt({
        type: 'printscreen',
        timestamp: Date.now(),
        detail: `Capture triggered by ${source}`,
      });
    }
  };

  // 1. Keydown listener for PrintScreen and screenshot shortcuts
  const handleKeyDown = (e: KeyboardEvent): void => {
    if (isPrintScreenKey(e)) {
      e.preventDefault();
      handleCaptureTrigger('keydown:PrintScreen');
      return;
    }

    if (isScreenshotShortcut(e)) {
      e.preventDefault();
      handleCaptureTrigger('keydown:ScreenshotShortcut');
      return;
    }
  };

  // 2. Keyup listener: Some Windows keyboards fire PrintScreen on keyup
  const handleKeyUp = (e: KeyboardEvent): void => {
    if (isPrintScreenKey(e)) {
      handleCaptureTrigger('keyup:PrintScreen');
    }
  };

  // 3. Visibility changes monitoring
  // Rule: Do not assume every visibility change means a screenshot.
  const handleVisibilityChange = (): void => {
    const isHidden = document.visibilityState === 'hidden';

    if (onAttempt) {
      onAttempt({
        type: 'visibility',
        timestamp: Date.now(),
        detail: { visibilityState: document.visibilityState },
      });
    }

    if (isHidden && blurProtection) {
      triggerBlackout(blackoutDuration);
    }
  };

  // 4. Focus / Blur monitoring
  const handleWindowBlur = (): void => {
    if (onAttempt) {
      onAttempt({
        type: 'blur',
        timestamp: Date.now(),
        detail: 'window.blur',
      });
    }

    if (blurProtection) {
      triggerBlackout(blackoutDuration);
    }
  };

  const handleWindowFocus = (): void => {
    // Window regained focus
  };

  // 5. Fullscreen change monitoring
  const handleFullscreenChange = (): void => {
    const isFullscreen = !!(
      document.fullscreenElement ||
      (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
    );

    if (onAttempt) {
      onAttempt({
        type: 'fullscreen',
        timestamp: Date.now(),
        detail: { isFullscreen },
      });
    }
  };

  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('keyup', handleKeyUp, true);
  document.addEventListener('visibilitychange', handleVisibilityChange, false);
  window.addEventListener('blur', handleWindowBlur, false);
  window.addEventListener('focus', handleWindowFocus, false);
  document.addEventListener('fullscreenchange', handleFullscreenChange, false);

  captureCleanup = () => {
    window.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('keyup', handleKeyUp, true);
    document.removeEventListener('visibilitychange', handleVisibilityChange, false);
    window.removeEventListener('blur', handleWindowBlur, false);
    window.removeEventListener('focus', handleWindowFocus, false);
    document.removeEventListener('fullscreenchange', handleFullscreenChange, false);
  };

  return captureCleanup;
}

/**
 * Disables capture detection listeners.
 */
export function disableCaptureDetection(): void {
  if (captureCleanup) {
    captureCleanup();
    captureCleanup = null;
  }
}
