import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { enhancedMateriaPrimaService } from '../services/enhancedMateriaPrimaService'
import type { MateriaPrima, MateriaPrimaDetail, NewMateriaPrima, MateriaPrimaUpdate, MateriaPrimaFilters } from '@/types/materiaPrima'

// Keys para las queries
export const materiaPrimaKeys = {
  all: ['materia_prima'] as const,
  lists: () => [...materiaPrimaKeys.all, 'list'] as const,
  list: (filters?: MateriaPrimaFilters) => [...materiaPrimaKeys.lists(), filters] as const,
  details: () => [...materiaPrimaKeys.all, 'detail'] as const,
  detail: (id: string) => [...materiaPrimaKeys.details(), id] as const,
  search: (term: string, limit?: number) => [...materiaPrimaKeys.all, 'search', term, limit] as const,
  stockBajo: () => [...materiaPrimaKeys.all, 'stock_bajo'] as const,
  estadisticas: () => [...materiaPrimaKeys.all, 'estadisticas'] as const,
}

// Hook para listar materiales
export const useMateriaPrimaList = (filters?: MateriaPrimaFilters) => {
  return useQuery({
    queryKey: materiaPrimaKeys.list(filters),
    queryFn: () => enhancedMateriaPrimaService.listar(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (renombrado de cacheTime en v5)
    retry: (failureCount, error) => {
      // Reintentar hasta 3 veces para errores de red
      if (failureCount < 3 && error.message.includes('conexión')) {
        return true
      }
      return false
    }
  })
}

// Hook para obtener un material por ID
export const useMateriaPrima = (id: string, options?: { includeInactive?: boolean }) => {
  return useQuery({
    queryKey: materiaPrimaKeys.detail(id),
    queryFn: () => enhancedMateriaPrimaService.obtener(id, options),
    enabled: !!id, // Solo ejecutar si hay ID
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2
  })
}

// Hook para buscar materiales
export const useMateriaPrimaSearch = (searchTerm: string, limit: number = 50) => {
  return useQuery({
    queryKey: materiaPrimaKeys.search(searchTerm, limit),
    queryFn: () => enhancedMateriaPrimaService.buscar(searchTerm, limit),
    enabled: searchTerm.trim().length > 0, // Solo ejecutar si hay término de búsqueda
    staleTime: 2 * 60 * 1000, // 2 minutos (caché más corto para búsquedas)
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  })
}

// Hook para stock bajo
export const useStockBajo = () => {
  return useQuery({
    queryKey: materiaPrimaKeys.stockBajo(),
    queryFn: () => enhancedMateriaPrimaService.getStockBajo(),
    staleTime: 30 * 1000, // 30 segundos (caché muy corto para datos críticos)
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 60 * 1000, // Refrescar cada minuto
    retry: 3
  })
}

// Hook para estadísticas
export const useMateriaPrimaEstadisticas = () => {
  return useQuery({
    queryKey: materiaPrimaKeys.estadisticas(),
    queryFn: () => enhancedMateriaPrimaService.getEstadisticas(),
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 2 * 60 * 1000, // Refrescar cada 2 minutos
    retry: 2
  })
}

// Hook para crear material (mutation)
export const useCrearMateriaPrima = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, usuarioId }: { data: NewMateriaPrima; usuarioId?: string }) =>
      enhancedMateriaPrimaService.crear(data, usuarioId),

    onMutate: async ({ data, usuarioId }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: materiaPrimaKeys.lists() })
      await queryClient.cancelQueries({ queryKey: materiaPrimaKeys.estadisticas() })
      await queryClient.cancelQueries({ queryKey: materiaPrimaKeys.stockBajo() })

      // Guardar estado anterior para rollback
      const previousLists = queryClient.getQueriesData({ queryKey: materiaPrimaKeys.lists() })

      return { previousLists }
    },

    onSuccess: (newMaterial) => {
      toast.success(`Material "${newMaterial.nombre}" creado correctamente`)

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.lists() })
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.estadisticas() })
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.stockBajo() })
    },

    onError: (error, variables, context) => {
      console.error('Error en useCrearMateriaPrima:', error)
      toast.error('Error al crear el material')

      // Rollback en caso de error
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData)
        })
      }
    },

    onSettled: () => {
      // Asegurar que las queries se refresquen
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.lists() })
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.estadisticas() })
    }
  })
}

