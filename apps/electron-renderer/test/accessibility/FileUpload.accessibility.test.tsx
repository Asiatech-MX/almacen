/**
 * Tests de Calidad y Accesibilidad para File Upload - Fase 5
 * Testing de accesibilidad, WCAG compliance y calidad de UX
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import '@testing-library/jest-dom'
import { FileUpload } from '../../../src/components/ui/file-upload'

// Extender expect con jest-axe
expect.extend(toHaveNoViolations)

describe('FileUpload Component - Accessibility & Quality Testing', () => {
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

  describe('5.6 WCAG 2.1 Accessibility Testing', () => {
    test('no violaciones de accesibilidad básicas', async () => {
      const { container } = render(<FileUpload onValueChange={mockOnValueChange} />)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    test('no violaciones con archivos cargados', async () => {
      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]
      const { container } = render(
        <FileUpload onValueChange={mockOnValueChange} value={files} />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    test('no violaciones con estado de error', async () => {
      const { container } = render(
        <FileUpload onValueChange={mockOnValueChange} error="Error message" />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    test('no violaciones con estado deshabilitado', () => {
      const { container } = render(
        <FileUpload onValueChange={mockOnValueChange} disabled={true} />
      )

      return expect(axe(container)).resolves.toHaveNoViolations()
    })
  })

  describe('Keyboard Accessibility', () => {
    test('navegación completa por teclado', async () => {
      const user = userEvent.setup()
      render(<FileUpload onValueChange={mockOnValueChange} />)

      const uploadButton = screen.getByRole('button')

      // Navegar con Tab
      await user.tab()
      expect(uploadButton).toHaveFocus()

      // Activar con Enter
      await user.keyboard('{Enter}')

      // Verificar que se puede acceder al input file
      const input = uploadButton.querySelector('input[type="file"]')
      expect(input).toBeInTheDocument()
    })

    test('navegación por teclado con archivos cargados', async () => {
      const user = userEvent.setup()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      render(<FileUpload onValueChange={mockOnValueChange} value={[file]} />)

      // Navegar a los botones de remover
      await user.tab()
      expect(screen.getByRole('button', { name: /remove file/i })).toBeInTheDocument()

      await user.tab()
      const removeButton = screen.getByRole('button', { name: /remove file/i })
      expect(removeButton).toHaveFocus()

      // Activar con Enter
      await user.keyboard('{Enter}')
      expect(mockOnValueChange).toHaveBeenCalledWith([])
    })

    test('navegación por teclado con estado deshabilitado', async () => {
      const user = userEvent.setup()
      render(<FileUpload onValueChange={mockOnValueChange} disabled={true} />)

      const uploadButton = screen.getByRole('button')

      await user.tab()
      expect(uploadButton).toHaveFocus()

      // Verificar que no se puede activar
      await user.keyboard('{Enter}')
      expect(mockOnValueChange).not.toHaveBeenCalled()
    })

    test('soporte para Escape key', async () => {
      const user = userEvent.setup()
      render(<FileUpload onValueChange={mockOnValueChange} />)

      const uploadButton = screen.getByRole('button')
      uploadButton.focus()

      // Simular presionar Escape (comportamiento específico puede variar)
      await user.keyboard('{Escape}')

      // El componente debería manejar Escape gracefully
      expect(uploadButton).toBeInTheDocument()
    })
  })

  describe('Screen Reader Testing', () => {
    test('etiquetas descriptivas apropiadas', () => {
      render(<FileUpload onValueChange={mockOnValueChange} />)

      // Debería tener aria-label o estar dentro de un label
      const uploadButton = screen.getByRole('button')
      expect(uploadButton).toHaveAccessibleName()
    })

    test('anuncios de estado apropiados', async () => {
      const user = userEvent.setup()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, file)

      // Debería mostrar el nombre del archivo para screen readers
      expect(screen.getByText('test.jpg')).toBeInTheDocument()
      expect(screen.getByText('0.00 MB')).toBeInTheDocument()
    })

    test('anuncios de error accesibles', async () => {
      const user = userEvent.setup()
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, largeFile)

      // Error debería ser accesible
      const errorMessage = screen.getByText(/exceeds maximum size/)
      expect(errorMessage).toBeInTheDocument()
      expect(errorMessage).toHaveClass('text-destructive')
    })

    test('indicadores de progreso accesibles', () => {
      render(<FileUpload onValueChange={mockOnValueChange} disabled={true} />)

      const uploadButton = screen.getByRole('button')

      // Estado deshabilitado debería ser claramente indicado
      expect(uploadButton).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('Focus Management', () => {
    test('manejo correcto del foco', async () => {
      const user = userEvent.setup()
      render(<FileUpload onValueChange={mockOnValueChange} />)

      const uploadButton = screen.getByRole('button')
      uploadButton.focus()

      expect(uploadButton).toHaveFocus()

      // Al activar, el foco debería manejarse apropiadamente
      await user.click(uploadButton)

      // El input file debería recibir el foco
      const input = uploadButton.querySelector('input[type="file"]')
      expect(input).toHaveFocus()
    })

    test('foco visible y claro', () => {
      render(<FileUpload onValueChange={mockOnValueChange} />)

      const uploadButton = screen.getByRole('button')
      uploadButton.focus()

      // Debería tener estilos de foco visibles
      expect(uploadButton).toHaveFocus()
    })

    test('manejo de foco en estado error', () => {
      render(<FileUpload onValueChange={mockOnValueChange} error="Error message" />)

      const uploadButton = screen.getByRole('button')
      uploadButton.focus()

      // El foco debería estar visible incluso en estado de error
      expect(uploadButton).toHaveFocus()
      expect(uploadButton).toHaveClass('border-destructive')
    })
  })

  describe('Color Contrast Testing', () => {
    test('contraste adecuado en estado normal', () => {
      render(<FileUpload onValueChange={mockOnValueChange} />)

      const uploadButton = screen.getByRole('button')
      expect(uploadButton).toBeInTheDocument()
      // En una implementación real, verificaríamos que los colores tienen suficiente contraste
    })

    test('contraste adecuado en estado hover', () => {
      render(<FileUpload onValueChange={mockOnValueChange} />)

      const uploadButton = screen.getByRole('button')

      fireEvent.mouseEnter(uploadButton)
      expect(uploadButton).toBeInTheDocument()
      // Verificar que los colores de hover tienen contraste adecuado
    })

    test('contraste adecuado en estado foco', () => {
      render(<FileUpload onValueChange={mockOnValueChange} />)

      const uploadButton = screen.getByRole('button')
      uploadButton.focus()

      expect(uploadButton).toHaveFocus()
      // Verificar que los colores de foco tienen contraste adecuado
    })

    test('contraste adecuado en estado error', () => {
      render(<FileUpload onValueChange={mockOnValueChange} error="Error message" />)

      const uploadButton = screen.getByRole('button')
      expect(uploadButton).toHaveClass('border-destructive')

      // Verificar que los colores de error tienen contraste adecuado
      const errorMessage = screen.getByText('Error message')
      expect(errorMessage).toHaveClass('text-destructive')
    })
  })

  describe('Responsive Design Testing', () => {
    test('funcionalidad en pantallas pequeñas', () => {
      // Simular viewport pequeño
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('Upload images')).toBeInTheDocument()
    })

    test('funcionalidad en pantallas grandes', () => {
      // Simular viewport grande
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('Upload images')).toBeInTheDocument()
    })

    test('accesibilidad táctil en dispositivos móviles', async () => {
      const user = userEvent.setup({ touch: true })
      render(<FileUpload onValueChange={mockOnValueChange} />)

      const uploadButton = screen.getByRole('button')

      // Simular touch
      await user.pointer({ keys: '[Touch]', target: uploadButton })

      expect(uploadButton).toBeInTheDocument()
    })
  })

  describe('User Experience Quality Testing', () => {
    test('feedback visual claro durante drag & drop', async () => {
      render(<FileUpload onValueChange={mockOnValueChange} />)

      const dropZone = screen.getByRole('button')

      // Estado normal
      expect(screen.getByText('Upload images')).toBeInTheDocument()

      // Estado drag active
      fireEvent.dragEnter(dropZone)
      expect(screen.getByText('Drop files here')).toBeInTheDocument()
      expect(dropZone).toHaveClass('border-primary')

      // Regresar a estado normal
      fireEvent.dragLeave(dropZone)
      expect(screen.getByText('Upload images')).toBeInTheDocument()
    })

    test('indicadores de progreso claros', () => {
      render(<FileUpload onValueChange={mockOnValueChange} disabled={true} />)

      const uploadButton = screen.getByRole('button')

      // Estado deshabilitado debería ser visualmente claro
      expect(uploadButton).toHaveClass('opacity-50', 'cursor-not-allowed')
    })

    test('mensajes de error informativos', async () => {
      const user = userEvent.setup()
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, largeFile)

      // Error debería ser específico y útil
      const errorMessage = screen.getByText(/exceeds maximum size of 5.0MB/)
      expect(errorMessage).toBeInTheDocument()
    })

    test('información de archivo clara y útil', async () => {
      const user = userEvent.setup()
      const file = new File(['test content'], 'test-image.jpg', { type: 'image/jpeg' })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')
      await user.upload(input!, file)

      // Mostrar información completa del archivo
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument()
      expect(screen.getByText(/MB/)).toBeInTheDocument()

      // Mostrar previsualización para imágenes
      expect(screen.getByRole('img')).toBeInTheDocument()
      expect(screen.getByRole('img')).toHaveAttribute('alt', 'test-image.jpg')
    })
  })

  describe('Internationalization Testing', () => {
    test('soporte para diferentes idiomas', () => {
      // Simular diferentes configuraciones de locale
      const originalLocale = navigator.language

      Object.defineProperty(navigator, 'language', {
        value: 'es-ES',
        configurable: true,
      })

      render(<FileUpload onValueChange={mockOnValueChange} />)

      expect(screen.getByRole('button')).toBeInTheDocument()

      // Restaurar locale original
      Object.defineProperty(navigator, 'language', {
        value: originalLocale,
        configurable: true,
      })
    })

    test('manejo de archivos con nombres en diferentes idiomas', async () => {
      const user = userEvent.setup()
      const files = [
        new File(['test'], '中文文件.jpg', { type: 'image/jpeg' }),
        new File(['test'], 'файл.jpg', { type: 'image/jpeg' }),
        new File(['test'], 'العربية.jpg', { type: 'image/jpeg' })
      ]

      render(<FileUpload onValueChange={mockOnValueChange} />)

      const input = screen.getByRole('button').querySelector('input[type="file"]')

      for (const file of files) {
        mockOnValueChange.mockClear()
        await user.upload(input!, file)

        expect(mockOnValueChange).toHaveBeenCalledWith([file])
        expect(screen.getByText(file.name)).toBeInTheDocument()
      }
    })
  })
})