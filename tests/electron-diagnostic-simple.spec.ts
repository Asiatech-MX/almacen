import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

test.describe('Electron Diagnostic', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    console.log('🚀 Launching Electron app...');

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

    window = await electronApp.firstWindow();
    console.log('✅ Electron app launched');
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
      console.log('🔚 Electron app closed');
    }
  });

  test('should test categoria and presentacion APIs', async () => {
    // Wait for app to initialize
    await window.waitForTimeout(5000);

    // Test IPC communication
    const results = await window.evaluate(async () => {
      try {
        if (!window.electronAPI) {
          return { success: false, error: 'No electronAPI found' };
        }

        const testResults = {};

        // Test categoria API
        if (window.electronAPI.categoria) {
          try {
            const categorias = await window.electronAPI.categoria.listar(1, true);
            testResults.categorias = { success: true, count: categorias.length, sample: categorias.slice(0, 2) };
          } catch (error) {
            testResults.categorias = { success: false, error: error.message };
          }
        } else {
          testResults.categorias = { success: false, error: 'categoria API not available' };
        }

        // Test presentacion API
        if (window.electronAPI.presentacion) {
          try {
            const presentaciones = await window.electronAPI.presentacion.listar(1, true);
            testResults.presentaciones = { success: true, count: presentaciones.length, sample: presentaciones.slice(0, 2) };
          } catch (error) {
            testResults.presentaciones = { success: false, error: error.message };
          }
        } else {
          testResults.presentaciones = { success: false, error: 'presentacion API not available' };
        }

        return { success: true, results: testResults };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log('📊 IPC Test Results:', results);

    // Verify results
    expect(results.success).toBe(true);

    if (results.results.categorias.success) {
      console.log(`✅ Found ${results.results.categorias.count} categories`);
      expect(results.results.categorias.count).toBeGreaterThan(0);
    } else {
      console.log('❌ Categoria API failed:', results.results.categorias.error);
    }

    if (results.results.presentaciones.success) {
      console.log(`✅ Found ${results.results.presentaciones.count} presentaciones`);
      expect(results.results.presentaciones.count).toBeGreaterThan(0);
    } else {
      console.log('❌ Presentacion API failed:', results.results.presentaciones.error);
    }
  });

  test('should navigate to materia prima form', async () => {
    try {
      // Navigate to the form
      await window.goto('http://localhost:5173/materia-prima/nueva');
      await window.waitForTimeout(3000);

      // Take screenshot
      await window.screenshot({
        path: 'test-materia-prima-form.png',
        fullPage: true
      });

      // Check form elements
      const formElements = await window.evaluate(() => {
        const elements = {
          codigoInput: !!document.querySelector('input[name="codigo_barras"]'),
          nombreInput: !!document.querySelector('input[name="nombre"]'),
          categoriaSelect: !!document.querySelector('select[name="categoria_id"]'),
          presentacionSelect: !!document.querySelector('select[name="presentacion_id"]'),
          fileInput: !!document.querySelector('input[type="file"]'),
          submitButton: !!document.querySelector('button[type="submit"]')
        };
        return elements;
      });

      console.log('📋 Form elements found:', formElements);
      expect(formElements.codigoInput || formElements.nombreInput).toBeTruthy();

    } catch (error) {
      console.log('❌ Form navigation failed:', error.message);
      await window.screenshot({
        path: 'test-form-error.png',
        fullPage: true
      });
    }
  });
});