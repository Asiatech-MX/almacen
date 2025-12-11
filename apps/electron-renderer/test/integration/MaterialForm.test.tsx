import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient } from '@tanstack/react-query'
import MaterialForm from '../../src/components/forms/MaterialForm'
import {
  createTestQueryClient,
  setupElectronAPIMocks,
  mockElectronAPI,
  mockCategoriaData,
  mockPresentacionData,
  mockCategoriasData,
  mockPresentacionesData
} from '../../src/test-utils/test-utils'
import type { Material, Proveedor } from '@shared-types'

// Mock data para los tests
const mockMaterial: Material = {
  id: '1',
  codigo: 'MAT-001',
  nombre: 'Material de prueba',
  descripcion: 'Descripción del material',
  categoria: 'Electricidad',
  id_categoria: '1',
  presentacion: 'Unidad',
  id_presentacion: '1',
  stock_minimo: 10,
  stock_actual: 50,
  costo_unitario: 100.50,
  fecha_creacion: '2024-01-01T00:00:00.000Z',
  fecha_actualizacion: '2024-01-01T00:00:00.000Z',
}

const mockProveedores: Proveedor[] = [
  {
    id: '1',
    nombre: 'Proveedor A',
    ruc: '12345678901',
    telefono: '999999999',
    email: 'proveedor@test.com',
    direccion: 'Dirección de prueba',
    activo: true
  }
]

