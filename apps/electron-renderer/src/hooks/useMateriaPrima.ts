import { useState, useEffect, useCallback, useMemo, useReducer } from 'react'
import { materiaPrimaService } from '../services/materiaPrimaService'
import type {
  MateriaPrima,
  MateriaPrimaDetail,
  NewMateriaPrima,
  MateriaPrimaUpdate,
  MateriaPrimaFilters,
  MateriaPrimaSearchCriteria,
  LowStockItem,
  StockCheck
} from '../../../../shared/types/materiaPrima'

export interface UseMateriaPrimaOptions {
  autoLoad?: boolean
  filters?: MateriaPrimaFilters
}

export function useMateriaPrima(options: UseMateriaPrimaOptions = {}) {
  const { autoLoad = true, filters } = options

  const [materiales, setMateriales] = useState<MateriaPrima[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<MateriaPrimaDetail | null>(null)

  // Cargar lista de materiales
  const cargarMateriales = useCallback(async (customFilters?: MateriaPrimaFilters) => {
    try {
      setLoading(true)
      setError(null)
      const data = await materiaPrimaService.listar(customFilters || filters)
      setMateriales(data)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      console.error('Error al cargar materiales:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener material por ID
  const obtenerMaterial = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const material = await materiaPrimaService.obtener(id)
      setSelectedMaterial(material)
      return material
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      console.error('Error al obtener material:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Crear nuevo material
  const crearMaterial = useCallback(async (data: NewMateriaPrima, usuarioId?: string) => {
    try {
      setLoading(true)
      setError(null)
      const nuevoMaterial = await materiaPrimaService.crear(data, usuarioId)

      // Optimistic update
      setMateriales(prev => [...prev, nuevoMaterial])
      return nuevoMaterial
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      console.error('Error al crear material:', err)

      // Revertir optimistic update
      await cargarMateriales()
      throw err
    } finally {
      setLoading(false)
    }
  }, [cargarMateriales])

  // Actualizar material existente
  const actualizarMaterial = useCallback(async (
    id: string,
    data: MateriaPrimaUpdate,
    usuarioId?: string
  ) => {
    try {
      setLoading(true)
      setError(null)
      const materialActualizado = await materiaPrimaService.actualizar(id, data, usuarioId)

      // Actualizar estado local
      setMateriales(prev =>
        prev.map(item => item.id === id ? materialActualizado : item)
      )

      // Actualizar material seleccionado si aplica
      if (selectedMaterial?.id === id) {
        setSelectedMaterial(materialActualizado)
      }

      return materialActualizado
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      console.error('Error al actualizar material:', err)

      // Recargar datos en caso de error
      await cargarMateriales()
      throw err
    } finally {
      setLoading(false)
    }
  }, [selectedMaterial, cargarMateriales])

  // Eliminar material
  const eliminarMaterial = useCallback(async (id: string, usuarioId?: string) => {
    try {
      setLoading(true)
      setError(null)
      await materiaPrimaService.eliminar(id, usuarioId)

      // Eliminar del estado local
      setMateriales(prev => prev.filter(item => item.id !== id))

      // Limpiar material seleccionado si aplica
      if (selectedMaterial?.id === id) {
        setSelectedMaterial(null)
      }

      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      console.error('Error al eliminar material:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [selectedMaterial])

  // Buscar materiales por término
  const buscarMateriales = useCallback(async (searchTerm: string, limit?: number) => {
    try {
      setLoading(true)
      setError(null)
      const resultados = await materiaPrimaService.buscar(searchTerm, limit)
      return resultados
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      console.error('Error al buscar materiales:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Buscar por código de barras
  const buscarPorCodigo = useCallback(async (codigoBarras: string) => {
    try {
      setLoading(true)
      setError(null)
      const material = await materiaPrimaService.buscarPorCodigo(codigoBarras)
      return material
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      console.error('Error al buscar por código de barras:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Refrescar datos
  const refrescar = useCallback(() => {
    cargarMateriales()
  }, [cargarMateriales])

  // Limpiar errores
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      cargarMateriales()
    }
  }, [autoLoad])

  // Calcular estadísticas locales para mejor UX
  const estadisticas = useMemo(() => {
    const total = materiales.length
    const valorTotal = materiales.reduce((sum, item) => {
      return sum + (item.stock_actual || 0)
    }, 0)
    const bajoStock = materiales.filter(item =>
      item.stock_actual !== undefined && item.stock_actual <= (item.stock_minimo || 0)
    ).length

    return {
      total,
      valorTotal,
      bajoStock,
      sinStock: materiales.filter(item =>
        item.stock_actual !== undefined && item.stock_actual === 0
      ).length
    }
  }, [materiales])

  return {
    // Estado
    materiales,
    selectedMaterial,
    loading,
    error,
    estadisticas,

    // Acciones
    cargarMateriales,
    obtenerMaterial,
    crearMaterial,
    actualizarMaterial,
    eliminarMaterial,
    buscarMateriales,
    buscarPorCodigo,
    refrescar,
    clearError,

    // Setters
    setSelectedMaterial
  }
}

// Interfaces para useReducer en búsqueda avanzada
interface SearchState {
  loading: boolean
  error: string | null
  resultados: MateriaPrima[]
  filters: MateriaPrimaSearchCriteria
}

type SearchAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RESULTS'; payload: MateriaPrima[] }
  | { type: 'UPDATE_FILTERS'; payload: Partial<MateriaPrimaSearchCriteria> }

// Reducer para manejar estado de búsqueda avanzada
function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      }

    case 'SET_RESULTS':
      return {
        ...state,
        resultados: action.payload,
        loading: false,
        error: null
      }

    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      }

    default:
      return state
  }
}

// Hook para búsqueda avanzada
export function useBusquedaAvanzada() {
  // Initial state for search
  const initialState: SearchState = {
    loading: false,
    error: null,
    resultados: [],
    filters: {
      nombre: '',
      categoria: '',
      proveedorId: '',
      bajoStock: false,
      rangoStock: { min: undefined, max: undefined }
    }
  }

  const [state, dispatch] = useReducer(searchReducer, initialState)

  // Búsqueda avanzada con filtros (legacy method for compatibility)
  const buscarAvanzado = useCallback(async (termino: string, filtros?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const resultados = await materiaPrimaService.buscar(termino, filtros?.limit)
      dispatch({ type: 'SET_RESULTS', payload: resultados })

      return resultados
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      dispatch({ type: 'SET_ERROR', payload: errorMsg })
      console.error('Error en búsqueda avanzada:', err)
      throw err
    }
  }, [])

  // Búsqueda por criterios múltiples - FIXED VERSION
  const buscarPorCriterios = useCallback(async (criterios: MateriaPrimaSearchCriteria) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Use the new service method with comprehensive filtering
      const resultados = await materiaPrimaService.buscarPorCriterios(criterios)
      dispatch({ type: 'SET_RESULTS', payload: resultados })

      return resultados
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      dispatch({ type: 'SET_ERROR', payload: errorMsg })
      console.error('Error en búsqueda por criterios:', err)
      throw err
    }
  }, [])

  // Limpiar resultados
  const limpiarResultados = useCallback(() => {
    dispatch({ type: 'SET_RESULTS', payload: [] })
    dispatch({ type: 'SET_ERROR', payload: null })
  }, [])

  // Limpiar error
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }, [])

  return {
    loading: state.loading,
    error: state.error,
    resultados: state.resultados,
    filters: state.filters,
    buscarAvanzado,
    buscarPorCriterios,
    limpiarBusqueda: limpiarResultados,
    clearError
  }
}

// Hook para gestion de stock (separa la lógica de stock del hook principal)
export function useStockMateriaPrima() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verificar stock disponible
  const verificarStock = useCallback(async (id: string, cantidad: number) => {
    try {
      setLoading(true)
      setError(null)
      const resultado = await materiaPrimaService.verificarStock(id, cantidad)
      return resultado
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      console.error('Error al verificar stock:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener items con stock bajo
  const obtenerStockBajo = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const items = await materiaPrimaService.stockBajo()
      return items
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      console.error('Error al obtener stock bajo:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Alias para obtenerStockBajo para consistencia con componentes
  const getStockBajo = obtenerStockBajo

  // Actualizar stock
  const actualizarStock = useCallback(async (id: string, cantidad: number, motivo: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await materiaPrimaService.actualizarStock(id, cantidad, motivo)
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      console.error('Error al actualizar stock:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    verificarStock,
    obtenerStockBajo,
    getStockBajo,
    actualizarStock,
    clearError: () => setError(null)
  }
}

export default useMateriaPrima