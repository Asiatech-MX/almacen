import { test, expect } from '@playwright/test'
import { Application } from 'spectron'
import path from 'path'
import fs from 'fs'

// Configuración para la aplicación Electron
const appPath = path.join(__dirname, '../../../dist/electron-renderer/main.js')

// Si el ejecutable no existe, usar el modo de desarrollo
const isDevMode = !fs.existsSync(appPath)
const electronBinary = isDevMode ?
  path.join(__dirname, '../../../node_modules/.bin/electron') :
  appPath

const appArgs = isDevMode ? [path.join(__dirname, '../../src/main.tsx')] : []

test.describe('Material Management E2E Tests', () => {
  let app: Application

  test.beforeAll(async () => {
    // Iniciar la aplicación Electron
    app = new Application({
      path: electronBinary,
      args: appArgs,
      env: {
        NODE_ENV: 'test',
        ELECTRON_IS_DEV: isDevMode ? '1' : '0'
      },
      startTimeout: 30000,
      waitTimeout: 30000
    })

    await app.start()
  })

  test.afterAll(async () => {
    if (app && app.isRunning()) {
      await app.stop()
    }
  })

  test.beforeEach(async () => {
    // Esperar a que la aplicación esté completamente cargada
    await app.client.waitUntilWindowLoaded()
    await app.client.pause(1000) // Pequeña pausa para asegurar estabilidad
  })

  test('should load material management screen', async () => {
    // Navegar a la gestión de materiales
    await app.client.click('[data-testid="nav-materiales"]')
    await app.client.waitForVisible('[data-testid="materiales-screen"]')

    // Verificar elementos principales
    await expect(app.client.isExisting('[data-testid="materiales-list"]')).resolves.toBe(true)
    await expect(app.client.isExisting('[data-testid="add-material-btn"]')).resolves.toBe(true)
  })

  test('should create new material with new category and presentation', async () => {
    // Navegar a crear material
    await app.client.click('[data-testid="add-material-btn"]')
    await app.client.waitForVisible('[data-testid="material-form"]')

    // Llenar formulario básico
    await app.client.setValue('[data-testid="material-code"]', 'MAT-TEST-001')
    await app.client.setValue('[data-testid="material-name"]', 'Material de Prueba E2E')
    await app.client.setValue('[data-testid="material-description"]', 'Descripción para testing E2E')
    await app.client.setValue('[data-testid="material-stock-min"]', '10')
    await app.client.setValue('[data-testid="material-cost"]', '150.50')

    // Crear nueva categoría
    await app.client.click('[data-testid="categoria-select"]')
    await app.client.click('[data-testid="categoria-add-new"]')
    await app.client.waitForVisible('[data-testid="categoria-modal"]')

    await app.client.setValue('[data-testid="new-categoria-name"]', 'Categoría E2E')
    await app.client.click('[data-testid="save-categoria-btn"]')

    // Esperar a que se cierre el modal y la nueva categoría aparezca
    await app.client.waitForVisible('[data-testid="categoria-modal"]', 10000, true)
    await app.client.waitForVisible('[data-testid="categoria-select"]')

    // Crear nueva presentación
    await app.client.click('[data-testid="presentacion-select"]')
    await app.client.click('[data-testid="presentacion-add-new"]')
    await app.client.waitForVisible('[data-testid="presentacion-modal"]')

    await app.client.setValue('[data-testid="new-presentacion-name"]', 'Presentación E2E')
    await app.client.setValue('[data-testid="new-presentacion-abbr"]', 'E2E')
    await app.client.click('[data-testid="save-presentacion-btn"]')

    // Esperar a que se cierre el modal
    await app.client.waitForVisible('[data-testid="presentacion-modal"]', 10000, true)

    // Seleccionar proveedor
    await app.client.click('[data-testid="proveedor-select"]')
    await app.client.click('[data-testid="proveedor-option-0"]') // Primer proveedor

    // Guardar material
    await app.client.click('[data-testid="save-material-btn"]')

    // Verificar éxito
    await app.client.waitForVisible('[data-testid="success-toast"]')
    const toastText = await app.client.getText('[data-testid="success-toast"]')
    expect(toastText).toContain('Material creado exitosamente')

    // Verificar que el material aparece en la lista
    await app.client.waitForVisible('[data-testid="materiales-screen"]')
    await expect(app.client.isExisting('[data-testid="material-MAT-TEST-001"]')).resolves.toBe(true)
  })

  test('should edit existing material', async () => {
    // Navegar a la lista de materiales
    await app.client.click('[data-testid="nav-materiales"]')
    await app.client.waitForVisible('[data-testid="materiales-list"]')

    // Buscar y seleccionar el material creado
    await app.client.click('[data-testid="material-MAT-TEST-001"]')
    await app.client.waitForVisible('[data-testid="material-detail"]')

    // Click en editar
    await app.client.click('[data-testid="edit-material-btn"]')
    await app.client.waitForVisible('[data-testid="material-form"]')

    // Modificar algunos campos
    await app.client.clearElement('[data-testid="material-name"]')
    await app.client.setValue('[data-testid="material-name"]', 'Material Editado E2E')
    await app.client.clearElement('[data-testid="material-stock-min"]')
    await app.client.setValue('[data-testid="material-stock-min"]', '20')

    // Guardar cambios
    await app.client.click('[data-testid="save-material-btn"]')

    // Verificar éxito
    await app.client.waitForVisible('[data-testid="success-toast"]')
    await app.client.waitForVisible('[data-testid="material-detail"]')

    // Verificar que los cambios se reflejen
    const materialName = await app.client.getText('[data-testid="material-name-display"]')
    expect(materialName).toBe('Material Editado E2E')
  })

  test('should handle real-time category updates across components', async () => {
    // Abrir dos vistas que usan categorías
    await app.client.click('[data-testid="nav-materiales"]')
    await app.client.click('[data-testid="add-material-btn"]')

    // Abrir gestión de categorías en una nueva ventana/pestaña (si la app lo permite)
    // o navegar a la sección de categorías
    await app.client.click('[data-testid="nav-categorias"]')
    await app.client.waitForVisible('[data-testid="categorias-screen"]')

    // Crear nueva categoría desde la gestión de categorías
    await app.client.click('[data-testid="add-categoria-btn"]')
    await app.client.setValue('[data-testid="categoria-name"]', 'Categoría Sincrónica')
    await app.client.click('[data-testid="save-categoria-btn"]')

    // Volver al formulario de material
    await app.client.click('[data-testid="nav-materiales"]')
    await app.client.click('[data-testid="add-material-btn"]')

    // Verificar que la nueva categoría está disponible sin recargar
    await app.client.click('[data-testid="categoria-select"]')
    await expect(app.client.isExisting('[data-testid="categoria-Categoría Sincrónica"]')).resolves.toBe(true)
  })

  test('should handle optimistic updates and rollback on error', async () => {
    // Mock para simular error de red
    await app.client.execute((errorSimulation) => {
      // Inyectar código para simular error en la próxima creación
      window.__SIMULATE_ERROR__ = errorSimulation
    }, true)

    // Intentar crear categoría que fallará
    await app.client.click('[data-testid="nav-materiales"]')
    await app.client.click('[data-testid="add-material-btn"]')

    await app.client.click('[data-testid="categoria-select"]')
    await app.client.click('[data-testid="categoria-add-new"]')
    await app.client.waitForVisible('[data-testid="categoria-modal"]')

    await app.client.setValue('[data-testid="new-categoria-name"]', 'Categoría Fallida')
    await app.client.click('[data-testid="save-categoria-btn"]')

    // Verificar que aparece mensaje de error
    await app.client.waitForVisible('[data-testid="error-toast"]')

    // Verificar que el modal permanece abierto (rollback)
    await expect(app.client.isExisting('[data-testid="categoria-modal"]')).resolves.toBe(true)
    await expect(app.client.getValue('[data-testid="new-categoria-name"]')).resolves.toBe('Categoría Fallida')
  })

  test('should handle concurrent category creation', async () => {
    // Escenario: Dos usuarios crean categorías simultáneamente
    // Simulado abriendo dos formularios rápidamente

    await app.client.click('[data-testid="nav-materiales"]')

    // Primer formulario
    await app.client.click('[data-testid="add-material-btn"]')
    await app.client.waitForVisible('[data-testid="material-form"]')

    // Abrir segundo formulario (si la app lo permite)
    await app.client.click('[data-testid="add-another-material-btn"]') // Botón hipotético

    // En ambos formularios, intentar crear categorías con el mismo nombre
    await app.client.windowByIndex(0)
    await app.client.click('[data-testid="categoria-select"]')
    await app.client.click('[data-testid="categoria-add-new"]')
    await app.client.setValue('[data-testid="new-categoria-name"]', 'Categoría Duplicada')

    await app.client.windowByIndex(1)
    await app.client.click('[data-testid="categoria-select"]')
    await app.client.click('[data-testid="categoria-add-new"]')
    await app.client.setValue('[data-testid="new-categoria-name"]', 'Categoría Duplicada')

    // Intentar guardar en ambos
    await app.client.windowByIndex(0)
    await app.client.click('[data-testid="save-categoria-btn"]')

    await app.client.windowByIndex(1)
    await app.client.click('[data-testid="save-categoria-btn"]')

    // Verificar manejo de conflicto
    await app.client.waitForVisible('[data-testid="conflict-toast"]', 10000)
  })

  test('should maintain state during page refresh/reload', async () => {
    // Llenar parcialmente un formulario
    await app.client.click('[data-testid="nav-materiales"]')
    await app.client.click('[data-testid="add-material-btn"]')

    await app.client.setValue('[data-testid="material-code"]', 'MAT-PERSIST-001')
    await app.client.setValue('[data-testid="material-name"]', 'Material Persistente')

    // Simular recarga de página (en Electron sería reiniciar la ventana)
    await app.client.refresh()

    // Verificar que se puede restaurar el estado o mostrar advertencia
    await expect(app.client.isExisting('[data-testid="unsaved-changes-warning"]')).resolves.toBe(true)

    // Opcionalmente, permitir restaurar
    if (await app.client.isExisting('[data-testid="restore-draft-btn"]')) {
      await app.client.click('[data-testid="restore-draft-btn"]')

      const code = await app.client.getValue('[data-testid="material-code"]')
      const name = await app.client.getValue('[data-testid="material-name"]')

      expect(code).toBe('MAT-PERSIST-001')
      expect(name).toBe('Material Persistente')
    }
  })

  test('should handle batch operations with caching', async () => {
    // Escenario: Crear múltiples categorías rápidamente
    const categorias = ['Categoría Batch 1', 'Categoría Batch 2', 'Categoría Batch 3']

    for (const categoriaName of categorias) {
      await app.client.click('[data-testid="nav-categorias"]')
      await app.client.click('[data-testid="add-categoria-btn"]')
      await app.client.setValue('[data-testid="categoria-name"]', categoriaName)
      await app.client.click('[data-testid="save-categoria-btn"]')
      await app.client.waitForVisible('[data-testid="categoria-modal"]', 5000, true)
    }

    // Verificar que todas las categorías están en la lista
    await app.client.click('[data-testid="nav-materiales"]')
    await app.client.click('[data-testid="add-material-btn"]')
    await app.client.click('[data-testid="categoria-select"]')

    for (const categoriaName of categorias) {
      await expect(app.client.isExisting(`[data-testid="categoria-${categoriaName}"]`)).resolves.toBe(true)
    }
  })

  test('should handle offline/online scenarios', async () => {
    // Simular modo offline
    await app.client.execute(() => {
      window.navigator.__defineGetter__('onLine', () => false)
      window.dispatchEvent(new Event('offline'))
    })

    // Intentar crear categoría
    await app.client.click('[data-testid="nav-materiales"]')
    await app.client.click('[data-testid="add-material-btn"]')
    await app.client.click('[data-testid="categoria-select"]')
    await app.client.click('[data-testid="categoria-add-new"]')
    await app.client.setValue('[data-testid="new-categoria-name"]', 'Categoría Offline')
    await app.client.click('[data-testid="save-categoria-btn"]')

    // Debería mostrar indicador de modo offline
    await expect(app.client.isExisting('[data-testid="offline-indicator"]')).resolves.toBe(true)

    // Simular vuelta a conexión
    await app.client.execute(() => {
      window.navigator.__defineGetter__('onLine', () => true)
      window.dispatchEvent(new Event('online'))
    })

    // Debería sincronizar automáticamente
    await app.client.waitForVisible('[data-testid="syncing-indicator"]')
    await app.client.waitForVisible('[data-testid="sync-complete"]', 10000, true)
  })

  test('should validate form constraints and business rules', async () => {
    await app.client.click('[data-testid="nav-materiales"]')
    await app.client.click('[data-testid="add-material-btn"]')

    // Intentar enviar formulario vacío
    await app.client.click('[data-testid="save-material-btn"]')

    // Verificar validaciones
    await expect(app.client.isExisting('[data-testid="error-code-required"]')).resolves.toBe(true)
    await expect(app.client.isExisting('[data-testid="error-name-required"]')).resolves.toBe(true)
    await expect(app.client.isExisting('[data-testid="error-categoria-required"]')).resolves.toBe(true)

    // Intentar código duplicado
    await app.client.setValue('[data-testid="material-code"]', 'MAT-001') // Suponiendo que ya existe
    await app.client.click('[data-testid="save-material-btn"]')
    await expect(app.client.isExisting('[data-testid="error-code-duplicate"]')).resolves.toBe(true)
  })
})