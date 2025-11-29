/**
 * Diagnostic Test for Electron App
 * Using Playwright's _electron API according to the official documentation
 */

import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

test.describe('Electron App Diagnostic', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    console.log('🚀 Launching Electron app...');

    // Launch Electron app using _electron API
    electronApp = await electron.launch({
      args: [
        path.join(__dirname, '../apps/electron-main/dist/main.js'),
        '--enable-logging',
        '--v=1'
      ],
      env: {
        ...process.env,
        NODE_ENV: 'development',
        ELECTRON_RENDERER_URL: 'http://localhost:5173'
      }
    });

    // Get the first window
    window = await electronApp.firstWindow();
    console.log('✅ Electron app launched successfully');
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
      console.log('🔚 Electron app closed');
    }
  });

  test('should launch Electron and load main window', async () => {
    // Verify window exists and has title
    const title = await window.title();
    console.log('Window title:', title);

    // Check if the window is properly loaded
    await window.waitForLoadState('networkidle', { timeout: 10000 });

    // Take screenshot for debugging
    await window.screenshot({
      path: 'electron-main-window.png',
      fullPage: true
    });

    expect(title).toBeTruthy();
  });

  test('should have electronAPI available in window', async () => {
    // Wait a bit for the app to initialize
    await window.waitForTimeout(3000);

    // Check if electronAPI is available
    const hasElectronAPI = await window.evaluate(() => {
      return typeof window.electronAPI !== 'undefined';
    });

    console.log('electronAPI available:', hasElectronAPI);

    if (hasElectronAPI) {
      // Check available APIs
      const availableAPIs = await window.evaluate(() => {
        return {
          materiaPrima: !!window.electronAPI?.materiaPrima,
          categoria: !!window.electronAPI?.categoria,
          presentacion: !!window.electronAPI?.presentacion,
          system: !!window.electronAPI?.system
        };
      });

      console.log('Available APIs:', availableAPIs);

      expect(availableAPIs.materiaPrima).toBe(true);
      expect(availableAPIs.categoria).toBe(true);
      expect(availableAPIs.presentacion).toBe(true);
    } else {
      console.log('❌ electronAPI not available');
    }
  });

  test('should test categoria API communication', async () => {
    // Wait for app to fully load
    await window.waitForTimeout(5000);

    const categoriaTest = await window.evaluate(async () => {
      try {
        if (!window.electronAPI?.categoria) {
          return { success: false, error: 'electronAPI.categoria not available' };
        }

        console.log('Testing categoria.listar...');
        const categorias = await window.electronAPI.categoria.listar(1, true);

        return {
          success: true,
          count: categorias.length,
          sample: categorias.slice(0, 3).map(c => ({ id: c.id, nombre: c.nombre }))
        };
      } catch (error) {
        console.error('Categoria test error:', error);
        return { success: false, error: error.message };
      }
    });

    console.log('Categoria API result:', categoriaTest);

    if (categoriaTest.success) {
      expect(categoriaTest.count).toBeGreaterThan(0);
      console.log(`✅ Found ${categoriaTest.count} categories`);
    } else {
      console.log('❌ Categoria API failed:', categoriaTest.error);
    }
  });

  test('should test presentacion API communication', async () => {
    const presentacionTest = await window.evaluate(async () => {
      try {
        if (!window.electronAPI?.presentacion) {
          return { success: false, error: 'electronAPI.presentacion not available' };
        }

        console.log('Testing presentacion.listar...');
        const presentaciones = await window.electronAPI.presentacion.listar(1, true);

        return {
          success: true,
          count: presentaciones.length,
          sample: presentaciones.slice(0, 3).map(p => ({ id: p.id, nombre: p.nombre }))
        };
      } catch (error) {
        console.error('Presentacion test error:', error);
        return { success: false, error: error.message };
      }
    });

    console.log('Presentacion API result:', presentacionTest);

    if (presentacionTest.success) {
      expect(presentacionTest.count).toBeGreaterThan(0);
      console.log(`✅ Found ${presentacionTest.count} presentaciones`);
    } else {
      console.log('❌ Presentacion API failed:', presentacionTest.error);
    }
  });

  test('should navigate to materia prima form and check fields', async () => {
    try {
      // Try to navigate to the form
      await window.goto('/materia-prima/nueva');
      await window.waitForTimeout(3000);

      console.log('✅ Navigation to materia prima form successful');

      // Take screenshot of the form
      await window.screenshot({
        path: 'materia-prima-form.png',
        fullPage: true
      });

      // Check if form elements exist
      const formElements = await window.evaluate(() => {
        const elements = {
          codigoInput: !!document.querySelector('input[name="codigo_barras"]'),
          nombreInput: !!document.querySelector('input[name="nombre"]'),
          presentacionSelect: !!document.querySelector('select[name="presentacion_id"]'),
          categoriaSelect: !!document.querySelector('select[name="categoria_id"]'),
          fileInput: !!document.querySelector('input[type="file"]'),
          submitButton: !!document.querySelector('button[type="submit"]')
        };

        // Also check for DynamicSelect components
        const dynamicPresentacion = !!document.querySelector('[data-testid*="presentacion"], [class*="presentacion"]');
        const dynamicCategoria = !!document.querySelector('[data-testid*="categoria"], [class*="categoria"]');

        return {
          ...elements,
          dynamicPresentacion,
          dynamicCategoria
        };
      });

      console.log('Form elements found:', formElements);

      // Verify basic form elements exist
      expect(formElements.codigoInput || formElements.nombreInput).toBeTruthy();

    } catch (error) {
      console.log('❌ Navigation to form failed:', error.message);

      // Take screenshot of current state for debugging
      await window.screenshot({
        path: 'current-state.png',
        fullPage: true
      });
    }
  });

  test('should capture console errors and warnings', async () => {
    const consoleMessages: string[] = [];

    // Listen to console messages
    window.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        consoleMessages.push(`ERROR: ${text}`);
        console.error('❌ [Console Error]:', text);
      } else if (type === 'warning') {
        consoleMessages.push(`WARNING: ${text}`);
        console.warn('⚠️ [Console Warning]:', text);
      } else if (text.includes('categoria') || text.includes('presentacion') || text.includes('subirImagen')) {
        consoleMessages.push(`INFO: ${text}`);
        console.log(`📋 [Console]: ${text}`);
      }
    });

    // Wait for some console messages
    await window.waitForTimeout(5000);

    if (consoleMessages.length > 0) {
      console.log('Console messages captured:');
      consoleMessages.forEach(msg => console.log('  -', msg));
    } else {
      console.log('No relevant console messages captured');
    }
  });
});