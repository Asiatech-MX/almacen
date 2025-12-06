import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useMemo, useCallback } from 'react'
import {
  Categoria,
  CategoriaArbol,
  Presentacion,
  NewCategoria,
  NewPresentacion,
  CategoriaUpdate,
  PresentacionUpdate
} from '../../../../packages/shared-types/src/referenceData'

// Declaración temporal de window.electronAPI para TypeScript
declare global {
  interface Window {
    electronAPI: {
      categoria: {
        listar: (idInstitucion: number, soloActivas?: boolean) => Promise<Categoria[]>
        listarArbol: (idInstitucion: number, soloActivas?: boolean) => Promise<CategoriaArbol[]>
        crear: (categoria: NewCategoria, idPadre?: string, usuarioId?: string) => Promise<Categoria>
        editar: (id: string, cambios: CategoriaUpdate, usuarioId?: string) => Promise<Categoria>
        mover: (idCategoria: string, nuevoPadreId?: string, usuarioId?: string) => Promise<Categoria>
        eliminar: (id: string, forzar?: boolean, usuarioId?: string) => Promise<boolean>
      }
      presentacion: {
        listar: (idInstitucion: number, soloActivas?: boolean) => Promise<Presentacion[]>
        crear: (presentacion: NewPresentacion, usuarioId?: string) => Promise<Presentacion>
        editar: (id: string, cambios: PresentacionUpdate, usuarioId?: string) => Promise<Presentacion>
        eliminar: (id: string, forzar?: boolean, usuarioId?: string) => Promise<boolean>
      }
    }
  }
}

// Query keys para el cache de TanStack Query
export const referenceDataKeys = {
  all: ['referenceData'] as const,
  categorias: () => [...referenceDataKeys.all, 'categorias'] as const,
  categoriasList: (idInstitucion: number, includeInactive?: boolean) =>
    [...referenceDataKeys.categorias(), 'list', idInstitucion, includeInactive] as const,
  categoriasArbol: (idInstitucion: number, includeInactive?: boolean) =>
    [...referenceDataKeys.categorias(), 'arbol', idInstitucion, includeInactive] as const,
  categoria: (id: string) => [...referenceDataKeys.categorias(), 'detail', id] as const,
  presentaciones: () => [...referenceDataKeys.all, 'presentaciones'] as const,
  presentacionesList: (idInstitucion: number, includeInactive?: boolean) =>
    [...referenceDataKeys.presentaciones(), 'list', idInstitucion, includeInactive] as const,
  presentacion: (id: string) => [...referenceDataKeys.presentaciones(), 'detail', id] as const,
}

