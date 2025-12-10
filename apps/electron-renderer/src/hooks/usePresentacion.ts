import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './queryKeys'
import { presentacionService } from '../services/presentacionService'
import type { Presentacion, NewPresentacion, PresentacionUpdate } from '../../../shared/types/referenceData'

// QUERIES
// --------

/**
 * Hook para obtener el listado de presentaciones de una institución
 * @param idInstitucion ID de la institución
 * @param soloActivas Filtrar solo presentaciones activas
 */
export function usePresentaciones(idInstitucion: number, soloActivas = true) {
  return useQuery({
    queryKey: queryKeys.presentacionesPorInstitucion(idInstitucion, soloActivas),
    queryFn: () => presentacionService.listar(idInstitucion, soloActivas),
    enabled: !!idInstitucion,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
  })
}

/**
 * Hook para obtener las presentaciones predeterminadas de una institución
 * @param idInstitucion ID de la institución
 */
export function usePresentacionesPredeterminadas(idInstitucion: number) {
  return useQuery({
    queryKey: queryKeys.presentacionPredeterminadas(idInstitucion),
    queryFn: () => presentacionService.obtenerPredeterminadas(idInstitucion),
    enabled: !!idInstitucion,
    staleTime: 15 * 60 * 1000, // 15 minutos (las predeterminadas cambian poco)
    gcTime: 30 * 60 * 1000,    // 30 minutos
  })
}

/**
 * Hook para obtener una presentación específica por su ID
 * @param id ID de la presentación
 * @param includeInactive Incluir presentaciones inactivas
 */
