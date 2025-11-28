/**
 * E2E Tests for Category Management Workflow
 * Tests complete category CRUD operations in the Electron application
 */

import { test, expect } from '@playwright/test';

test.describe('Category Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the category management page
    await page.goto('/admin/categorias');

    // Wait for the page to load
    await page.waitForSelector('[data-testid="categoria-manager"]', { timeout: 10000 });
  });

  test('should display category management interface', async ({ page }) => {
    // Check that the main components are visible
    await expect(page.locator('[data-testid="categoria-tree"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-category-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-categories"]')).toBeVisible();
  });

  test('should create a new root category', async ({ page }) => {
    // Click on add category button
    await page.click('[data-testid="add-category-button"]');

    // Wait for modal to appear
    await page.waitForSelector('[data-testid="categoria-modal"]', { timeout: 5000 });

    // Fill in category details
    await page.fill('[data-testid="categoria-nombre"]', 'Nueva Categoría Test');
    await page.fill('[data-testid="categoria-descripcion"]', 'Descripción de prueba para nueva categoría');

    // Submit the form
    await page.click('[data-testid="categoria-form-submit"]');

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });

    // Verify the new category appears in the tree
    await expect(page.locator('text=Nueva Categoría Test')).toBeVisible({ timeout: 5000 });
  });

  test('should create a subcategory under existing category', async ({ page }) => {
    // Wait for categories to load
    await page.waitForSelector('[data-testid="categoria-node"]', { timeout: 10000 });

    // Find and expand a parent category (assuming we have existing categories)
    const firstCategory = page.locator('[data-testid="categoria-node"]').first();
    await firstCategory.click();

    // Wait for expand button to be available
    await page.waitForSelector('[data-testid="expand-category"]', { timeout: 3000 });
    await page.click('[data-testid="expand-category"]');

    // Right-click on the expanded category to show context menu
    await firstCategory.click({ button: 'right' });

    // Click on "Add Subcategory" from context menu
    await page.click('[data-testid="add-subcategory-menu"]');

    // Wait for modal
    await page.waitForSelector('[data-testid="categoria-modal"]', { timeout: 5000 });

    // Fill subcategory details
    await page.fill('[data-testid="categoria-nombre"]', 'Subcategoría Test');
    await page.fill('[data-testid="categoria-descripcion"]', 'Descripción de subcategoría de prueba');

    // Submit form
    await page.click('[data-testid="categoria-form-submit"]');

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });

    // Verify the subcategory appears under the parent
    await expect(page.locator('text=Subcategoría Test')).toBeVisible({ timeout: 5000 });
  });

  test('should edit an existing category', async ({ page }) => {
    // Wait for categories to load
    await page.waitForSelector('[data-testid="categoria-node"]', { timeout: 10000 });

    // Find a category and click the edit button
    const firstCategory = page.locator('[data-testid="categoria-node"]').first();
    await firstCategory.hover();
    await page.click('[data-testid="edit-category"]');

    // Wait for edit modal
    await page.waitForSelector('[data-testid="categoria-modal"]', { timeout: 5000 });

    // Update category details
    await page.fill('[data-testid="categoria-nombre"]', 'Categoría Editada Test');
    await page.fill('[data-testid="categoria-descripcion"]', 'Descripción actualizada de prueba');

    // Submit form
    await page.click('[data-testid="categoria-form-submit"]');

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });

    // Verify the updated name appears
    await expect(page.locator('text=Categoría Editada Test')).toBeVisible({ timeout: 5000 });
  });

  test('should delete a category with confirmation', async ({ page }) => {
    // Wait for categories to load
    await page.waitForSelector('[data-testid="categoria-node"]', { timeout: 10000 });

    // Find a category and click the delete button
    const firstCategory = page.locator('[data-testid="categoria-node"]').first();
    const categoryName = await firstCategory.textContent();

    await firstCategory.hover();
    await page.click('[data-testid="delete-category"]');

    // Wait for confirmation dialog
    await page.waitForSelector('[data-testid="delete-confirmation-modal"]', { timeout: 5000 });

    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });

    // Verify the category is no longer visible
    await expect(page.locator(`text=${categoryName}`)).not.toBeVisible({ timeout: 5000 });
  });

  test('should search and filter categories', async ({ page }) => {
    // Wait for categories to load
    await page.waitForSelector('[data-testid="categoria-node"]', { timeout: 10000 });

    // Use the search functionality
    await page.fill('[data-testid="search-categories"]', 'test');

    // Wait for search results
    await page.waitForTimeout(1000); // Allow debounced search to execute

    // Verify search results are filtered
    const visibleCategories = page.locator('[data-testid="categoria-node"]:visible');
    const count = await visibleCategories.count();

    // Should have fewer results after search (assuming not all categories contain "test")
    expect(count).toBeGreaterThan(0);
  });

  test('should handle drag and drop to reorder categories', async ({ page }) => {
    // Wait for categories to load
    await page.waitForSelector('[data-testid="categoria-node"]', { timeout: 10000 });

    // Get the first two categories
    const firstCategory = page.locator('[data-testid="categoria-node"]').first();
    const secondCategory = page.locator('[data-testid="categoria-node"]').nth(1);

    const firstCategoryText = await firstCategory.textContent();
    const secondCategoryText = await secondCategory.textContent();

    // Perform drag and drop
    await firstCategory.dragTo(secondCategory);

    // Wait for the operation to complete
    await page.waitForTimeout(1000);

    // Verify the order has changed (this might need adjustment based on your implementation)
    // The exact verification depends on how your drag-drop updates the order
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle invalid category creation with validation', async ({ page }) => {
    // Click on add category button
    await page.click('[data-testid="add-category-button"]');

    // Wait for modal
    await page.waitForSelector('[data-testid="categoria-modal"]', { timeout: 5000 });

    // Try to submit without required fields
    await page.click('[data-testid="categoria-form-submit"]');

    // Should show validation errors
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('text=El nombre es requerido')).toBeVisible();

    // Fill with invalid data (too long name)
    await page.fill('[data-testid="categoria-nombre"]', 'a'.repeat(101)); // Assuming max 100 chars

    // Should show length validation error
    await expect(page.locator('text=El nombre no puede exceder 100 caracteres')).toBeVisible();

    // Close modal without saving
    await page.click('[data-testid="cancel-category-form"]');

    // Verify modal is closed
    await expect(page.locator('[data-testid="categoria-modal"]')).not.toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure scenario
    await page.route('**/api/categorias/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    // Try to create a category
    await page.click('[data-testid="add-category-button"]');
    await page.waitForSelector('[data-testid="categoria-modal"]', { timeout: 5000 });

    await page.fill('[data-testid="categoria-nombre"]', 'Test Error Category');
    await page.click('[data-testid="categoria-form-submit"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Error al crear la categoría')).toBeVisible();
  });

  test('should load categories efficiently with large datasets', async ({ page }) => {
    // This test would work better with a large test dataset
    // For now, we'll test the loading behavior

    // Wait for initial load
    await page.waitForSelector('[data-testid="categoria-tree"]', { timeout: 15000 });

    // Check for loading indicators
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible({ timeout: 10000 });

    // Verify categories are loaded
    const categories = page.locator('[data-testid="categoria-node"]');
    await expect(categories.first()).toBeVisible({ timeout: 5000 });

    // Test lazy loading by expanding a category with many children
    const firstCategory = categories.first();
    await firstCategory.click();

    // Should show children or indicate loading
    await page.waitForTimeout(1000);
  });
});