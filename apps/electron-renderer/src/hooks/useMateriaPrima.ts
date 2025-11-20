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

// Importamos sistema de errores mejorado
import {
  MateriaPrimaError,
  StockDisponibleError,
  MaterialNoEncontradoError,
  ConexionDatabaseError,
  ValidacionError,
  esMateriaPrimaError,
  esStockDisponibleError,
  esMaterialNoEncontradoError,
  esConexionDatabaseError,
  esValidacionError,
  procesarError,
  crearErrorGenerico
} from '../types/materiaPrimaErrors'

export interface UseMateriaPrimaOptions {
  autoLoad?: boolean
  filters?: MateriaPrimaFilters
}

export function useMateriaPrima(options: UseMateriaPrimaOptions = {}) {
  const { autoLoad = true, filters } = options

  const [materiales, setMateriales] = useState<MateriaPrima[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<MateriaPrimaError | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<MateriaPrimaDetail | null>(null)

  // Cargar lista de materiales
  const cargarMateriales = useCallback(async (customFilters?: MateriaPrimaFilters) => {
    try {
      setLoading(true)
      setError(null)
      const data = await materiaPrimaService.listar(customFilters || filters)
      setMateriales(data)
    } catch (err) {
      if (esMateriaPrimaError(err)) {
        setError(err);
      } else if (err instanceof Error) {
        setError(procesarError(err));
      } else {
        setError(crearErrorGenerico('Error desconocido al cargar materiales'));
      }
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
      let errorProcesado: MateriaPrimaError;
      if (esMateriaPrimaError(err)) {
        errorProcesado = err;
      } else if (err instanceof Error) {
        errorProcesado = procesarError(err);
      } else {
        errorProcesado = crearErrorGenerico('Error desconocido al obtener material');
      }
      setError(errorProcesado);
      console.error('Error al obtener material:', err);
      throw errorProcesado;
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
      let errorProcesado: MateriaPrimaError;
      if (esMateriaPrimaError(err)) {
        errorProcesado = err;
      } else if (err instanceof Error) {
        errorProcesado = procesarError(err);
      } else {
        errorProcesado = crearErrorGenerico('Error desconocido al crear material');
      }
      setError(errorProcesado);
      console.error('Error al crear material:', err);

      // Revertir optimistic update
      await cargarMateriales();
      throw errorProcesado;
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
      let errorProcesado: MateriaPrimaError;
      if (esMateriaPrimaError(err)) {
        errorProcesado = err;
      } else if (err instanceof Error) {
        errorProcesado = procesarError(err);
      } else {
        errorProcesado = crearErrorGenerico('Error desconocido al actualizar material');
      }
      setError(errorProcesado);
      console.error('Error al actualizar material:', err);

      // Recargar datos en caso de error
      await cargarMateriales();
      throw errorProcesado;
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
      // Procesar error manteniendo tipo y contexto
      let errorProcesado: MateriaPrimaError

      if (esMateriaPrimaError(err)) {
        // Enriquecer con contexto adicional del hook
        errorProcesado = {
          ...err,
          layer: 'hook',
          timestamp: new Date()
        }
      } else if (err instanceof Error) {
        // Error genérico desde el servicio, procesarlo
        errorProcesado = {
          type: 'ERROR_GENERICO',
          message: err.message,
          userMessage: 'Error al procesar la solicitud de eliminación',
          suggestedAction: 'Intente nuevamente o contacte soporte',
          severity: 'error',
          timestamp: new Date(),
          layer: 'hook',
          correlationId: `hook_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      } else {
        // Error completamente desconocido
        errorProcesado = {
          type: 'ERROR_GENERICO',
          message: 'Error desconocido al eliminar material',
          userMessage: 'Ha ocurrido un error inesperado',
          suggestedAction: 'Intente nuevamente o contacte soporte técnico',
          severity: 'error',
          timestamp: new Date(),
          layer: 'hook',
          correlationId: `hook_unk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      }

      setError(errorProcesado)
      console.error('Error al eliminar material:', err)
      throw errorProcesado
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
      let errorProcesado: MateriaPrimaError;
      if (esMateriaPrimaError(err)) {
        errorProcesado = err;
      } else if (err instanceof Error) {
        errorProcesado = procesarError(err);
      } else {
        errorProcesado = crearErrorGenerico('Error desconocido al buscar materiales');
      }
      setError(errorProcesado);
      console.error('Error al buscar materiales:', err);
      throw errorProcesado;
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
      let errorProcesado: MateriaPrimaError;
      if (esMateriaPrimaError(err)) {
        errorProcesado = err;
      } else if (err instanceof Error) {
        errorProcesado = procesarError(err);
      } else {
        errorProcesado = crearErrorGenerico('Error desconocido al buscar por código de barras');
      }
      setError(errorProcesado);
      console.error('Error al buscar por código de barras:', err);
      throw errorProcesado;
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

  // Mensaje específico para el usuario según tipo de error
  const obtenerMensajeUsuario = useCallback((error: MateriaPrimaError | null): string => {
    if (!error) return ''

    if (esStockDisponibleError(error)) {
      return `⚠️ ${error.userMessage}. Stock actual: ${error.stockActual} unidades. ${error.suggestedAction}`
    }

    if (esMaterialNoEncontradoError(error)) {
      return `❌ ${error.userMessage}. ID: ${error.idMaterial}. ${error.suggestedAction}`
    }

    if (esConexionDatabaseError(error)) {
      return `🔌 ${error.userMessage}. ${error.suggestedAction}`
    }

    if (esValidacionError(error)) {
      return `⚠️ ${error.userMessage} (campo: ${error.campo}). ${error.suggestedAction}`
    }

    // Error genérico
    return `❌ ${error.userMessage}. ${error.suggestedAction}`
  }, [])

  // Obtener tipo de error para componentes específicos
  const getErrorType = useCallback((error: MateriaPrimaError | null): string => {
    if (!error) return null

    return error.type
  }, [])

  // Verificar si el error permite acciones de recuperación
  const tieneAccionesRecuperacion = useCallback((error: MateriaPrimaError | null): boolean => {
    if (!error) return false

    // Errores de stock permiten acciones específicas
    return esStockDisponibleError(error)
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

    // Métodos de error mejorados
    obtenerMensajeUsuario,
    getErrorType,
    tieneAccionesRecuperacion,

    // Exponer type guards para uso en componentes
    esStockDisponibleError,
    esMaterialNoEncontradoError,
    esConexionDatabaseError,
    esValidacionError,
    esMateriaPrimaError,

    // Setters
    setSelectedMaterial
  }
}

// Interfaces para useReducer en búsqueda avanzada
interface SearchState {
  loading: boolean
  error: MateriaPrimaError | null
  resultados: MateriaPrima[]
  filters: MateriaPrimaSearchCriteria
}

type SearchAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: MateriaPrimaError | null }
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
      let errorProcesado: MateriaPrimaError;
      if (esMateriaPrimaError(err)) {
        errorProcesado = err;
      } else if (err instanceof Error) {
        errorProcesado = procesarError(err);
      } else {
        errorProcesado = crearErrorGenerico('Error desconocido en búsqueda avanzada');
      }
      dispatch({ type: 'SET_ERROR', payload: errorProcesado });
      console.error('Error en búsqueda avanzada:', err);
      throw errorProcesado;
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
      let errorProcesado: MateriaPrimaError;
      if (esMateriaPrimaError(err)) {
        errorProcesado = err;
      } else if (err instanceof Error) {
        errorProcesado = procesarError(err);
      } else {
        errorProcesado = crearErrorGenerico('Error desconocido en búsqueda por criterios');
      }
      dispatch({ type: 'SET_ERROR', payload: errorProcesado });
      console.error('Error en búsqueda por criterios:', err);
      throw errorProcesado;
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
  const [error, setError] = useState<MateriaPrimaError | null>(null)

  // Verificar stock disponible
  const verificarStock = useCallback(async (id: string, cantidad: number) => {
    try {
      setLoading(true)
      setError(null)
      const resultado = await materiaPrimaService.verificarStock(id, cantidad)
      return resultado
    } catch (err) {
      let errorProcesado: MateriaPrimaError;
      if (esMateriaPrimaError(err)) {
        errorProcesado = err;
      } else if (err instanceof Error) {
        errorProcesado = procesarError(err);
      } else {
        errorProcesado = crearErrorGenerico('Error desconocido al verificar stock');
      }
      setError(errorProcesado);
      console.error('Error al verificar stock:', err);
      throw errorProcesado;
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
      let errorProcesado: MateriaPrimaError;
      if (esMateriaPrimaError(err)) {
        errorProcesado = err;
      } else if (err instanceof Error) {
        errorProcesado = procesarError(err);
      } else {
        errorProcesado = crearErrorGenerico('Error desconocido al obtener stock bajo');
      }
      setError(errorProcesado);
      console.error('Error al obtener stock bajo:', err);
      throw errorProcesado;
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
      let errorProcesado: MateriaPrimaError;
      if (esMateriaPrimaError(err)) {
        errorProcesado = err;
      } else if (err instanceof Error) {
        errorProcesado = procesarError(err);
      } else {
        errorProcesado = crearErrorGenerico('Error desconocido al actualizar stock');
      }
      setError(errorProcesado);
      console.error('Error al actualizar stock:', err);
      throw errorProcesado;
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