export function usePresentacion(id: string, includeInactive = false) {
  return useQuery({
    queryKey: queryKeys.presentacion(id),
    queryFn: () => presentacionService.obtener(id, includeInactive),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook para buscar presentaciones por término
 * @param idInstitucion ID de la institución
 * @param terminos Término de búsqueda
 * @param soloActivas Filtrar solo activas
 */
export function useBuscarPresentaciones(
  idInstitucion: number,
  terminos: string,
  soloActivas = true
) {
  return useQuery({
    queryKey: [...queryKeys.presentacionesBuscar, idInstitucion, terminos, soloActivas],
    queryFn: () => presentacionService.buscar(idInstitucion, terminos, soloActivas),
    enabled: !!idInstitucion && !!terminos,
    staleTime: 2 * 60 * 1000, // 2 minutos (resultados de búsqueda)
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para obtener presentación por nombre exacto
 * @param idInstitucion ID de la institución
 * @param nombre Nombre exacto de la presentación
 * @param includeInactive Incluir inactivas
 */
export function usePresentacionPorNombre(
  idInstitucion: number,
  nombre: string,
  includeInactive = false
) {
  return useQuery({
    queryKey: [...queryKeys.presentacionPorNombre, idInstitucion, nombre, includeInactive],
    queryFn: () => presentacionService.obtenerPorNombre(idInstitucion, nombre, includeInactive),
    enabled: !!idInstitucion && !!nombre,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook para listar todas las presentaciones (incluyendo inactivas)
 * @param idInstitucion ID de la institución
 */
export function usePresentacionesTodas(idInstitucion: number) {
  return useQuery({
    queryKey: queryKeys.presentacionesTodas,
    queryFn: () => presentacionService.listarTodas(idInstitucion),
    enabled: !!idInstitucion,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// MUTATIONS
// ----------

/**
 * Hook para crear una nueva presentación
 */
export function useCrearPresentacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ presentacion, usuarioId }: { presentacion: NewPresentacion; usuarioId?: string }) =>
      presentacionService.crear(presentacion, usuarioId),

    onMutate: async (variables) => {
      // Cancelar queries salientes
      const presentacionKeys = queryInvalidationPatterns.presentaciones(variables.presentacion.id_institucion)

      for (const key of presentacionKeys) {
        await queryClient.cancelQueries({ queryKey: key })
      }

      // Snapshot para rollback
      const previousPresentaciones = queryClient.getQueryData(
        queryKeys.presentacionesPorInstitucion(variables.presentacion.id_institucion, true)
      )

      // Actualización optimista inmediata
      const newPresentacion: Presentacion = {
        id: `temp-${Date.now()}`,
        ...variables.presentacion,
        activo: variables.presentacion.activo ?? true,
        es_predeterminado: variables.presentacion.es_predeterminado ?? false,
        creado_en: null,
        actualizado_en: null,
      }

      queryClient.setQueryData(
        queryKeys.presentacionesPorInstitucion(variables.presentacion.id_institucion, true),
        (old = []) => [...old, newPresentacion]
      )

      return { previousPresentaciones }
    },

    onError: (err, variables, context) => {
      // Rollback automático si hay error
      if (context?.previousPresentaciones) {
        queryClient.setQueryData(
          queryKeys.presentacionesPorInstitucion(variables.presentacion.id_institucion, true),
          context.previousPresentaciones
        )
      }
    },

    onSuccess: (newPresentacion, variables) => {
      // Actualizar cache con datos reales
      queryClient.setQueryData(
        queryKeys.presentacion(newPresentacion.id),
        newPresentacion
      )

      // Invalidar queries relacionadas usando los patrones
      const presentacionKeys = queryInvalidationPatterns.presentaciones(variables.presentacion.id_institucion)
      for (const key of presentacionKeys) {
        queryClient.invalidateQueries({ queryKey: key })
      }
    }
  })
}

/**
 * Hook para editar una presentación existente
 */
export function useEditarPresentacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      cambios,
      usuarioId
    }: {
      id: string
      cambios: PresentacionUpdate
      usuarioId?: string
    }) => presentacionService.editar(id, cambios, usuarioId),

    onMutate: async (variables) => {
      // Cancelar queries salientes
      await queryClient.cancelQueries({ queryKey: queryKeys.presentacion(variables.id) })

      // Snapshot para rollback
      const previousPresentacion = queryClient.getQueryData<Presentacion>(
        queryKeys.presentacion(variables.id)
      )

      // Actualización optimista
      if (previousPresentacion) {
        const updatedPresentacion = { ...previousPresentacion, ...variables.cambios }
        queryClient.setQueryData(queryKeys.presentacion(variables.id), updatedPresentacion)

        // Actualizar en la lista si es necesario
        const listKey = queryKeys.presentacionesPorInstitucion(
          previousPresentacion.id_institucion,
          previousPresentacion.activo
        )
        queryClient.setQueryData(listKey, (old: Presentacion[] = []) =>
          old.map(p => p.id === variables.id ? updatedPresentacion : p)
        )
      }

      return { previousPresentacion }
    },

    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousPresentacion) {
        queryClient.setQueryData(queryKeys.presentacion(variables.id), context.previousPresentacion)

        const listKey = queryKeys.presentacionesPorInstitucion(
          context.previousPresentacion.id_institucion,
          context.previousPresentacion.activo
        )
        queryClient.setQueryData(listKey, (old: Presentacion[] = []) =>
          old.map(p => p.id === variables.id ? context.previousPresentacion! : p)
        )
      }
    },

    onSuccess: (updatedPresentacion, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.presentacion(variables.id) })
      queryClient.invalidateQueries({
        queryKey: queryKeys.presentacionesPorInstitucion(
          updatedPresentacion.id_institucion,
          updatedPresentacion.activo
        )
      })
    }
  })
}

/**
 * Hook para eliminar una presentación
 */
