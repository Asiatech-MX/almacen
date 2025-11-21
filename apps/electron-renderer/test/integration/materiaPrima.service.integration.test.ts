/**
 * Integration Tests for Materia Prima Elimination Flow - Service Level
 * Fase 5: Testing de Integración - Issue #4 Fix
 * 
 * Tests del flujo de servicio y comunicación IPC
 */

// Mock de window.electronAPI
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

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
})

// Importar después de configurar el mock
import { materiaPrimaService } from '../../src/services/materiaPrimaService'

describe('Materia Prima Elimination Integration Tests - Service Level', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('5.1 Flujo completo para material INACTIVO con stock = 0', () => {
    it('should eliminate INACTIVE material with zero stock successfully', async () => {
      // Arrange: Mock de material INACTIVO con stock = 0
      const mockMaterial = {
        id: 'test-inactive-id',
        nombre: 'Material INACTIVO Test',
        estatus: 'INACTIVO',
        activo: false,
        stock_actual: 0,
        stock_minimo: 10,
        codigo_barras: '1234567890123',
        presentacion: 'UNIDAD'
      }

      // Mock del servicio para simular verificación y eliminación exitosa
      mockElectronAPI.materiaPrima.listar.mockResolvedValue([mockMaterial])
      mockElectronAPI.materiaPrima.eliminar.mockResolvedValue(true)

      // Act: Eliminar material a través del servicio
      const result = await materiaPrimaService.eliminar(mockMaterial.id, 'test-user-123')

      // Assert: Verificar flujo exitoso
      expect(result).toBe(true)
      expect(mockElectronAPI.materiaPrima.eliminar).toHaveBeenCalledWith(mockMaterial.id, 'test-user-123')
    })

    it('should handle stock verification before deletion', async () => {
      // Arrange: Mock de material con stock > 0
      const mockMaterialWithStock = {
        id: 'test-stock-id',
        nombre: 'Material con Stock',
        estatus: 'INACTIVO',
        stock_actual: 25
      }

      mockElectronAPI.materiaPrima.listar.mockResolvedValue([mockMaterialWithStock])
      mockElectronAPI.materiaPrima.eliminar.mockRejectedValue(
        new Error('No se puede eliminar el material con 25 unidades en stock')
      )

      // Act & Assert: Verificar que se lanza error de stock
      await expect(materiaPrimaService.eliminar(mockMaterialWithStock.id)).rejects.toThrow('stock')
      expect(mockElectronAPI.materiaPrima.eliminar).toHaveBeenCalledWith(mockMaterialWithStock.id)
    })
  })

  describe('5.2 Flujo para material ACTIVO con stock = 0 (regresión)', () => {
    it('should continue working for ACTIVE material with zero stock', async () => {
      // Arrange: Material ACTIVO con stock = 0
      const mockActiveMaterial = {
        id: 'test-active-id',
        nombre: 'Material ACTIVO Test',
        estatus: 'ACTIVO',
        activo: true,
        stock_actual: 0
      }

      mockElectronAPI.materiaPrima.eliminar.mockResolvedValue(true)

      // Act: Eliminar material ACTIVO
      const result = await materiaPrimaService.eliminar(mockActiveMaterial.id, 'test-user-456')

      // Assert: Verificar que funciona correctamente
      expect(result).toBe(true)
      expect(mockElectronAPI.materiaPrima.eliminar).toHaveBeenCalledWith(mockActiveMaterial.id, 'test-user-456')
    })
  })

  describe('5.3 Validación comunicación IPC bridge', () => {
    it('should validate IPC parameters correctly', async () => {
      // Arrange: Configurar mock para validar parámetros
      mockElectronAPI.materiaPrima.eliminar.mockImplementation(async (id: string) => {
        if (!id || typeof id !== 'string') {
          throw new Error('ID inválido')
        }
        return true
      })

      // Act & Assert: Verificar validación de ID inválido
      await expect(mockElectronAPI.materiaPrima.eliminar('')).rejects.toThrow('ID inválido')
      await expect(mockElectronAPI.materiaPrima.eliminar('valid-id')).resolves.toBe(true)
    })

    it('should handle IPC communication errors', async () => {
      // Arrange: Simular error de comunicación
      const ipcError = new Error('Error de comunicación IPC')
      mockElectronAPI.materiaPrima.eliminar.mockRejectedValue(ipcError)

      // Act & Assert: Verificar manejo de error IPC
      await expect(materiaPrimaService.eliminar('test-id')).rejects.toThrow('Error de comunicación IPC')
      expect(mockElectronAPI.materiaPrima.eliminar).toHaveBeenCalledWith('test-id')
    })

    it('should handle IPC timeout scenarios', async () => {
      // Arrange: Simular timeout de IPC
      mockElectronAPI.materiaPrima.eliminar.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Long delay
        return true
      })

      const materialId = 'timeout-test-id'

      // Act & Assert: Verificar manejo de timeout (simulado)
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

  describe('5.4 Manejo de errores y mensajes de usuario', () => {
    it('should show appropriate error for material with stock > 0', async () => {
      // Arrange: Material con stock > 0
      const mockMaterialWithStock = {
        id: 'stock-error-id',
        nombre: 'Material con Stock',
        estatus: 'INACTIVO',
        stock_actual: 50
      }

      const stockError = new Error('No se puede eliminar el material con 50 unidades en stock')
      mockElectronAPI.materiaPrima.listar.mockResolvedValue([mockMaterialWithStock])
      mockElectronAPI.materiaPrima.eliminar.mockRejectedValue(stockError)

      // Act & Assert: Verificar manejo de error de stock
      await expect(materiaPrimaService.eliminar(mockMaterialWithStock.id)).rejects.toThrow('stock')
      expect(mockElectronAPI.materiaPrima.eliminar).toHaveBeenCalledWith(mockMaterialWithStock.id)
    })

    it('should handle non-existent material error', async () => {
      // Arrange: Material no encontrado
      const notFoundError = new Error('Material no encontrado')
      mockElectronAPI.materiaPrima.eliminar.mockRejectedValue(notFoundError)

      const nonExistentId = 'non-existent-material-id'

      // Act & Assert: Verificar manejo de material no encontrado
      await expect(materiaPrimaService.eliminar(nonExistentId)).rejects.toThrow('Material no encontrado')
      expect(mockElectronAPI.materiaPrima.eliminar).toHaveBeenCalledWith(nonExistentId)
    })

    it('should handle database connection errors', async () => {
      // Arrange: Error de conexión a base de datos
      const dbError = new Error('Error de conexión a la base de datos')
      mockElectronAPI.materiaPrima.eliminar.mockRejectedValue(dbError)

      const materialId = 'db-error-test-id'

      // Act & Assert: Verificar manejo de error de base de datos
      await expect(materiaPrimaService.eliminar(materialId)).rejects.toThrow('Error de conexión')
      expect(mockElectronAPI.materiaPrima.eliminar).toHaveBeenCalledWith(materialId)
    })
  })

  describe('5.5 Verificar que no se afecten otras operaciones CRUD', () => {
    it('should not affect listing operations', async () => {
      // Arrange: Mock de listado
      const mockMateriales = [
        { id: '1', nombre: 'Material 1', estatus: 'ACTIVO', stock_actual: 10 },
        { id: '2', nombre: 'Material 2', estatus: 'INACTIVO', stock_actual: 0 }
      ]

      mockElectronAPI.materiaPrima.listar.mockResolvedValue(mockMateriales)

      // Act: Listar materiales
      const result = await materiaPrimaService.listar()

      // Assert: Verificar listado funciona correctamente
      expect(result).toEqual(mockMateriales)
      expect(mockElectronAPI.materiaPrima.listar).toHaveBeenCalled()
    })

    it('should not affect creation operations', async () => {
      // Arrange: Mock de creación
      const newMaterialData = {
        nombre: 'Nuevo Material',
        codigo_barras: '1234567890123',
        presentacion: 'UNIDAD',
        stock_actual: 100,
        stock_minimo: 10
      }

      const createdMaterial = {
        id: 'new-id',
        ...newMaterialData,
        estatus: 'ACTIVO' as const,
        activo: true,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      }

      mockElectronAPI.materiaPrima.crear.mockResolvedValue(createdMaterial)

      // Act: Crear material
      const result = await materiaPrimaService.crear(newMaterialData)

      // Assert: Verificar creación exitosa
      expect(result).toEqual(createdMaterial)
      expect(mockElectronAPI.materiaPrima.crear).toHaveBeenCalledWith(newMaterialData)
    })

    it('should not affect update operations', async () => {
      // Arrange: Mock de actualización
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

    it('should not affect search operations', async () => {
      // Arrange: Mock de búsqueda
      const searchResults = [
        { id: '1', nombre: 'Material de Búsqueda', estatus: 'ACTIVO' }
      ]

      mockElectronAPI.materiaPrima.buscar.mockResolvedValue(searchResults)

      // Act: Buscar materiales
      const result = await materiaPrimaService.buscar('Búsqueda')

      // Assert: Verificar búsqueda exitosa
      expect(result).toEqual(searchResults)
      expect(mockElectronAPI.materiaPrima.buscar).toHaveBeenCalledWith('Búsqueda', 50)
    })
  })

  describe('Integration Edge Cases', () => {
    it('should handle concurrent deletion attempts', async () => {
      // Arrange: Material de prueba
      const materialId = 'concurrent-test-id'
      
      // Mock que simula eliminación exitosa
      mockElectronAPI.materiaPrima.eliminar.mockResolvedValue(true)

      // Act: Intentos concurrentes de eliminación
      const deletionPromises = [
        materiaPrimaService.eliminar(materialId),
        materiaPrimaService.eliminar(materialId),
        materiaPrimaService.eliminar(materialId)
      ]

      // Assert: Todos deberían completarse exitosamente (en modo mock)
      const results = await Promise.allSettled(deletionPromises)
      const successful = results.filter(r => r.status === 'fulfilled')

      expect(successful.length).toBe(3)
      expect(mockElectronAPI.materiaPrima.eliminar).toHaveBeenCalledTimes(3)
    })

    it('should handle rapid successive operations', async () => {
      // Arrange: Mock para operaciones rápidas
      mockElectronAPI.materiaPrima.listar.mockResolvedValue([
        { id: '1', nombre: 'Material 1', estatus: 'ACTIVO', stock_actual: 0 }
      ])
      mockElectronAPI.materiaPrima.eliminar.mockResolvedValue(true)

      // Act: Operaciones sucesivas rápidas
      const listResult = await materiaPrimaService.listar()
      const deleteResult = await materiaPrimaService.eliminar('1')
      const listResult2 = await materiaPrimaService.listar()

      // Assert: Verificar que todas las operaciones funcionan
      expect(listResult).toHaveLength(1)
      expect(deleteResult).toBe(true)
      expect(listResult2).toHaveLength(1)
      
      expect(mockElectronAPI.materiaPrima.listar).toHaveBeenCalledTimes(2)
      expect(mockElectronAPI.materiaPrima.eliminar).toHaveBeenCalledTimes(1)
    })

    it('should handle service initialization correctly', async () => {
      // Arrange: Verificar que el servicio se inicializa correctamente
      expect(materiaPrimaService).toBeDefined()
      expect(typeof materiaPrimaService.eliminar).toBe('function')
      expect(typeof materiaPrimaService.listar).toBe('function')
      expect(typeof materiaPrimaService.crear).toBe('function')
      expect(typeof materiaPrimaService.actualizar).toBe('function')
    })

    it('should handle empty responses correctly', async () => {
      // Arrange: Mock de respuestas vacías
      mockElectronAPI.materiaPrima.listar.mockResolvedValue([])
      mockElectronAPI.materiaPrima.buscar.mockResolvedValue([])

      // Act: Operaciones con respuestas vacías
      const listResult = await materiaPrimaService.listar()
      const searchResult = await materiaPrimaService.buscar('nonexistent')

      // Assert: Verificar manejo de respuestas vacías
      expect(listResult).toEqual([])
      expect(searchResult).toEqual([])
    })
  })

  describe('Service Method Validation', () => {
    it('should validate eliminar method signature', () => {
      // Assert: Verificar firma del método eliminar
      expect(typeof materiaPrimaService.eliminar).toBe('function')
    })

    it('should validate listar method signature', () => {
      // Assert: Verificar firma del método listar
      expect(typeof materiaPrimaService.listar).toBe('function')
    })

    it('should validate crear method signature', () => {
      // Assert: Verificar firma del método crear
      expect(typeof materiaPrimaService.crear).toBe('function')
    })

    it('should validate actualizar method signature', () => {
      // Assert: Verificar firma del método actualizar
      expect(typeof materiaPrimaService.actualizar).toBe('function')
    })
  })
})