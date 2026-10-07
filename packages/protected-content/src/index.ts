/**
 * @yourorg/protected-content
 * Comprehensive client-side website protection package.
 *
 * One-line integration:
 * ```ts
 * import { protectWebsite } from "@yourorg/protected-content";
 * protectWebsite();
 * ```
 */

import {
  ProtectionOptions,
  ProtectionController,
  WatermarkOptions,
  CaptureEvent,
} from './types';
import {
  createProtectionOverlay,
  removeProtectionOverlay,
  triggerBlackout,
  hideBlackout,
  isBlackoutActive,
  getOverlayElement,
} from './overlay';
import {
  createWatermark,
  updateWatermark,
  removeWatermark,
  getWatermarkElement,
} from './watermark';
import {
  enablePrintProtection,
  disablePrintProtection,
} from './print';
import {
  enableCaptureDetection,
  disableCaptureDetection,
} from './capture';
import {
  enableTamperDetection,
  disableTamperDetection,
} from './tamper';
import {
  enableClipboardProtection,
  disableClipboardProtection,
} from './clipboard';

export * from './types';
export {
  triggerBlackout,
  hideBlackout,
  isBlackoutActive,
  getOverlayElement,
  createProtectionOverlay,
  removeProtectionOverlay,
  createWatermark,
  updateWatermark,
  removeWatermark,
  getWatermarkElement,
  enablePrintProtection,
  disablePrintProtection,
  enableCaptureDetection,
  disableCaptureDetection,
  enableTamperDetection,
  disableTamperDetection,
  enableClipboardProtection,
  disableClipboardProtection,
};

let activeController: ProtectionController | null = null;

/**
 * Protects the entire website with screenshot prevention, blackout overlay,
 * print shielding, dynamic watermark, and anti-tamper observer.
 *
 * @example
 * // Minimal one-line integration:
 * import { protectWebsite } from "@yourorg/protected-content";
 * protectWebsite();
 *
 * @example
 * // Configured integration:
 * protectWebsite({
 *   screenshotProtection: true,
 *   printProtection: true,
 *   watermark: {
 *     enabled: true,
 *     text: ["CONFIDENTIAL", "USER: 18472", "SESSION: A82F91"]
 *   },
 *   tamperDetection: true
 * });
 */
export function protectWebsite(options: ProtectionOptions = {}): ProtectionController {
  // If already protected, dismantle previous instance before re-initializing
  if (activeController) {
    activeController.unprotect();
    activeController = null;
  }

  // Normalize defaults
  const screenshotProtection = options.screenshotProtection ?? true;
  const printProtection = options.printProtection ?? true;
  const tamperDetection = options.tamperDetection ?? true;
  const copyPasteProtection = options.copyPasteProtection ?? true;
  const blurProtection = options.blurProtection ?? false;
  const blackoutDuration = options.blackoutDuration ?? 800;
  const onAttempt = options.onCaptureAttempt;

  // Watermark options resolution
  let watermarkEnabled = true;
  let watermarkOpts: WatermarkOptions = {};

  if (typeof options.watermark === 'boolean') {
    watermarkEnabled = options.watermark;
  } else if (typeof options.watermark === 'object' && options.watermark !== null) {
    watermarkEnabled = options.watermark.enabled ?? true;
    watermarkOpts = options.watermark;
  }

  // Step 3 & 9: Create full-page protection overlay
  createProtectionOverlay();

  // Step 6: Create full-page transparent watermark
  if (watermarkEnabled) {
    createWatermark(watermarkOpts);
  }

  // Cleanups array
  const cleanups: Array<() => void> = [];

  // Step 5: Protect printing (@media print & beforeprint)
  if (printProtection) {
    const cleanupPrint = enablePrintProtection(onAttempt);
    cleanups.push(cleanupPrint);
  }

  // Step 4 & 8: Detect PrintScreen, shortcuts, visibility/focus monitoring
  if (screenshotProtection) {
    const cleanupCapture = enableCaptureDetection({
      blackoutDuration,
      blurProtection,
      onAttempt,
    });
    cleanups.push(cleanupCapture);
  }

  // Interaction / copy-paste protection
  if (copyPasteProtection) {
    const cleanupClipboard = enableClipboardProtection(onAttempt);
    cleanups.push(cleanupClipboard);
  }

  // Step 7: Tamper detection via MutationObserver
  if (tamperDetection) {
    const cleanupTamper = enableTamperDetection({
      watermarkEnabled,
      watermarkOptions: watermarkOpts,
      printProtectionEnabled: printProtection,
      onAttempt,
    });
    cleanups.push(cleanupTamper);
  }

  let isProtectedState = true;

  const controller: ProtectionController = {
    unprotect: () => {
      if (!isProtectedState) return;
      isProtectedState = false;

      // Run cleanups in reverse order
      while (cleanups.length > 0) {
        const cleanup = cleanups.pop();
        try {
          cleanup?.();
        } catch (err) {
          console.error('[protected-content] Cleanup error:', err);
        }
      }

      removeWatermark();
      removeProtectionOverlay();

      if (activeController === controller) {
        activeController = null;
      }
    },

    triggerBlackout: (durationMs?: number) => {
      triggerBlackout(durationMs ?? blackoutDuration);
    },

    updateWatermark: (newOpts: Partial<WatermarkOptions>) => {
      watermarkOpts = { ...watermarkOpts, ...newOpts };
      if (watermarkEnabled) {
        updateWatermark(watermarkOpts);
      }
    },

    isProtected: () => isProtectedState,
  };

  activeController = controller;
  return controller;
}

/**
 * Convenience helper to unprotect the website.
 */
export function unprotectWebsite(): void {
  if (activeController) {
    activeController.unprotect();
    activeController = null;
  }
}

export default protectWebsite;
