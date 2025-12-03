import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Testing - Inline Editing System', () => {
  test.beforeEach(async ({ page }) => {
    // Mockear datos de prueba
    await page.goto('/materia-prima/formulario');

    // Mock de API responses
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
          },
          {
            id: '2',
            nombre: 'Caja',
            abreviatura: 'caja',
            unidad_base: 'unidad',
            factor_conversion: 24
          }
        ])
      });
    });
  });

  test('should not have any automatically detectable accessibility issues on main page', async ({ page }) => {
    await page.goto('/materia-prima/formulario');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should meet WCAG 2.1 AA standards for DynamicSelect component', async ({ page }) => {
    await page.goto('/materia-prima/formulario');

    // Esperar a que el componente esté cargado
    await page.waitForSelector('[role="combobox"]');

    // Analizar accesibilidad del componente DynamicSelect
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="combobox"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Verificar atributos ARIA específicos
    const combobox = page.locator('[role="combobox"]').first();
    await expect(combobox).toHaveAttribute('aria-label');
    await expect(combobox).toHaveAttribute('aria-required');
  });

  test('should handle keyboard navigation correctly', async ({ page }) => {
    await page.goto('/materia-prima/formulario');

    // Tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Enter/Spcace to open dropdown
    await page.keyboard.press('Enter');
    await expect(page.locator('[role="listbox"]')).toBeVisible();

    // Arrow navigation
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    // Enter to select
    await page.keyboard.press('Enter');
    await expect(page.locator('[role="listbox"]')).not.toBeVisible();
  });

  test('should support screen readers with proper ARIA live regions', async ({ page }) => {
    await page.goto('/materia-prima/formulario');

    // Activar edición inline
    const categorySelect = page.locator('[role="combobox"]').first();
    await categorySelect.click();

    // Esperar opciones
    await page.waitForSelector('[role="option"]');

    // Activar edición inline en primer elemento
    const editButton = page.locator('[aria-label*="Editar"]').first();
    await editButton.click();

    // Verificar que hay elementos con aria-live para screen readers
    const liveRegions = await page.locator('[aria-live]').count();
    expect(liveRegions).toBeGreaterThan(0);
  });

  test('should maintain focus management during inline editing', async ({ page }) => {
    await page.goto('/materia-prima/formulario');

    // Iniciar edición inline
    const categorySelect = page.locator('[role="combobox"]').first();
    await categorySelect.click();
    await page.waitForSelector('[role="option"]');

    const editButton = page.locator('[aria-label*="Editar"]').first();
    await editButton.click();

    // Verificar que el foco está dentro del editor inline
    const inlineEditor = page.locator('[data-testid="inline-editor"]');
    await expect(inlineEditor).toBeVisible();

    // El foco debería estar en el input del editor
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Escape debería cancelar edición y devolver foco
    await page.keyboard.press('Escape');
    await expect(inlineEditor).not.toBeVisible();
  });

  test('should provide sufficient color contrast', async ({ page }) => {
    await page.goto('/materia-prima/formulario');

    // Analizar contraste de colores
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    // Filtrar violaciones de contraste
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('should handle form validation accessibility', async ({ page }) => {
    await page.goto('/materia-prima/formulario');

    // Intentar enviar formulario vacío
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Verificar mensajes de error accesibles
    const errorMessages = page.locator('[role="alert"]');
    await expect(errorMessages).toHaveCount.toBeGreaterThan(0);

    // Verificar que los mensajes de error están asociados con los campos correctos
    const firstError = errorMessages.first();
    const errorId = await firstError.getAttribute('id');

    if (errorId) {
      const associatedField = page.locator(`[aria-describedby="${errorId}"]`);
      await expect(associatedField).toHaveCount.toBeGreaterThan(0);
    }
  });

  test('should support high contrast mode', async ({ page }) => {
    // Simular modo de alto contraste
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });

    await page.goto('/materia-prima/formulario');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be accessible with reduced motion', async ({ page }) => {
    // Emular preferencia de movimiento reducido
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/materia-prima/formulario');

    // Realizar operaciones que normalmente tienen animaciones
    const categorySelect = page.locator('[role="combobox"]').first();
    await categorySelect.click();

    const editButton = page.locator('[aria-label*="Editar"]').first();
    await editButton.click();

    // Verificar que no hay violaciones de accesibilidad
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should provide proper touch target sizes for mobile', async ({ page }) => {
    // Simular dispositivo móvil
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/materia-prima/formulario');

    // Verificar que los botones interactivos tienen tamaño mínimo de 44px
    const interactiveElements = page.locator('button, [role="button"], input, select, textarea');
    const elementsCount = await interactiveElements.count();

    for (let i = 0; i < elementsCount; i++) {
      const element = interactiveElements.nth(i);
      const boundingBox = await element.boundingBox();

      if (boundingBox) {
        // Verificar que al menos una dimensión sea >= 44px
        expect(
          boundingBox.width >= 44 || boundingBox.height >= 44
        ).toBeTruthy();
      }
    }
  });

  test('should handle multi-level form navigation', async ({ page }) => {
    await page.goto('/materia-prima/formulario');

    // Navegación con teclado entre campos del formulario
    await page.keyboard.press('Tab'); // Primer campo
    let focusedElement = await page.locator(':focus');
    expect(focusedElement).toBeVisible();

    await page.keyboard.press('Tab'); // Segundo campo
    focusedElement = await page.locator(':focus');
    expect(focusedElement).toBeVisible();

    // Shift+Tab para navegar hacia atrás
    await page.keyboard.press('Shift+Tab');
    focusedElement = await page.locator(':focus');
    expect(focusedElement).toBeVisible();
  });

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/materia-prima/formulario');

    // Crear nueva categoría para generar contenido dinámico
    const categorySelect = page.locator('[role="combobox"]').first();
    await categorySelect.click();

    const input = categorySelect.locator('input');
    await input.fill('Nueva categoría de prueba');
    await page.keyboard.press('Enter');

    // Esperar a que se complete la operación
    await page.waitForTimeout(1000);

    // Verificar que hay regiones aria-live para anunciar cambios
    const liveRegions = page.locator('[aria-live="polite"], [aria-live="assertive"]');
    const liveRegionCount = await liveRegions.count();
    expect(liveRegionCount).toBeGreaterThan(0);
  });
});