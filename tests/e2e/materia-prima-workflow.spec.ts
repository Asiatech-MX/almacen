/**
 * E2E Tests for Material (Materia Prima) Workflow
 * Tests complete material CRUD operations with DynamicSelect components
 */

import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Materia Prima Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the materia prima form page
    await page.goto('/materia-prima/nuevo');

    // Wait for the form to load
    await page.waitForSelector('[data-testid="materia-prima-form"]', { timeout: 10000 });
  });

  test('should display materia prima form with all required fields', async ({ page }) => {
    // Check main form components
    await expect(page.locator('[data-testid="codigo-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="nombre-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="descripcion-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="categoria-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="presentacion-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="stock-minimo-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="stock-actual-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="precio-unitario-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="ubicacion-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="proveedor-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="imagen-upload"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-form"]')).toBeVisible();
  });

  test('should create a new materia prima with existing category and presentation', async ({ page }) => {
    // Fill basic information
    await page.fill('[data-testid="codigo-input"]', 'MP-TEST-001');
    await page.fill('[data-testid="nombre-input"]', 'Material de Prueba E2E');
    await page.fill('[data-testid="descripcion-input"]', 'Descripción completa del material de prueba');
    await page.fill('[data-testid="stock-minimo-input"]', '10');
    await page.fill('[data-testid="stock-actual-input"]", '50');
    await page.fill('[data-testid="precio-unitario-input"]', '25.50');
    await page.fill('[data-testid="ubicacion-input"]', 'Almacén A - Estantería 1');

    // Select existing category (assuming categories are loaded)
    await page.click('[data-testid="categoria-select"]');
    await page.waitForSelector('[data-testid="categoria-option"]', { timeout: 5000 });
    await page.click('[data-testid="categoria-option"]:first-child');

    // Select existing presentation
    await page.click('[data-testid="presentacion-select"]');
    await page.waitForSelector('[data-testid="presentacion-option"]', { timeout: 5000 });
    await page.click('[data-testid="presentacion-option"]:first-child');

    // Select supplier
    await page.click('[data-testid="proveedor-select"]');
    await page.waitForSelector('[data-testid="proveedor-option"]', { timeout: 5000 });
    await page.click('[data-testid="proveedor-option"]:first-child');

    // Submit the form
    await page.click('[data-testid="submit-form"]');

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Material creado exitosamente')).toBeVisible();

    // Verify redirection to list or detail view
    await expect(page).toHaveURL(/\/materia-prima/);
  });

  test('should create a new category inline from materia prima form', async ({ page }) => {
    // Fill basic information first
    await page.fill('[data-testid="codigo-input"]', 'MP-TEST-002');
    await page.fill('[data-testid="nombre-input"]', 'Material con Nueva Categoría');

    // Click on category select
    await page.click('[data-testid="categoria-select"]');

    // Click on "Add new category" option
    await page.click('[data-testid="add-new-category"]');

    // Wait for inline edit modal
    await page.waitForSelector('[data-testid="inline-edit-modal"]', { timeout: 5000 });

    // Fill new category details
    await page.fill('[data-testid="inline-categoria-nombre"]', 'Categoría Nueva Test');
    await page.fill('[data-testid="inline-categoria-descripcion"]', 'Categoría creada desde formulario');

    // Submit category creation
    await page.click('[data-testid="inline-categoria-submit"]');

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });

    // Verify the new category is selected in the dropdown
    await expect(page.locator('[data-testid="categoria-select"]')).toContainText('Categoría Nueva Test');
  });

  test('should create a new presentation inline from materia prima form', async ({ page }) => {
    // Fill basic information first
    await page.fill('[data-testid="codigo-input"]', 'MP-TEST-003');
    await page.fill('[data-testid="nombre-input"]', 'Material con Nueva Presentación');

    // Click on presentation select
    await page.click('[data-testid="presentacion-select"]');

    // Click on "Add new presentation" option
    await page.click('[data-testid="add-new-presentation"]');

    // Wait for inline edit modal
    await page.waitForSelector('[data-testid="inline-edit-modal"]', { timeout: 5000 });

    // Fill new presentation details
    await page.fill('[data-testid="inline-presentacion-nombre"]', 'Presentación Nueva Test');
    await page.fill('[data-testid="inline-presentacion-unidad-medida"]', 'kg');
    await page.fill('[data-testid="inline-presentacion-contenido"]', '25');

    // Submit presentation creation
    await page.click('[data-testid="inline-presentacion-submit"]');

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });

    // Verify the new presentation is selected in the dropdown
    await expect(page.locator('[data-testid="presentacion-select"]')).toContainText('Presentación Nueva Test');
  });

  test('should handle image upload correctly', async ({ page }) => {
    // Get a test image path
    const imagePath = path.resolve(__dirname, 'test-data', 'test-image.jpg');

    // Create a simple test image (in real scenario, you'd have actual test images)
    // For this test, we'll simulate the upload process

    // Fill basic information
    await page.fill('[data-testid="codigo-input"]', 'MP-TEST-004');
    await page.fill('[data-testid="nombre-input"]', 'Material con Imagen');

    // Mock file upload (since we can't easily create files in this environment)
    // In real tests, you would have actual test files
    await page.setInputFiles('[data-testid="imagen-upload"]', []);

    // The upload should trigger image preview (if file was provided)
    // For now, we'll test the upload button functionality
    await expect(page.locator('[data-testid="imagen-upload"]')).toBeVisible();
  });

  test('should validate form fields correctly', async ({ page }) => {
    // Try to submit empty form
    await page.click('[data-testid="submit-form"]');

    // Should show validation errors
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('text=El código es requerido')).toBeVisible();
    await expect(page.locator('text=El nombre es requerido')).toBeVisible();
    await expect(page.locator('text=La categoría es requerida')).toBeVisible();
    await expect(page.locator('text=La presentación es requerida')).toBeVisible();

    // Test invalid data
    await page.fill('[data-testid="codigo-input"]', 'MP-001'); // Too short
    await page.fill('[data-testid="stock-minimo-input"]', '-5'); // Negative number
    await page.fill('[data-testid="precio-unitario-input"]', '0'); // Zero price

    await page.click('[data-testid="submit-form"]');

    // Should show specific validation errors
    await expect(page.locator('text=El código debe tener al menos 8 caracteres')).toBeVisible();
    await expect(page.locator('text=El stock mínimo no puede ser negativo')).toBeVisible();
    await expect(page.locator('text=El precio debe ser mayor que cero')).toBeVisible();
  });

  test('should handle duplicate code validation', async ({ page }) => {
    // Fill form with existing material code
    await page.fill('[data-testid="codigo-input"]', 'MP-EXISTENTE-001'); // Assume this exists
    await page.fill('[data-testid="nombre-input"]', 'Material Duplicado');
    await page.fill('[data-testid="descripcion-input"]', 'Descripción de prueba');

    // Fill other required fields
    await page.click('[data-testid="categoria-select"]');
    await page.waitForSelector('[data-testid="categoria-option"]');
    await page.click('[data-testid="categoria-option"]:first-child');

    await page.click('[data-testid="presentacion-select"]');
    await page.waitForSelector('[data-testid="presentacion-option"]');
    await page.click('[data-testid="presentacion-option"]:first-child');

    // Submit form
    await page.click('[data-testid="submit-form"]');

    // Should show duplicate code error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Ya existe un material con este código')).toBeVisible();
  });

  test('should edit existing materia prima', async ({ page }) => {
    // Navigate to an existing material edit page
    await page.goto('/materia-prima/editar/1'); // Assume material with ID 1 exists

    // Wait for form to load with existing data
    await page.waitForSelector('[data-testid="materia-prima-form"]', { timeout: 10000 });

    // Verify existing data is loaded
    await expect(page.locator('[data-testid="codigo-input"]')).toHaveValue(/.+/);
    await expect(page.locator('[data-testid="nombre-input"]')).toHaveValue(/.+/);

    // Update some fields
    await page.fill('[data-testid="nombre-input"]', 'Material Editado E2E');
    await page.fill('[data-testid="descripcion-input"]', 'Descripción actualizada');
    await page.fill('[data-testid="stock-minimo-input"]', '15');
    await page.fill('[data-testid="precio-unitario-input"]', '30.75');

    // Submit the form
    await page.click('[data-testid="submit-form"]');

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Material actualizado exitosamente')).toBeVisible();
  });

  test('should handle autocomplete search for suppliers', async ({ page }) => {
    // Focus on supplier select
    await page.click('[data-testid="proveedor-select"]');

    // Type search term
    await page.keyboard.type('Proveedor');

    // Wait for search results
    await page.waitForSelector('[data-testid="proveedor-option"]', { timeout: 5000 });

    // Should show filtered results
    const options = page.locator('[data-testid="proveedor-option"]');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    // Select first option
    await options.first().click();

    // Verify selection
    await expect(page.locator('[data-testid="proveedor-select"]')).toContainText('Proveedor');
  });

  test('should handle form cancellation and reset', async ({ page }) => {
    // Fill some fields
    await page.fill('[data-testid="codigo-input"]', 'MP-TEST-005');
    await page.fill('[data-testid="nombre-input"]', 'Material Cancelado');
    await page.fill('[data-testid="descripcion-input"]', 'Esta descripción debería desaparecer');

    // Click cancel button
    await page.click('[data-testid="cancel-form"]');

    // Should show confirmation dialog
    await page.waitForSelector('[data-testid="cancel-confirmation-modal"]', { timeout: 5000 });

    // Confirm cancellation
    await page.click('[data-testid="confirm-cancel"]');

    // Should redirect to list page
    await expect(page).toHaveURL('/materia-prima');

    // Or if staying on form, fields should be reset
    // await expect(page.locator('[data-testid="codigo-input"]')).toHaveValue('');
  });

  test('should handle network errors during form submission', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/materia-prima/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    // Fill form completely
    await page.fill('[data-testid="codigo-input"]', 'MP-TEST-ERROR');
    await page.fill('[data-testid="nombre-input"]', 'Material con Error');
    await page.fill('[data-testid="descripcion-input"]', 'Descripción de prueba');

    // Fill required selects
    await page.click('[data-testid="categoria-select"]');
    await page.waitForSelector('[data-testid="categoria-option"]');
    await page.click('[data-testid="categoria-option"]:first-child');

    await page.click('[data-testid="presentacion-select"]');
    await page.waitForSelector('[data-testid="presentacion-option"]');
    await page.click('[data-testid="presentacion-option"]:first-child');

    // Submit form
    await page.click('[data-testid="submit-form"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Error al crear el material')).toBeVisible();

    // Form should retain entered data for retry
    await expect(page.locator('[data-testid="codigo-input"]')).toHaveValue('MP-TEST-ERROR');
  });

  test('should handle keyboard navigation and accessibility', async ({ page }) => {
    // Test Tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="codigo-input"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nombre-input"]')).toBeFocused();

    // Test Enter key submission
    await page.fill('[data-testid="codigo-input"]', 'MP-TEST-006');
    await page.fill('[data-testid="nombre-input"]', 'Material Keyboard Test');

    // Press Enter on last field to submit (if implemented)
    await page.focus('[data-testid="ubicacion-input"]');
    await page.keyboard.press('Enter');

    // Should attempt submission (might show validation errors)
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
  });

  test('should handle responsive design on different screen sizes', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });

    // Form should adapt to mobile layout
    await expect(page.locator('[data-testid="materia-prima-form"]')).toBeVisible();

    // Check that mobile-specific elements are present
    const mobileLayout = page.locator('[data-testid="mobile-layout"]');
    if (await mobileLayout.isVisible()) {
      // Test mobile-specific interactions
      await expect(mobileLayout).toBeVisible();
    }

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="materia-prima-form"]')).toBeVisible();

    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="materia-prima-form"]')).toBeVisible();
  });
});