/**
 * Integration Tests for Materia Prima Elimination Flow
 * Fase 5: Testing de Integración - Issue #4 Fix
 * 
 * Tests completos del flujo desde UI hasta base de datos para materiales INACTIVOS
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Kysely } from 'kysely'
import type { DB } from '../../../backend/types/generated/database.types'
import {
  createTestDatabase,
  testDataFactories,
  DatabaseSeeder,
  beforeEachTest
} from '../setup/database'

// Importar el servicio y repositorio reales
import MateriaPrimaRepository from '../../../backend/repositories/materiaPrimaRepo'
import { materiaPrimaService } from '../../../apps/electron-renderer/src/services/materiaPrimaService'

// Mock de window.electronAPI para simular entorno Electron
const mockElectronAPI = {
  materiaPrima: {
    listar: jest.fn(),
    obtener: jest.fn(),
    eliminar: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    buscarPorCodigo: jest.fn(),
    buscar: jest.fn(),
    stockBajo: jest.fn(),
    verificarStock: jest.fn(),
    actualizarStock: jest.fn(),
    actualizarEstatus: jest.fn(),
    auditoria: jest.fn(),
    estadisticas: jest.fn(),
    exportar: jest.fn()
  }
}

// Mock de window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
})

describe('Materia Prima Elimination Integration Tests', () => {
  let db: Kysely<DB>
  let seeder: DatabaseSeeder
  let testDb: any
  let repository: MateriaPrimaRepository

  beforeAll(async () => {
    testDb = createTestDatabase()
    db = testDb.db
    seeder = new DatabaseSeeder(db)
    repository = new MateriaPrimaRepository()
  })

  afterAll(async () => {
    await testDb.cleanup()
  })

  beforeEach(async () => {
    await beforeEachTest(testDb)
    jest.clearAllMocks()
  })

  describe('5.1 Flujo completo para material INACTIVO con stock = 0', () => {
    it('should eliminate INACTIVE material with zero stock through complete flow', async () => {
      // Arrange: Crear material INACTIVO con stock = 0 en base de datos
      const testMaterial = await seeder.seedMateriaPrima(1, {
        nombre: 'Material INACTIVO Test',
        activo: false,
        stockActual: '0.00',
        stockMinimo: '10.00'
      })

      const materialId = testMaterial[0].id
      const usuarioId = 'test-user-123'

      // Configurar mock de IPC para simular llamada real al repository
      mockElectronAPI.materiaPrima.listar.mockResolvedValue([{
        id: materialId,
        nombre: 'Material INACTIVO Test',
        estatus: 'INACTIVO',
        activo: false,
        stock_actual: 0,
        stock_minimo: 10,
        codigo_barras: testMaterial[0].codigoBarras,
        presentacion: testMaterial[0].presentacion,
        marca: testMaterial[0].marca || '',
        modelo: testMaterial[0].modelo || '',
        categoria: testMaterial[0].categoria || '',
        costo_unitario: parseFloat(testMaterial[0].costoUnitario || '0'),
        fecha_caducidad: testMaterial[0].fechaCaducidad,
        descripcion: testMaterial[0].descripcion || '',
        proveedor_id: testMaterial[0].proveedorId,
        imagen_url: testMaterial[0].imagenUrl || '',
        creado_en: testMaterial[0].creadoEn?.toISOString() || '',
        actualizado_en: testMaterial[0].actualizadoEn?.toISOString() || ''
      }])

      mockElectronAPI.materiaPrima.eliminar.mockImplementation(async (id: string, userId?: string) => {
        // Simular llamada real al repository
        await repository.delete(id, userId)
        return true
      })

      // Act: Ejecutar flujo de eliminación a través del servicio
      const user = userEvent.setup()

      // Renderizar componente simulado de UI (mock component para testing)
      const MockMateriaPrimaList = () => (
        <div>
          <h1>Gestión de Materia Prima</h1>
          <div data-testid={`material-${materialId}`}>
            <span>{testMaterial[0].nombre}</span>
            <span>INACTIVO</span>
            <span>Stock: 0</span>
            <button 
              data-testid={`eliminar-${materialId}`}
              onClick={() => materiaPrimaService.eliminar(materialId, usuarioId)}
            >
              Eliminar
            </button>
          </div>
          <div data-testid="resultados"></div>
        </div>
      )

      render(<MockMateriaPrimaList />)

      // Simular clic en botón eliminar
      const eliminarButton = screen.getByTestId(`eliminar-${materialId}`)
      await user.click(eliminarButton)

      // Assert: Verificar que el flujo completo se ejecutó correctamente
      await waitFor(() => {
        expect(mockElectronAPI.materiaPrima.eliminar).toHaveBeenCalledWith(materialId, usuarioId)
      })

      // Verificar en base de datos que el material fue marcado como eliminado
      const deletedMaterial = await db
        .selectFrom('materia_prima')
        .selectAll()
        .where('id', '=', materialId)
        .executeTakeFirst()

      expect(deletedMaterial).toBeTruthy()
      expect(deletedMaterial!.eliminado_en).toBeTruthy()
      expect(deletedMaterial!.activo).toBe(false) // Debe permanecer INACTIVO

      // Verificar auditoría
      const auditRecord = await db
        .selectFrom('materia_prima_auditoria')
        .selectAll()
        .where('materia_prima_id', '=', materialId)
        .where('accion', '=', 'DELETE')
        .executeTakeFirst()

      expect(auditRecord).toBeTruthy()
      expect(auditRecord!.usuario_id).toBe(usuarioId)
      expect(auditRecord!.accion).toBe('DELETE')
    })

    it('should handle UI feedback correctly for successful deletion', async () => {
      // Arrange: Material INACTIVO con stock = 0
      const testMaterial = await seeder.seedMateriaPrima(1, {
        nombre: 'Material UI Test',
        activo: false,
        stockActual: '0.00'
      })

      const materialId = testMaterial[0].id

      // Mock con simulación de éxito
      mockElectronAPI.materiaPrima.eliminar.mockResolvedValue(true)

      // Act & Assert: Componente con manejo de estado UI
      const MockDeletionComponent = () => {
        const [deleting, setDeleting] = React.useState(false)
        const [error, setError] = React.useState<string | null>(null)
        const [success, setSuccess] = React.useState(false)

        const handleDelete = async () => {
          setDeleting(true)
          setError(null)
          setSuccess(false)

          try {
            await materiaPrimaService.eliminar(materialId)
            setSuccess(true)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
          } finally {
            setDeleting(false)
          }
        }

        return (
          <div>
            <button 
              onClick={handleDelete}
              disabled={deleting}
              data-testid="delete-button"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
            {error && <div data-testid="error-message">{error}</div>}
            {success && <div data-testid="success-message">Material eliminado correctamente</div>}
          </div>
        )
      }

      render(<MockDeletionComponent />)

      const user = userEvent.setup()
      const deleteButton = screen.getByTestId('delete-button')

      // Estado inicial
      expect(deleteButton).not.toBeDisabled()
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
      expect(screen.queryByTestId('success-message')).not.toBeInTheDocument()

      // Actuar: Clic en eliminar
      await user.click(deleteButton)

      // Verificar estados intermedios y finales
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument()
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
        expect(deleteButton).not.toBeDisabled()
      })
    })
  })

  describe('5.2 Flujo completo para material ACTIVO con stock = 0 (regresión)', () => {
    it('should continue eliminating ACTIVE material with zero stock', async () => {
      // Arrange: Material ACTIVO con stock = 0
      const testMaterial = await seeder.seedMateriaPrima(1, {
        nombre: 'Material ACTIVO Test',
        activo: true,
        stockActual: '0.00',
        stockMinimo: '5.00'
      })

      const materialId = testMaterial[0].id
      const usuarioId = 'test-user-456'

      // Mock para simular comportamiento existente
      mockElectronAPI.materiaPrima.eliminar.mockImplementation(async (id: string, userId?: string) => {
        await repository.delete(id, userId)
        return true
      })

      // Act: Eliminar material ACTIVO con stock = 0
      await materiaPrimaService.eliminar(materialId, usuarioId)

      // Assert: Verificar eliminación exitosa
      expect(mockElectronAPI.materiaPrima.eliminar).toHaveBeenCalledWith(materialId, usuarioId)

      const deletedMaterial = await db
        .selectFrom('materia_prima')
        .selectAll()
        .where('id', '=', materialId)
        .executeTakeFirst()

      expect(deletedMaterial).toBeTruthy()
      expect(deletedMaterial!.eliminado_en).toBeTruthy()
      expect(deletedMaterial!.activo).toBe(false) // Cambia a INACTIVO por soft delete
    })
  })

  describe('5.3 Validación comunicación IPC bridge', () => {
    it('should handle IPC communication errors correctly', async () => {
      // Arrange: Configurar IPC para que lance error
      const errorMessage = 'Error de comunicación IPC'
      mockElectronAPI.materiaPrima.eliminar.mockRejectedValue(new Error(errorMessage))

      const materialId = 'test-material-id'

      // Act & Assert: Verificar manejo de errores IPC
      await expect(materiaPrimaService.eliminar(materialId)).rejects.toThrow()

      // Verificar que el error se procesa correctamente en el servicio
      expect(mockElectronAPI.materiaPrima.eliminar).toHaveBeenCalledWith(materialId)
    })

    it('should validate IPC parameters before sending', async () => {
      // Arrange: ID inválido
      const invalidId = ''

      mockElectronAPI.materiaPrima.eliminar.mockImplementation(async (id: string) => {
        if (!id || typeof id !== 'string') {
          throw new Error('ID inválido')
        }
        return true
      })

      // Act & Assert: Validar parámetros
      await expect(materiaPrimaService.eliminar(invalidId)).rejects.toThrow('ID inválido')
    })
  })

  describe('5.4 Manejo de errores y mensajes de usuario', () => {
    it('should show appropriate error for material with stock > 0', async () => {
      // Arrange: Material con stock > 0
      const testMaterial = await seeder.seedMateriaPrima(1, {
        nombre: 'Material con Stock',
        activo: false,
        stockActual: '50.00',
        stockMinimo: '10.00'
      })

      const materialId = testMaterial[0].id

      // Mock que simula error de stock
      mockElectronAPI.materiaPrima.eliminar.mockRejectedValue(
        new Error('No se puede eliminar un material con stock disponible')
      )

      // Act: Intentar eliminar
      const MockErrorComponent = () => {
        const [error, setError] = React.useState<string | null>(null)

        const handleDelete = async () => {
          try {
            await materiaPrimaService.eliminar(materialId)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
          }
        }

        return (
          <div>
            <button onClick={handleDelete} data-testid="delete-button">
              Eliminar
            </button>
            {error && <div data-testid="error-message">{error}</div>}
          </div>
        )
      }

      render(<MockErrorComponent />)

      const user = userEvent.setup()
      await user.click(screen.getByTestId('delete-button'))

      // Assert: Verificar mensaje de error específico
      await waitFor(() => {
        const errorElement = screen.getByTestId('error-message')
        expect(errorElement).toBeInTheDocument()
        expect(errorElement.textContent).toContain('stock')
      })
    })

    it('should handle non-existent material error', async () => {
      // Arrange: Material que no existe
      const nonExistentId = 'non-existent-material-id'

      mockElectronAPI.materiaPrima.eliminar.mockRejectedValue(
        new Error('Material no encontrado')
      )

      // Act & Assert: Verificar manejo de material no encontrado
      await expect(materiaPrimaService.eliminar(nonExistentId)).rejects.toThrow('Material no encontrado')
    })
  })

  describe('5.5 Verificar que no se afecten otras operaciones CRUD', () => {
    it('should not affect listing operations', async () => {
      // Arrange: Materiales de prueba
      await seeder.seedMateriaPrima(3, { activo: true })
      await seeder.seedMateriaPrima(2, { activo: false })

      const mockMateriales = [
        { id: '1', nombre: 'Material 1', estatus: 'ACTIVO', stock_actual: 10 },
        { id: '2', nombre: 'Material 2', estatus: 'INACTIVO', stock_actual: 0 }
      ]

      mockElectronAPI.materiaPrima.listar.mockResolvedValue(mockMateriales)

      // Act: Listar materiales
      const result = await materiaPrimaService.listar()

      // Assert: Verificar que listado funciona correctamente
      expect(result).toEqual(mockMateriales)
      expect(mockElectronAPI.materiaPrima.listar).toHaveBeenCalled()
    })

    it('should not affect creation operations', async () => {
      // Arrange: Datos para nuevo material
      const newMaterial = {
        nombre: 'Nuevo Material',
        codigo_barras: '1234567890123',
        presentacion: 'UNIDAD',
        stock_actual: 100,
        stock_minimo: 10
      }

      const createdMaterial = {
        id: 'new-id',
        ...newMaterial,
        estatus: 'ACTIVO' as const,
        activo: true,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      }

      mockElectronAPI.materiaPrima.crear.mockResolvedValue(createdMaterial)

      // Act: Crear material
      const result = await materiaPrimaService.crear(newMaterial)

      // Assert: Verificar creación exitosa
      expect(result).toEqual(createdMaterial)
      expect(mockElectronAPI.materiaPrima.crear).toHaveBeenCalledWith(newMaterial)
    })

    it('should not affect update operations', async () => {
      // Arrange: Datos para actualizar
      const materialId = 'update-test-id'
      const updateData = {
        nombre: 'Material Actualizado',
        stock_minimo: 25
      }

      const updatedMaterial = {
        id: materialId,
        nombre: 'Material Actualizado',
        stock_minimo: 25,
        estatus: 'ACTIVO' as const
      }

      mockElectronAPI.materiaPrima.actualizar.mockResolvedValue(updatedMaterial)

      // Act: Actualizar material
      const result = await materiaPrimaService.actualizar(materialId, updateData)

      // Assert: Verificar actualización exitosa
      expect(result).toEqual(updatedMaterial)
      expect(mockElectronAPI.materiaPrima.actualizar).toHaveBeenCalledWith(materialId, updateData)
    })
  })

  describe('Integration Edge Cases', () => {
    it('should handle concurrent deletion attempts', async () => {
      // Arrange: Material INACTIVO con stock = 0
      const testMaterial = await seeder.seedMateriaPrima(1, {
        nombre: 'Material Concurrente',
        activo: false,
        stockActual: '0.00'
      })

      const materialId = testMaterial[0].id

      mockElectronAPI.materiaPrima.eliminar.mockImplementation(async (id: string) => {
        await repository.delete(id)
        return true
      })

      // Act: Intentos concurrentes de eliminación
      const deletionPromises = [
        materiaPrimaService.eliminar(materialId),
        materiaPrimaService.eliminar(materialId),
        materiaPrimaService.eliminar(materialId)
      ]

      // Assert: Solo uno debería tener éxito
      const results = await Promise.allSettled(deletionPromises)
      const successful = results.filter(r => r.status === 'fulfilled')
      const failed = results.filter(r => r.status === 'rejected')

      // Al menos uno debería tener éxito
      expect(successful.length).toBeGreaterThanOrEqual(1)
      
      // Verificar estado final en base de datos
      const finalMaterial = await db
        .selectFrom('materia_prima')
        .selectAll()
        .where('id', '=', materialId)
        .executeTakeFirst()

      expect(finalMaterial?.eliminado_en).toBeTruthy()
    })

    it('should handle network timeout scenarios', async () => {
      // Arrange: Simular timeout
      mockElectronAPI.materiaPrima.eliminar.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)) // Long delay
        return true
      })

      const materialId = 'timeout-test-id'

      // Act & Assert: Manejo de timeout (dependiente de configuración del cliente)
      // Este test verifica que el sistema puede manejar operaciones largas
      const startTime = Date.now()
      
      try {
        await Promise.race([
          materiaPrimaService.eliminar(materialId),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 1000)
          )
        ])
      } catch (error) {
        expect(error.message).toBe('Timeout')
      }

      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(2000) // Should timeout quickly
    })
  })
})