// Hook para obtener categorías con optimizaciones de performance
export const useCategoriasQuery = (idInstitucion: number, includeInactive: boolean = false) => {
  return useQuery({
    queryKey: referenceDataKeys.categoriasList(idInstitucion, includeInactive),
    queryFn: async () => {
      const result = await window.electronAPI.categoria.listar(idInstitucion, includeInactive)
      return Array.isArray(result) ? result : []
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error: any) => {
      // No reintentar para errores 4xx (cliente)
      if (error?.status >= 400 && error?.status < 500) {
        return false
      }
      // Reintentar hasta 3 veces para errores de red o 5xx
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Optimizaciones de performance para Phase 3
    structuralSharing: true, // Mantener referencias para objetos sin cambios
    select: (data: Categoria[]) => {
      // Memoización: retornar siempre el mismo array si no hay cambios
      return data.length > 0 ? [...data] : []
    },
    refetchOnWindowFocus: false, // Evitar refetch innecesario
    refetchOnReconnect: true, // Permitir refetch al reconectar
  })
}

// Hook para obtener categorías en formato árbol con optimizaciones
export const useCategoriasArbolQuery = (idInstitucion: number, includeInactive: boolean = false) => {
  return useQuery({
    queryKey: referenceDataKeys.categoriasArbol(idInstitucion, includeInactive),
    queryFn: async () => {
      const result = await window.electronAPI.categoria.listarArbol(idInstitucion, includeInactive)
      return Array.isArray(result) ? result : []
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    // Optimizaciones de performance para Phase 3
    structuralSharing: true, // Importante para estructuras jerárquicas
    select: (data: CategoriaArbol[]) => {
      // Memoización para datos jerárquicos complejos
      return data.length > 0 ? [...data] : []
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

// Hook para obtener presentaciones con optimizaciones de performance
export const usePresentacionesQuery = (idInstitucion: number, includeInactive: boolean = false) => {
  return useQuery({
    queryKey: referenceDataKeys.presentacionesList(idInstitucion, includeInactive),
    queryFn: async () => {
      const result = await window.electronAPI.presentacion.listar(idInstitucion, includeInactive)
      return Array.isArray(result) ? result : []
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error: any) => {
      // No reintentar para errores 4xx (cliente)
      if (error?.status >= 400 && error?.status < 500) {
        return false
      }
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Optimizaciones de performance para Phase 3
    structuralSharing: true, // Mantener referencias estables
    select: (data: Presentacion[]) => {
      // Memoización para presentaciones
      return data.length > 0 ? [...data] : []
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

// Hook combinado para todos los datos de referencia con optimizaciones de memoización
export const useReferenceDataQuery = (idInstitucion: number, options?: { includeInactive?: boolean }) => {
  const { includeInactive = false } = options || {}

  const categoriasQuery = useCategoriasQuery(idInstitucion, includeInactive)
  const categoriasArbolQuery = useCategoriasArbolQuery(idInstitucion, includeInactive)
  const presentacionesQuery = usePresentacionesQuery(idInstitucion, includeInactive)

  // Memoizar computaciones de estado para evitar re-renders innecesarios
  const isLoading = useMemo(
    () => categoriasQuery.isPending || categoriasArbolQuery.isPending || presentacionesQuery.isPending,
    [categoriasQuery.isPending, categoriasArbolQuery.isPending, presentacionesQuery.isPending]
  )

  const isFetching = useMemo(
    () => categoriasQuery.isFetching || categoriasArbolQuery.isFetching || presentacionesQuery.isFetching,
    [categoriasQuery.isFetching, categoriasArbolQuery.isFetching, presentacionesQuery.isFetching]
  )

  const error = useMemo(
    () => categoriasQuery.error || categoriasArbolQuery.error || presentacionesQuery.error,
    [categoriasQuery.error, categoriasArbolQuery.error, presentacionesQuery.error]
  )

  // Memoizar datos para mantener referencias estables
  const categorias = useMemo(() => categoriasQuery.data || [], [categoriasQuery.data])
  const categoriasArbol = useMemo(() => categoriasArbolQuery.data || [], [categoriasArbolQuery.data])
  const presentaciones = useMemo(() => presentacionesQuery.data || [], [presentacionesQuery.data])

  // Memoizar función refetch
  const refetch = useCallback(() => {
    return Promise.all([
      categoriasQuery.refetch(),
      categoriasArbolQuery.refetch(),
      presentacionesQuery.refetch()
    ])
  }, [categoriasQuery.refetch, categoriasArbolQuery.refetch, presentacionesQuery.refetch])

  return {
    categorias,
    categoriasArbol,
    presentaciones,
    isLoading,
    isFetching,
    error,
    refetch,
    // Exponer queries individuales para casos avanzados
    queries: {
      categorias: categoriasQuery,
      categoriasArbol: categoriasArbolQuery,
      presentaciones: presentacionesQuery,
    }
  }
}

// Hook para crear categoría (optimistic mutation)
export const useCrearCategoriaMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      categoria,
      idPadre,
      idInstitucion
    }: {
      categoria: NewCategoria
      idPadre?: string
      idInstitucion: number
    }) => {
      return await window.electronAPI.categoria.crear(categoria, idPadre)
    },

    onMutate: async ({ categoria, idPadre, idInstitucion }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({
        queryKey: referenceDataKeys.categoriasList(idInstitucion)
      })
      await queryClient.cancelQueries({
        queryKey: referenceDataKeys.categoriasArbol(idInstitucion)
      })

      // Guardar estado anterior para rollback
      const previousCategorias = queryClient.getQueryData(
        referenceDataKeys.categoriasList(idInstitucion)
      )
      const previousArbol = queryClient.getQueryData(
        referenceDataKeys.categoriasArbol(idInstitucion)
      )

      // Optimistic update - crear categoría temporal
      const tempId = `temp-${Date.now()}`
      const optimisticCategoria: Categoria = {
        ...categoria,
        id: tempId,
        categoria_padre_id: idPadre,
        nivel: 1, // Simplificado, debería calcularse basado en el padre
        ruta_completa: categoria.nombre,
        activo: true,
        es_predeterminado: false,
        orden: 0,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      }

      // Actualizar caché con dato optimista
      queryClient.setQueryData(
        referenceDataKeys.categoriasList(idInstitucion),
        (old: Categoria[] = []) => [...old, optimisticCategoria]
      )

      return { previousCategorias, previousArbol, tempId }
    },

    onError: (error, variables, context) => {
      console.error('Error en useCrearCategoriaMutation:', error)
      toast.error('Error al crear categoría')

      // Rollback en caso de error
      if (context?.previousCategorias) {
        queryClient.setQueryData(
          referenceDataKeys.categoriasList(variables.idInstitucion),
          context.previousCategorias
        )
      }
      if (context?.previousArbol) {
        queryClient.setQueryData(
          referenceDataKeys.categoriasArbol(variables.idInstitucion),
          context.previousArbol
        )
      }
    },

    onSuccess: (data, variables) => {
      toast.success(`Categoría "${data.nombre}" creada correctamente`)

      // Invalidar queries para refrescar datos del servidor
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.categoriasList(variables.idInstitucion)
      })
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.categoriasArbol(variables.idInstitucion)
      })
    },

    onSettled: (_, __, variables) => {
      // Asegurar refresco de datos relacionados
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.categoriasList(variables.idInstitucion)
      })
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.categoriasArbol(variables.idInstitucion)
      })
    }
  })
}

