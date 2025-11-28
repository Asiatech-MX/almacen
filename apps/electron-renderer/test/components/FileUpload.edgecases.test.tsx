/**
 * Tests de Edge Cases y Manejo de Errores para File Upload - Fase 5
 * Testing de casos extremos y manejo robusto de errores
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { FileUpload } from '../../../src/components/ui/file-upload'

describe('FileUpload Component - Edge Cases & Error Handling', () => {
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

  describe('5.3 Testing de Edge Cases', () => {
    test('manejo de nombres de archivo con caracteres especiales', async () => {
      const user = userEvent.setup()
      const fileWithSpecialChars = new File(['test'], 'test@#$%^&*()[]{}+.png', {
        type: 'image/png'
      })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, fileWithSpecialChars)

      expect(mockOnValueChange).toHaveBeenCalledWith([fileWithSpecialChars])
      expect(screen.getByText('test@#$%^&*()[]{}+.png')).toBeInTheDocument()
    })

    test('manejo de archivos con nombres muy largos', async () => {
      const user = userEvent.setup()
      const longName = 'a'.repeat(300) + '.png'
      const fileWithLongName = new File(['test'], longName, { type: 'image/png' })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, fileWithLongName)

      expect(mockOnValueChange).toHaveBeenCalledWith([fileWithLongName])
      expect(screen.getByText(longName)).toBeInTheDocument()
    })

    test('manejo de archivos con espacios y unicode', async () => {
      const user = userEvent.setup()
      const unicodeFile = new File(['test'], '测试 图片 🖼️ with spaces.png', {
        type: 'image/png'
      })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, unicodeFile)

      expect(mockOnValueChange).toHaveBeenCalledWith([unicodeFile])
      expect(screen.getByText('测试 图片 🖼️ with spaces.png')).toBeInTheDocument()
    })

    test('manejo de archivos sin extensión', async () => {
      const user = userEvent.setup()
      const noExtFile = new File(['test'], 'imagefile', { type: 'image/png' })

      render(<FileUpload onValueChange={mockOnValueChange} accept="image/*" />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, noExtFile)

      expect(mockOnValueChange).toHaveBeenCalledWith([noExtFile])
      expect(screen.getByText('imagefile')).toBeInTheDocument()
    })

    test('manejo de múltiples archivos cuando multiple=false', async () => {
      const user = userEvent.setup()
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
        new File(['test3'], 'test3.jpg', { type: 'image/jpeg' })
      ]

      render(<FileUpload onValueChange={mockOnValueChange} multiple={false} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, ...files)

      // Debería aceptar solo el primer archivo
      expect(mockOnValueChange).toHaveBeenCalledWith([files[0]])
    })

    test('manejo de archivos con tamaño exactamente al límite', async () => {
      const user = userEvent.setup()
      const exactSize = 5 * 1024 * 1024 // 5MB exact
      const exactSizeFile = new File(['x'.repeat(exactSize)], 'exact-5mb.jpg', {
        type: 'image/jpeg'
      })

      render(<FileUpload onValueChange={mockOnValueChange} maxSize={5 * 1024 * 1024} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, exactSizeFile)

      expect(mockOnValueChange).toHaveBeenCalledWith([exactSizeFile])
      expect(screen.queryByText(/exceeds maximum size/)).not.toBeInTheDocument()
    })

    test('manejo de archivos de 0 bytes', async () => {
      const user = userEvent.setup()
      const emptyFile = new File([''], 'empty.jpg', { type: 'image/jpeg' })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, emptyFile)

      expect(mockOnValueChange).toHaveBeenCalledWith([emptyFile])
      expect(screen.getByText('0.00 MB')).toBeInTheDocument()
    })
  })

  describe('5.4 Manejo Avanzado de Errores', () => {
    test('recuperación después de error de tamaño', async () => {
      const user = userEvent.setup()
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      })
      const validFile = new File(['test'], 'valid.jpg', { type: 'image/jpeg' })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')

      // Primer intento con archivo grande
      await user.upload(input!, largeFile)
      expect(screen.getByText(/exceeds maximum size/)).toBeInTheDocument()
      expect(mockOnValueChange).not.toHaveBeenCalled()

      // El error debería desaparecer después de 5 segundos
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      await waitFor(() => {
        expect(screen.queryByText(/exceeds maximum size/)).not.toBeInTheDocument()
      })

      // Segundo intento con archivo válido
      await user.upload(input!, validFile)
      expect(mockOnValueChange).toHaveBeenCalledWith([validFile])
    })

    test('manejo de cambio rápido de archivos', async () => {
      const user = userEvent.setup()
      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' })
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')

      // Cambiar archivos rápidamente
      await user.upload(input!, file1)
      await user.upload(input!, file2)

      expect(mockOnValueChange).toHaveBeenCalledTimes(2)
      expect(mockOnValueChange).toHaveBeenLastCalledWith([file2])
    })

    test('manejo de error durante previsualización', async () => {
      const user = userEvent.setup()
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      // Mock URL.createObjectURL para que lance error
      global.URL.createObjectURL = jest.fn(() => {
        throw new Error('Failed to create object URL')
      })

      render(<FileUpload onValueChange={mockOnValueChange} value={[imageFile]} />)

      expect(screen.getByText('test.jpg')).toBeInTheDocument()
      expect(screen.getByTestId('image-icon')).toBeInTheDocument()
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    test('manejo de prop error externo', () => {
      render(<FileUpload onValueChange={mockOnValueChange} error="Error externo del servidor" />)

      expect(screen.getByText('Error externo del servidor')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveClass('border-destructive')
    })

    test('manejo de props inválidas', () => {
      expect(() => {
        render(<FileUpload
          onValueChange={mockOnValueChange}
          maxSize={-1}
          maxFiles={0}
        />)
      }).not.toThrow()
    })
  })

  describe('5.5 Testing de Performance y Memory', () {
    test('limpieza correcta de URLs de objetos', () => {
      const { unmount } = render(<FileUpload onValueChange={mockOnValueChange} value={[]} />)

      unmount()

      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    })

    test('manejo de grandes cantidades de archivos pequeños', async () => {
      const user = userEvent.setup()
      const manySmallFiles = Array.from({ length: 100 }, (_, i) =>
        new File(['small'], `file${i}.jpg`, { type: 'image/jpeg' })
      )

      render(<FileUpload onValueChange={mockOnValueChange} multiple={true} maxFiles={200} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')

      const startTime = performance.now()
      await user.upload(input!, ...manySmallFiles)
      const endTime = performance.now()

      expect(mockOnValueChange).toHaveBeenCalledWith(manySmallFiles)
      expect(endTime - startTime).toBeLessThan(1000) // Debe completarse en menos de 1 segundo
    })

    test('manejo de archivo muy grande sin bloqueo UI', async () => {
      const user = userEvent.setup()
      const hugeFile = new File(['x'.repeat(50 * 1024 * 1024)], 'huge.jpg', {
        type: 'image/jpeg'
      })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')

      const startTime = performance.now()
      await user.upload(input!, hugeFile)
      const endTime = performance.now()

      // UI no debería bloquearse por más de 100ms para procesar el error
      expect(endTime - startTime).toBeLessThan(100)
      expect(screen.getByText(/exceeds maximum size/)).toBeInTheDocument()
    })
  })

  describe('5.6 Testing de Seguridad', () => {
    test('prevención de inyección de scripts en nombres de archivo', async () => {
      const user = userEvent.setup()
      const maliciousFile = new File(['test'], '<script>alert("xss")</script>.jpg', {
        type: 'image/jpeg'
      })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, maliciousFile)

      expect(screen.getByText('<script>alert("xss")</script>.jpg')).toBeInTheDocument()
      // El nombre del archivo se muestra como texto plano, no como HTML
      expect(screen.queryByRole('script')).not.toBeInTheDocument()
    })

    test('manejo de archivos con MIME types sospechosos', async () => {
      const user = userEvent.setup()
      const suspiciousFile = new File(['test'], 'suspicious.jpg', {
        type: 'application/javascript'
      })

      render(<FileUpload onValueChange={mockOnValueChange} accept="image/*" />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, suspiciousFile)

      // El navegador debería rechazar archivos que no coinciden con accept
      expect(mockOnValueChange).not.toHaveBeenCalled()
    })

    test('manejo de archivos con paths relativos', async () => {
      const user = userEvent.setup()
      // Este caso simula un archivo con un path relativo (aunque en realidad no puede ocurrir en navegadores)
      const fileWithPath = new File(['test'], '../../etc/passwd.jpg', {
        type: 'image/jpeg'
      })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, fileWithPath)

      expect(mockOnValueChange).toHaveBeenCalledWith([fileWithPath])
      expect(screen.getByText('../../etc/passwd.jpg')).toBeInTheDocument()
    })
  })

  describe('5.7 Testing de Compatibilidad', () => {
    test('funcionamiento con diferentes tipos de imágenes', async () => {
      const user = userEvent.setup()
      const imageTypes = [
        { file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }, expected: 'image' },
        { file: new File(['test'], 'test.png', { type: 'image/png' }, expected: 'image' },
        { file: new File(['test'], 'test.webp', { type: 'image/webp' }, expected: 'image' },
        { file: new File(['test'], 'test.gif', { type: 'image/gif' }, expected: 'image' },
        { file: new File(['test'], 'test.svg', { type: 'image/svg+xml' }, expected: 'image' }
      ]

      for (const { file, expected } of imageTypes) {
        mockOnValueChange.mockClear()

        render(<FileUpload onValueChange={mockOnValueChange} value={[file]} />)

        expect(screen.getByText(file.name)).toBeInTheDocument()

        if (expected === 'image') {
          expect(screen.getByRole('img')).toBeInTheDocument()
        }
      }
    })

    test('manejo de archivos no imagen cuando accept="*/*"', async () => {
      const user = userEvent.setup()
      const nonImageFile = new File(['test'], 'test.txt', { type: 'text/plain' })

      render(<FileUpload onValueChange={mockOnValueChange} accept="*/*" />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, nonImageFile)

      expect(mockOnValueChange).toHaveBeenCalledWith([nonImageFile])
      expect(screen.getByText('test.txt')).toBeInTheDocument()
      expect(screen.getByTestId('image-icon')).toBeInTheDocument()
    })
  })
})