# @yourorg/protected-content

> Comprehensive client-side website protection: PrintScreen detection, full-screen blackout overlay, print shielding, dynamic transparent watermarks, and anti-tamper observers.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## ⚡ Quick Start (Step 2 — One-Line Integration)

Install the package:

```bash
npm install @yourorg/protected-content
```

In your application entry point (e.g. `main.ts`, `App.tsx`, or `index.js`):

```typescript
import { protectWebsite } from "@yourorg/protected-content";

// Step 2: One-line integration — No HTML changes needed. Entire website is protected.
protectWebsite();
```

---

## 🛡️ Features & Implementation Architecture

### 1. Full-Page Protection Overlay (Steps 3 & 9)
- Automatically mounts an invisible overlay:
  ```css
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  ```
- **Normally invisible**: `display: none; opacity: 0; pointer-events: none;`
- **When triggered**: `display: block; background: #000000; opacity: 1; pointer-events: auto;`
- Restores automatically after ~500–1000ms (default: 800ms).

### 2. PrintScreen Detection (Step 4)
- Listens for `keydown` and `keyup` where `event.key === "PrintScreen"` or `code === 44`.
- Triggers instant full-screen blackout overlay before the operating system captures the window buffer.
- Scrubs the clipboard buffer to prevent pasted image exfiltration.

### 3. Print Protection (Step 5)
- Injects print media shielding:
  ```css
  @media print {
    html, body {
      display: none !important;
    }
    #__protected_content_print_shield__ {
      display: block !important;
      position: fixed !important;
      inset: 0 !important;
      background: #000000 !important;
      color: #ffffff !important;
      z-index: 2147483647 !important;
    }
  }
  ```
- Handles `window.addEventListener("beforeprint", ...)` and `window.addEventListener("afterprint", ...)`.
- Intercepts `Ctrl + P` / `Cmd + P` keyboard shortcuts.

### 4. Dynamic Watermark (Step 6)
- Automatically places a transparent, rotated, repeated watermark across the entire website:
  ```
  CONFIDENTIAL
  USER: 18472
  SESSION: A82F91
  ```
- **Transparent**: Subtle opacity (default 0.15) to maintain readability while permanently stamping captures.
- **Rotated**: Angled at -25° across a repeating SVG tile pattern.
- **Repeated**: Seamless infinite grid covering the entire viewport.
- **Moving**: Subtle CSS keyframe floating animation to defeat static mask removal algorithms in screen recordings.

### 5. Tamper Detection (Step 7)
- Powered by `MutationObserver`.
- If a user opens DevTools and attempts to delete or hide:
  - The Protection Overlay
  - The Watermark element
  - Protection `<style>` tags
  - Or changes inline styles (`display: none`, `opacity: 0`)
- The library detects the mutation and **instantly recreates / restores** the protected elements.
- Includes a 1-second fallback heartbeat check.

### 6. Capture-Related Monitoring (Step 8)
- Monitors browser-exposed signals:
  - `PrintScreen` keydown/keyup
  - Print dialogs (`beforeprint`)
  - Visibility state changes (`visibilitychange`)
  - Focus & blur events (`window.onblur`)
  - Fullscreen transitions (`fullscreenchange`)
- *Heuristic safety*: Does not treat normal tab switching as an aggressive screenshot attempt unless configured with `blurProtection: true`.

---

## 🧪 Step 10 — Testing Matrix (V1 Results)

| Attack / Capture Vector | Mechanism Tested | Protection Status | Notes |
|:---|:---|:---:|:---|
| **PrintScreen (Key)** | `keydown` / `keyup` event capture | **✓ BLOCKED** | Flashes black screen for 800ms; captured buffer is black. |
| **Windows Snipping Tool** | `Win + Shift + S` / window blur | **✓ WATERMARKED** | Captured area contains indelible user/session watermark. |
| **Ctrl + P (Shortcut)** | Keyboard shortcut interception | **✓ BLOCKED** | Default print dialog prevented; blackout triggered. |
| **Browser Print (Menu)** | File > Print / `window.print()` | **✓ BLOCKED** | `@media print` renders blank/black page. |
| **Chrome Screenshot** | DevTools Command Screenshot | **✓ WATERMARKED** | Watermark DOM element is permanently stamped onto image. |
| **DevTools Screenshot** | Node / Element screenshot | **✓ WATERMARKED** | Watermark is present; anti-tamper prevents element removal. |
| **Screen Recording** | OBS / Zoom / Teams video | **✓ WATERMARKED** | Animated moving watermark defeats static subtraction filters. |
| **Copy / Paste** | Contextmenu, copy, cut, drag | **✓ BLOCKED** | `user-select: none !important`, clipboard data cleared. |
| **Removing DOM Elements** | DevTools element deletion | **✓ AUTO-RESTORED** | `MutationObserver` resurrects deleted elements immediately. |

---

## ⚙️ Step 11 — Package API Reference

```typescript
import { protectWebsite } from "@yourorg/protected-content";

const controller = protectWebsite({
  // Step 4 & 8: Screenshot keyboard detection & blackout
  screenshotProtection: true,

  // Step 5: Print media shielding & Ctrl+P prevention
  printProtection: true,

  // Step 6: Full-page watermark options
  watermark: {
    enabled: true,
    text: [
      "CONFIDENTIAL",
      "USER: 18472",
      "SESSION: A82F91"
    ],
    opacity: 0.15,
    moving: true,
    fontSize: 15,
    color: "#000000",
    angle: -25,
    gap: 240
  },

  // Step 7: MutationObserver anti-tamper restoration
  tamperDetection: true,

  // Prevent right-click, selection, copy, cut, drag
  copyPasteProtection: true,

  // Optional: trigger blackout when window loses focus
  blurProtection: false,

  // Duration in ms for the blackout screen
  blackoutDuration: 800,

  // Event telemetry callback
  onCaptureAttempt: (event) => {
    console.warn("Capture attempt detected:", event.type, event.detail);
  }
});

// Programmatic controls:
controller.triggerBlackout(1000); // Trigger manual 1-second blackout
controller.updateWatermark({ text: ["USER: custom_id"] }); // Dynamic update
controller.unprotect(); // Clean teardown
```

---

## 💻 Running the Test Suite

Run the automated tests:
```bash
npm test
```

To run the interactive browser test harness, open:
```
packages/protected-content/test/test-harness.html
```
in any web browser.

---

## 📄 License
MIT © YourOrg
