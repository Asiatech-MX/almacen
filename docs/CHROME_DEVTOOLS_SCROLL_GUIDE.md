# Chrome DevTools Scroll Debugging Guide

## 📋 Overview

This guide provides comprehensive instructions for using Chrome DevTools to debug, analyze, and optimize scroll functionality in the Electron + React + Tailwind CSS v4 application.

---

## 🚀 Quick Start

### 1. Access Chrome DevTools
- **Keyboard**: Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Opt+I` (Mac)
- **Menu**: Right-click → "Inspect" or Three dots menu → "More tools" → "Developer tools"

### 2. Load the Scroll Debugger
```javascript
// In Console tab, copy-paste this:
fetch('/tools/chrome-devtools-scroll-debugger.js')
  .then(response => response.text())
  .then(code => eval(code))
  .then(() => ScrollDebugger.run());
```

Or manually copy the contents of `tools/chrome-devtools-scroll-debugger.js` into the console.

### 3. Run Full Analysis
```javascript
ScrollDebugger.run();
```

---

## 🔍 Essential Chrome DevTools Tabs for Scroll Debugging

### Console Tab
**Purpose**: Run debugging scripts and view logs

#### Key Commands
```javascript
// Quick scroll check
console.log('Body overflow:', window.getComputedStyle(document.body).overflowY);
console.log('Scroll height:', document.documentElement.scrollHeight);
console.log('Viewport height:', window.innerHeight);

// Find Scroller component
const scroller = document.querySelector('[data-slot="scroller"]');
console.log('Scroller found:', !!scroller);

// Test scroll functionality
window.scrollBy(0, 100); window.scrollBy(0, -100);
```

#### Common Console Errors and Solutions
```
❌ ERROR: "Cannot read property 'scrollTop' of null"
💡 SOLUTION: Element not found, check selector in DOM

❌ ERROR: "overflow is hidden"
💡 SOLUTION: Check globals.css line 211, change to overflow-x: hidden
```

---

### Elements Tab
**Purpose**: Inspect DOM structure and CSS styles

#### Workflow for Scroll Issues
1. **Select body element**
   - Check `Styles` panel for `overflow` properties
   - Look for `overflow: hidden;` (problematic)
   - Verify `overflow-x: hidden;` (correct)

2. **Inspect Scroller component**
   - Use search: `[data-slot="scroller"]`
   - Check `Computed styles` for:
     - `overflow-y: auto` ✅
     - `height: 100%` or specific value ✅
     - `display: block` or `flex` ✅

3. **Check layout hierarchy**
   - `.SidebarInset` → `main` → `Scroller` → content
   - Verify `min-h-0` on `main` element
   - Verify `h-full` on `Scroller` component

#### Color-coded Elements
- 🔴 **Red**: Problematic CSS (overflow: hidden)
- 🟡 **Yellow**: Warnings (missing height classes)
- 🟢 **Green**: Correct implementation

#### Box Model Analysis
```
┌─────────────────────────────────┐
│           Margin (transparent)  │
│  ┌─────────────────────────────┐│
│  │        Border (colored)     ││
│  │  ┌─────────────────────────┐││
│  │  │    Padding (shaded)     │││
│  │  │  ┌─────────────────────┐│││
│  │  │  │    Content           ││││
│  │  │  └─────────────────────┘│││
│  │  └─────────────────────────┘││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

---

### Performance Tab
**Purpose**: Analyze scroll performance and identify bottlenecks

#### Recording Scroll Performance
1. Click **"Record"** (⏺️ button)
2. Scroll naturally in the application
3. Click **"Stop"** (⏹️ button)
4. Analyze the results

#### Key Metrics to Monitor
- **FPS (Frames Per Second)**: Target ≥30fps
- **CPU Usage**: Should remain <80% during scroll
- **Paint Time**: <16ms per frame for 60fps
- **Layout Shift**: Should be minimal during scroll

#### Performance Flame Graph Interpretation
```
┌─────────────────────────────────────┐
│    Script (JavaScript execution)    │ ← Look for long blocks
├─────────────────────────────────────┤
│          Render (Painting)          │ ← Should be minimal
├─────────────────────────────────────┤
│            Layout (Reflow)          │ ← Avoid during scroll
├─────────────────────────────────────┤
│          Composite (Layers)         │ ← GPU acceleration
└─────────────────────────────────────┘
```