// Hook para editar categoría (optimistic mutation)
export const useEditarCategoriaMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      cambios,
      idInstitucion
    }: {
      id: string
      cambios: CategoriaUpdate
      idInstitucion: number
    }) => {
      // Asegurar que el ID sea string válido
      const idStr = String(id).trim()
      if (!idStr || idStr === 'undefined' || idStr === 'null') {
        throw new Error('ID de categoría inválido')
      }

      return await window.electronAPI.categoria.editar(idStr, cambios)
    },

    onMutate: async ({ id, cambios, idInstitucion }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({
        queryKey: referenceDataKeys.categoriasList(idInstitucion)
      })
      await queryClient.cancelQueries({
        queryKey: referenceDataKeys.categoriasArbol(idInstitucion)
      })

      // Guardar estado anterior para rollback
      const previousCategorias = queryClient.getQueryData(
        referenceDataKeys.categoriasList(idInstitucion)
      )
      const previousArbol = queryClient.getQueryData(
        referenceDataKeys.categoriasArbol(idInstitucion)
      )

      // Optimistic update - actualizar categoría en caché
      const idStr = String(id)

      queryClient.setQueryData(
        referenceDataKeys.categoriasList(idInstitucion),
        (old: Categoria[] = []) =>
          old.map(cat =>
            cat.id === idStr
              ? { ...cat, ...cambios, actualizado_en: new Date().toISOString() }
              : cat
          )
      )

      // Actualizar en árbol (función helper)
      queryClient.setQueryData(
        referenceDataKeys.categoriasArbol(idInstitucion),
        (old: CategoriaArbol[] = []) => updateCategoriaInTree(old, idStr, cambios)
      )

      return { previousCategorias, previousArbol, idStr }
    },

    onError: (error, variables, context) => {
      console.error('Error en useEditarCategoriaMutation:', error)
      toast.error('Error al editar categoría')

      // Rollback en caso de error
      if (context?.previousCategorias) {
        queryClient.setQueryData(
          referenceDataKeys.categoriasList(variables.idInstitucion),
          context.previousCategorias
        )
      }
      if (context?.previousArbol) {
        queryClient.setQueryData(
          referenceDataKeys.categoriasArbol(variables.idInstitucion),
          context.previousArbol
        )
      }
    },

    onSuccess: (data, variables) => {
      toast.success(`Categoría "${data.nombre}" actualizada correctamente`)

      // Ensure cache is updated with server response
      queryClient.setQueryData(
        referenceDataKeys.categoriasList(variables.idInstitucion),
        (old: Categoria[] = []) =>
          old.map(cat =>
            cat.id === variables.id.toString()
              ? { ...cat, ...data }
              : cat
          )
      )

      // Update tree structure as well
      queryClient.setQueryData(
        referenceDataKeys.categoriasArbol(variables.idInstitucion),
        (old: CategoriaArbol[] = []) => updateCategoriaInTree(old, variables.id.toString(), data)
      )
    },

    onSettled: (_, __, variables) => {
      // Always invalidate to ensure fresh data
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: referenceDataKeys.categoriasList(variables.idInstitucion)
        }),
        queryClient.invalidateQueries({
          queryKey: referenceDataKeys.categoriasArbol(variables.idInstitucion)
        })
      ])
    }
  })
}

