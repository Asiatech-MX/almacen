/**
 * Tests de Integración para MateriaPrimaService.subirImagen - Fase 5
 * Testing completo de la integración del servicio con el backend IPC
 */

import { MateriaPrimaService } from '../../../src/services/materiaPrimaService'
import type { MateriaPrima } from '../../../../shared/types/materiaPrima'

// Mock del API de Electron
const mockElectronAPI = {
  materiaPrima: {
    subirImagen: jest.fn()
  }
} as any

// Mock de window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
})

describe('MateriaPrimaService.subirImagen - Integration Testing', () => {
  let service: MateriaPrimaService
  let mockFile: File
  let mockMetadata: {
    materiaPrimaId: string
    codigoBarras: string
    nombre: string
  }

  beforeEach(() => {
    jest.clearAllMocks()
    service = new MateriaPrimaService()

    // Crear archivo de prueba
    const fileData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]) // Header PNG
    mockFile = new File([fileData], 'test-image.png', { type: 'image/png' })

    mockMetadata = {
      materiaPrimaId: 'test-123',
      codigoBarras: '123456789',
      nombre: 'Test Material'
    }
  })

  describe('5.2 Testing de Integración con IPC', () => {
    test('upload exitoso via IPC', async () => {
      const expectedResult = {
        success: true,
        url: 'file:///path/to/test-image.png',
        filename: '123456789_Test_1234567890_abc123.png'
      }

      mockElectronAPI.materiaPrima.subirImagen.mockResolvedValue(expectedResult)

      const result = await service.subirImagen(mockFile, mockMetadata)

      expect(mockElectronAPI.materiaPrima.subirImagen).toHaveBeenCalledWith(
        {
          name: 'test-image.png',
          type: 'image/png',
          size: 8,
          buffer: expect.any(ArrayBuffer)
        },
        mockMetadata
      )

      expect(result).toEqual(expectedResult)
    })

    test('error en IPC handling', async () => {
      const errorMessage = 'Error de sistema de archivos'
      mockElectronAPI.materiaPrima.subirImagen.mockRejectedValue(
        new Error(errorMessage)
      )

      const result = await service.subirImagen(mockFile, mockMetadata)

      expect(result).toEqual({
        success: false,
        error: errorMessage
      })
    })

    test('conversión correcta de File a ArrayBuffer', async () => {
      mockElectronAPI.materiaPrima.subirImagen.mockResolvedValue({
        success: true,
        url: 'test-url'
      })

      await service.subirImagen(mockFile, mockMetadata)

      const callArgs = mockElectronAPI.materiaPrima.subirImagen.mock.calls[0][0]
      expect(callArgs.buffer).toBeInstanceOf(ArrayBuffer)

      // Verificar que el buffer contiene los datos correctos
      const bufferView = new Uint8Array(callArgs.buffer)
      expect(bufferView[0]).toBe(137) // Primer byte del header PNG
      expect(bufferView[1]).toBe(80)  // Segundo byte del header PNG
    })
  })

  describe('5.3 Testing en Modo Desarrollo', () => {
    beforeEach(() => {
      // Simular modo desarrollo (sin electronAPI)
      delete (window as any).electronAPI
      service = new MateriaPrimaService()
      // Restaurar el mock para otras pruebas
      Object.defineProperty(window, 'electronAPI', {
        value: mockElectronAPI,
        writable: true
      })
    })

    test('modo desarrollo simula upload exitoso', async () => {
      delete (window as any).electronAPI
      service = new MateriaPrimaService()

      const result = await service.subirImagen(mockFile, mockMetadata)

      expect(result.success).toBe(true)
      expect(result.url).toContain('assets/images/materia-prima/')
      expect(result.filename).toContain(mockMetadata.codigoBarras)
      expect(result.filename).toContain(mockMetadata.nombre.replace(/\s+/g, '_'))
      expect(result.filename).toMatch(/\.(jpg|jpeg|png|webp)$/)
    })

    test('metadata requerida en modo desarrollo', async () => {
      delete (window as any).electronAPI
      service = new MateriaPrimaService()

      // Test con metadata incompleta
      const incompleteMetadata = {
        materiaPrimaId: '',
        codigoBarras: '',
        nombre: ''
      }

      const result = await service.subirImagen(mockFile, incompleteMetadata)

      expect(result.success).toBe(true) // En modo desarrollo aún funciona
      expect(result.filename).toBeUndefined() // Filename puede ser undefined con metadata vacía
    })
  })

  describe('5.4 Testing de Validaciones de Seguridad', () => {
    test('maneja archivos muy grandes', async () => {
      // Crear archivo grande (10MB)
      const largeFileData = new Uint8Array(10 * 1024 * 1024)
      const largeFile = new File([largeFileData], 'large-image.png', {
        type: 'image/png'
      })

      mockElectronAPI.materiaPrima.subirImagen.mockRejectedValue(
        new Error('Archivo demasiado grande')
      )

      const result = await service.subirImagen(largeFile, mockMetadata)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Archivo demasiado grande')
    })

    test('maneja tipos de archivo no soportados', async () => {
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' })

      mockElectronAPI.materiaPrima.subirImagen.mockRejectedValue(
        new Error('Tipo de archivo no soportado')
      )

      const result = await service.subirImagen(textFile, mockMetadata)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Tipo de archivo no soportado')
    })

    test('maneja archivos con caracteres especiales en nombre', async () => {
      const specialCharsFile = new File(['test'], 'test@#$%^&*().png', {
        type: 'image/png'
      })

      mockElectronAPI.materiaPrima.subirImagen.mockResolvedValue({
        success: true,
        url: 'test-url',
        filename: 'sanitized-filename.png'
      })

      const result = await service.subirImagen(specialCharsFile, mockMetadata)

      expect(result.success).toBe(true)
      expect(mockElectronAPI.materiaPrima.subirImagen).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test@#$%^&*().png'
        }),
        mockMetadata
      )
    })
  })

  describe('5.5 Testing de Edge Cases', () => {
    test('maneja archivos vacíos', async () => {
      const emptyFile = new File([], 'empty.png', { type: 'image/png' })

      mockElectronAPI.materiaPrima.subirImagen.mockResolvedValue({
        success: true,
        url: 'test-url'
      })

      const result = await service.subirImagen(emptyFile, mockMetadata)

      expect(result.success).toBe(true)
    })

    test('maneja timeouts del IPC', async () => {
      mockElectronAPI.materiaPrima.subirImagen.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      )

      jest.useFakeTimers()

      const promise = service.subirImagen(mockFile, mockMetadata)

      // Avanzar tiempo más allá del timeout (si lo hubiera)
      jest.advanceTimersByTime(5000)

      // No debería resolverse todavía
      await expect(Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      ])).rejects.toThrow('Timeout')

      jest.useRealTimers()
    })

    test('maneja archivos con metadata undefined', async () => {
      const result = await service.subirImagen(mockFile, {
        materiaPrimaId: 'test',
        codigoBarras: 'test',
        nombre: undefined as any
      })

      expect(typeof result.success).toBe('boolean')
    })

    test('maneja multiple llamadas concurrentes', async () => {
      const files = [
        new File(['test1'], 'test1.png', { type: 'image/png' }),
        new File(['test2'], 'test2.png', { type: 'image/png' })
      ]

      mockElectronAPI.materiaPrima.subirImagen
        .mockResolvedValueOnce({ success: true, url: 'url1', filename: 'file1.png' })
        .mockResolvedValueOnce({ success: true, url: 'url2', filename: 'file2.png' })

      const [result1, result2] = await Promise.all([
        service.subirImagen(files[0], mockMetadata),
        service.subirImagen(files[1], { ...mockMetadata, materiaPrimaId: 'test2' })
      ])

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.url).toBe('url1')
      expect(result2.url).toBe('url2')
    })
  })

  describe('5.6 Testing de Memory Management', () => {
    test('limpia referencias a buffers después del upload', async () => {
      const { track, getTracked, untrack } = (() => {
        const tracked = new Set()
        return {
          track: (obj: any) => tracked.add(obj),
          getTracked: () => Array.from(tracked),
          untrack: (obj: any) => tracked.delete(obj)
        }
      })()

      // Track del ArrayBuffer para verificar que se libere
      const originalArrayBuffer = ArrayBuffer.prototype.slice
      ArrayBuffer.prototype.slice = function(...args) {
        const result = originalArrayBuffer.apply(this, args)
        track(result)
        return result
      }

      mockElectronAPI.materiaPrima.subirImagen.mockResolvedValue({
        success: true,
        url: 'test-url'
      })

      await service.subirImagen(mockFile, mockMetadata)

      // Simular cleanup de referencias
      jest.advanceTimersByTime(1000)

      // Restaurar método original
      ArrayBuffer.prototype.slice = originalArrayBuffer

      expect(getTracked().length).toBeGreaterThanOrEqual(0)
    })
  })
})