describe('MaterialForm Integration Tests', () => {
  let queryClient: QueryClient
  let cleanupMocks: () => void
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    queryClient = createTestQueryClient()
    cleanupMocks = setupElectronAPIMocks()
    user = userEvent.setup()
    jest.clearAllMocks()

    // Setup mocks por defecto
    mockElectronAPI.categoria.listar.mockResolvedValue(mockCategoriasData)
    mockElectronAPI.presentacion.listar.mockResolvedValue(mockPresentacionesData)
    mockElectronAPI.categoria.crear.mockResolvedValue(mockCategoriaData)
    mockElectronAPI.presentacion.crear.mockResolvedValue(mockPresentacionData)
  })

  afterEach(() => {
    cleanupMocks()
    queryClient.clear()
  })

  const renderMaterialForm = (props = {}) => {
    return render(
      <MaterialForm
        material={mockMaterial}
        proveedores={mockProveedores}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        {...props}
      />,
      {
        wrapper: ({ children }) => (
          <div>{children}</div>
        )
      }
    )
  }

  describe('Initial Load', () => {
    it('should load categories and presentations on mount', async () => {
      // Act
      renderMaterialForm()

      // Assert
      expect(screen.getByDisplayValue('MAT-001')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Material de prueba')).toBeInTheDocument()

      // Verificar que los dropdowns cargan los datos
      await waitFor(() => {
        expect(screen.getByText('Electricidad')).toBeInTheDocument()
        expect(screen.getByText('Unidad')).toBeInTheDocument()
      })

      expect(mockElectronAPI.categoria.listar).toHaveBeenCalledWith(1, true)
      expect(mockElectronAPI.presentacion.listar).toHaveBeenCalledWith(1, true)
    })

    it('should show loading states while fetching data', async () => {
      // Arrange - Mock respuestas lentas
      mockElectronAPI.categoria.listar.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockCategoriasData), 100))
      )
      mockElectronAPI.presentacion.listar.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPresentacionesData), 100))
      )

      // Act
      renderMaterialForm()

      // Assert - Verificar skeletons o indicadores de carga
      const categorySelect = screen.getByLabelText('Categoría')
      const presentationSelect = screen.getByLabelText('Presentación')

      // Los selectores deberían estar deshabilitados durante la carga
      expect(categorySelect).toBeDisabled()
      expect(presentationSelect).toBeDisabled()

      // Esperar a que se carguen los datos
      await waitFor(() => {
        expect(screen.getByText('Electricidad')).toBeInTheDocument()
      })

      expect(categorySelect).not.toBeDisabled()
      expect(presentationSelect).not.toBeDisabled()
    })

    it('should handle error when fetching categories', async () => {
      // Arrange
      mockElectronAPI.categoria.listar.mockRejectedValue(new Error('Error al cargar categorías'))

      // Act
      renderMaterialForm()

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Error al cargar categorías/)).toBeInTheDocument()
      })
    })
  })

  describe('Creating New Categories', () => {
    it('should open modal for creating new category', async () => {
      // Act
      renderMaterialForm()
      const categorySelect = screen.getByLabelText('Categoría')
      const addNewOption = screen.getByText('Agregar nueva categoría')

      await user.click(addNewOption)

      // Assert
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Agregar Nueva Categoría')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Ej: Electricidad, Plomería, etc.')).toBeInTheDocument()
    })

    it('should create new category successfully', async () => {
      // Arrange
      const newCategoryName = 'Nueva Categoría Test'
      const newCategoria = {
        ...mockCategoriaData,
        id: '3',
        nombre: newCategoryName
      }
      mockElectronAPI.categoria.crear.mockResolvedValue(newCategoria)

      // Act
      renderMaterialForm()

      // Abrir modal de nueva categoría
      const addNewOption = screen.getByText('Agregar nueva categoría')
      await user.click(addNewOption)

      // Llenar formulario
      const input = screen.getByPlaceholderText('Ej: Electricidad, Plomería, etc.')
      await user.type(input, newCategoryName)

      // Guardar
      const saveButton = screen.getByRole('button', { name: /agregar categoría/i })
      await user.click(saveButton)

      // Assert
      await waitFor(() => {
        expect(mockElectronAPI.categoria.crear).toHaveBeenCalledWith(
          expect.objectContaining({
            nombre: newCategoryName
          }),
          undefined,
          undefined
        )
      })

      // Verificar que el modal se cierre
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // Verificar que la nueva categoría aparezca en el dropdown
      await waitFor(() => {
        expect(screen.getByText(newCategoryName)).toBeInTheDocument()
      })
    })

    it('should handle error when creating category', async () => {
      // Arrange
      mockElectronAPI.categoria.crear.mockRejectedValue(new Error('Error al crear categoría'))

      // Act
      renderMaterialForm()

      const addNewOption = screen.getByText('Agregar nueva categoría')
      await user.click(addNewOption)

      const input = screen.getByPlaceholderText('Ej: Electricidad, Plomería, etc.')
      await user.type(input, 'Nueva Categoría')

      const saveButton = screen.getByRole('button', { name: /agregar categoría/i })
      await user.click(saveButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Error al crear categoría/i)).toBeInTheDocument()
      })

      // Modal debería permanecer abierto
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should validate category name is not empty', async () => {
      // Act
      renderMaterialForm()

      const addNewOption = screen.getByText('Agregar nueva categoría')
      await user.click(addNewOption)

      const saveButton = screen.getByRole('button', { name: /agregar categoría/i })
      await user.click(saveButton)

      // Assert
      expect(saveButton).toBeDisabled()
    })
  })

  describe('Creating New Presentations', () => {
    it('should open modal for creating new presentation', async () => {
      // Act
      renderMaterialForm()
      const addNewOption = screen.getByText('Agregar nueva presentación')

      await user.click(addNewOption)

      // Assert
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Agregar Nueva Presentación')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Nombre de la presentación')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Ej: Und, Cja, Kg, Lt')).toBeInTheDocument()
    })

    it('should create new presentation successfully', async () => {
      // Arrange
      const newPresentationName = 'Nueva Presentación'
      const newPresentationAbbr = 'NP'
      const newPresentacion = {
        ...mockPresentacionData,
        id: '3',
        nombre: newPresentationName,
        abreviatura: newPresentationAbbr
      }
      mockElectronAPI.presentacion.crear.mockResolvedValue(newPresentacion)

      // Act
      renderMaterialForm()

      // Abrir modal de nueva presentación
      const addNewOption = screen.getByText('Agregar nueva presentación')
      await user.click(addNewOption)

      // Llenar formulario
      const nameInput = screen.getByPlaceholderText('Nombre de la presentación')
      const abbrInput = screen.getByPlaceholderText('Ej: Und, Cja, Kg, Lt')

      await user.type(nameInput, newPresentationName)
      await user.type(abbrInput, newPresentationAbbr)

      // Guardar
      const saveButton = screen.getByRole('button', { name: /agregar presentación/i })
      await user.click(saveButton)

      // Assert
      await waitFor(() => {
        expect(mockElectronAPI.presentacion.crear).toHaveBeenCalledWith(
          expect.objectContaining({
            nombre: newPresentationName,
            abreviatura: newPresentationAbbr
          }),
          undefined
        )
      })

      // Verificar que el modal se cierre
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // Verificar que la nueva presentación aparezca en el dropdown
      await waitFor(() => {
        expect(screen.getByText(newPresentationName)).toBeInTheDocument()
      })
    })

    it('should handle error when creating presentation', async () => {
      // Arrange
      mockElectronAPI.presentacion.crear.mockRejectedValue(new Error('Error al crear presentación'))

      // Act
      renderMaterialForm()

      const addNewOption = screen.getByText('Agregar nueva presentación')
      await user.click(addNewOption)

      const nameInput = screen.getByPlaceholderText('Nombre de la presentación')
      await user.type(nameInput, 'Nueva Presentación')

      const saveButton = screen.getByRole('button', { name: /agregar presentación/i })
      await user.click(saveButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Error al crear presentación/i)).toBeInTheDocument()
      })

      // Modal debería permanecer abierto
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should submit form with correct data', async () => {
      // Arrange
      const onSubmit = jest.fn()
      renderMaterialForm({ onSubmit })

      // Act
      const submitButton = screen.getByRole('button', { name: /guardar/i })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            codigo: 'MAT-001',
            nombre: 'Material de prueba',
            categoria: 'Electricidad',
            presentacion: 'Unidad'
          })
        )
      })
    })

    it('should validate required fields', async () => {
      // Act
      renderMaterialForm({ material: {} as Material })

      const submitButton = screen.getByRole('button', { name: /guardar/i })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/el código es requerido/i)).toBeInTheDocument()
        expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument()
      })
    })

    it('should create material with newly created category and presentation', async () => {
      // Arrange
      const onSubmit = jest.fn()
      const newCategoria = {
        ...mockCategoriaData,
        id: '3',
        nombre: 'Nueva Categoría Integración'
      }
      const newPresentacion = {
        ...mockPresentacionData,
        id: '3',
        nombre: 'Nueva Presentación Integración',
        abreviatura: 'NPI'
      }

      mockElectronAPI.categoria.crear.mockResolvedValue(newCategoria)
      mockElectronAPI.presentacion.crear.mockResolvedValue(newPresentacion)

      // Act
      renderMaterialForm({ onSubmit, material: {} as Material })

      // Crear nueva categoría
      const addNewCategory = screen.getByText('Agregar nueva categoría')
      await user.click(addNewCategory)

      const categoryInput = screen.getByPlaceholderText('Ej: Electricidad, Plomería, etc.')
      await user.type(categoryInput, 'Nueva Categoría Integración')

      const saveCategoryButton = screen.getByRole('button', { name: /agregar categoría/i })
      await user.click(saveCategoryButton)

      // Esperar a que se cierre el modal
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Crear nueva presentación
      const addNewPresentation = screen.getByText('Agregar nueva presentación')
      await user.click(addNewPresentation)

      const presentationNameInput = screen.getByPlaceholderText('Nombre de la presentación')
      const presentationAbbrInput = screen.getByPlaceholderText('Ej: Und, Cja, Kg, Lt')

      await user.type(presentationNameInput, 'Nueva Presentación Integración')
      await user.type(presentationAbbrInput, 'NPI')

      const savePresentationButton = screen.getByRole('button', { name: /agregar presentación/i })
      await user.click(savePresentationButton)

      // Esperar a que se cierre el modal
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Llenar formulario y enviar
      const codeInput = screen.getByLabelText('Código')
      const nameInput = screen.getByLabelText('Nombre')

      await user.type(codeInput, 'MAT-NEW')
      await user.type(nameInput, 'Material con nueva categoría y presentación')

      const submitButton = screen.getByRole('button', { name: /guardar/i })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            codigo: 'MAT-NEW',
            nombre: 'Material con nueva categoría y presentación',
            categoria: 'Nueva Categoría Integración',
            presentacion: 'Nueva Presentación Integración'
          })
        )
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should update dropdown when new category is created from another component', async () => {
      // Arrange
      renderMaterialForm()

      // Esperar carga inicial
      await waitFor(() => {
        expect(screen.getByText('Electricidad')).toBeInTheDocument()
      })

      // Simular creación de categoría desde otro componente
      const newCategoria = {
        ...mockCategoriaData,
        id: '4',
        nombre: 'Categoría Externa'
      }

      // Act - Actualizar cache directamente
      queryClient.setQueryData(['categorias', 1, true], (old: any[] = []) => [
        ...old,
        newCategoria
      ])

      // Assert - La nueva categoría debería aparecer en el dropdown
      await waitFor(() => {
        expect(screen.getByText('Categoría Externa')).toBeInTheDocument()
      })
    })

    it('should maintain form state when categories are updated', async () => {
      // Arrange
      renderMaterialForm()

      // Esperar carga inicial
      await waitFor(() => {
        expect(screen.getByText('Electricidad')).toBeInTheDocument()
      })

      // Seleccionar una categoría
      const categorySelect = screen.getByLabelText('Categoría')
      await user.click(categorySelect)
      await user.click(screen.getByText('Plomería'))

      // Verificar que la categoría seleccionada se mantiene
      expect(categorySelect).toHaveValue('Plomería')

      // Simular actualización de categorías
      const newCategoria = {
        ...mockCategoriaData,
        id: '5',
        nombre: 'Categoría Nueva'
      }

      // Act
      queryClient.setQueryData(['categorias', 1, true], (old: any[] = []) => [
        ...old,
        newCategoria
      ])

      // Assert - La selección debería mantenerse
      expect(categorySelect).toHaveValue('Plomería')
      await waitFor(() => {
        expect(screen.getByText('Categoría Nueva')).toBeInTheDocument()
      })
    })
  })
})