export function useEliminarPresentacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      forzar = false,
      usuarioId
    }: {
      id: string
      forzar?: boolean
      usuarioId?: string
    }) => presentacionService.eliminar(id, forzar, usuarioId),

    onMutate: async (variables) => {
      // Obtener la presentación antes de eliminar para el rollback
      const previousPresentacion = queryClient.getQueryData<Presentacion>(
        queryKeys.presentacion(variables.id)
      )

      // Eliminar optimísticamente de las queries
      queryClient.removeQueries({ queryKey: queryKeys.presentacion(variables.id) })

      if (previousPresentacion) {
        // Remover de la lista de activas
        queryClient.setQueryData(
          queryKeys.presentacionesPorInstitucion(previousPresentacion.id_institucion, true),
          (old: Presentacion[] = []) => old.filter(p => p.id !== variables.id)
        )
      }

      return { previousPresentacion }
    },

    onError: (err, variables, context) => {
      // Restaurar si hay error
      if (context?.previousPresentacion) {
        queryClient.setQueryData(queryKeys.presentacion(variables.id), context.previousPresentacion)

        queryClient.setQueryData(
          queryKeys.presentacionesPorInstitucion(context.previousPresentacion.id_institucion, true),
          (old: Presentacion[] = []) => [...old, context.previousPresentacion]
        )
      }
    },

    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.presentaciones })
    }
  })
}

/**
 * Hook para establecer una presentación como predeterminada
 */
export function useEstablecerPredeterminada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      idInstitucion,
      usuarioId
    }: {
      id: string
      idInstitucion: number
      usuarioId?: string
    }) => presentacionService.establecerPredeterminada(id, idInstitucion, usuarioId),

    onMutate: async (variables) => {
      // Cancelar queries de predeterminadas
      await queryClient.cancelQueries({
        queryKey: queryKeys.presentacionPredeterminadas(variables.idInstitucion)
      })

      // Obtener lista actual para rollback
      const previousPredeterminadas = queryClient.getQueryData<Presentacion[]>(
        queryKeys.presentacionPredeterminadas(variables.idInstitucion)
      )

      // Actualización optimista: marcar la presentación como predeterminada
      // y desmarcar las otras
      queryClient.setQueryData(
        queryKeys.presentacionPredeterminadas(variables.idInstitucion),
        (old: Presentacion[] = []) => {
          // Primero quitar predeterminado de todas
          const sinPredeterminado = old.map(p => ({ ...p, es_predeterminado: false }))
          // Luego marcar la nueva como predeterminada si existe
          return sinPredeterminado.map(p =>
            p.id === variables.id ? { ...p, es_predeterminado: true } : p
          )
        }
      )

      return { previousPredeterminadas }
    },

    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousPredeterminadas) {
        queryClient.setQueryData(
          queryKeys.presentacionPredeterminadas(variables.idInstitucion),
          context.previousPredeterminadas
        )
      }
    },

    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: queryKeys.presentacionPredeterminadas(variables.idInstitucion)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.presentacionesPorInstitucion(variables.idInstitucion, true)
      })
    }
  })
}

/**
 * Hook para activar/desactivar una presentación
 */
