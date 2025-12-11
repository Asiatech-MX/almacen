import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import {
  usePresentaciones,
  usePresentacion,
  useCrearPresentacion,
  useEditarPresentacion,
  useEliminarPresentacion,
  useToggleActivoPresentacion,
  usePresentacionesPredeterminadas,
  useEstablecerPredeterminada,
  useBuscarPresentaciones
} from '../../src/hooks/usePresentacion'
import {
  renderWithQueryClient,
  createTestQueryClient,
  setupElectronAPIMocks,
  mockElectronAPI,
  createMockIPCResponse,
  createMockIPCError,
  mockPresentacionData,
  mockPresentacionesData,
  waitForQueriesToStabilize
} from '../../src/test-utils/test-utils'
import type { Presentacion, NewPresentacion, PresentacionUpdate } from '@shared-types/referenceData'

// Mock data específico para tests
const mockNewPresentacion: NewPresentacion = {
  nombre: 'Nueva Presentación',
  abreviatura: 'NP',
  activo: true,
  id_institucion: 1
}

const mockPresentacionUpdate: PresentacionUpdate = {
  nombre: 'Presentación Actualizada',
  abreviatura: 'PA'
}

const mockPresentacionesPredeterminadas = [
  {
    ...mockPresentacionData,
    id: '1',
    nombre: 'Unidad',
    es_predeterminado: true
  }
]

