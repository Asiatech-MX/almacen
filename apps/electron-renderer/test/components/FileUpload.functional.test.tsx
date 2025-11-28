/**
 * Tests Funcionales para File Upload Component - Fase 5
 * Testing completo del componente FileUpload para imágenes de materia prima
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { FileUpload } from '../../../src/components/ui/file-upload'

// Mock de URL.createObjectURL y URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url')
global.URL.revokeObjectURL = jest.fn()

describe('FileUpload Component - Functional Testing', () => {
  const mockOnValueChange = jest.fn()
  const defaultProps = {
    onValueChange: mockOnValueChange,
    accept: 'image/*',
    multiple: false,
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('5.1 Testing Funcional Básico', () => {
    test('renderizado inicial del componente', () => {
      render(<FileUpload {...defaultProps} />)

      expect(screen.getByText('Upload images')).toBeInTheDocument()
      expect(screen.getByText('Drag and drop or click to select')).toBeInTheDocument()
      expect(screen.getByText(/PNG, JPG, JPEG up to/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
    })

    test('carga de archivo válido mediante click', async () => {
      const user = userEvent.setup()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      render(<FileUpload {...defaultProps} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      expect(input).toBeInTheDocument()

      await user.upload(input!, file)

      expect(mockOnValueChange).toHaveBeenCalledWith([file])
    })

    test('carga de archivo válido mediante drag & drop', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })

      render(<FileUpload {...defaultProps} />)

      const dropZone = screen.getByRole('button')

      fireEvent.dragEnter(dropZone)
      fireEvent.dragOver(dropZone)
      expect(screen.getByText('Drop files here')).toBeInTheDocument()

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      })

      expect(mockOnValueChange).toHaveBeenCalledWith([file])
    })
  })

  describe('5.2 Validaciones de Archivo', () => {
    test('rechaza archivos que exceden el tamaño máximo', async () => {
      const user = userEvent.setup()
      // Crear archivo de 6MB (excede el límite de 5MB)
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      })

      render(<FileUpload {...defaultProps} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, largeFile)

      expect(mockOnValueChange).not.toHaveBeenCalled()
      expect(screen.getByText(/exceeds maximum size of/)).toBeInTheDocument()

      // El error debería desaparecer después de 5 segundos
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      await waitFor(() => {
        expect(screen.queryByText(/exceeds maximum size of/)).not.toBeInTheDocument()
      })
    })

    test('rechaza número excesivo de archivos', async () => {
      const user = userEvent.setup()
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      ]

      render(<FileUpload {...defaultProps} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, ...files)

      expect(mockOnValueChange).not.toHaveBeenCalled()
      expect(screen.getByText('Maximum 1 files allowed')).toBeInTheDocument()
    })

    test('acepta múltiples archivos cuando multiple=true', async () => {
      const user = userEvent.setup()
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.png', { type: 'image/png' })
      ]

      render(<FileUpload {...defaultProps} multiple={true} maxFiles={3} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, ...files)

      expect(mockOnValueChange).toHaveBeenCalledWith(files)
    })
  })

  describe('5.3 Previsualización de Imágenes', () => {
    test('muestra previsualización de archivo de imagen', async () => {
      const user = userEvent.setup()
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      render(<FileUpload {...defaultProps} value={[imageFile]} />)

      expect(screen.getByText('test.jpg')).toBeInTheDocument()
      expect(screen.getByText(/0\.00 MB/)).toBeInTheDocument()

      const previewImg = screen.getByRole('img')
      expect(previewImg).toHaveAttribute('src', 'mocked-url')
      expect(previewImg).toHaveAttribute('alt', 'test.jpg')
    })

    test('muestra icono para archivos no imagen', async () => {
      const user = userEvent.setup()
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' })

      render(<FileUpload {...defaultProps} value={[textFile]} accept="*/*" />)

      expect(screen.getByText('test.txt')).toBeInTheDocument()
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      expect(screen.getByTestId('image-icon')).toBeInTheDocument()
    })

    test('limpia URLs de objeto al desmontar', () => {
      const { unmount } = render(<FileUpload {...defaultProps} value={[]} />)

      unmount()

      // Verificar que se llamó a revokeObjectURL (aunque no podemos verificar el URL específico)
      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('5.4 Manejo de Estados y Errores', () => {
    test('muestra error cuando se proporciona prop error', () => {
      render(<FileUpload {...defaultProps} error="Error personalizado" />)

      expect(screen.getByText('Error personalizado')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveClass('border-destructive')
    })

    test('deshabilita interacción cuando disabled=true', () => {
      render(<FileUpload {...defaultProps} disabled={true} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed')
      expect(button).not.toHaveClass('cursor-pointer')

      const input = button.querySelector('input[type="file"]')
      expect(input).toBeDisabled()
    })

    test('maneja removal de archivo', async () => {
      const user = userEvent.setup()
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      render(<FileUpload {...defaultProps} value={[imageFile]} />)

      const removeButton = screen.getByRole('button', { name: /remove file/i })
      await user.click(removeButton)

      expect(mockOnValueChange).toHaveBeenCalledWith([])
    })

    test('reinicia input值 después de selección', async () => {
      const user = userEvent.setup()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      render(<FileUpload {...defaultProps} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')!

      await user.upload(input, file)

      // Verificar que el input se reinició
      expect(input.files).toHaveLength(0)
    })
  })

  describe('5.5 Drag & Drop Behavior', () => {
    test('maneja correctamente estados de drag', () => {
      render(<FileUpload {...defaultProps} />)

      const dropZone = screen.getByRole('button')

      fireEvent.dragEnter(dropZone)
      expect(dropZone).toHaveClass('border-primary', 'bg-primary/5')
      expect(screen.getByText('Drop files here')).toBeInTheDocument()

      fireEvent.dragLeave(dropZone)
      expect(dropZone).not.toHaveClass('border-primary', 'bg-primary/5')
      expect(screen.getByText('Upload images')).toBeInTheDocument()
    })

    test('ignora drag & drop cuando está deshabilitado', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      render(<FileUpload {...defaultProps} disabled={true} />)

      const dropZone = screen.getByRole('button')

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      })

      expect(mockOnValueChange).not.toHaveBeenCalled()
    })

    test('previene comportamiento por defecto del drag & drop', () => {
      const preventDefault = jest.fn()
      const stopPropagation = jest.fn()

      render(<FileUpload {...defaultProps} />)

      const dropZone = screen.getByRole('button')

      fireEvent.dragEnter(dropZone, {
        preventDefault,
        stopPropagation
      })
      fireEvent.dragOver(dropZone, {
        preventDefault,
        stopPropagation
      })
      fireEvent.drop(dropZone, {
        preventDefault,
        stopPropagation,
        dataTransfer: { files: [] }
      })

      expect(preventDefault).toHaveBeenCalledTimes(3)
      expect(stopPropagation).toHaveBeenCalledTimes(3)
    })
  })

  describe('5.6 Accesibilidad', () => {
    test('es accesible por teclado', async () => {
      const user = userEvent.setup()
      render(<FileUpload {...defaultProps} />)

      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')

      // debería activar el input file
      const input = button.querySelector('input[type="file"]')
      expect(input).toBeInTheDocument()
    })

    test('tiene atributos ARIA apropiados', () => {
      render(<FileUpload {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'button')
    })
  })
})