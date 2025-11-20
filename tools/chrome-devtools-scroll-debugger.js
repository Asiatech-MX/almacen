/**
 * Chrome DevTools Scroll Debugger
 * Comprehensive debugging tool for scroll functionality
 *
 * Usage:
 * 1. Open Chrome DevTools (F12)
 * 2. Go to Console tab
 * 3. Copy-paste this entire script
 * 4. Run `ScrollDebugger.run()` to start debugging
 *
 * Version: 1.0
 * Compatible with: Electron 32, React 19, Tailwind CSS v4
 */

class ScrollDebugger {
  constructor() {
    this.version = '1.0';
    this.results = {};
    this.startTime = performance.now();
  }

  /**
   * Main entry point - runs all debugging checks
   */
  static run() {
    const debugger = new ScrollDebugger();
    debugger.execute();
  }

  /**
   * Execute all debugging checks
   */
  async execute() {
    console.group('🔍 Chrome DevTools Scroll Debugger v' + this.version);
    console.log('Started at:', new Date().toISOString());

    try {
      // Phase 1: Basic checks
      await this.basicChecks();

      // Phase 2: Component analysis
      await this.componentAnalysis();

      // Phase 3: Performance testing
      await this.performanceAnalysis();

      // Phase 4: Memory analysis
      await this.memoryAnalysis();

      // Phase 5: Accessibility testing
      await this.accessibilityTesting();

      // Phase 6: Responsive testing
      await this.responsiveTesting();

      // Generate final report
      this.generateReport();

    } catch (error) {
      console.error('❌ Debugging error:', error);
    }

    console.groupEnd();
  }

  /**
   * Basic scroll functionality checks
   */
  async basicChecks() {
    console.group('📋 Basic Functionality Checks');

    const tests = [
      {
        name: 'Body Overflow Configuration',
        test: this.checkBodyOverflow.bind(this)
      },
      {
        name: 'Document Height Analysis',
        test: this.checkDocumentHeight.bind(this)
      },
      {
        name: 'Scroll Functionality Test',
        test: this.testScrollFunction.bind(this)
      },
      {
        name: 'CSS Overflow Properties',
        test: this.checkOverflowProperties.bind(this)
      }
    ];

    for (const test of tests) {
      try {
        await test.test();
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error);
        this.results[test.name] = { status: 'ERROR', error: error.message };
      }
    }