// Hook para actualizar material (mutation)
export const useActualizarMateriaPrima = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data, usuarioId }: { id: string; data: MateriaPrimaUpdate; usuarioId?: string }) =>
      enhancedMateriaPrimaService.actualizar(id, data, usuarioId),

    onMutate: async ({ id, data }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: materiaPrimaKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: materiaPrimaKeys.lists() })
      await queryClient.cancelQueries({ queryKey: materiaPrimaKeys.estadisticas() })
      await queryClient.cancelQueries({ queryKey: materiaPrimaKeys.stockBajo() })

      // Guardar estado anterior
      const previousMaterial = queryClient.getQueryData(materiaPrimaKeys.detail(id))
      const previousLists = queryClient.getQueriesData({ queryKey: materiaPrimaKeys.lists() })

      return { previousMaterial, previousLists }
    },

    onSuccess: (updatedMaterial) => {
      toast.success(`Material "${updatedMaterial.nombre}" actualizado correctamente`)

      // Actualizar cache con los datos nuevos
      queryClient.setQueryData(materiaPrimaKeys.detail(updatedMaterial.id), updatedMaterial)
    },

    onError: (error, variables, context) => {
      console.error('Error en useActualizarMateriaPrima:', error)
      toast.error('Error al actualizar el material')

      // Rollback en caso de error
      if (context?.previousMaterial) {
        queryClient.setQueryData(materiaPrimaKeys.detail(variables.id), context.previousMaterial)
      }

      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData)
        })
      }
    },

    onSettled: (_, __, variables) => {
      // Refrescar queries relacionadas
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.lists() })
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.estadisticas() })
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.stockBajo() })
    }
  })
}

// Hook para eliminar material (mutation)
export const useEliminarMateriaPrima = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, usuarioId }: { id: string; usuarioId?: string }) =>
      enhancedMateriaPrimaService.eliminar(id, usuarioId),

    onMutate: async ({ id }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: materiaPrimaKeys.lists() })
      await queryClient.cancelQueries({ queryKey: materiaPrimaKeys.estadisticas() })
      await queryClient.cancelQueries({ queryKey: materiaPrimaKeys.stockBajo() })

      // Guardar estado anterior
      const previousMaterial = queryClient.getQueryData(materiaPrimaKeys.detail(id))
      const previousLists = queryClient.getQueriesData({ queryKey: materiaPrimaKeys.lists() })

      return { previousMaterial, previousLists }
    },

    onSuccess: (_, variables) => {
      toast.success('Material eliminado correctamente')

      // Remover de cache el material eliminado
      queryClient.removeQueries({ queryKey: materiaPrimaKeys.detail(variables.id) })
    },

    onError: (error, variables, context) => {
      console.error('Error en useEliminarMateriaPrima:', error)
      toast.error('Error al eliminar el material')

      // Rollback en caso de error
      if (context?.previousMaterial) {
        queryClient.setQueryData(materiaPrimaKeys.detail(variables.id), context.previousMaterial)
      }

      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData)
        })
      }
    },

    onSettled: () => {
      // Refrescar queries relacionadas
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.lists() })
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.estadisticas() })
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.stockBajo() })
    }
  })
}

// Hook para refrescar manualmente todos los datos
export const useRefreshMateriaPrima = () => {
  const queryClient = useQueryClient()

  return {
    refreshAll: () => {
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.all })
      toast.success('Datos actualizados')
    },
    refreshList: (filters?: MateriaPrimaFilters) => {
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.list(filters) })
    },
    refreshEstadisticas: () => {
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.estadisticas() })
    },
    refreshStockBajo: () => {
      queryClient.invalidateQueries({ queryKey: materiaPrimaKeys.stockBajo() })
    }
  }
}

// Hook para prefetch de datos (optimización)
export const usePrefetchMateriaPrima = () => {
  const queryClient = useQueryClient()

  return {
    prefetchMaterial: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: materiaPrimaKeys.detail(id),
        queryFn: () => enhancedMateriaPrimaService.obtener(id),
        staleTime: 5 * 60 * 1000
      })
    },
    prefetchList: (filters?: MateriaPrimaFilters) => {
      queryClient.prefetchQuery({
        queryKey: materiaPrimaKeys.list(filters),
        queryFn: () => enhancedMateriaPrimaService.listar(filters),
        staleTime: 5 * 60 * 1000
      })
    }
  }
}