#### Optimization Recommendations
```
✅ GOOD: Transform & Opacity changes (GPU accelerated)
⚠️ OKAY: Background & Color changes (CPU, but fast)
❌ AVOID: Width/Height changes during scroll (layout thrashing)
```

---

### Memory Tab
**Purpose**: Detect memory leaks during scroll operations

#### Heap Snapshot Analysis
1. Take snapshot before scroll testing
2. Perform intensive scroll operations
3. Take another snapshot
4. Compare snapshots for memory growth

#### Memory Leak Detection
```javascript
// Monitor memory during scroll
let memoryInterval = setInterval(() => {
  if (performance.memory) {
    console.log('Memory:', {
      used: `${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      total: `${(performance.memory.totalJSHeapSize / 1048576).toFixed(2)} MB`
    });
  }
}, 1000);

// Stop monitoring
// clearInterval(memoryInterval);
```

#### Memory Usage Patterns
```
📈 GROWING: Potential memory leak (investigate)
📉 STABLE: Normal behavior (good)
⚡ SPIKES: Normal during heavy scroll (monitor)
```

---

### Network Tab
**Purpose**: Verify CSS and resource loading

#### Check CSS Loading
1. Filter by `CSS` file type
2. Look for `globals.css` in the list
3. Verify **Status**: `200 OK`
4. Check **Size**: Should be reasonable (<100KB)
5. Verify **Time**: Should load quickly (<500ms)

#### Common Network Issues
```
❌ 404 Not Found: CSS file missing
❌ 304 Not Modified: Cache issues (hard refresh)
❌ Slow Loading: Network or server issues
```

---

### Application Tab
**Purpose**: Check application state and storage

#### LocalStorage Check
```javascript
// Check for scroll-related data
console.log('LocalStorage keys:', Object.keys(localStorage));
localStorage.forEach((value, key) => {
  if (key.includes('scroll')) {
    console.log(`${key}:`, value);
  }
});
```

#### Service Worker Check
- Verify service worker isn't interfering with CSS loading
- Check for cached outdated CSS files

---

## 🎯 Step-by-Step Debugging Workflow

### Step 1: Initial Diagnosis (2 minutes)
```javascript
// Quick health check
const health = {
  bodyOverflow: window.getComputedStyle(document.body).overflowY,
  needsScroll: document.documentElement.scrollHeight > window.innerHeight,
  scrollerFound: !!document.querySelector('[data-slot="scroller"]'),
  canScroll: false // Will be tested below
};

// Test scroll functionality
const originalScroll = window.pageYOffset;
window.scrollBy(0, 10);
health.canScroll = window.pageYOffset !== originalScroll;
window.scrollTo(0, originalScroll);

console.log('Health Check:', health);
```

### Step 2: Visual Inspection (3 minutes)
1. **Elements Tab**: Inspect body element styles
2. **Search**: `[data-slot="scroller"]`
3. **Verify**: Layout hierarchy and CSS classes
4. **Check**: Height constraints and overflow settings

### Step 3: Performance Analysis (5 minutes)
1. **Performance Tab**: Record scroll session
2. **Monitor**: FPS and CPU usage
3. **Identify**: Performance bottlenecks
4. **Document**: Issues found

### Step 4: Advanced Debugging (10 minutes)
```javascript
// Run comprehensive analysis
ScrollDebugger.run();

// Or individual tests
ScrollDebugger.testScrollFPS();
ScrollDebugger.testScrollResponse();
ScrollDebugger.analyzeMemoryUsage();
```

---

## 🔧 Common Debugging Scenarios

### Scenario 1: Scroll Completely Disabled
**Symptoms**: No scroll, wheel doesn't work, keyboard doesn't work

**Debugging Steps**:
1. Console: `window.getComputedStyle(document.body).overflow`
2. Elements: Check body CSS for `overflow: hidden`
3. Fix: Change to `overflow-x: hidden` in `globals.css:211`

**Expected Console Output**:
```javascript
// ❌ Problem
Body Overflow: "hidden"

