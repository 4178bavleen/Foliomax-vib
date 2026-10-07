/**
 * Automated Test Runner for @yourorg/protected-content
 * Tests core functionality and simulated vectors.
 */

const assert = require('assert');
const path = require('path');

// Setup minimal browser-like DOM simulation for Node.js environment
global.window = global;
const listeners = new Map();

global.window.addEventListener = (event, fn) => {
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event).push(fn);
};
global.window.removeEventListener = (event, fn) => {
  if (listeners.has(event)) {
    const arr = listeners.get(event);
    const idx = arr.indexOf(fn);
    if (idx >= 0) arr.splice(idx, 1);
  }
};
global.window.getComputedStyle = (el) => el.style || {};

const elementsById = new Map();
class MockElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.style = {
      _styles: {},
      setProperty(prop, val) {
        this._styles[prop] = val;
        this[prop] = val;
        // Also map kebab-case to camelCase
        const camel = prop.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
        this[camel] = val;
        this._styles[camel] = val;
      },
      getPropertyValue(prop) {
        return this._styles[prop] || '';
      },
      display: 'none',
      visibility: 'hidden',
      opacity: '0',
      zIndex: '0',
    };
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
  }
  setAttribute(k, v) {
    this.attributes[k] = v;
  }
  getAttribute(k) {
    return this.attributes[k];
  }
  hasAttribute(k) {
    return k in this.attributes;
  }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }
}

global.document = {
  documentElement: new MockElement('html'),
  body: new MockElement('body'),
  head: new MockElement('head'),
  visibilityState: 'visible',
  createElement(tag) {
    const el = new MockElement(tag);
    return el;
  },
  getElementById(id) {
    return elementsById.get(id) || null;
  },
  addEventListener: global.window.addEventListener,
  removeEventListener: global.window.removeEventListener,
};

global.document.documentElement.appendChild(global.document.head);
global.document.documentElement.appendChild(global.document.body);

// Mock MutationObserver
class MockMutationObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  disconnect() {}
}
global.MutationObserver = MockMutationObserver;

// Hook createElement / appendChild to track elementsById
const origAppend = MockElement.prototype.appendChild;
MockElement.prototype.appendChild = function (child) {
  if (child.id) elementsById.set(child.id, child);
  return origAppend.call(this, child);
};
const origRemove = MockElement.prototype.removeChild;
MockElement.prototype.removeChild = function (child) {
  if (child.id) elementsById.delete(child.id);
  return origRemove.call(this, child);
};

// Load compiled CommonJS package
const pc = require('../dist/index.cjs');

console.log('====================================================');
console.log(' RUNNING AUTOMATED TESTS: @yourorg/protected-content ');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(` ✓ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(` ✗ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

// 1. Export check
test('Step 1 & 2: Exports protectWebsite function and one-line initialization', () => {
  assert.strictEqual(typeof pc.protectWebsite, 'function');
  assert.strictEqual(typeof pc.triggerBlackout, 'function');
  assert.strictEqual(typeof pc.createProtectionOverlay, 'function');
  assert.strictEqual(typeof pc.createWatermark, 'function');
});

// 2. Overlay creation
test('Step 3: Creates full-page overlay with z-index 2147483647', () => {
  const overlay = pc.createProtectionOverlay();
  assert.ok(overlay);
  assert.strictEqual(overlay.id, '__protected_content_overlay__');
  assert.strictEqual(overlay.style.zIndex, '2147483647');
});

// 3. Blackout mechanism
test('Step 9: Blackout turns overlay black and visible', () => {
  pc.triggerBlackout(500);
  assert.strictEqual(pc.isBlackoutActive(), true);
  const overlay = pc.getOverlayElement();
  assert.strictEqual(overlay.style.display, 'block');
  assert.strictEqual(overlay.style.background, '#000000');
  assert.strictEqual(overlay.style.opacity, '1');

  pc.hideBlackout();
  assert.strictEqual(pc.isBlackoutActive(), false);
  assert.strictEqual(overlay.style.display, 'none');
});

// 4. PrintScreen detection
test('Step 4: PrintScreen detection triggers blackout', () => {
  let captured = false;
  const controller = pc.protectWebsite({
    onCaptureAttempt: (e) => {
      if (e.type === 'printscreen') captured = true;
    },
  });

  // Simulate PrintScreen keydown
  const keyListeners = listeners.get('keydown') || [];
  let prevented = false;
  for (const fn of keyListeners) {
    fn({
      key: 'PrintScreen',
      preventDefault: () => {
        prevented = true;
      },
    });
  }

  assert.strictEqual(captured, true, 'onCaptureAttempt should be called on PrintScreen');
  assert.strictEqual(pc.isBlackoutActive(), true, 'Blackout should be active after PrintScreen');
  assert.strictEqual(prevented, true, 'Default action should be prevented on PrintScreen');

  controller.unprotect();
});

// 5. Print protection
test('Step 5: Print protection injects @media print rules and catches Ctrl+P / beforeprint', () => {
  let printCaptured = false;
  const controller = pc.protectWebsite({
    onCaptureAttempt: (e) => {
      if (e.type === 'print') printCaptured = true;
    },
  });

  const styleEl = document.getElementById('__protected_content_print_style__');
  assert.ok(styleEl, 'Print style should be injected into DOM');
  assert.ok(styleEl.textContent.includes('@media print'), 'Style should contain @media print');
  assert.ok(styleEl.textContent.includes('display: none !important'), 'Style should hide html/body');

  // Simulate Ctrl+P keydown
  const keyListeners = listeners.get('keydown') || [];
  let ctrlPPrevented = false;
  for (const fn of keyListeners) {
    fn({
      key: 'p',
      ctrlKey: true,
      preventDefault: () => {
        ctrlPPrevented = true;
      },
      stopPropagation: () => {},
    });
  }

  assert.strictEqual(ctrlPPrevented, true, 'Ctrl+P should be prevented');
  assert.strictEqual(printCaptured, true, 'onCaptureAttempt should record print attempt');

  controller.unprotect();
});

// 6. Watermark
test('Step 6: Watermark created with default text CONFIDENTIAL, USER: 18472, SESSION: A82F91', () => {
  const controller = pc.protectWebsite();
  const watermarkEl = document.getElementById('__protected_content_watermark__');
  assert.ok(watermarkEl, 'Watermark element should be in DOM');
  assert.ok(watermarkEl.style.backgroundImage.includes('CONFIDENTIAL'), 'Should include CONFIDENTIAL');
  assert.ok(watermarkEl.style.backgroundImage.includes('18472'), 'Should include user ID 18472');
  assert.ok(watermarkEl.style.backgroundImage.includes('A82F91'), 'Should include session ID A82F91');

  controller.unprotect();
});

// 7. Tamper detection
test('Step 7: Tamper verification detects and restores removed overlay and watermark', () => {
  let tamperEventFired = false;
  const controller = pc.protectWebsite({
    onCaptureAttempt: (e) => {
      if (e.type === 'tamper') tamperEventFired = true;
    },
  });

  // Remove overlay
  const overlay = document.getElementById('__protected_content_overlay__');
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }

  // Trigger verify and restore
  const tamperMod = require('../dist/tamper.cjs');
  tamperMod.verifyAndRestoreElements({
    watermarkEnabled: true,
    printProtectionEnabled: true,
    onAttempt: (e) => {
      if (e.type === 'tamper') tamperEventFired = true;
    },
  });

  const restoredOverlay = document.getElementById('__protected_content_overlay__');
  assert.ok(restoredOverlay, 'Overlay should be automatically restored after removal');
  assert.strictEqual(tamperEventFired, true, 'Tamper event should be reported');

  controller.unprotect();
});

