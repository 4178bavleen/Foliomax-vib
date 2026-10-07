/**
 * @yourorg/protected-content - Types and interfaces
 */

export interface WatermarkOptions {
  /**
   * Whether the watermark is enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Lines of text to display in the watermark pattern.
   * @default ["CONFIDENTIAL", "USER: 18472", "SESSION: A82F91"]
   */
  text?: string[] | string;

  /**
   * Opacity of the watermark (0.0 to 1.0).
   * @default 0.15
   */
  opacity?: number;

  /**
   * Whether the watermark floats/moves slowly across the screen.
   * @default true
   */
  moving?: boolean;

  /**
   * Font size in pixels.
   * @default 15
   */
  fontSize?: number;

  /**
   * Watermark text color (CSS color string).
   * @default "rgba(0, 0, 0, 0.85)"
   */
  color?: string;

  /**
   * Angle of rotation in degrees.
   * @default -25
   */
  angle?: number;

  /**
   * Spacing / gap between watermark repetitions in pixels.
   * @default 240
   */
  gap?: number;
}

export type CaptureEventType =
  | 'printscreen'
  | 'print'
  | 'shortcut'
  | 'blur'
  | 'visibility'
  | 'fullscreen'
  | 'tamper'
  | 'clipboard';

export interface CaptureEvent {
  type: CaptureEventType;
  timestamp: number;
  detail?: Record<string, unknown> | string;
}

export interface ProtectionOptions {
  /**
   * Enable PrintScreen and screenshot keyboard shortcut detection.
   * Flashes black screen for 500-1000ms upon detection.
   * @default true
   */
  screenshotProtection?: boolean;

  /**
   * Enable print protection via @media print CSS and beforeprint events.
   * @default true
   */
  printProtection?: boolean;

  /**
   * Full-screen transparent repeated watermark.
   * Set to `false` to disable, or provide WatermarkOptions.
   * @default { enabled: true }
   */
  watermark?: boolean | WatermarkOptions;

  /**
   * Automatic tamper detection via MutationObserver.
   * Recreates protection elements if removed or modified in DevTools.
   * @default true
   */
  tamperDetection?: boolean;

  /**
   * Prevent text selection, right-click context menu, copy, cut, and drag.
   * @default true
   */
  copyPasteProtection?: boolean;

  /**
   * Optional window blur protection: applies blackout or blur when the window loses focus.
   * Note: false by default to avoid interfering with normal multi-window workflows.
   * @default false
   */
  blurProtection?: boolean;

  /**
   * Duration in milliseconds for the blackout screen when a capture attempt is detected.
   * @default 800 (between 500ms and 1000ms)
   */
  blackoutDuration?: number;

  /**
   * Callback fired when a capture attempt or tamper event is detected.
   */
  onCaptureAttempt?: (event: CaptureEvent) => void;
}

export interface ProtectionController {
  /**
   * Dismantles all protection listeners, observers, and DOM elements.
   */
  unprotect: () => void;

  /**
   * Programmatically trigger the black protection overlay.
   * @param durationMs Duration in ms (defaults to configured blackoutDuration)
   */
  triggerBlackout: (durationMs?: number) => void;

  /**
   * Update the watermark text or options dynamically.
   */
  updateWatermark: (options: Partial<WatermarkOptions>) => void;

  /**
   * Returns true if protection is currently active.
   */
  isProtected: () => boolean;
}