// ✅ After fix
Body Overflow: "visible"
Body Overflow X: "hidden"
```

### Scenario 2: Choppy Scroll Performance
**Symptoms**: Jerky scrolling, low FPS, laggy response

**Debugging Steps**:
1. Performance Tab: Record scroll session
2. Look for: Long JavaScript blocks
3. Check for: Excessive layout recalculations
4. Identify: Heavy DOM manipulations

**Performance Analysis**:
```
FPS: 15-20fps (Target: 30+fps)
CPU: 90% (Target: <80%)
Paint time: 25ms (Target: <16ms)
```

### Scenario 3: Scroller Component Not Working
**Symptoms**: Custom scroll shadows missing, scroll indicators broken

**Debugging Steps**:
1. Elements: Search `[data-slot="scroller"]`
2. Check: `h-full` class present
3. Verify: Parent has `min-h-0`
4. Test: Scroll container isolation

**Required Classes**:
```html
<main class="flex-1 min-h-0">
  <Scroller className="h-full">
```

### Scenario 4: Mobile Touch Issues
**Symptoms**: Touch scrolling doesn't work, momentum scrolling missing

**Debugging Steps**:
1. Console: `'ontouchstart' in window`
2. Elements: Check for `-webkit-overflow-scrolling`
3. Verify: `overscroll-behavior` settings
4. Test: Device simulation in DevTools

**Required CSS**:
```css
.scroller {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
```

---

## 📊 Performance Benchmarking

### Good Performance Indicators
```
✅ FPS: 30-60fps (smooth scrolling)
✅ Response Time: <100ms
✅ Memory: Stable, no leaks
✅ CPU: <80% during scroll
✅ Paint: <16ms per frame
```

### Performance Issues Indicators
```
❌ FPS: <30fps (choppy scrolling)
❌ Response Time: >200ms (laggy)
❌ Memory: Growing continuously
❌ CPU: >90% (overloaded)
❌ Paint: >30ms (slow rendering)
```

### Performance Optimization Checklist
- [ ] Use `transform: translateZ(0)` for hardware acceleration
- [ ] Avoid layout thrashing (don't modify width/height during scroll)
- [ ] Optimize images (lazy loading offscreen)
- [ ] Reduce DOM complexity in scroll containers
- [ ] Use `will-change: scroll-position` wisely
- [ ] Implement scroll event throttling/debouncing

---

## 🧪 Testing Scripts Collection

### Basic Scroll Test
```javascript
function quickScrollTest() {
  const test = {
    bodyOverflowOK: window.getComputedStyle(document.body).overflowY !== 'hidden',
    contentExists: document.documentElement.scrollHeight > window.innerHeight,
    scrollWorks: false,
    scrollerFound: !!document.querySelector('[data-slot="scroller"]')
  };

  const originalScroll = window.pageYOffset;
  window.scrollBy(0, 5);
  test.scrollWorks = window.pageYOffset !== originalScroll;
  window.scrollTo(0, originalScroll);

  const passed = Object.values(test).every(Boolean);
  console.log(`Quick Test: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.table(test);
}

quickScrollTest();
```

### FPS Monitor
```javascript
function fpsMonitor(duration = 5000) {
  let frames = 0;
  let lastTime = performance.now();
  let fpsArray = [];

  function countFPS() {
    frames++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;

    if (deltaTime >= 1000) {
      const fps = Math.round((frames * 1000) / deltaTime);
      fpsArray.push(fps);
      frames = 0;
      lastTime = currentTime;
    }

    if (performance.now() - startTime < duration) {
      requestAnimationFrame(countFPS);
    } else {
      console.log('FPS Results:', {
        average: Math.round(fpsArray.reduce((a, b) => a + b) / fpsArray.length),
        min: Math.min(...fpsArray),
        max: Math.max(...fpsArray),
        samples: fpsArray.length
      });
    }
  }

  const startTime = performance.now();
  requestAnimationFrame(countFPS);
}

fpsMonitor();
```

### Memory Tracker
```javascript
function memoryTracker(duration = 10000) {
  if (!performance.memory) {
    console.log('Memory API not available');
    return;
  }

  const measurements = [];
  const interval = setInterval(() => {
    measurements.push({
      time: Date.now(),
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize
    });
  }, 1000);

  setTimeout(() => {
    clearInterval(interval);
    const increase = measurements[measurements.length - 1].used - measurements[0].used;
    console.log('Memory Tracker Results:', {
      initialMB: (measurements[0].used / 1048576).toFixed(2),
      finalMB: (measurements[measurements.length - 1].used / 1048576).toFixed(2),
      increaseMB: (increase / 1048576).toFixed(2),
      healthy: increase < 1048576 * 5 // <5MB increase
    });
  }, duration);
}

memoryTracker();
```

---

## 📱 Device-Specific Debugging

### Mobile Device Simulation
1. **Device Toolbar**: Toggle with Ctrl+Shift+M (or Cmd+Shift+M)
2. **Select Device**: iPhone, iPad, Android devices
3. **Test Touch**: Enable touch simulation
4. **Network**: Throttle to 3G/4G speeds

### Responsive Testing Checklist
- [ ] **Mobile (375px+)**: Touch scrolling works, performance acceptable
- [ ] **Tablet (768px+)**: Hybrid touch/mouse, layout correct
- [ ] **Desktop (1024px+)**: Mouse scrolling, optimal performance

### Touch Event Debugging
```javascript
// Touch event monitoring
document.addEventListener('touchstart', e => console.log('Touch start:', e.touches.length));
document.addEventListener('touchmove', e => console.log('Touch move:', e.touches.length));
document.addEventListener('touchend', e => console.log('Touch end:', e.touches.length));
```

---

## 🚨 Advanced Issues & Solutions

### Issue: Scroll Jank in Complex Layouts
**Root Cause**: Layout recalculations during scroll
**Solution**: CSS containment and hardware acceleration

```css
.scroll-container {
  contain: layout style paint;
  transform: translateZ(0);
  will-change: scroll-position;
}
```

### Issue: Memory Leaks During Scroll
**Root Cause**: Event listeners not properly cleaned up
**Solution**: Proper cleanup and debouncing

```javascript
// Good practice
class ScrollManager {
  constructor() {
    this.boundHandler = this.handleScroll.bind(this);
    this.element.addEventListener('scroll', this.boundHandler, { passive: true });
  }

  destroy() {
    this.element.removeEventListener('scroll', this.boundHandler);
  }
}
```

### Issue: Cross-Browser Inconsistencies
**Root Cause**: Different browser scroll behaviors
**Solution**: Feature detection and polyfills

```javascript
// Feature detection
const supportsSmoothScroll = 'scrollBehavior' in document.documentElement.style;
const supportsPassiveEvents = 'PassiveEventHandler' in window;

// Polyfill if needed
if (!supportsSmoothScroll) {
  // Load smooth scroll polyfill
}
```

---

## 📞 Getting Additional Help

### When to Escalate
- Performance issues persist after optimization
- Cross-browser compatibility problems
- Complex layout interactions
- Memory leaks can't be resolved

### Information to Collect
1. **Browser/Version**: Chrome/Edge/Firefox version
2. **Device**: Mobile/tablet/desktop specifications
3. **Console Output**: All errors and warnings
4. **Performance Metrics**: FPS, memory usage, CPU
5. **Test Results**: Output from debugging scripts
6. **Expected Behavior**: What should happen vs what actually happens

### Debugging Session Template
```
=== DEBUGGING SESSION ===
Date: [current date]
Browser: [browser/version]
Device: [device type]
Issue: [clear description]

Steps Taken:
1. [action taken]
2. [action taken]
3. [action taken]

Results:
- Console output: [paste relevant output]
- Performance metrics: [paste metrics]
- Test results: [paste test results]

Next Steps:
[what to try next]
```

---

**Last Updated**: 2025-11-20
**Version**: 1.0
**Compatible with**: Chrome DevTools latest, Electron 32, React 19, Tailwind CSS v4

*This guide should be updated as new debugging techniques and tools become available.*