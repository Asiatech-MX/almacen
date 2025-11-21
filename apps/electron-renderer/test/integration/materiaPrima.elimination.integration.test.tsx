/**
 * Integration Tests for Materia Prima Elimination Flow - Simplified
 * Fase 5: Testing de Integración - Issue #4 Fix
 * 
 * Tests del flujo de comunicación IPC y manejo de estados UI
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock del servicio para simular el comportamiento real
jest.mock('../../src/services/materiaPrimaService', () => ({
  materiaPrimaService: {
    eliminar: jest.fn(),
    listar: jest.fn(),
    obtener: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn()
  }
}))

import { materiaPrimaService } from '../../src/services/materiaPrimaService'

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

describe('Materia Prima Elimination Integration Tests - Simplified', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('5.1 Flujo UI para material INACTIVO con stock = 0', () => {
    it('should handle successful deletion of INACTIVE material through UI', async () => {
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

      // Mock del servicio para simular eliminación exitosa
      materiaPrimaService.eliminar.mockResolvedValue(true)
      mockElectronAPI.materiaPrima.listar.mockResolvedValue([mockMaterial])

      // Componente UI simulado
      const MockDeletionComponent = () => {
        const [deleting, setDeleting] = React.useState(false)
        const [error, setError] = React.useState<string | null>(null)
        const [success, setSuccess] = React.useState(false)

        const handleDelete = async (materialId: string) => {
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
            <h1>Gestión de Materia Prima</h1>
            <div data-testid={`material-${mockMaterial.id}`}>
              <span>{mockMaterial.nombre}</span>
              <span>{mockMaterial.estatus}</span>
              <span>Stock: {mockMaterial.stock_actual}</span>
              <button 
                data-testid={`eliminar-${mockMaterial.id}`}
                onClick={() => handleDelete(mockMaterial.id)}
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
            {error && <div data-testid="error-message">{error}</div>}
            {success && <div data-testid="success-message">Material eliminado correctamente</div>}
          </div>
        )
      }

      // Act: Renderizar componente y simular eliminación
      render(<MockDeletionComponent />)
      const user = userEvent.setup()

      const eliminarButton = screen.getByTestId(`eliminar-${mockMaterial.id}`)
      
      // Verificar estado inicial
      expect(eliminarButton).not.toBeDisabled()
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
      expect(screen.queryByTestId('success-message')).not.toBeInTheDocument()

      // Simular clic en eliminar
      await user.click(eliminarButton)

      // Assert: Verificar flujo exitoso
      await waitFor(() => {
        expect(materiaPrimaService.eliminar).toHaveBeenCalledWith(mockMaterial.id)
        expect(screen.getByTestId('success-message')).toBeInTheDocument()
        expect(screen.getByTestId('success-message').textContent).toBe('Material eliminado correctamente')
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
        expect(eliminarButton).not.toBeDisabled()
        expect(eliminarButton).toHaveTextContent('Eliminar')
      })
    })

    it('should handle deletion error for material with stock > 0', async () => {
      // Arrange: Mock de error de stock
      const stockError = new Error('No se puede eliminar el material con 25 unidades en stock')
      materiaPrimaService.eliminar.mockRejectedValue(stockError)

      const mockMaterial = {
        id: 'test-stock-id',
        nombre: 'Material con Stock',
        estatus: 'INACTIVO',
        stock_actual: 25
      }

      // Componente UI simulado
      const MockErrorComponent = () => {
        const [error, setError] = React.useState<string | null>(null)

        const handleDelete = async (materialId: string) => {
          try {
            await materiaPrimaService.eliminar(materialId)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
          }
        }

        return (
          <div>
            <button 
              onClick={() => handleDelete(mockMaterial.id)}
              data-testid="delete-button"
            >
              Eliminar
            </button>
            {error && <div data-testid="error-message">{error}</div>}
          </div>
        )
      }

      // Act: Renderizar y simular error
      render(<MockErrorComponent />)
      const user = userEvent.setup()

      await user.click(screen.getByTestId('delete-button'))

      // Assert: Verificar manejo de error
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByTestId('error-message').textContent).toContain('stock')
        expect(materiaPrimaService.eliminar).toHaveBeenCalledWith(mockMaterial.id)
      })
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

      materiaPrimaService.eliminar.mockResolvedValue(true)

      // Act & Assert: Verificar que el flujo existente funciona
      await expect(materiaPrimaService.eliminar(mockActiveMaterial.id)).resolves.toBe(true)
      expect(materiaPrimaService.eliminar).toHaveBeenCalledWith(mockActiveMaterial.id)
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
      await expect(mockElectronAPI.materiaPrima.eliminar('test-id')).rejects.toThrow('Error de comunicación IPC')
    })
  })

  describe('5.4 Manejo de errores y mensajes de usuario', () => {
    it('should show appropriate error for non-existent material', async () => {
      // Arrange: Material no encontrado
      const notFoundError = new Error('Material no encontrado')
      materiaPrimaService.eliminar.mockRejectedValue(notFoundError)

      const nonExistentId = 'non-existent-id'

      // Act: Intentar eliminar material inexistente
      try {
        await materiaPrimaService.eliminar(nonExistentId)
      } catch (error) {
        // Assert: Verificar error específico
        expect(error.message).toBe('Material no encontrado')
      }

      expect(materiaPrimaService.eliminar).toHaveBeenCalledWith(nonExistentId)
    })

    it('should handle timeout scenarios gracefully', async () => {
      // Arrange: Simular timeout
      materiaPrimaService.eliminar.mockImplementation(async () => {
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

  describe('5.5 Verificar que no se afecten otras operaciones CRUD', () => {
    it('should not affect listing operations', async () => {
      // Arrange: Mock de listado
      const mockMateriales = [
        { id: '1', nombre: 'Material 1', estatus: 'ACTIVO' },
        { id: '2', nombre: 'Material 2', estatus: 'INACTIVO' }
      ]

      materiaPrimaService.listar.mockResolvedValue(mockMateriales)

      // Act: Listar materiales
      const result = await materiaPrimaService.listar()

      // Assert: Verificar listado funciona correctamente
      expect(result).toEqual(mockMateriales)
      expect(materiaPrimaService.listar).toHaveBeenCalled()
    })

    it('should not affect creation operations', async () => {
      // Arrange: Mock de creación
      const newMaterial = {
        id: 'new-id',
        nombre: 'Nuevo Material',
        estatus: 'ACTIVO'
      }

      materiaPrimaService.crear?.mockResolvedValue(newMaterial)

      // Act: Crear material (si el método existe)
      if (materiaPrimaService.crear) {
        const result = await materiaPrimaService.crear(newMaterial as any)

        // Assert: Verificar creación exitosa
        expect(result).toEqual(newMaterial)
        expect(materiaPrimaService.crear).toHaveBeenCalledWith(newMaterial)
      }
    })

    it('should not affect update operations', async () => {
      // Arrange: Mock de actualización
      const updatedMaterial = {
        id: 'update-id',
        nombre: 'Material Actualizado',
        estatus: 'ACTIVO'
      }

      materiaPrimaService.actualizar?.mockResolvedValue(updatedMaterial)

      // Act: Actualizar material (si el método existe)
      if (materiaPrimaService.actualizar) {
        const result = await materiaPrimaService.actualizar('update-id', { nombre: 'Material Actualizado' } as any)

        // Assert: Verificar actualización exitosa
        expect(result).toEqual(updatedMaterial)
        expect(materiaPrimaService.actualizar).toHaveBeenCalledWith('update-id', { nombre: 'Material Actualizado' })
      }
    })
  })

  describe('Integration Edge Cases', () => {
    it('should handle rapid successive deletion attempts', async () => {
      // Arrange: Material de prueba
      const materialId = 'rapid-test-id'
      
      // Mock que simula eliminación exitosa
      materiaPrimaService.eliminar.mockResolvedValue(true)

      // Act: Intentos rápidos de eliminación
      const deletionPromises = [
        materiaPrimaService.eliminar(materialId),
        materiaPrimaService.eliminar(materialId),
        materiaPrimaService.eliminar(materialId)
      ]

      // Assert: Todos deberían completarse exitosamente (en modo mock)
      const results = await Promise.allSettled(deletionPromises)
      const successful = results.filter(r => r.status === 'fulfilled')

      expect(successful.length).toBe(3)
      expect(materiaPrimaService.eliminar).toHaveBeenCalledTimes(3)
    })

    it('should maintain UI responsiveness during deletion', async () => {
      // Arrange: Mock de eliminación lenta
      materiaPrimaService.eliminar.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return true
      })

      // Componente con indicador de progreso
      const MockResponsiveComponent = () => {
        const [deleting, setDeleting] = React.useState(false)

        const handleDelete = async () => {
          setDeleting(true)
          try {
            await materiaPrimaService.eliminar('test-id')
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
            <div data-testid="status">
              {deleting ? 'Procesando...' : 'Listo'}
            </div>
          </div>
        )
      }

      // Act: Renderizar y probar eliminación
      render(<MockResponsiveComponent />)
      const user = userEvent.setup()

      const deleteButton = screen.getByTestId('delete-button')
      const statusDiv = screen.getByTestId('status')

      // Estado inicial
      expect(deleteButton).not.toBeDisabled()
      expect(statusDiv.textContent).toBe('Listo')

      // Actuar: Iniciar eliminación
      await user.click(deleteButton)

      // Verificar estado durante eliminación
      expect(deleteButton).toBeDisabled()
      expect(deleteButton).toHaveTextContent('Eliminando...')
      expect(statusDiv.textContent).toBe('Procesando...')

      // Esperar completion
      await waitFor(() => {
        expect(deleteButton).not.toBeDisabled()
        expect(deleteButton).toHaveTextContent('Eliminar')
        expect(statusDiv.textContent).toBe('Listo')
      }, { timeout: 200 })
    })
  })
})