// Hook para mover categoría
export const useMoverCategoriaMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      idCategoria,
      nuevoPadreId,
      idInstitucion
    }: {
      idCategoria: string
      nuevoPadreId?: string
      idInstitucion: number
    }) => {
      return await window.electronAPI.categoria.mover(idCategoria, nuevoPadreId)
    },

    onSuccess: (_, variables) => {
      toast.success('Categoría movida correctamente')

      // Invalidar queries ya que la estructura jerárquica cambió
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.categoriasList(variables.idInstitucion)
      })
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.categoriasArbol(variables.idInstitucion)
      })
    },

    onError: (error) => {
      console.error('Error en useMoverCategoriaMutation:', error)
      toast.error('Error al mover categoría')
    }
  })
}

// Hook para eliminar categoría
export const useEliminarCategoriaMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      idInstitucion
    }: {
      id: string
      idInstitucion: number
    }) => {
      return await window.electronAPI.categoria.eliminar(id)
    },

    onSuccess: (_, variables) => {
      toast.success('Categoría eliminada correctamente')

      // Invalidar queries para refrescar
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.categoriasList(variables.idInstitucion)
      })
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.categoriasArbol(variables.idInstitucion)
      })
    },

    onError: (error) => {
      console.error('Error en useEliminarCategoriaMutation:', error)
      toast.error('Error al eliminar categoría')
    }
  })
}

// Hook para crear presentación (optimistic mutation)
export const useCrearPresentacionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      presentacion,
      idInstitucion
    }: {
      presentacion: NewPresentacion
      idInstitucion: number
    }) => {
      return await window.electronAPI.presentacion.crear(presentacion)
    },

    onMutate: async ({ presentacion, idInstitucion }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({
        queryKey: referenceDataKeys.presentacionesList(idInstitucion)
      })

      // Guardar estado anterior para rollback
      const previousPresentaciones = queryClient.getQueryData(
        referenceDataKeys.presentacionesList(idInstitucion)
      )

      // Optimistic update - crear presentación temporal
      const tempId = `temp-${Date.now()}`
      const optimisticPresentacion: Presentacion = {
        ...presentacion,
        id: tempId,
        activo: true,
        es_predeterminado: false,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      }

      // Actualizar caché con dato optimista
      queryClient.setQueryData(
        referenceDataKeys.presentacionesList(idInstitucion),
        (old: Presentacion[] = []) => [...old, optimisticPresentacion]
      )

      return { previousPresentaciones, tempId }
    },

    onError: (error, variables, context) => {
      console.error('Error en useCrearPresentacionMutation:', error)
      toast.error('Error al crear presentación')

      // Rollback en caso de error
      if (context?.previousPresentaciones) {
        queryClient.setQueryData(
          referenceDataKeys.presentacionesList(variables.idInstitucion),
          context.previousPresentaciones
        )
      }
    },

    onSuccess: (data, variables) => {
      toast.success(`Presentación "${data.nombre}" creada correctamente`)

      // Invalidar queries para refrescar datos del servidor
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.presentacionesList(variables.idInstitucion)
      })
    },

    onSettled: (_, __, variables) => {
      // Asegurar refresco de datos relacionados
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.presentacionesList(variables.idInstitucion)
      })
    }
  })
}

