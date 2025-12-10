import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import {
  useCategorias,
  useCategoria,
  useCrearCategoria,
  useEditarCategoria,
  useEliminarCategoria,
  useToggleActivoCategoria,
  useCategoriaArbol,
  useBuscarCategorias
} from '../../src/hooks/useCategoria'
import {
  renderWithQueryClient,
  createTestQueryClient,
  setupElectronAPIMocks,
  mockElectronAPI,
  createMockIPCResponse,
  createMockIPCError,
  mockCategoriaData,
  mockCategoriasData,
  waitForQueriesToStabilize
} from '../../src/test-utils/test-utils'
import type { Categoria, NewCategoria, CategoriaUpdate } from '@shared-types/referenceData'

// Mock data específico para tests
const mockNewCategoria: NewCategoria = {
  nombre: 'Nueva Categoría',
  nivel: 2,
  activo: true,
  id_institucion: 1,
  id_padre: '1'
}

const mockCategoriaUpdate: CategoriaUpdate = {
  nombre: 'Categoría Actualizada'
}

const mockCategoriaArbol = [
  {
    ...mockCategoriaData,
    hijos: [
      {
        ...mockCategoriaData,
        id: '2',
        nombre: 'Subcategoría',
        nivel: 2,
        id_padre: '1',
        hijos: []
      }
    ]
  }
]

