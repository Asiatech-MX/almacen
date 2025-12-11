import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Direct Electron test using _electron API
 */

async function runElectronTest() {
  console.log('🚀 Starting Electron test...');

  try {
    // Launch Electron using _electron API
    const electronApp = await import('playwright').then(module => {
      return module._electron.launch({
        args: [
          path.join(__dirname, 'apps/electron-main/dist/main.js'),
          '--enable-logging',
          '--v=1'
        ],
        env: {
          ...process.env,
          NODE_ENV: 'development',
          ELECTRON_RENDERER_URL: 'http://localhost:5173'
        }
      });
    });

    console.log('✅ Electron app launched');

    // Get the first window
    const window = await electronApp.firstWindow();
    console.log('✅ Window obtained');

    // Wait for app to load
    await window.waitForLoadState('networkidle', { timeout: 15000 });
    console.log('✅ App loaded');

    // Test basic navigation
    console.log('🧭 Testing navigation...');
    await window.goto('http://localhost:5173/materia-prima/nueva');
    await window.waitForTimeout(5000);

    // Test IPC communication
    console.log('🔍 Testing IPC communication...');
    const ipcResult = await window.evaluate(async () => {
      try {
        if (!window.electronAPI) {
          return { success: false, error: 'No electronAPI found' };
        }

        const results = {};

        // Test categoria API
        if (window.electronAPI.categoria) {
          try {
          const categorias = await window.electronAPI.categoria.listar(1, true);
          results.categorias = { success: true, count: categorias.length, sample: categorias.slice(0, 3) };
        } catch (error) {
          results.categorias = { success: false, error: error.message };
        }
        } else {
          results.categorias = { success: false, error: 'categoria API not available' };
        }

        // Test presentacion API
        if (window.electronAPI.presentacion) {
          try {
            const presentaciones = await window.electronAPI.presentacion.listar(1, true);
            results.presentaciones = { success: true, count: presentaciones.length, sample: presentaciones.slice(0, 3) };
          } catch (error) {
            results.presentaciones = { success: false, error: error.message };
          }
        } else {
          results.presentaciones = { success: false, error: 'presentacion API not available' };
        }

        // Test materiaPrima API
        if (window.electronAPI.materiaPrima) {
          try {
            const materiales = await window.electronAPI.materiaPrima.listar();
            results.materiaPrima = { success: true, count: materiales.length };
          } catch (error) {
            results.materiaPrima = { success: false, error: error.message };
          }
        } else {
          results.materiaPrima = { success: false, error: 'materiaPrima API not available' };
        }

        return { success: true, results };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log('📊 IPC Test Results:', ipcResult);

    // Take screenshots
    await window.screenshot({
      path: 'test-app-loaded.png',
      fullPage: true
    });

    // Test navigation to different forms
    console.log('🧭 Testing form navigation...');

    try {
      await window.goto('http://localhost:5ateria-prima/nueva');
      await window.waitForTimeout(3000);
      await window.screenshot({ path: 'test-form.png', fullPage: true });
    } catch (error) {
      console.log('❌ Form navigation failed:', error.message);
    }

    // Check for form elements
    const formCheck = await window.evaluate(() => {
      const elements = {
        codigoInput: !!document.querySelector('input[name="codigo_barras"]'),
        nombreInput: !!document.querySelector('input[name="nombre"]'),
        categoriaSelect: !!document.querySelector('select[name="categoria_id"]'),
        presentacionSelect: !!document.querySelector('select[name="presentacion_id"]'),
        fileInput: !!document.querySelector('input[type="file"]')
      };
      return elements;
    });

    console.log('📋 Form elements found:', formCheck);

    // Close the app
    await electronApp.close();
    console.log('🔚 Test completed successfully');

    return {
      success: true,
      ipcResult,
      formCheck
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
runElectronTest()
  .then(result => {
    console.log('\n📋 Final Results:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });