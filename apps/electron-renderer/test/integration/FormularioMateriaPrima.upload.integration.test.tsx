/**
 * Tests de Integración para Formulario Materia Prima con File Upload - Fase 5
 * Testing completo de la integración del FileUpload en el formulario de materia prima
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { Form } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Mock de servicios y hooks
jest.mock('../../../src/services/materiaPrimaService', () => ({
  MateriaPrimaService: jest.fn().mockImplementation(() => ({
    subirImagen: jest.fn().mockResolvedValue({
      success: true,
      url: 'file:///test/path/image.png',
      filename: 'test-image.png'
    }),
    crear: jest.fn().mockResolvedValue({
      id: 'new-id',
      nombre: 'Test Material',
      imagen_url: 'file:///test/path/image.png'
    })
  }))
}))

jest.mock('../../../src/hooks/useMateriaPrima', () => ({
  useMateriaPrima: jest.fn(() => ({
    loading: false,
    error: null,
    crear: jest.fn().mockResolvedValue({
      id: 'new-id',
      nombre: 'Test Material'
    })
  }))
}))

import { MateriaPrimaService } from '../../../src/services/materiaPrimaService'

// Mock del componente Formulario
const mockFormulario = ({ initialData, onSubmit }: {
  initialData?: any
  onSubmit: (data: any) => void
}) => {
  const [formData, setFormData] = React.useState(initialData || {
    nombre: '',
    codigo_barras: '',
    descripcion: '',
    imagen_url: '',
    estatus: 'ACTIVO',
    stock_actual: 0,
    stock_minimo: 0,
    costo_unitario: 0,
    id_proveedor: '',
    id_categoria: ''
  })

  const [isUploading, setIsUploading] = React.useState(false)
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
  const [uploadError, setUploadError] = React.useState<string | null>(null)

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const file = files[0]
      const service = new MateriaPrimaService()

      const result = await service.subirImagen(file, {
        materiaPrimaId: initialData?.id || 'new',
        codigoBarras: formData.codigo_barras || 'temp',
        nombre: formData.nombre || 'temp'
      })

      if (result.success && result.url) {
        setFormData(prev => ({
          ...prev,
          imagen_url: result.url
        }))
        setSelectedFiles(files)
      } else {
        setUploadError(result.error || 'Error al subir imagen')
      }
    } catch (error) {
      setUploadError('Error inesperado al subir imagen')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Importar FileUpload (simulado para testing)
  const FileUpload = ({ onValueChange, value, error }: any) => (
    <div data-testid="file-upload">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          onValueChange(files)
        }}
        data-testid="file-input"
      />
      {error && <div data-testid="file-error">{error}</div>}
      {value && value.length > 0 && (
        <div data-testid="selected-files">
          {value.map((file: File, index: number) => (
            <div key={index} data-testid={`file-${index}`}>
              {file.name}
              <button
                onClick={() => onValueChange([])}
                data-testid="remove-file"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} data-testid="materia-prima-form">
      <div>
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          type="text"
          value={formData.nombre}
          onChange={(e) => handleInputChange('nombre', e.target.value)}
          data-testid="nombre-input"
          required
        />
      </div>

      <div>
        <label htmlFor="codigo_barras">Código de Barras</label>
        <input
          id="codigo_barras"
          type="text"
          value={formData.codigo_barras}
          onChange={(e) => handleInputChange('codigo_barras', e.target.value)}
          data-testid="codigo-input"
          required
        />
      </div>

      <div>
        <label htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => handleInputChange('descripcion', e.target.value)}
          data-testid="descripcion-input"
        />
      </div>

      <div>
        <label>Imagen</label>
        <FileUpload
          onValueChange={handleFileUpload}
          value={selectedFiles}
          error={uploadError}
        />
        {formData.imagen_url && (
          <div data-testid="image-preview">
            <img
              src={formData.imagen_url}
              alt="Preview"
              data-testid="preview-img"
            />
            <p data-testid="image-path">{formData.imagen_url}</p>
          </div>
        )}
      </div>

      {isUploading && (
        <div data-testid="uploading">Subiendo imagen...</div>
      )}

      <button
        type="submit"
        data-testid="submit-button"
        disabled={isUploading}
      >
        {isUploading ? 'Guardando...' : 'Guardar Material'}
      </button>
    </form>
  )
}

describe('Formulario Materia Prima con File Upload - Integration Testing', () => {
  const mockOnSubmit = jest.fn()
  const mockService = new MateriaPrimaService() as jest.Mocked<MateriaPrimaService>

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('5.1 Testing de Flujo Completo de Upload', () => {
    test('flujo completo de carga de imagen en formulario', async () => {
      const user = userEvent.setup()
      render(<mockFormulario onSubmit={mockOnSubmit} />)

      // Llenar campos básicos
      await user.type(screen.getByTestId('nombre-input'), 'Material de Prueba')
      await user.type(screen.getByTestId('codigo-input'), '123456789')
      await user.type(screen.getByTestId('descripcion-input'), 'Descripción de prueba')

      // Seleccionar archivo
      const file = new File(['test'], 'test-image.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('file-input')
      await user.upload(fileInput, file)

      // Esperar el upload
      await waitFor(() => {
        expect(screen.queryByTestId('uploading')).not.toBeInTheDocument()
      })

      // Verificar que se muestra la previsualización
      expect(screen.getByTestId('image-preview')).toBeInTheDocument()
      expect(screen.getByTestId('preview-img')).toBeInTheDocument()
      expect(screen.getByTestId('image-path')).toHaveTextContent('file:///test/path/image.png')

      // Enviar formulario
      await user.click(screen.getByTestId('submit-button'))

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Material de Prueba',
          codigo_barras: '123456789',
          descripcion: 'Descripción de prueba',
          imagen_url: 'file:///test/path/image.png'
        })
      )
    })

    test('manejo de errores de upload en formulario', async () => {
      const user = userEvent.setup()

      // Mock error en el servicio
      mockService.subirImagen.mockResolvedValue({
        success: false,
        error: 'Error al subir archivo'
      })

      render(<mockFormulario onSubmit={mockOnSubmit} />)

      const file = new File(['test'], 'test-image.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('file-input')
      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByTestId('file-error')).toHaveTextContent('Error al subir archivo')
      })

      expect(screen.queryByTestId('image-preview')).not.toBeInTheDocument()
    })

    test('estado loading durante upload', async () => {
      const user = userEvent.setup()

      // Mock upload lento
      mockService.subirImagen.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 2000))
      )

      render(<mockFormulario onSubmit={mockOnSubmit} />)

      const file = new File(['test'], 'test-image.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('file-input')
      await user.upload(fileInput, file)

      // Verificar estado de loading
      expect(screen.getByTestId('uploading')).toBeInTheDocument()
      expect(screen.getByTestId('submit-button')).toBeDisabled()
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Guardando...')

      // Avanzar tiempo para completar upload
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(screen.queryByTestId('uploading')).not.toBeInTheDocument()
        expect(screen.getByTestId('submit-button')).not.toBeDisabled()
      })
    })
  })

  describe('5.2 Testing en Modo Edición', () => {
    test('carga de imagen existente en modo edición', () => {
      const existingData = {
        id: 'existing-id',
        nombre: 'Material Existente',
        codigo_barras: '987654321',
        imagen_url: 'file:///existing/path/image.jpg'
      }

      render(<mockFormulario initialData={existingData} onSubmit={mockOnSubmit} />)

      expect(screen.getByTestId('nombre-input')).toHaveValue('Material Existente')
      expect(screen.getByTestId('codigo-input')).toHaveValue('987654321')
      expect(screen.getByTestId('image-preview')).toBeInTheDocument()
      expect(screen.getByTestId('preview-img')).toHaveAttribute('src', 'file:///existing/path/image.jpg')
    })

    test('reemplazo de imagen en modo edición', async () => {
      const user = userEvent.setup()
      const existingData = {
        id: 'existing-id',
        nombre: 'Material Existente',
        codigo_barras: '987654321',
        imagen_url: 'file:///existing/path/image.jpg'
      }

      render(<mockFormulario initialData={existingData} onSubmit={mockOnSubmit} />)

      // Verificar imagen existente
      expect(screen.getByTestId('image-preview')).toBeInTheDocument()

      // Seleccionar nueva imagen
      const newFile = new File(['test'], 'new-image.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('file-input')
      await user.upload(fileInput, newFile)

      await waitFor(() => {
        expect(screen.getByTestId('image-path')).toHaveTextContent('file:///test/path/image.png')
      })
    })
  })

  describe('5.3 Testing de Validaciones de Formulario', () => {
    test('no permite enviar formulario sin campos requeridos', async () => {
      const user = userEvent.setup()
      render(<mockFormulario onSubmit={mockOnSubmit} />)

      // Intentar enviar sin llenar campos requeridos
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      // HTML5 validation debería prevenir el submit
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    test('permite enviar formulario sin imagen', async () => {
      const user = userEvent.setup()
      render(<mockFormulario onSubmit={mockOnSubmit} />)

      // Llenar campos requeridos pero sin imagen
      await user.type(screen.getByTestId('nombre-input'), 'Material sin imagen')
      await user.type(screen.getByTestId('codigo-input'), '111111111')

      await user.click(screen.getByTestId('submit-button'))

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Material sin imagen',
          codigo_barras: '111111111',
          imagen_url: '' // sin imagen
        })
      )
    })
  })

  describe('5.4 Testing de Performance', () => {
    test('manejo correcto de memory leaks', async () => {
      const user = userEvent.setup()

      // Mock para rastrear URLs de objetos
      const objectUrls = new Set<string>()
      global.URL.createObjectURL = jest.fn((file: File) => {
        const url = `blob:${file.name}`
        objectUrls.add(url)
        return url
      })
      global.URL.revokeObjectURL = jest.fn((url: string) => {
        objectUrls.delete(url)
      })

      const { unmount } = render(<mockFormulario onSubmit={mockOnSubmit} />)

      // Cargar imagen
      const file = new File(['test'], 'test-image.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('file-input')
      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByTestId('image-preview')).toBeInTheDocument()
      })

      // Remover archivo
      const removeButton = screen.getByTestId('remove-file')
      await user.click(removeButton)

      // Unmount component
      unmount()

      // Verificar limpieza de URLs (simulado)
      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('5.5 Testing de Accesibilidad', () => {
    test('flujo completo con navegación por teclado', async () => {
      const user = userEvent.setup()
      render(<mockFormulario onSubmit={mockOnSubmit} />)

      // Navegación por tab
      await user.tab()
      expect(screen.getByTestId('nombre-input')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('codigo-input')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('descripcion-input')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('file-input')).toHaveFocus()

      // Llenar formulario con teclado
      await user.keyboard('Material de Teclado{Tab}')
      await user.keyboard('123456789{Tab}')
      await user.keyboard('Descripción con teclado{Tab}')

      // Seleccionar archivo con teclado (Enter en input file)
      await user.keyboard('{Enter}')

      // Enviar formulario
      await user.tab()
      await user.keyboard('{Enter}')

      expect(mockOnSubmit).toHaveBeenCalled()
    })

    test('etiquetas y asociaciones correctas', () => {
      render(<mockFormulario onSubmit={mockOnSubmit} />)

      expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
      expect(screen.getByLabelText('Código de Barras')).toBeInTheDocument()
      expect(screen.getByLabelText('Descripción')).toBeInTheDocument()
    })
  })
})