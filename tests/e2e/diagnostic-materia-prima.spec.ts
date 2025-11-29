/**
 * Diagnostic E2E Tests for Materia Prima Issues
 *
 * Issues to diagnose:
 * 1. Image upload not working from Formulario.tsx
 * 2. Category and presentation fields appearing blank in edit mode
 */

import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Diagnostic Materia Prima Issues', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to materia prima section
    await page.goto('/materia-prima');
    await page.waitForLoadState('networkidle');
  });

  test('DIAG-1: Verify IPC communication for reference data', async ({ page }) => {
    console.log('🔍 Testing IPC communication for reference data...');

    // Navigate to form to trigger reference data loading
    await page.goto('/materia-prima/nueva');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow time for hooks to load

    // Test IPC communication directly in the browser context
    const ipcResult = await page.evaluate(async () => {
      try {
        // Check if electronAPI is available
        if (!window.electronAPI) {
          return { success: false, error: 'window.electronAPI not available' };
        }

        // Check if categoria API is available
        if (!window.electronAPI.categoria) {
          return { success: false, error: 'window.electronAPI.categoria not available' };
        }

        // Check if presentacion API is available
        if (!window.electronAPI.presentacion) {
          return { success: false, error: 'window.electronAPI.presentacion not available' };
        }

        console.log('Testing categoria API...');
        const categorias = await window.electronAPI.categoria.listar(1, true);
        console.log(`Categorías loaded: ${categorias.length}`);

        console.log('Testing presentacion API...');
        const presentaciones = await window.electronAPI.presentacion.listar(1, true);
        console.log(`Presentaciones loaded: ${presentaciones.length}`);

        return {
          success: true,
          categorias: {
            count: categorias.length,
            sample: categorias.slice(0, 3).map(c => ({ id: c.id, nombre: c.nombre }))
          },
          presentaciones: {
            count: presentaciones.length,
            sample: presentaciones.slice(0, 3).map(p => ({ id: p.id, nombre: p.nombre }))
          }
        };
      } catch (error) {
        console.error('IPC Test Error:', error);
        return { success: false, error: error.message };
      }
    });

    console.log('IPC Result:', ipcResult);
    expect(ipcResult.success).toBe(true);
    expect(ipcResult.categorias.count).toBeGreaterThan(0);
    expect(ipcResult.presentaciones.count).toBeGreaterThan(0);
  });

  test('DIAG-2: Check reference data loading in UI', async ({ page }) => {
    console.log('🔍 Testing reference data loading in UI...');

    // Navigate to form
    await page.goto('/materia-prima/nueva');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Allow reference data to load

    // Look for DynamicSelect components
    const presentacionSelect = await page.$('div[data-testid="presentacion-select"], select[name="presentacion_id"]');
    const categoriaSelect = await page.$('div[data-testid="categoria-select"], select[name="categoria_id"]');

    console.log(`Presentación select found: ${!!presentacionSelect}`);
    console.log(`Categoría select found: ${!!categoriaSelect}`);

    if (presentacionSelect) {
      // Check if options are loaded
      const options = await presentacionSelect.$$eval('option, [role="option"]', options =>
        options.slice(0, 5).map(opt => ({ text: opt.textContent, value: opt.value }))
      );
      console.log('Presentación options:', options);
      expect(options.length).toBeGreaterThan(0);
    }

    if (categoriaSelect) {
      // Check if options are loaded
      const options = await categoriaSelect.$$eval('option, [role="option"]', options =>
        options.slice(0, 5).map(opt => ({ text: opt.textContent, value: opt.value }))
      );
      console.log('Categoría options:', options);
      expect(options.length).toBeGreaterThan(0);
    }
  });

  test('DIAG-3: Test material edit form loads reference data correctly', async ({ page }) => {
    console.log('🔍 Testing edit form reference data loading...');

    // First, try to find an existing material to edit
    await page.goto('/materia-prima');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for edit buttons
    const editButtons = await page.$$('[data-testid*="edit"], button:has-text("Editar"), .edit-btn');

    if (editButtons.length > 0) {
      console.log(`Found ${editButtons.length} edit buttons, clicking first one...`);
      await editButtons[0].click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Check if form loads with data
      const presentacionValue = await page.$eval('select[name="presentacion_id"]', el => el.value).catch(() => 'NOT_FOUND');
      const categoriaValue = await page.$eval('select[name="categoria_id"]', el => el.value).catch(() => 'NOT_FOUND');

      console.log(`Presentación value in edit mode: ${presentacionValue}`);
      console.log(`Categoría value in edit mode: ${categoriaValue}`);

      // Check if options are populated
      const presentacionOptions = await page.$$('select[name="presentacion_id"] option');
      const categoriaOptions = await page.$$('select[name="categoria_id"] option');

      console.log(`Presentación options count: ${presentacionOptions.length}`);
      console.log(`Categoría options count: ${categoriaOptions.length}`);

      // Verify that form fields are not empty (if material has data)
      const nombreValue = await page.$eval('input[name="nombre"]', el => el.value).catch(() => '');
      const codigoValue = await page.$eval('input[name="codigo_barras"]', el => el.value).catch(() => '');

      console.log(`Material name: ${nombreValue}`);
      console.log(`Material code: ${codigoValue}`);

      // Take screenshot for debugging
      await page.screenshot({
        path: 'debug-edit-form.png',
        fullPage: true
      });

      // Verify data is loaded
      expect(nombreValue).not.toBe('');
      expect(codigoValue).not.toBe('');

    } else {
      console.log('No edit buttons found, creating a new material first...');
      // Create a test material first
      await testCreateMaterialForEdit(page);

      // Then try editing it
      await page.goto('/materia-prima');
      await page.waitForTimeout(2000);

      const newEditButtons = await page.$$('[data-testid*="edit"], button:has-text("Editar"), .edit-btn');
      if (newEditButtons.length > 0) {
        await newEditButtons[0].click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // Now test the edit form
        const nombreValue = await page.$eval('input[name="nombre"]', el => el.value).catch(() => '');
        expect(nombreValue).not.toBe('');
      }
    }
  });

  test('DIAG-4: Test image upload functionality', async ({ page }) => {
    console.log('🔍 Testing image upload functionality...');

    await page.goto('/materia-prima/nueva');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for image upload components
    const fileInput = await page.$('input[type="file"]');
    const fileUploadComponent = await page.$('[data-testid*="file"], [class*="file-upload"], .file-upload');

    console.log(`File input found: ${!!fileInput}`);
    console.log(`File upload component found: ${!!fileUploadComponent}`);

    if (fileInput) {
      // Test file input attributes
      const accept = await fileInput.getAttribute('accept');
      const multiple = await fileInput.getAttribute('multiple');
      const hasOnChange = await fileInput.evaluate(el => el.onchange !== null);

      console.log(`File input accepts: ${accept}`);
      console.log(`File input multiple: ${multiple}`);
      console.log(`File input has onChange: ${hasOnChange}`);

      // Test if we can set files (even if empty)
      try {
        await fileInput.setInputFiles([]);
        console.log('✅ File input accepts files');
      } catch (error) {
        console.log('❌ File input error:', error.message);
      }
    }

    // Look for drag and drop areas
    const dropZone = await page.$('[data-testid*="drop"], [class*="drop"], [data-testid*="drag"]');
    console.log(`Drop zone found: ${!!dropZone}`);

    // Check for upload buttons
    const uploadButton = await page.$('button:has-text("Subir"), button:has-text("Seleccionar"), button:has-text("Cargar")');
    console.log(`Upload button found: ${!!uploadButton}`);

    // Take screenshot for visual debugging
    await page.screenshot({
      path: 'debug-image-upload.png',
      fullPage: true
    });

    // Test if materiaPrimaService.subirImagen is available
    const serviceCheck = await page.evaluate(() => {
      try {
        // Check if the service function is called somewhere
        const hasUploadLogic = !!document.querySelector('[onchange*="subirImagen"], [onclick*="subirImagen"]');
        const hasFileUploadComponent = !!document.querySelector('[class*="file-upload"], [data-testid*="file"]');

        return {
          hasUploadLogic,
          hasFileUploadComponent
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('Upload logic check:', serviceCheck);
  });

  test('DIAG-5: Check for JavaScript errors', async ({ page }) => {
    console.log('🔍 Checking for JavaScript errors...');

    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        errors.push(text);
        console.error('❌ [JS Error]:', text);
      } else if (type === 'warning') {
        warnings.push(text);
        console.warn('⚠️ [JS Warning]:', text);
      } else if (text.includes('categoria') || text.includes('presentacion') || text.includes('reference')) {
        console.log(`📋 [Console]: ${text}`);
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.error('💥 [Page Error]:', error.message);
    });

    // Navigate through the application
    await page.goto('/materia-prima');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.goto('/materia-prima/nueva');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Try to trigger reference data loading
    await page.evaluate(() => {
      // Try to access reference data if possible
      if (window.electronAPI?.categoria) {
        window.electronAPI.categoria.listar(1, true).catch(console.error);
      }
      if (window.electronAPI?.presentacion) {
        window.electronAPI.presentacion.listar(1, true).catch(console.error);
      }
    });

    await page.waitForTimeout(2000);

    console.log(`Found ${errors.length} errors and ${warnings.length} warnings`);

    if (errors.length > 0) {
      console.log('All errors:', errors);
    }
    if (warnings.length > 0) {
      console.log('All warnings:', warnings);
    }

    // Expect no critical errors
    expect(errors.filter(e => e.includes('ReferenceError') || e.includes('TypeError'))).toHaveLength(0);
  });

  test('DIAG-6: Verify database data consistency', async ({ page }) => {
    console.log('🔍 Verifying database data consistency...');

    const dbCheck = await page.evaluate(async () => {
      try {
        if (!window.electronAPI) {
          return { success: false, error: 'electronAPI not available' };
        }

        // Get reference data
        const categorias = await window.electronAPI.categoria.listar(1, true);
        const presentaciones = await window.electronAPI.presentacion.listar(1, true);

        // Check data integrity
        const categoriaIssues = categorias.filter(c => !c.id || !c.nombre);
        const presentacionIssues = presentaciones.filter(p => !p.id || !p.nombre);

        // Check for duplicates
        const categoriaNames = categorias.map(c => c.nombre);
        const presentacionNames = presentaciones.map(p => p.nombre);

        const categoriaDuplicates = categoriaNames.filter((name, index) => categoriaNames.indexOf(name) !== index);
        const presentacionDuplicates = presentacionNames.filter((name, index) => presentacionNames.indexOf(name) !== index);

        return {
          success: true,
          categorias: {
            total: categorias.length,
            issues: categoriaIssues.length,
            duplicates: categoriaDuplicates.length
          },
          presentaciones: {
            total: presentaciones.length,
            issues: presentacionIssues.length,
            duplicates: presentacionDuplicates.length
          },
          samples: {
            categorias: categorias.slice(0, 3),
            presentaciones: presentaciones.slice(0, 3)
          }
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log('Database consistency check:', dbCheck);
    expect(dbCheck.success).toBe(true);
    expect(dbCheck.categorias.total).toBeGreaterThan(0);
    expect(dbCheck.presentaciones.total).toBeGreaterThan(0);
    expect(dbCheck.categorias.issues).toBe(0);
    expect(dbCheck.presentaciones.issues).toBe(0);
  });
});

// Helper function to create a test material for editing
async function testCreateMaterialForEdit(page: any): Promise<void> {
  console.log('Creating test material for edit testing...');

  await page.goto('/materia-prima/nueva');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  try {
    // Fill form with test data
    await page.fill('input[name="codigo_barras"]', `TEST-${Date.now()}`);
    await page.fill('input[name="nombre"]', 'Material de Prueba para Edición');

    // Try to select category and presentation (if available)
    const categoriaSelect = await page.$('select[name="categoria_id"]');
    const presentacionSelect = await page.$('select[name="presentacion_id"]');

    if (categoriaSelect) {
      const options = await categoriaSelect.$$('option');
      if (options.length > 1) {
        await categoriaSelect.selectOption({ index: 1 });
      }
    }

    if (presentacionSelect) {
      const options = await presentacionSelect.$$('option');
      if (options.length > 1) {
        await presentacionSelect.selectOption({ index: 1 });
      }
    }

    // Fill other required fields
    await page.fill('input[name="stock_actual"]', '10');
    await page.fill('input[name="stock_minimo"]', '5');

    // Try to submit
    const submitButton = await page.$('button[type="submit"]:has-text("Crear"), button[type="submit"]:has-text("Guardar")');
    if (submitButton) {
      await submitButton.click();
      await page.waitForTimeout(2000);
    }
  } catch (error) {
    console.log('Could not create test material:', error.message);
  }
}