export function useToggleActivoPresentacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      activar,
      usuarioId
    }: {
      id: string
      activar: boolean
      usuarioId?: string
    }) => presentacionService.toggleActivo(id, activar, usuarioId),

    onMutate: async (variables) => {
      // Obtener presentación actual
      const previousPresentacion = queryClient.getQueryData<Presentacion>(
        queryKeys.presentacion(variables.id)
      )

      if (previousPresentacion) {
        // Actualización optimista
        const updatedPresentacion = { ...previousPresentacion, activo: variables.activar }
        queryClient.setQueryData(queryKeys.presentacion(variables.id), updatedPresentacion)

        // Mover entre listas de activas/inactivas
        if (variables.activar) {
          // Agregar a activas
          queryClient.setQueryData(
            queryKeys.presentacionesPorInstitucion(previousPresentacion.id_institucion, true),
            (old: Presentacion[] = []) => [...old, updatedPresentacion]
          )
          // Remover de inactivas
          queryClient.setQueryData(
            queryKeys.presentacionesPorInstitucion(previousPresentacion.id_institucion, false),
            (old: Presentacion[] = []) => old.filter(p => p.id !== variables.id)
          )
        } else {
          // Remover de activas
          queryClient.setQueryData(
            queryKeys.presentacionesPorInstitucion(previousPresentacion.id_institucion, true),
            (old: Presentacion[] = []) => old.filter(p => p.id !== variables.id)
          )
          // Agregar a inactivas
          queryClient.setQueryData(
            queryKeys.presentacionesPorInstitucion(previousPresentacion.id_institucion, false),
            (old: Presentacion[] = []) => [...old, updatedPresentacion]
          )
        }
      }

      return { previousPresentacion }
    },

    onError: (err, variables, context) => {
      // Rollback completo
      if (context?.previousPresentacion) {
        queryClient.setQueryData(queryKeys.presentacion(variables.id), context.previousPresentacion)

        // Restaurar en listas correspondientes
        if (context.previousPresentacion.activo) {
          queryClient.setQueryData(
            queryKeys.presentacionesPorInstitucion(context.previousPresentacion.id_institucion, true),
            (old: Presentacion[] = []) => {
              const filtered = old.filter(p => p.id !== variables.id)
              return [...filtered, context.previousPresentacion]
            }
          )
          queryClient.setQueryData(
            queryKeys.presentacionesPorInstitucion(context.previousPresentacion.id_institucion, false),
            (old: Presentacion[] = []) => old.filter(p => p.id !== variables.id)
          )
        } else {
          queryClient.setQueryData(
            queryKeys.presentacionesPorInstitucion(context.previousPresentacion.id_institucion, true),
            (old: Presentacion[] = []) => old.filter(p => p.id !== variables.id)
          )
          queryClient.setQueryData(
            queryKeys.presentacionesPorInstitucion(context.previousPresentacion.id_institucion, false),
            (old: Presentacion[] = []) => {
              const filtered = old.filter(p => p.id !== variables.id)
              return [...filtered, context.previousPresentacion]
            }
          )
        }
      }
    },

    onSuccess: (updatedPresentacion, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.presentacion(variables.id) })
      queryClient.invalidateQueries({
        queryKey: queryKeys.presentacionesPorInstitucion(
          updatedPresentacion.id_institucion,
          variables.activar
        )
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.presentacionesPorInstitucion(
          updatedPresentacion.id_institucion,
          !variables.activar
        )
      })
    }
  })
}

/**
 * Hook para restaurar una presentación eliminada
 */
export function useRestaurarPresentacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, usuarioId }: { id: string; usuarioId?: string }) =>
      presentacionService.restaurar(id, usuarioId),

    onMutate: async (variables) => {
      // Obtener presentación actual (debe estar inactiva)
      const previousPresentacion = queryClient.getQueryData<Presentacion>(
        queryKeys.presentacion(variables.id)
      )

      if (previousPresentacion) {
        // Actualización optimista: marcar como activa
        const updatedPresentacion = { ...previousPresentacion, activo: true }
        queryClient.setQueryData(queryKeys.presentacion(variables.id), updatedPresentacion)

        // Mover a lista de activas
        queryClient.setQueryData(
          queryKeys.presentacionesPorInstitucion(previousPresentacion.id_institucion, true),
          (old: Presentacion[] = []) => [...old, updatedPresentacion]
        )
        // Remover de inactivas
        queryClient.setQueryData(
          queryKeys.presentacionesPorInstitucion(previousPresentacion.id_institucion, false),
          (old: Presentacion[] = []) => old.filter(p => p.id !== variables.id)
        )
      }

      return { previousPresentacion }
    },

    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousPresentacion) {
        queryClient.setQueryData(queryKeys.presentacion(variables.id), context.previousPresentacion)

        // Remover de activas
        queryClient.setQueryData(
          queryKeys.presentacionesPorInstitucion(context.previousPresentacion.id_institucion, true),
          (old: Presentacion[] = []) => old.filter(p => p.id !== variables.id)
        )
        // Restaurar en inactivas
        queryClient.setQueryData(
          queryKeys.presentacionesPorInstitucion(context.previousPresentacion.id_institucion, false),
          (old: Presentacion[] = []) => [...old, context.previousPresentacion]
        )
      }
    },

    onSuccess: (restaurada, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.presentacion(variables.id) })
      queryClient.invalidateQueries({
        queryKey: queryKeys.presentacionesPorInstitucion(restaurada.id_institucion, true)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.presentacionesPorInstitucion(restaurada.id_institucion, false)
      })
    }
  })
}