// 8. Capture-related detection
test('Step 8: Monitor visibility and focus events without false positives', () => {
  let visibilityEventFired = false;
  const controller = pc.protectWebsite({
    blurProtection: false, // Default: don't blackout on mere tab switch
    onCaptureAttempt: (e) => {
      if (e.type === 'visibility') visibilityEventFired = true;
    },
  });

  // Simulate visibilitychange
  document.visibilityState = 'hidden';
  const visListeners = listeners.get('visibilitychange') || [];
  for (const fn of visListeners) fn();

  assert.strictEqual(visibilityEventFired, true, 'Visibility event should be logged');
  assert.strictEqual(
    pc.isBlackoutActive(),
    false,
    'Should not trigger false positive blackout on visibilitychange when blurProtection is false'
  );

  controller.unprotect();
});

// 9. Copy / Paste & interaction protection
test('Step 10: Copy/paste and contextmenu events are prevented', () => {
  let copyAttempt = false;
  const controller = pc.protectWebsite({
    onCaptureAttempt: (e) => {
      if (e.type === 'clipboard') copyAttempt = true;
    },
  });

  // Context menu prevention
  let contextPrevented = false;
  const ctxListeners = listeners.get('contextmenu') || [];
  for (const fn of ctxListeners) {
    fn({
      preventDefault: () => {
        contextPrevented = true;
      },
    });
  }
  assert.strictEqual(contextPrevented, true, 'Context menu should be prevented');

  // Copy prevention
  let copyPrevented = false;
  const copyListeners = listeners.get('copy') || [];
  for (const fn of copyListeners) {
    fn({
      preventDefault: () => {
        copyPrevented = true;
      },
      clipboardData: {
        setData: () => {},
      },
    });
  }
  assert.strictEqual(copyPrevented, true, 'Copy event should be prevented');
  assert.strictEqual(copyAttempt, true, 'Clipboard event should be logged');

  controller.unprotect();
});

// 10. API full test
test('Step 11: Final package API with custom options and cleanup', () => {
  const controller = pc.protectWebsite({
    screenshotProtection: true,
    printProtection: true,
    watermark: {
      enabled: true,
      text: ['TOP SECRET', 'USER: 9999'],
    },
    tamperDetection: true,
  });

  assert.strictEqual(controller.isProtected(), true);

  // Dynamic watermark update
  controller.updateWatermark({ text: ['UPDATED WATERMARK'] });
  const wm = document.getElementById('__protected_content_watermark__');
  assert.ok(wm.style.backgroundImage.includes('UPDATED%20WATERMARK'));

  controller.unprotect();
  assert.strictEqual(controller.isProtected(), false);
  assert.strictEqual(document.getElementById('__protected_content_overlay__'), null);
  assert.strictEqual(document.getElementById('__protected_content_watermark__'), null);
});

console.log('\n====================================================');
console.log(` RESULTS: ${passed} passed, ${failed} failed`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