    console.groupEnd();
  }

  /**
   * Check body overflow settings
   */
  checkBodyOverflow() {
    const bodyStyle = window.getComputedStyle(document.body);
    const documentStyle = window.getComputedStyle(document.documentElement);

    const result = {
      body: {
        overflow: bodyStyle.overflow,
        overflowX: bodyStyle.overflowX,
        overflowY: bodyStyle.overflowY
      },
      documentElement: {
        overflow: documentStyle.overflow,
        overflowX: documentStyle.overflowX,
        overflowY: documentStyle.overflowY
      },
      issues: []
    };

    // Check for problematic overflow settings
    if (bodyStyle.overflow === 'hidden' || bodyStyle.overflowY === 'hidden') {
      result.issues.push({
        severity: 'CRITICAL',
        issue: 'Body has overflow:hidden, vertical scrolling will not work',
        solution: 'Change to overflow-x: hidden in globals.css'
      });
    }

    if (documentStyle.overflow === 'hidden' || documentStyle.overflowY === 'hidden') {
      result.issues.push({
        severity: 'HIGH',
        issue: 'Document element has overflow:hidden',
        solution: 'Remove overflow:hidden from document element'
      });
    }

    const status = result.issues.length === 0 ? '✅ PASS' : '❌ FAIL';
    console.log(`Body Overflow: ${status}`);
    console.table(result);

    this.results['Body Overflow Configuration'] = { status, result };
  }

  /**
   * Check document height and viewport
   */
  checkDocumentHeight() {
    const result = {
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      needsVerticalScroll: document.documentElement.scrollHeight > window.innerHeight,
      needsHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
      scrollableHeight: document.documentElement.scrollHeight - window.innerHeight,
      scrollableWidth: document.documentElement.scrollWidth - window.innerWidth
    };

    const status = result.needsVerticalScroll ? '✅ PASS' : '⚠️ WARN';
    console.log(`Document Height: ${status}`);
    console.log('Content needs vertical scroll:', result.needsVerticalScroll);
    console.table(result);

    this.results['Document Height Analysis'] = { status, result };
  }

  /**
   * Test actual scroll functionality
   */
  testScrollFunction() {
    const originalScroll = {
      x: window.pageXOffset,
      y: window.pageYOffset
    };

    let scrollWorked = false;
    let scrollBackWorked = false;

    try {
      // Test scroll down
      window.scrollBy(0, 10);
      scrollWorked = window.pageYOffset > originalScroll.y;

      // Test scroll back up
      window.scrollBy(0, -10);
      scrollBackWorked = window.pageYOffset === originalScroll.y;

      // Restore original position
      window.scrollTo(originalScroll.x, originalScroll.y);

    } catch (error) {
      console.error('Scroll test error:', error);
    }

    const result = {
      scrollDown: scrollWorked,
      scrollUp: scrollBackWorked,
      originalPosition: originalScroll,
      currentPosition: {
        x: window.pageXOffset,
        y: window.pageYOffset
      },
      positionRestored: window.pageYOffset === originalScroll.y
    };

    const status = (scrollWorked && scrollBackWorked) ? '✅ PASS' : '❌ FAIL';
    console.log(`Scroll Functionality: ${status}`);
    console.table(result);

    this.results['Scroll Functionality Test'] = { status, result };
  }

  /**
   * Check CSS overflow properties
   */
  checkOverflowProperties() {
    const elements = [
      { selector: 'body', name: 'Body' },
      { selector: 'html', name: 'HTML' },
      { selector: '[data-slot="scroller"]', name: 'Scroller Component' },
      { selector: '.SidebarInset', name: 'Sidebar Inset' },
      { selector: 'main', name: 'Main Element' }
    ];

    const result = {};

    elements.forEach(({ selector, name }) => {
      const element = document.querySelector(selector);
      if (element) {
        const style = window.getComputedStyle(element);
        result[name] = {
          selector,
          exists: true,
          overflow: style.overflow,
          overflowX: style.overflowX,
          overflowY: style.overflowY,
          height: style.height,
          maxHeight: style.maxHeight,
          display: style.display
        };
      } else {
        result[name] = {
          selector,
          exists: false
        };
      }
    });

    console.log('CSS Overflow Properties:');
    console.table(result);

    const scrollerFound = result['Scroller Component']?.exists;
    const status = scrollerFound ? '✅ PASS' : '⚠️ WARN';

    this.results['CSS Overflow Properties'] = { status, result };
  }

  /**
   * Analyze scroll-related components
   */
  async componentAnalysis() {
    console.group('🔧 Component Analysis');

    const components = [
      {
        name: 'Scroller Component',
        test: this.analyzeScrollerComponent.bind(this)
      },
      {
        name: 'Layout Structure',
        test: this.analyzeLayoutStructure.bind(this)
      },
      {
        name: 'Height Constraints',
        test: this.analyzeHeightConstraints.bind(this)
      }
    ];

    for (const component of components) {
      try {
        await component.test();
      } catch (error) {
        console.error(`❌ ${component.name} analysis failed:`, error);
        this.results[component.name] = { status: 'ERROR', error: error.message };
      }
    }

    console.groupEnd();
  }

  /**
   * Analyze Scroller component
   */
  analyzeScrollerComponent() {
    const scroller = document.querySelector('[data-slot="scroller"]');

    if (!scroller) {
      console.log('❌ Scroller component not found');
      this.results['Scroller Component'] = { status: 'FAIL', result: { found: false } };
      return;
    }

    const result = {
      found: true,
      tagName: scroller.tagName,
      classes: scroller.className,
      attributes: Array.from(scroller.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      })),
      computedStyle: {
        overflowY: window.getComputedStyle(scroller).overflowY,
        overflowX: window.getComputedStyle(scroller).overflowX,
        height: window.getComputedStyle(scroller).height,
        display: window.getComputedStyle(scroller).display,
        position: window.getComputedStyle(scroller).position
      },
      parent: {
        tagName: scroller.parentElement?.tagName,
        classes: scroller.parentElement?.className,
        computedStyle: scroller.parentElement ? {
          display: window.getComputedStyle(scroller.parentElement).display,
          height: window.getComputedStyle(scroller.parentElement).height,
          minHeight: window.getComputedStyle(scroller.parentElement).minHeight
        } : null
      }
    };

    // Check for proper height constraints
    const hasHeightClass = scroller.classList.contains('h-full');
    const parentHasMinHeightZero = scroller.parentElement?.classList.contains('min-h-0');

    result.issues = [];
    if (!hasHeightClass) {
      result.issues.push({
        severity: 'HIGH',
        issue: 'Scroller missing h-full class',
        solution: 'Add className="h-full" to Scroller component'
      });
    }

    if (!parentHasMinHeightZero) {
      result.issues.push({
        severity: 'MEDIUM',
        issue: 'Parent container missing min-h-0 class',
        solution: 'Add min-h-0 to main element'
      });
    }

    const status = result.issues.length === 0 ? '✅ PASS' : '⚠️ WARN';
    console.log(`Scroller Component: ${status}`);
    console.table(result);

    this.results['Scroller Component'] = { status, result };
  }

  /**
   * Analyze layout structure
   */
  analyzeLayoutStructure() {
    const structure = {
      body: this.getElementInfo('body'),
      sidebarInset: this.getElementInfo('.SidebarInset'),
      header: this.getElementInfo('header'),
      main: this.getElementInfo('main'),
      scroller: this.getElementInfo('[data-slot="scroller"]'),
      content: this.getElementInfo('[data-slot="scroller"] > div')
    };

    // Check hierarchy
    const hierarchy = [];
    let current = document.querySelector('[data-slot="scroller"]');
    while (current && current !== document.body) {
      hierarchy.push({
        tagName: current.tagName,
        className: current.className,
        id: current.id
      });
      current = current.parentElement;
    }

    const result = {
      structure,
      hierarchy: hierarchy.reverse(),
      depth: hierarchy.length
    };

    console.log('Layout Structure:');
    console.log('Element Hierarchy:', hierarchy);
    console.table(result);

    const hasProperStructure = hierarchy.length >= 3; // At least body -> sidebarInset -> main -> scroller
    const status = hasProperStructure ? '✅ PASS' : '❌ FAIL';

    this.results['Layout Structure'] = { status, result };
  }

  /**
   * Analyze height constraints
   */
  analyzeHeightConstraints() {
    const elements = [
      '.SidebarInset',
      'main',
      '[data-slot="scroller"]'
    ];

    const result = {};
    let issues = [];

    elements.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        result[selector] = {
          classes: element.className,
          computedHeight: style.height,
          computedMinHeight: style.minHeight,
          actualHeight: rect.height,
          parentHeight: element.parentElement ? element.parentElement.getBoundingClientRect().height : 'N/A',
          flex: style.flex,
          flexGrow: style.flexGrow,
          flexShrink: style.flexShrink
        };

        // Check for height constraint issues
        if (selector === 'main' && !element.classList.contains('min-h-0')) {
          issues.push({
            element: selector,
            issue: 'Missing min-h-0 on main element',
            solution: 'Add min-h-0 class to allow flex shrinking'
          });
        }

        if (selector === '[data-slot="scroller"]' && !element.classList.contains('h-full')) {
          issues.push({
            element: selector,
            issue: 'Missing h-full on Scroller component',
            solution: 'Add h-full class to occupy full container height'
          });
        }
      } else {
        result[selector] = { exists: false };
      }
    });

    console.log('Height Constraints Analysis:');
    console.table(result);

    if (issues.length > 0) {
      console.warn('Height constraint issues:');
      console.table(issues);
    }

    const status = issues.length === 0 ? '✅ PASS' : '⚠️ WARN';
    this.results['Height Constraints'] = { status, result: { ...result, issues } };
  }

  /**
   * Performance analysis
   */
  async performanceAnalysis() {
    console.group('⚡ Performance Analysis');

    const tests = [
      {
        name: 'Scroll FPS Test',
        test: this.testScrollFPS.bind(this)
      },
      {
        name: 'Scroll Response Time',
        test: this.testScrollResponse.bind(this)
      },
      {
        name: 'Rendering Performance',
        test: this.testRenderingPerformance.bind(this)
      }
    ];

    for (const test of tests) {
      try {
        await test.test();
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error);
        this.results[test.name] = { status: 'ERROR', error: error.message };
      }
    }

    console.groupEnd();
  }

  /**
   * Test scroll FPS
   */
  async testScrollFPS() {
    return new Promise((resolve) => {
      let frameCount = 0;
      let lastTime = performance.now();
      let fpsArray = [];

      const scrollContainer = document.querySelector('[data-slot="scroller"]') || window;
      const originalScroll = scrollContainer.scrollTop || window.pageYOffset;

      function measureFPS() {
        frameCount++;
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTime;

        if (deltaTime >= 100) {
          const fps = Math.round((frameCount * 1000) / deltaTime);
          fpsArray.push(fps);
          frameCount = 0;
          lastTime = currentTime;
        }

        if (fpsArray.length < 10) {
          requestAnimationFrame(measureFPS);
        } else {
          // Restore scroll position
          scrollContainer.scrollTo(0, originalScroll);

          const avgFPS = Math.round(fpsArray.reduce((a, b) => a + b) / fpsArray.length);
          const minFPS = Math.min(...fpsArray);
          const maxFPS = Math.max(...fpsArray);

          const result = {
            average: avgFPS,
            min: minFPS,
            max: maxFPS,
            allFrames: fpsArray,
            stable: fpsArray.every(fps => fps >= 30)
          };

          const status = result.stable ? '✅ PASS' : avgFPS >= 20 ? '⚠️ FAIR' : '❌ POOR';
          console.log(`Scroll FPS Test: ${status}`);
          console.table(result);

          this.results['Scroll FPS Test'] = { status, result };
          resolve();
        }
      }

      // Start scroll animation
      let scrollDirection = 1;
      let scrollAmount = 0;

      function animate() {
        if (scrollAmount < 50) {
          scrollContainer.scrollBy(0, scrollDirection * 2);
          scrollAmount += 2;
          requestAnimationFrame(animate);
        } else if (scrollAmount < 100) {
          scrollContainer.scrollBy(0, -scrollDirection * 2);
          scrollAmount += 2;
          requestAnimationFrame(animate);
        }
      }

      animate();
      measureFPS();
    });
  }

  /**
   * Test scroll response time
   */
  async testScrollResponse() {
    const scrollContainer = document.querySelector('[data-slot="scroller"]') || window;
    const originalScroll = scrollContainer.scrollTop || window.pageYOffset;

    const times = [];

    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      scrollContainer.scrollBy(0, 5);
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    // Scroll back
    for (let i = 0; i < 10; i++) {
      scrollContainer.scrollBy(0, -5);
    }

    scrollContainer.scrollTo(0, originalScroll);

    const result = {
      measurements: times,
      average: times.reduce((a, b) => a + b) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      total: times.reduce((a, b) => a + b)
    };

    const status = result.average < 2 ? '✅ EXCELLENT' : result.average < 5 ? '✅ GOOD' : '⚠️ NEEDS_OPTIMIZATION';
    console.log(`Scroll Response Time: ${status}`);
    console.table(result);

    this.results['Scroll Response Time'] = { status, result };
  }

  /**
   * Test rendering performance
   */
  async testRenderingPerformance() {
    const startTime = performance.now();

    // Force some rendering by scrolling
    const scrollContainer = document.querySelector('[data-slot="scroller"]') || window;
    const originalScroll = scrollContainer.scrollTop || window.pageYOffset;

    for (let i = 0; i < 20; i++) {
      scrollContainer.scrollBy(0, 1);
      await new Promise(resolve => requestAnimationFrame(resolve));
    }

    for (let i = 0; i < 20; i++) {
      scrollContainer.scrollBy(0, -1);
      await new Promise(resolve => requestAnimationFrame(resolve));
    }

    const totalTime = performance.now() - startTime;
    scrollContainer.scrollTo(0, originalScroll);

    const result = {
      totalTime: totalTime,
      averagePerFrame: totalTime / 40,
      estimatedFPS: Math.round(40000 / totalTime)
    };

    const status = result.estimatedFPS >= 30 ? '✅ PASS' : '❌ FAIL';
    console.log(`Rendering Performance: ${status}`);
    console.table(result);

    this.results['Rendering Performance'] = { status, result };
  }

  /**
   * Memory analysis
   */
  async memoryAnalysis() {
    console.group('🧠 Memory Analysis');

    if (!performance.memory) {
      console.log('⚠️ Memory API not available in this browser');
      console.groupEnd();
      this.results['Memory Analysis'] = { status: 'SKIP', result: 'Memory API not available' };
      return;
    }

    const initialMemory = performance.memory.usedJSHeapSize;

    // Perform scroll operations
    const scrollContainer = document.querySelector('[data-slot="scroller"]') || window;

    for (let cycle = 0; cycle < 5; cycle++) {
      for (let i = 0; i < 20; i++) {
        scrollContainer.scrollBy(0, 2);
      }
      for (let i = 0; i < 20; i++) {
        scrollContainer.scrollBy(0, -2);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Wait for garbage collection opportunity
    await new Promise(resolve => setTimeout(resolve, 1000));

    const finalMemory = performance.memory.usedJSHeapSize;
    const memoryIncrease = finalMemory - initialMemory;
    const percentIncrease = (memoryIncrease / initialMemory) * 100;

    const result = {
      initial: {
        bytes: initialMemory,
        mb: (initialMemory / 1048576).toFixed(2)
      },
      final: {
        bytes: finalMemory,
        mb: (finalMemory / 1048576).toFixed(2)
      },
      increase: {
        bytes: memoryIncrease,
        mb: (memoryIncrease / 1048576).toFixed(2),
        percent: percentIncrease.toFixed(2)
      },
      memoryPressure: percentIncrease > 10 ? 'HIGH' : percentIncrease > 5 ? 'MEDIUM' : 'LOW'
    };

    const status = percentIncrease < 5 ? '✅ PASS' : percentIncrease < 10 ? '⚠️ WARN' : '❌ FAIL';
    console.log(`Memory Analysis: ${status}`);
    console.table(result);

    this.results['Memory Analysis'] = { status, result };
    console.groupEnd();
  }

  /**
   * Accessibility testing
   */
  async accessibilityTesting() {
    console.group('♿ Accessibility Testing');

    const tests = [
      {
        name: 'Keyboard Navigation',
        test: this.testKeyboardNavigation.bind(this)
      },
      {
        name: 'ARIA Labels',
        test: this.testARIALabels.bind(this)
      },
      {
        name: 'Focus Management',
        test: this.testFocusManagement.bind(this)
      }
    ];

    for (const test of tests) {
      try {
        await test.test();
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error);
        this.results[test.name] = { status: 'ERROR', error: error.message };
      }
    }

    console.groupEnd();
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation() {
    return new Promise((resolve) => {
      let keydownDetected = false;
      let scrollWorked = false;

      const handleKeydown = (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'PageDown' || e.key === 'PageUp') {
          keydownDetected = true;
          const originalScroll = window.pageYOffset;
          setTimeout(() => {
            scrollWorked = window.pageYOffset !== originalScroll;
            document.removeEventListener('keydown', handleKeydown);
          }, 100);
        }
      };

      document.addEventListener('keydown', handleKeydown);

      // Simulate keyboard scroll
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(event);

      setTimeout(() => {
        const result = {
          keyboardSupported: keydownDetected,
          scrollWithKeyboard: scrollWorked,
          score: (keydownDetected ? 50 : 0) + (scrollWorked ? 50 : 0)
        };

        const status = result.score >= 75 ? '✅ PASS' : result.score >= 50 ? '⚠️ PARTIAL' : '❌ FAIL';
        console.log(`Keyboard Navigation: ${status}`);
        console.table(result);

        this.results['Keyboard Navigation'] = { status, result };
        resolve();
      }, 200);
    });
  }

  /**
   * Test ARIA labels
   */
  testARIALabels() {
    const scroller = document.querySelector('[data-slot="scroller"]');

    const result = {
      scrollerExists: !!scroller,
      scrollerHasAriaLabel: scroller ? scroller.getAttribute('aria-label') !== null : false,
      scrollerHasAriaLabelledBy: scroller ? scroller.getAttribute('aria-labelledby') !== null : false,
      scrollRegions: document.querySelectorAll('[role="region"]').length,
      landmarkElements: document.querySelectorAll('main, header, nav, aside, section').length
    };

    const score = (result.scrollerHasAriaLabel || result.scrollerHasAriaLabelledBy ? 40 : 0) +
                  (result.scrollRegions > 0 ? 30 : 0) +
                  (result.landmarkElements > 0 ? 30 : 0);

    const status = score >= 70 ? '✅ PASS' : score >= 40 ? '⚠️ PARTIAL' : '❌ FAIL';
    console.log(`ARIA Labels: ${status}`);
    console.table(result);

    this.results['ARIA Labels'] = { status, result, score };
  }

  /**
   * Test focus management
   */
  testFocusManagement() {
    const focusableElements = document.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );

    const scroller = document.querySelector('[data-slot="scroller"]');
    const focusableInScroller = scroller ?
      scroller.querySelectorAll('a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select') : [];

    const result = {
      totalFocusableElements: focusableElements.length,
      focusableInScroller: focusableInScroller.length,
      scrollerContainsFocusableElements: focusableInScroller.length > 0,
      tabindexElements: document.querySelectorAll('[tabindex]').length,
      negativeTabindexElements: document.querySelectorAll('[tabindex="-1"]').length
    };

    const score = Math.min(100, (result.focusableInScroller / Math.max(1, result.totalFocusableElements)) * 100);
    const status = score >= 80 ? '✅ PASS' : score >= 50 ? '⚠️ PARTIAL' : '❌ FAIL';
    console.log(`Focus Management: ${status}`);
    console.table(result);

    this.results['Focus Management'] = { status, result, score };
  }

  /**
   * Responsive testing
   */
  async responsiveTesting() {
    console.group('📱 Responsive Testing');

    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;

    const viewports = [
      { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
      { width: 768, height: 1024, name: 'Tablet (iPad)' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    const results = {};

    for (const viewport of viewports) {
      try {
        // Note: This won't actually resize the window, but will test logic
        const result = await this.testViewport(viewport.width, viewport.height, viewport.name);
        results[viewport.name] = result;
      } catch (error) {
        console.error(`❌ ${viewport.name} test failed:`, error);
        results[viewport.name] = { status: 'ERROR', error: error.message };
      }
    }

    // Test current viewport
    results['Current'] = await this.testViewport(currentWidth, currentHeight, 'Current Viewport');

    console.log('Responsive Test Results:');
    console.table(results);

    const allPassed = Object.values(results).every(r => r.status === '✅ PASS');
    const status = allPassed ? '✅ PASS' : '⚠️ MIXED';

    this.results['Responsive Testing'] = { status, result: results };
    console.groupEnd();
  }

  /**
   * Test specific viewport
   */
  async testViewport(width, height, name) {
    const result = {
      width,
      height,
      name,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      scrollAvailable: document.documentElement.scrollHeight > height,
      scrollerHeight: this.getScrollerHeight(),
      issues: []
    };

    // Device-specific checks
    if (result.isMobile && !result.scrollAvailable) {
      result.issues.push({
        severity: 'HIGH',
        issue: 'No scroll available on mobile viewport',
        solution: 'Ensure content height exceeds viewport height on mobile'
      });
    }

    if (result.isDesktop && result.scrollerHeight < height * 0.8) {
      result.issues.push({
        severity: 'MEDIUM',
        issue: 'Scroller not utilizing available height on desktop',
        solution: 'Check height constraints and h-full classes'
      });
    }

    const status = result.issues.length === 0 ? '✅ PASS' : '⚠️ WARN';
    result.status = status;

    return result;
  }

  /**
   * Get scroller height information
   */
  getScrollerHeight() {
    const scroller = document.querySelector('[data-slot="scroller"]');
    if (!scroller) return 0;

    const rect = scroller.getBoundingClientRect();
    return rect.height;
  }

  /**
   * Get element information
   */
  getElementInfo(selector) {
    const element = document.querySelector(selector);
    if (!element) return null;

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return {
      exists: true,
      tagName: element.tagName,
      className: element.className,
      id: element.id,
      computedStyle: {
        display: style.display,
        position: style.position,
        height: style.height,
        minHeight: style.minHeight,
        overflow: style.overflow,
        overflowY: style.overflowY,
        flex: style.flex
      },
      dimensions: {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      }
    };
  }

  /**
   * Generate final report
   */
  generateReport() {
    console.group('📊 Final Report');

    const totalTests = Object.keys(this.results).length;
    const passedTests = Object.values(this.results).filter(r => r.status && r.status.includes('PASS')).length;
    const failedTests = Object.values(this.results).filter(r => r.status && r.status.includes('FAIL')).length;
    const warningTests = Object.values(this.results).filter(r => r.status && r.status.includes('WARN')).length;

    const summary = {
      totalTests,
      passed: passedTests,
      failed: failedTests,
      warnings: warningTests,
      skipped: Object.values(this.results).filter(r => r.status === 'SKIP').length,
      executionTime: `${(performance.now() - this.startTime).toFixed(2)}ms`,
      overallScore: Math.round((passedTests / totalTests) * 100)
    };

    console.log('🎯 Test Summary:');
    console.table(summary);

    console.log('\n📋 Detailed Results:');
    Object.entries(this.results).forEach(([testName, result]) => {
      console.log(`${result.status} ${testName}`);
    });

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (failedTests > 0) {
      console.log('- ❌ Fix critical issues before deployment');
    }
    if (warningTests > 0) {
      console.log('- ⚠️ Address warnings for optimal performance');
    }
    if (passedTests === totalTests) {
      console.log('✅ All tests passed! Ready for production.');
    }

    // Critical issues summary
    const criticalIssues = [];
    Object.entries(this.results).forEach(([testName, result]) => {
      if (result.result && result.result.issues) {
        result.result.issues.forEach(issue => {
          if (issue.severity === 'CRITICAL' || issue.severity === 'HIGH') {
            criticalIssues.push({ test: testName, ...issue });
          }
        });
      }
    });

    if (criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      console.table(criticalIssues);
    }

    console.groupEnd();

    // Return for programmatic use
    return {
      summary,
      results: this.results,
      criticalIssues
    };
  }
}

// Auto-expose for easy access
window.ScrollDebugger = ScrollDebugger;

// Auto-run if loaded directly
if (typeof module === 'undefined') {
  console.log('🔍 Scroll Debugger loaded. Run ScrollDebugger.run() to start debugging.');
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollDebugger;
}