// Hook para editar presentación (optimistic mutation)
export const useEditarPresentacionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      cambios,
      idInstitucion
    }: {
      id: string
      cambios: PresentacionUpdate
      idInstitucion: number
    }) => {
      // Asegurar que el ID sea string válido
      const idStr = String(id).trim()
      if (!idStr || idStr === 'undefined' || idStr === 'null') {
        throw new Error('ID de presentación inválido')
      }

      return await window.electronAPI.presentacion.editar(idStr, cambios)
    },

    onMutate: async ({ id, cambios, idInstitucion }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({
        queryKey: referenceDataKeys.presentacionesList(idInstitucion)
      })

      // Guardar estado anterior para rollback
      const previousPresentaciones = queryClient.getQueryData(
        referenceDataKeys.presentacionesList(idInstitucion)
      )

      // Optimistic update - actualizar presentación en caché
      const idStr = String(id)

      queryClient.setQueryData(
        referenceDataKeys.presentacionesList(idInstitucion),
        (old: Presentacion[] = []) =>
          old.map(p =>
            p.id === idStr
              ? { ...p, ...cambios, actualizado_en: new Date().toISOString() }
              : p
          )
      )

      return { previousPresentaciones, idStr }
    },

    onError: (error, variables, context) => {
      console.error('Error en useEditarPresentacionMutation:', error)
      toast.error('Error al editar presentación')

      // Rollback en caso de error
      if (context?.previousPresentaciones) {
        queryClient.setQueryData(
          referenceDataKeys.presentacionesList(variables.idInstitucion),
          context.previousPresentaciones
        )
      }
    },

    onSuccess: (data, variables) => {
      toast.success(`Presentación "${data.nombre}" actualizada correctamente`)

      // Ensure cache is updated with server response
      queryClient.setQueryData(
        referenceDataKeys.presentacionesList(variables.idInstitucion),
        (old: Presentacion[] = []) =>
          old.map(p =>
            p.id === variables.id.toString()
              ? { ...p, ...data }
              : p
          )
      )
    },

    onSettled: (_, __, variables) => {
      // Always invalidate to ensure fresh data
      return queryClient.invalidateQueries({
        queryKey: referenceDataKeys.presentacionesList(variables.idInstitucion)
      })
    }
  })
}

// Hook para eliminar presentación
export const useEliminarPresentacionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      idInstitucion
    }: {
      id: string
      idInstitucion: number
    }) => {
      return await window.electronAPI.presentacion.eliminar(id)
    },

    onSuccess: (_, variables) => {
      toast.success('Presentación eliminada correctamente')

      // Invalidar queries para refrescar
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.presentacionesList(variables.idInstitucion)
      })
    },

    onError: (error) => {
      console.error('Error en useEliminarPresentacionMutation:', error)
      toast.error('Error al eliminar presentación')
    }
  })
}

// Helper para actualizar recursivamente una categoría en el árbol
function updateCategoriaInTree(
  categorias: CategoriaArbol[],
  targetId: string,
  cambios: CategoriaUpdate
): CategoriaArbol[] {
  return categorias.map(categoria => {
    if (categoria.id === targetId) {
      // Actualizar la categoría encontrada
      return {
        ...categoria,
        ...cambios,
        actualizado_en: new Date().toISOString()
      }
    } else if (categoria.hijos && categoria.hijos.length > 0) {
      // Recursivamente buscar en los hijos
      return {
        ...categoria,
        hijos: updateCategoriaInTree(categoria.hijos, targetId, cambios)
      }
    }
    // Si no es la categoría y no tiene hijos, devolver sin cambios
    return categoria
  })
}

export default useReferenceDataQuery