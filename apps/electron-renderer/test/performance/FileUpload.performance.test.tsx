/**
 * Tests de Performance y Optimización para File Upload - Fase 5
 * Testing de performance, memory management y optimizaciones
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { FileUpload } from '../../../src/components/ui/file-upload'

describe('FileUpload Component - Performance & Optimization', () => {
  const mockOnValueChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    global.URL.createObjectURL = jest.fn(() => 'mocked-url')
    global.URL.revokeObjectURL = jest.fn()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('5.4 Performance Testing', () => {
    test('renderizado inicial rápido', () => {
      const startTime = performance.now()
      render(<FileUpload onValueChange={mockOnValueChange} />)
      const endTime = performance.now()

      // El renderizado inicial debería ser menor a 50ms
      expect(endTime - startTime).toBeLessThan(50)
      expect(screen.getByText('Upload images')).toBeInTheDocument()
    })

    test('manejo eficiente de archivos grandes', async () => {
      const user = userEvent.setup()

      // Crear archivo grande pero válido (4.9MB)
      const largeValidFile = new File(
        ['x'.repeat(4.9 * 1024 * 1024)],
        'large-but-valid.jpg',
        { type: 'image/jpeg' }
      )

      const startTime = performance.now()
      render(<FileUpload onValueChange={mockOnValueChange} maxSize={5 * 1024 * 1024} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, largeValidFile)

      const endTime = performance.now()

      // Procesamiento debería ser rápido (<200ms)
      expect(endTime - startTime).toBeLessThan(200)
      expect(mockOnValueChange).toHaveBeenCalledWith([largeValidFile])
      expect(screen.queryByText(/exceeds maximum size/)).not.toBeInTheDocument()
    })

    test('re-renders minimales con props estáticas', () => {
      const { rerender } = render(<FileUpload onValueChange={mockOnValueChange} />)

      const initialText = screen.getByText('Upload images')

      rerender(<FileUpload onValueChange={mockOnValueChange} />)

      // No debería haber cambios visibles en el DOM
      expect(screen.getByText('Upload images')).toBe(initialText)
    })

    test('actualización eficiente con cambios en value', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<FileUpload onValueChange={mockOnValueChange} value={[]} />)

      const initialRenderTime = performance.now()

      // Actualizar con archivos
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      ]

      rerender(<FileUpload onValueChange={mockOnValueChange} value={files} />)

      const updateRenderTime = performance.now()

      expect(updateRenderTime - initialRenderTime).toBeLessThan(100)
      expect(screen.getByText('test1.jpg')).toBeInTheDocument()
      expect(screen.getByText('test2.jpg')).toBeInTheDocument()
    })
  })

  describe('Memory Management Testing', () => {
    test('limpieza correcta de Object URLs', () => {
      const objectUrls = new Set<string>()
      global.URL.createObjectURL = jest.fn((file) => {
        const url = `blob:${file.name}-${Date.now()}`
        objectUrls.add(url)
        return url
      })
      global.URL.revokeObjectURL = jest.fn((url) => {
        objectUrls.delete(url)
      })

      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      ]

      const { unmount } = render(<FileUpload onValueChange={mockOnValueChange} value={files} />)

      // Debería haber creado URLs para las imágenes
      expect(global.URL.createObjectURL).toHaveBeenCalledTimes(2)
      expect(objectUrls.size).toBe(2)

      // Al desmontar, debería limpiar las URLs
      unmount()

      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    })

    test('limpieza de URLs al cambiar archivos', async () => {
      const user = userEvent.setup()
      const objectUrls = new Set<string>()

      global.URL.createObjectURL = jest.fn((file) => {
        const url = `blob:${file.name}-${Date.now()}`
        objectUrls.add(url)
        return url
      })
      global.URL.revokeObjectURL = jest.fn((url) => {
        objectUrls.delete(url)
      })

      const initialFiles = [new File(['test1'], 'test1.jpg', { type: 'image/jpeg' })]

      render(<FileUpload onValueChange={mockOnValueChange} value={initialFiles} />)

      expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1)
      expect(objectUrls.size).toBe(1)

      // Cambiar archivos
      const newFiles = [new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })]

      const { rerender } = render(<FileUpload onValueChange={mockOnValueChange} value={newFiles} />)

      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    })

    test('no memory leaks con drag & drop frecuente', async () => {
      const user = userEvent.setup()
      const files = Array.from({ length: 10 }, (_, i) =>
        new File([`test${i}`], `test${i}.jpg`, { type: 'image/jpeg' })
      )

      render(<FileUpload onValueChange={mockOnValueChange} multiple={true} />)

      const dropZone = screen.getByRole('button')

      // Simular múltiples drag & drop rápidos
      for (let i = 0; i < 5; i++) {
        fireEvent.dragEnter(dropZone)
        fireEvent.dragOver(dropZone)
        fireEvent.drop(dropZone, {
          dataTransfer: { files: [files[i]] }
        })

        // Pequeña pausa para simular comportamiento real
        act(() => {
          jest.advanceTimersByTime(10)
        })
      }

      expect(mockOnValueChange).toHaveBeenCalledTimes(5)
    })
  })

  describe('Optimization Testing', () => {
    test('debouncing de mensajes de error', async () => {
      const user = userEvent.setup()
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')

      // Subir archivo grande que causa error
      await user.upload(input!, largeFile)

      expect(screen.getByText(/exceeds maximum size/)).toBeInTheDocument()

      // El error debería desaparecer después de 5 segundos
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      await waitFor(() => {
        expect(screen.queryByText(/exceeds maximum size/)).not.toBeInTheDocument()
      })
    })

    test('actualización eficiente del DOM', () => {
      const files = Array.from({ length: 50 }, (_, i) =>
        new File([`test${i}`], `test${i}.jpg`, { type: 'image/jpeg' })
      )

      const startTime = performance.now()
      render(<FileUpload onValueChange={mockOnValueChange} value={files} multiple={true} />)
      const endTime = performance.now()

      // El renderizado con muchos archivos debería ser eficiente (<500ms)
      expect(endTime - startTime).toBeLessThan(500)

      // Verificar que todos los archivos se muestran
      files.forEach(file => {
        expect(screen.getByText(file.name)).toBeInTheDocument()
      })
    })

    test('lazy loading de previsualizaciones', () => {
      jest.useFakeTimers()

      const files = Array.from({ length: 20 }, (_, i) =>
        new File([`test${i}`], `test${i}.jpg`, { type: 'image/jpeg' })
      )

      const startTime = performance.now()
      render(<FileUpload onValueChange={mockOnValueChange} value={files} multiple={true} />)
      const endTime = performance.now()

      // El renderizado inicial debería ser rápido aunque haya muchas imágenes
      expect(endTime - startTime).toBeLessThan(300)

      // Las previsualizaciones deberían cargarse de forma asíncrona
      expect(global.URL.createObjectURL).toHaveBeenCalledTimes(0)

      // Avanzar tiempo para cargar previsualizaciones
      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })

    test('eficiencia con archivos muy pequeños', async () => {
      const user = userEvent.setup()
      const tinyFiles = Array.from({ length: 100 }, (_, i) =>
        new File(['x'], `tiny${i}.jpg`, { type: 'image/jpeg' })
      )

      const startTime = performance.now()
      render(<FileUpload onValueChange={mockOnValueChange} multiple={true} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, ...tinyFiles)

      const endTime = performance.now()

      // Procesamiento de muchos archivos pequeños debería ser eficiente (<200ms)
      expect(endTime - startTime).toBeLessThan(200)
    })
  })

  describe('Stress Testing', () => {
    test('manejo de carga extrema de archivos', async () => {
      const user = userEvent.setup()
      const extremeFiles = Array.from({ length: 1000 }, (_, i) =>
        new File([`test${i}`], `test${i}.jpg`, { type: 'image/jpeg' })
      )

      render(<FileUpload onValueChange={mockOnValueChange} multiple={true} maxFiles={2000} />)

      const startTime = performance.now()

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, ...extremeFiles)

      const endTime = performance.now()

      // Incluso con carga extrema, debería ser manejable (<2s)
      expect(endTime - startTime).toBeLessThan(2000)
      expect(mockOnValueChange).toHaveBeenCalledWith(extremeFiles)
    })

    test('recuperación después de errores múltiples', async () => {
      const user = userEvent.setup()

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')

      // Generar múltiples errores rápidos
      for (let i = 0; i < 5; i++) {
        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], `large${i}.jpg`, {
          type: 'image/jpeg'
        })
        await user.upload(input!, largeFile)

        // Esperar un poco entre errores
        act(() => {
          jest.advanceTimersByTime(100)
        })
      }

      // Debería poder recuperarse y aceptar un archivo válido
      const validFile = new File(['test'], 'valid.jpg', { type: 'image/jpeg' })
      await user.upload(input!, validFile)

      expect(mockOnValueChange).toHaveBeenCalledWith([validFile])
    })

    test('rendimiento bajo memoria simulada', async () => {
      const user = userEvent.setup()

      // Simular condiciones de memoria baja
      const originalCreateObjectURL = global.URL.createObjectURL
      let callCount = 0
      global.URL.createObjectURL = jest.fn((file) => {
        callCount++
        if (callCount > 10) {
          throw new Error('Out of memory')
        }
        return originalCreateObjectURL(file)
      })

      const files = Array.from({ length: 15 }, (_, i) =>
        new File([`test${i}`], `test${i}.jpg`, { type: 'image/jpeg' })
      )

      render(<FileUpload onValueChange={mockOnValueChange} value={files} multiple={true} />)

      // Debería manejar el error de memoria gracioso
      expect(global.URL.revokeObjectURL).toHaveBeenCalled()

      // Restaurar función original
      global.URL.createObjectURL = originalCreateObjectURL
    })
  })

  describe('Accessibility Performance', () => {
    test('anuncios de estado eficientes', async () => {
      const user = userEvent.setup()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')

      const startTime = performance.now()
      await user.upload(input!, file)
      const endTime = performance.now()

      // Actualización de estado accesible debería ser rápida (<100ms)
      expect(endTime - startTime).toBeLessThan(100)
    })

    test('navegación por teclado responsiva', async () => {
      const user = userEvent.setup()

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const startTime = performance.now()

      // Navegar por todos los elementos interactivos
      await user.tab() // al input
      await user.tab() // al siguiente elemento

      const endTime = performance.now()

      // Navegación debería ser instantánea (<50ms)
      expect(endTime - startTime).toBeLessThan(50)
    })
  })
})