describe('usePresentacion Hooks', () => {
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

  describe('usePresentaciones', () => {
    it('should fetch presentations successfully', async () => {
      // Arrange
      mockElectronAPI.presentacion.listar.mockResolvedValue(mockPresentacionesData)

      // Act
      const { result } = renderHook(() => usePresentaciones(1), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      expect(result.current.isLoading).toBe(true)
      expect(mockElectronAPI.presentacion.listar).toHaveBeenCalledWith(1, true)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockPresentacionesData)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      // Arrange
      const errorMessage = 'Error al cargar presentaciones'
      mockElectronAPI.presentacion.listar.mockRejectedValue(new Error(errorMessage))

      // Act
      const { result } = renderHook(() => usePresentaciones(1), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe(errorMessage)
      expect(result.current.data).toBeUndefined()
    })

    it('should include inactive presentations when requested', async () => {
      // Arrange
      const mockInactivePresentations = [
        ...mockPresentacionesData,
        {
          ...mockPresentacionData,
          id: '3',
          nombre: 'Inactiva',
          activo: false
        }
      ]
      mockElectronAPI.presentacion.listar.mockResolvedValue(mockInactivePresentations)

      // Act
      const { result } = renderHook(() => usePresentaciones(1, false), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockElectronAPI.presentacion.listar).toHaveBeenCalledWith(1, false)
      expect(result.current.data).toEqual(mockInactivePresentations)
    })
  })

  describe('usePresentacion', () => {
    it('should fetch single presentation by id', async () => {
      // Arrange
      mockElectronAPI.presentacion.obtener.mockResolvedValue(mockPresentacionData)

      // Act
      const { result } = renderHook(() => usePresentacion('1'), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockPresentacionData)
      expect(mockElectronAPI.presentacion.obtener).toHaveBeenCalledWith('1', false)
    })

    it('should include inactive presentation when requested', async () => {
      // Arrange
      mockElectronAPI.presentacion.obtener.mockResolvedValue({
        ...mockPresentacionData,
        activo: false
      })

      // Act
      const { result } = renderHook(() => usePresentacion('1', true), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockElectronAPI.presentacion.obtener).toHaveBeenCalledWith('1', true)
      expect(result.current.data?.activo).toBe(false)
    })
  })

  describe('usePresentacionesPredeterminadas', () => {
    it('should fetch predeterminadas presentations', async () => {
      // Arrange
      mockElectronAPI.presentacion.obtenerPredeterminadas.mockResolvedValue(mockPresentacionesPredeterminadas)

      // Act
      const { result } = renderHook(() => usePresentacionesPredeterminadas(1), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockPresentacionesPredeterminadas)
      expect(mockElectronAPI.presentacion.obtenerPredeterminadas).toHaveBeenCalledWith(1)
    })
  })

  describe('useBuscarPresentaciones', () => {
    it('should search presentations by term', async () => {
      // Arrange
      const searchResults = [mockPresentacionData]
      mockElectronAPI.presentacion.buscar.mockResolvedValue(searchResults)

      // Act
      const { result } = renderHook(() => useBuscarPresentaciones(1, 'Uni'), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(searchResults)
      expect(mockElectronAPI.presentacion.buscar).toHaveBeenCalledWith(1, 'Uni', true)
    })

    it('should not search when search term is empty', () => {
      // Act
      const { result } = renderHook(() => useBuscarPresentaciones(1, ''), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isIdle).toBe(true)
      expect(mockElectronAPI.presentacion.buscar).not.toHaveBeenCalled()
    })
  })

  describe('useCrearPresentacion', () => {
    it('should create new presentation successfully', async () => {
      // Arrange
      const createdPresentacion = {
        ...mockPresentacionData,
        id: '3',
        nombre: mockNewPresentacion.nombre
      }
      mockElectronAPI.presentacion.crear.mockResolvedValue(createdPresentacion)

      // Act
      const { result } = renderHook(() => useCrearPresentacion(), {
        wrapper: withQueryClient(queryClient)
      })

      // Assert
      expect(result.current.isIdle).toBe(true)

      await act(async () => {
        result.current.mutate({
          presentacion: mockNewPresentacion
        })
      })

      expect(result.current.isPending).toBe(true)
      expect(mockElectronAPI.presentacion.crear).toHaveBeenCalledWith(
        mockNewPresentacion,
        undefined
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(createdPresentacion)
    })

    it('should handle creation error', async () => {
      // Arrange
      const errorMessage = 'Error al crear presentación'
      mockElectronAPI.presentacion.crear.mockRejectedValue(new Error(errorMessage))

      // Act
      const { result } = renderHook(() => useCrearPresentacion(), {
        wrapper: withQueryClient(queryClient)
      })

      await act(async () => {
        result.current.mutate({
          presentacion: mockNewPresentacion
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
      mockElectronAPI.presentacion.crear.mockResolvedValue(mockPresentacionData)
      mockElectronAPI.presentacion.listar.mockResolvedValue([])

      // Pre-cargar presentaciones existentes
      const { result: preloadResult } = renderHook(() => usePresentaciones(1), {
        wrapper: withQueryClient(queryClient)
      })

      await waitFor(() => {
        expect(preloadResult.current.isSuccess).toBe(true)
      })

      // Act
      const { result } = renderHook(() => useCrearPresentacion(), {
        wrapper: withQueryClient(queryClient)
      })

      await act(async () => {
        result.current.mutate({
          presentacion: mockNewPresentacion
        })
      })

      // Verificar actualización optimista
      const cachedData = queryClient.getQueryData(['presentaciones', 'porInstitucion', 1, true])
      expect(cachedData).toContainEqual(
        expect.objectContaining({
          nombre: mockNewPresentacion.nombre
        })
      )
    })
  })

  describe('useEditarPresentacion', () => {
    it('should update presentation successfully', async () => {
      // Arrange
      const updatedPresentacion = {
        ...mockPresentacionData,
        ...mockPresentacionUpdate
      }
      mockElectronAPI.presentacion.editar.mockResolvedValue(updatedPresentacion)

      // Act
      const { result } = renderHook(() => useEditarPresentacion(), {
        wrapper: withQueryClient(queryClient)
      })

      await act(async () => {
        result.current.mutate({
          id: '1',
          cambios: mockPresentacionUpdate
        })
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(updatedPresentacion)
      expect(mockElectronAPI.presentacion.editar).toHaveBeenCalledWith(
        '1',
        mockPresentacionUpdate,
        undefined
      )
    })
  })

  describe('useEliminarPresentacion', () => {
    it('should delete presentation successfully', async () => {
      // Arrange
      mockElectronAPI.presentacion.eliminar.mockResolvedValue(true)

      // Act
      const { result } = renderHook(() => useEliminarPresentacion(), {
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
      expect(mockElectronAPI.presentacion.eliminar).toHaveBeenCalledWith(
        '1',
        false,
        undefined
      )
    })

    it('should force delete when specified', async () => {
      // Arrange
      mockElectronAPI.presentacion.eliminar.mockResolvedValue(true)

      // Act
      const { result } = renderHook(() => useEliminarPresentacion(), {
        wrapper: withQueryClient(queryClient)
      })

      await act(async () => {
        result.current.mutate({
          id: '1',
          forzar: true
        })
      })

      // Assert
      expect(mockElectronAPI.presentacion.eliminar).toHaveBeenCalledWith(
        '1',
        true,
        undefined
      )
    })
  })

  describe('useEstablecerPredeterminada', () => {
    it('should establish predeterminada presentation successfully', async () => {
      // Arrange
      const predeterminadaPresentacion = {
        ...mockPresentacionData,
        es_predeterminado: true
      }
      mockElectronAPI.presentacion.establecerPredeterminada.mockResolvedValue(predeterminadaPresentacion)

      // Act
      const { result } = renderHook(() => useEstablecerPredeterminada(), {
        wrapper: withQueryClient(queryClient)
      })

      await act(async () => {
        result.current.mutate({
          id: '1',
          idInstitucion: 1
        })
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(predeterminadaPresentacion)
      expect(mockElectronAPI.presentacion.establecerPredeterminada).toHaveBeenCalledWith(
        '1',
        1,
        undefined
      )
    })

    it('should perform optimistic update for predeterminada', async () => {
      // Arrange
      const previousPredeterminadas = [
        {
          ...mockPresentacionData,
          id: '2',
          nombre: 'Vieja Predeterminada',
          es_predeterminado: true
        }
      ]

      const newPredeterminada = {
        ...mockPresentacionData,
        id: '3',
        nombre: 'Nueva Predeterminada',
        es_predeterminado: true
      }

      mockElectronAPI.presentacion.establecerPredeterminada.mockResolvedValue(newPredeterminada)
      mockElectronAPI.presentacion.obtenerPredeterminadas.mockResolvedValue(previousPredeterminadas)

      // Pre-cargar predeterminadas existentes
      const { result: preloadResult } = renderHook(() => usePresentacionesPredeterminadas(1), {
        wrapper: withQueryClient(queryClient)
      })

      await waitFor(() => {
        expect(preloadResult.current.isSuccess).toBe(true)
      })

      // Act
      const { result } = renderHook(() => useEstablecerPredeterminada(), {
        wrapper: withQueryClient(queryClient)
      })

      await act(async () => {
        result.current.mutate({
          id: '3',
          idInstitucion: 1
        })
      })

      // Verificar actualización optimista: desmarcar todas las anteriores y marcar la nueva
      const cachedPredeterminadas = queryClient.getQueryData(['presentaciones', 'predeterminadas', 1])
      expect(cachedPredeterminadas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: '2',
            es_predeterminado: false
          }),
          expect.objectContaining({
            id: '3',
            es_predeterminado: true
          })
        ])
      )
    })
  })

  describe('useToggleActivoPresentacion', () => {
    it('should activate presentation', async () => {
      // Arrange
      const activatedPresentacion = {
        ...mockPresentacionData,
        activo: true
      }
      mockElectronAPI.presentacion.toggleActivo.mockResolvedValue(activatedPresentacion)

      // Act
      const { result } = renderHook(() => useToggleActivoPresentacion(), {
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

      expect(result.current.data).toEqual(activatedPresentacion)
      expect(mockElectronAPI.presentacion.toggleActivo).toHaveBeenCalledWith(
        '1',
        true,
        undefined
      )
    })

    it('should deactivate presentation', async () => {
      // Arrange
      const deactivatedPresentacion = {
        ...mockPresentacionData,
        activo: false
      }
      mockElectronAPI.presentacion.toggleActivo.mockResolvedValue(deactivatedPresentacion)

      // Act
      const { result } = renderHook(() => useToggleActivoPresentacion(), {
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

    it('should move presentation between active/inactive lists optimistically', async () => {
      // Arrange
      const activePresentaciones = [mockPresentacionData]
      const deactivatedPresentacion = {
        ...mockPresentacionData,
        activo: false
      }

      mockElectronAPI.presentacion.toggleActivo.mockResolvedValue(deactivatedPresentacion)
      mockElectronAPI.presentacion.listar.mockResolvedValue(activePresentaciones)

      // Pre-cargar presentaciones activas
      const { result: activeResult } = renderHook(() => usePresentaciones(1, true), {
        wrapper: withQueryClient(queryClient)
      })

      await waitFor(() => {
        expect(activeResult.current.isSuccess).toBe(true)
      })

      // Act
      const { result } = renderHook(() => useToggleActivoPresentacion(), {
        wrapper: withQueryClient(queryClient)
      })

      await act(async () => {
        result.current.mutate({
          id: '1',
          activar: false
        })
      })

      // Verificar actualización optimista: remover de activas
      const cachedActivePresentaciones = queryClient.getQueryData(['presentaciones', 'porInstitucion', 1, true])
      expect(cachedActivePresentaciones).not.toContainEqual(
        expect.objectContaining({
          id: '1'
        })
      )
    })
  })
})

// Helper function wrapper
const withQueryClient = (client: QueryClient) => ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
)