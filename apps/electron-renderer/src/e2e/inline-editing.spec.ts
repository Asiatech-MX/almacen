import { test, expect } from '@playwright/test';

test.describe('Inline Editing - End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock de API responses para categorías
    await page.route('**/api/categorias', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            nombre: 'Construcción',
            descripcion: 'Materiales de construcción',
            icono: '🔨',
            color: '#FF5722',
            nivel: 1
          },
          {
            id: '2',
            nombre: 'Electricidad',
            descripcion: 'Materiales eléctricos',
            icono: '⚡',
            color: '#FFC107',
            nivel: 1
          }
        ])
      });
    });

    // Mock de API responses para presentaciones
    await page.route('**/api/presentaciones', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            nombre: 'Unidad',
            abreviatura: 'ud',
            unidad_base: 'unidad',
            factor_conversion: 1
          }
        ])
      });
    });

    // Mock de API para edición
    await page.route('**/api/categorias/*', route => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: '1',
              nombre: 'Construcción Actualizada',
              descripcion: 'Descripción actualizada'
            }
          })
        });
      }
    });

    await page.goto('/materia-prima/formulario');
  });

  test('should complete inline editing workflow successfully', async ({ page }) => {
    // 1. Abrir el selector de categorías
    const categorySelect = page.locator('[role="combobox"]').first();
    await expect(categorySelect).toBeVisible();
    await categorySelect.click();

    // 2. Esperar a que aparezcan las opciones
    await page.waitForSelector('[role="option"]');

    // 3. Iniciar edición inline en la primera categoría
    const editButton = page.locator('[aria-label*="Editar inline"]').first();
    await expect(editButton).toBeVisible();
    await editButton.click();

    // 4. Verificar que el editor inline está visible
    const inlineEditor = page.locator('[data-testid="inline-editor"]');
    await expect(inlineEditor).toBeVisible();

    // 5. Editar el nombre
    const nameInput = inlineEditor.locator('input').first();
    await expect(nameInput).toBeVisible();
    await nameInput.clear();
    await nameInput.fill('Construcción Actualizada');

    // 6. Editar la descripción
    const descriptionInput = inlineEditor.locator('textarea').first();
    if (await descriptionInput.isVisible()) {
      await descriptionInput.clear();
      await descriptionInput.fill('Descripción actualizada');
    }

    // 7. Guardar cambios
    const saveButton = inlineEditor.locator('button:has-text("Guardar")');
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // 8. Verificar que el editor se cierra
    await expect(inlineEditor).not.toBeVisible();

    // 9. Verificar que los cambios se reflejan en la UI
    await page.waitForTimeout(1000);
    await categorySelect.click();
    await page.waitForSelector('[role="option"]');

    const updatedOption = page.locator('[role="option"]:has-text("Construcción Actualizada")');
    await expect(updatedOption).toBeVisible();
  });

  test('should cancel inline editing when Escape is pressed', async ({ page }) => {
    const categorySelect = page.locator('[role="combobox"]').first();
    await categorySelect.click();
    await page.waitForSelector('[role="option"]');

    const editButton = page.locator('[aria-label*="Editar inline"]').first();
    await editButton.click();

    const inlineEditor = page.locator('[data-testid="inline-editor"]');
    await expect(inlineEditor).toBeVisible();

    // Presionar Escape para cancelar
    await page.keyboard.press('Escape');

    // Verificar que el editor se cierra sin guardar
    await expect(inlineEditor).not.toBeVisible();

    // Verificar que los valores originales se mantienen
    await categorySelect.click();
    await page.waitForSelector('[role="option"]');

    const originalOption = page.locator('[role="option"]:has-text("Construcción")');
    await expect(originalOption).toBeVisible();
  });

  test('should show validation errors during inline editing', async ({ page }) => {
    const categorySelect = page.locator('[role="combobox"]').first();
    await categorySelect.click();
    await page.waitForSelector('[role="option"]');

    const editButton = page.locator('[aria-label*="Editar inline"]').first();
    await editButton.click();

    const inlineEditor = page.locator('[data-testid="inline-editor"]');
    await expect(inlineEditor).toBeVisible();

    const nameInput = inlineEditor.locator('input').first();
    await nameInput.clear(); // Dejar el nombre vacío

    const saveButton = inlineEditor.locator('button:has-text("Guardar")');
    await saveButton.click();

    // Verificar mensaje de error de validación
    const errorMessage = page.locator('text=El nombre es requerido');
    await expect(errorMessage).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simular error de red
    await page.route('**/api/categorias/*', route => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Error del servidor'
          })
        });
      }
    });

    const categorySelect = page.locator('[role="combobox"]').first();
    await categorySelect.click();
    await page.waitForSelector('[role="option"]');

    const editButton = page.locator('[aria-label*="Editar inline"]').first();
    await editButton.click();

    const inlineEditor = page.locator('[data-testid="inline-editor"]');
    const nameInput = inlineEditor.locator('input').first();
    await nameInput.clear();
    await nameInput.fill('Categoría con Error');

    const saveButton = inlineEditor.locator('button:has-text("Guardar")');
    await saveButton.click();

    // Verificar mensaje de error
    const errorMessage = page.locator('text=Error del servidor');
    await expect(errorMessage).toBeVisible();

    // El editor debería permanecer visible para que el usuario pueda reintentar
    await expect(inlineEditor).toBeVisible();
  });

  test('should support keyboard shortcuts in inline editor', async ({ page }) => {
    const categorySelect = page.locator('[role="combobox"]').first();
    await categorySelect.click();
    await page.waitForSelector('[role="option"]');

    const editButton = page.locator('[aria-label*="Editar inline"]').first();
    await editButton.click();

    const inlineEditor = page.locator('[data-testid="inline-editor"]');
    await expect(inlineEditor).toBeVisible();

    const nameInput = inlineEditor.locator('input').first();
    await nameInput.clear();
    await nameInput.fill('Categoría con Atajo');

    // Usar Ctrl+S para guardar
    await page.keyboard.press('Control+s');

    // Verificar que se guarda
    await expect(inlineEditor).not.toBeVisible();
  });

  test('should handle concurrent inline editing attempts', async ({ page }) => {
    const categorySelect = page.locator('[role="combobox"]').first();
    await categorySelect.click();
    await page.waitForSelector('[role="option"]');

    // Iniciar edición en primer elemento
    const firstEditButton = page.locator('[aria-label*="Editar inline"]').first();
    await firstEditButton.click();

    const inlineEditor = page.locator('[data-testid="inline-editor"]');
    await expect(inlineEditor).toBeVisible();

    // Intentar editar segundo elemento mientras el primero está en edición
    const secondEditButton = page.locator('[aria-label*="Editar inline"]').nth(1);

    // El botón del segundo elemento debería estar deshabilitado o no visible
    if (await secondEditButton.isVisible()) {
      const isDisabled = await secondEditButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    }
  });

  test('should maintain form state during inline editing', async ({ page }) => {
    // Llenar otros campos del formulario
    await page.fill('input[name="nombre"]', 'Material de prueba');
    await page.fill('input[name="codigo"]', 'TEST-001');

    const categorySelect = page.locator('[role="combobox"]').first();
    await categorySelect.click();
    await page.waitForSelector('[role="option"]');

    const editButton = page.locator('[aria-label*="Editar inline"]').first();
    await editButton.click();

    const inlineEditor = page.locator('[data-testid="inline-editor"]');
    const nameInput = inlineEditor.locator('input').first();
    await nameInput.clear();
    await nameInput.fill('Categoría editada');

    // Cancelar edición
    await page.keyboard.press('Escape');

    // Verificar que los otros campos del formulario mantienen sus valores
    await expect(page.locator('input[name="nombre"]')).toHaveValue('Material de prueba');
    await expect(page.locator('input[name="codigo"]')).toHaveValue('TEST-001');
  });

  test('should work with presentaciones as well as categorias', async ({ page }) => {
    // Editar presentación en lugar de categoría
    const presentationSelect = page.locator('[role="combobox"]').nth(1);
    await presentationSelect.click();
    await page.waitForSelector('[role="option"]');

    const editButton = page.locator('[aria-label*="Editar inline"]').first();
    await editButton.click();

    const inlineEditor = page.locator('[data-testid="inline-editor"]');
    await expect(inlineEditor).toBeVisible();

    // Verificar que incluye campos adicionales de presentación
    const abbreviationInput = page.locator('input[placeholder*="abreviatura" i]');
    if (await abbreviationInput.isVisible()) {
      await abbreviationInput.fill('UN');
    }

    const saveButton = inlineEditor.locator('button:has-text("Guardar")');
    await saveButton.click();

    await expect(inlineEditor).not.toBeVisible();
  });

  test('should handle large data sets efficiently', async ({ page }) => {
    // Mock con muchos datos
    const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
      id: `cat-${i}`,
      nombre: `Categoría ${i}`,
      descripcion: `Descripción de la categoría ${i}`,
      nivel: 1
    }));

    await page.route('**/api/categorias', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeDataSet)
      });
    });

    await page.goto('/materia-prima/formulario');

    const categorySelect = page.locator('[role="combobox"]').first();
    await categorySelect.click();

    // Medir tiempo de carga
    const startTime = Date.now();
    await page.waitForSelector('[role="option"]');
    const loadTime = Date.now() - startTime;

    // Debería cargar en menos de 2 segundos incluso con 1000 elementos
    expect(loadTime).toBeLessThan(2000);

    // La edición debería seguir funcionando
    const editButton = page.locator('[aria-label*="Editar inline"]').first();
    await expect(editButton).toBeVisible();
  });
});