describe('useCategoria Hooks', () => {
  let queryClient: QueryClient
  let cleanupMocks: () => void

  beforeEach(() => {
    queryClient = createTestQueryClient()
    cleanupMocks = setupElectronAPIMocks()
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanupMocks()
    queryClient.clear()
  })

  describe('useCategorias', () => {
    it('should fetch categories successfully', async () => {
      // Arrange
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategoriasData)

      // Act
      const { result } = renderHook(() => useCategorias(1), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      expect(result.current.isLoading).toBe(true)
      expect(mockElectronAPI.categoria.listar).toHaveBeenCalledWith(1, true)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockCategoriasData)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      // Arrange
      const errorMessage = 'Error al cargar categorías'
      mockElectronAPI.categoria.listar.mockRejectedValue(new Error(errorMessage))

      // Act
      const { result } = renderHook(() => useCategorias(1), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe(errorMessage)
      expect(result.current.data).toBeUndefined()
    })

    it('should not fetch when idInstitucion is not provided', () => {
      // Act
      const { result } = renderHook(() => useCategorias(0), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isIdle).toBe(true)
      expect(mockElectronAPI.categoria.listar).not.toHaveBeenCalled()
    })

    it('should include inactive categories when requested', async () => {
      // Arrange
      const mockInactiveCategories = [
        ...mockCategoriasData,
        {
          ...mockCategoriaData,
          id: '3',
          nombre: 'Inactiva',
          activo: false
        }
      ]
      mockElectronAPI.categoria.listar.mockResolvedValue(mockInactiveCategories)

      // Act
      const { result } = renderHook(() => useCategorias(1, false), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockElectronAPI.categoria.listar).toHaveBeenCalledWith(1, false)
      expect(result.current.data).toEqual(mockInactiveCategories)
    })
  })

  describe('useCategoria', () => {
    it('should fetch single category by id', async () => {
      // Arrange
      mockElectronAPI.categoria.obtener.mockResolvedValue(mockCategoriaData)

      // Act
      const { result } = renderHook(() => useCategoria('1'), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockCategoriaData)
      expect(mockElectronAPI.categoria.obtener).toHaveBeenCalledWith('1', false)
    })

    it('should include inactive category when requested', async () => {
      // Arrange
      mockElectronAPI.categoria.obtener.mockResolvedValue({
        ...mockCategoriaData,
        activo: false
      })

      // Act
      const { result } = renderHook(() => useCategoria('1', true), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockElectronAPI.categoria.obtener).toHaveBeenCalledWith('1', true)
      expect(result.current.data?.activo).toBe(false)
    })
  })

  describe('useCategoriaArbol', () => {
    it('should fetch category tree structure', async () => {
      // Arrange
      mockElectronAPI.categoria.listarArbol.mockResolvedValue(mockCategoriaArbol)

      // Act
      const { result } = renderHook(() => useCategoriaArbol(1), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockCategoriaArbol)
      expect(mockElectronAPI.categoria.listarArbol).toHaveBeenCalledWith(1, true)
    })
  })

  describe('useBuscarCategorias', () => {
    it('should search categories by terms', async () => {
      // Arrange
      const searchResults = [mockCategoriaData]
      mockElectronAPI.categoria.buscar.mockResolvedValue(searchResults)

      // Act
      const { result } = renderHook(() => useBuscarCategorias(1, 'Electric'), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(searchResults)
      expect(mockElectronAPI.categoria.buscar).toHaveBeenCalledWith(1, 'Electric', true)
    })

    it('should not search when search term is empty', () => {
      // Act
      const { result } = renderHook(() => useBuscarCategorias(1, ''), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isIdle).toBe(true)
      expect(mockElectronAPI.categoria.buscar).not.toHaveBeenCalled()
    })
  })

  describe('useCrearCategoria', () => {
    it('should create new category successfully', async () => {
      // Arrange
      const createdCategoria = {
        ...mockCategoriaData,
        id: '3',
        nombre: mockNewCategoria.nombre
      }
      mockElectronAPI.categoria.crear.mockResolvedValue(createdCategoria)

      // Act
      const { result } = renderHook(() => useCrearCategoria(), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      expect(result.current.isIdle).toBe(true)

      await act(async () => {
        result.current.mutate({
          categoria: mockNewCategoria,
          idPadre: '1'
        })
      })

      expect(result.current.isPending).toBe(true)
      expect(mockElectronAPI.categoria.crear).toHaveBeenCalledWith(
        mockNewCategoria,
        '1',
        undefined
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(createdCategoria)
    })

    it('should handle creation error', async () => {
      // Arrange
      const errorMessage = 'Error al crear categoría'
      mockElectronAPI.categoria.crear.mockRejectedValue(new Error(errorMessage))

      // Act
      const { result } = renderHook(() => useCrearCategoria(), {
        wrapper: withQueryClient(queryClient)
      })

      await act(async () => {
        result.current.mutate({
          categoria: mockNewCategoria
        })
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe(errorMessage)
    })

    it('should perform optimistic update', async () => {
      // Arrange
      mockElectronAPI.categoria.crar.mockResolvedValue(mockCategoriaData)
      mockElectronAPI.categoria.listar.mockResolvedValue([])

      // Pre-cargar categorías existentes
      const { result: preloadResult } = renderHook(() => useCategorias(1), {
        wrapper: withQueryClient(queryClient)
      })

      await waitFor(() => {
        expect(preloadResult.current.isSuccess).toBe(true)
      })

      // Act
      const { result } = renderHook(() => useCrearCategoria(), {
        wrapper: withQueryClient(queryClient)
      })

      await act(async () => {
        result.current.mutate({
          categoria: mockNewCategoria
        })
      })

      // Verificar actualización optimista
      const cachedData = queryClient.getQueryData(['categorias', 1, true])
      expect(cachedData).toContainEqual(
        expect.objectContaining({
          nombre: mockNewCategoria.nombre
        })
      )
    })
  })

  describe('useEditarCategoria', () => {
    it('should update category successfully', async () => {
      // Arrange
      const updatedCategoria = {
        ...mockCategoriaData,
        ...mockCategoriaUpdate
      }
      mockElectronAPI.categoria.editar.mockResolvedValue(updatedCategoria)

      // Act
      const { result } = renderHook(() => useEditarCategoria(), {
        wrapper: withQueryClient(queryClient)
      })

      await act(async () => {
        result.current.mutate({
          id: '1',
          cambios: mockCategoriaUpdate
        })
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(updatedCategoria)
      expect(mockElectronAPI.categoria.editar).toHaveBeenCalledWith(
        '1',
        mockCategoriaUpdate,
        undefined
      )
    })
  })

  describe('useEliminarCategoria', () => {
    it('should delete category successfully', async () => {
      // Arrange
      mockElectronAPI.categoria.eliminar.mockResolvedValue(true)

      // Act
      const { result } = renderHook(() => useEliminarCategoria(), {
        wrapper: withQueryClient(queryClient)
      })

      await act(async () => {
        result.current.mutate({
          id: '1'
        })
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBe(true)
      expect(mockElectronAPI.categoria.eliminar).toHaveBeenCalledWith(
        '1',
        false,
        undefined
      )
    })

    it('should force delete when specified', async () => {
      // Arrange
      mockElectronAPI.categoria.eliminar.mockResolvedValue(true)

      // Act
      const { result } = renderHook(() => useEliminarCategoria(), {
        wrapper: withQueryClient(queryClient)
      })

      await act(async () => {
        result.current.mutate({
          id: '1',
          forzar: true
        })
      })

      // Assert
      expect(mockElectronAPI.categoria.eliminar).toHaveBeenCalledWith(
        '1',
        true,
        undefined
      )
    })
  })

  describe('useToggleActivoCategoria', () => {
    it('should activate category', async () => {
      // Arrange
      const activatedCategoria = {
        ...mockCategoriaData,
        activo: true
      }
      mockElectronAPI.categoria.toggleActivo.mockResolvedValue(activatedCategoria)

      // Act
      const { result } = renderHook(() => useToggleActivoCategoria(), {
        wrapper: withQueryClient(queryClient)
      })

      await act(async () => {
        result.current.mutate({
          id: '1',
          activar: true
        })
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(activatedCategoria)
      expect(mockElectronAPI.categoria.toggleActivo).toHaveBeenCalledWith(
        '1',
        true,
        undefined
      )
    })

    it('should deactivate category', async () => {
      // Arrange
      const deactivatedCategoria = {
        ...mockCategoriaData,
        activo: false
      }
      mockElectronAPI.categoria.toggleActivo.mockResolvedValue(deactivatedCategoria)

      // Act
      const { result } = renderHook(() => useToggleActivoCategoria(), {
        wrapper: withQueryClient(queryClient)
      })

      await act(async () => {
        result.current.mutate({
          id: '1',
          activar: false
        })
      })

      // Assert
      expect(result.current.data?.activo).toBe(false)
    })
  })
})