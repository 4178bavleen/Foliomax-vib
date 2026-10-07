/**
 * @yourorg/protected-content - Full-Page Watermark
 * Step 6: Transparent, rotated, repeated, optionally moving watermark across the entire website.
 */

import { WatermarkOptions } from './types';

export const WATERMARK_ID = '__protected_content_watermark__';
export const WATERMARK_STYLE_ID = '__protected_content_watermark_style__';

const DEFAULT_TEXT = ['CONFIDENTIAL', 'USER: 18472', 'SESSION: A82F91'];

let watermarkElement: HTMLDivElement | null = null;
let currentOptions: WatermarkOptions = {};

/**
 * Builds an SVG data URL for repeating watermark tiles.
 */
function createWatermarkSvg(
  lines: string[],
  angle: number,
  fontSize: number,
  color: string,
  opacity: number,
  gap: number
): string {
  const width = gap;
  const height = gap;
  const cx = width / 2;
  const cy = height / 2;
  const lineHeight = fontSize * 1.35;
  const totalTextHeight = lines.length * lineHeight;
  const startY = cy - totalTextHeight / 2 + fontSize;

  const textTags = lines
    .map((line, i) => {
      const y = startY + i * lineHeight;
      const safeText = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<text x="${cx}" y="${y}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="${fontSize}px" fill="${color}" fill-opacity="${opacity}">${safeText}</text>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <g transform="rotate(${angle} ${cx} ${cy})">
      ${textTags}
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Injects keyframe animation for the moving watermark if requested.
 */
function ensureWatermarkStyle(moving: boolean): void {
  if (typeof document === 'undefined') return;

  let styleEl = document.getElementById(WATERMARK_STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = WATERMARK_STYLE_ID;
    styleEl.setAttribute('data-protected-element', 'watermark-style');
    (document.head || document.documentElement).appendChild(styleEl);
  }

  styleEl.textContent = `
    @keyframes __pc_watermark_float__ {
      0% {
        transform: translate3d(0, 0, 0);
      }
      25% {
        transform: translate3d(-24px, 16px, 0);
      }
      50% {
        transform: translate3d(18px, -22px, 0);
      }
      75% {
        transform: translate3d(-15px, -18px, 0);
      }
      100% {
        transform: translate3d(0, 0, 0);
      }
    }

    #${WATERMARK_ID} {
      position: fixed !important;
      inset: -60px !important;
      width: calc(100vw + 120px) !important;
      height: calc(100vh + 120px) !important;
      z-index: 2147483646 !important;
      pointer-events: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      overflow: hidden !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      ${moving ? 'animation: __pc_watermark_float__ 24s ease-in-out infinite alternate !important;' : ''}
    }
  `;
}

/**
 * Creates and injects the full-page repeating watermark.
 */
export function createWatermark(options: WatermarkOptions = {}): HTMLDivElement {
  if (typeof document === 'undefined') {
    return null as unknown as HTMLDivElement;
  }

  currentOptions = { ...options };

  const lines = Array.isArray(options.text)
    ? options.text
    : typeof options.text === 'string'
    ? [options.text]
    : DEFAULT_TEXT;

  const angle = options.angle ?? -25;
  const fontSize = options.fontSize ?? 15;
  const color = options.color ?? '#000000';
  const opacity = options.opacity ?? 0.15;
  const gap = options.gap ?? 240;
  const moving = options.moving ?? true;

  ensureWatermarkStyle(moving);

  let watermark = document.getElementById(WATERMARK_ID) as HTMLDivElement | null;
  if (!watermark) {
    watermark = document.createElement('div');
    watermark.id = WATERMARK_ID;
    watermark.setAttribute('aria-hidden', 'true');
    watermark.setAttribute('data-protected-element', 'watermark');

    const target = document.body || document.documentElement;
    if (target) {
      target.appendChild(watermark);
    }
  }

  const svgDataUrl = createWatermarkSvg(lines, angle, fontSize, color, opacity, gap);

  watermark.style.setProperty('background-image', `url("${svgDataUrl}")`, 'important');
  watermark.style.setProperty('background-repeat', 'repeat', 'important');
  watermark.style.setProperty('background-position', 'center center', 'important');

  watermarkElement = watermark;
  return watermark;
}

/**
 * Updates watermark options dynamically.
 */
export function updateWatermark(options: Partial<WatermarkOptions>): void {
  currentOptions = { ...currentOptions, ...options };
  createWatermark(currentOptions);
}

/**
 * Returns current watermark DOM element.
 */
export function getWatermarkElement(): HTMLDivElement | null {
  return watermarkElement;
}

/**
 * Removes the watermark and associated styles from the DOM.
 */
export function removeWatermark(): void {
  if (watermarkElement && watermarkElement.parentNode) {
    watermarkElement.parentNode.removeChild(watermarkElement);
  }
  watermarkElement = null;

  if (typeof document !== 'undefined') {
    const styleEl = document.getElementById(WATERMARK_STYLE_ID);
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
  }
}
