import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriaService } from '../services/categoriaService'
import { queryKeys } from './queryKeys'
import type {
  Categoria,
  NewCategoria,
  CategoriaUpdate,
  CategoriaArbol
} from '../../../../shared/types/referenceData'

/**
 * Hook para obtener lista de categorías con estructura de árbol
 */
export function useCategoriaArbol(idInstitucion: number, soloActivas = true) {
  return useQuery({
    queryKey: queryKeys.categoriaArbol(idInstitucion),
    queryFn: () => categoriaService.listarArbol(idInstitucion, soloActivas),
    enabled: !!idInstitucion,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}

/**
 * Hook para obtener lista plana de categorías
 */
export function useCategorias(idInstitucion: number, soloActivas = true) {
  return useQuery({
    queryKey: queryKeys.categoriasPorInstitucion(idInstitucion, soloActivas),
    queryFn: () => categoriaService.listar(idInstitucion, soloActivas),
    enabled: !!idInstitucion,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}

/**
 * Hook para obtener una categoría específica
 */
export function useCategoria(id: string, includeInactive = false) {
  return useQuery({
    queryKey: queryKeys.categoria(id),
    queryFn: () => categoriaService.obtener(id, includeInactive),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
  })
}

/**
 * Hook para obtener categorías por nivel
 */
export function useCategoriasPorNivel(
  idInstitucion: number,
  nivel: number,
  soloActivas = true
) {
  return useQuery({
    queryKey: [...queryKeys.categoriasPorNivel, idInstitucion, nivel, soloActivas],
    queryFn: () => categoriaService.obtenerPorNivel(idInstitucion, nivel, soloActivas),
    enabled: !!idInstitucion && nivel >= 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook para buscar categorías
 */
export function useBuscarCategorias(
  idInstitucion: number,
  terminos: string,
  soloActivas = true
) {
  return useQuery({
    queryKey: [...queryKeys.categoriasBuscar, idInstitucion, terminos, soloActivas],
    queryFn: () => categoriaService.buscar(idInstitucion, terminos, soloActivas),
    enabled: !!idInstitucion && terminos.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutos para búsquedas
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para obtener ruta de una categoría
 */
export function useCategoriaRuta(id: string) {
  return useQuery({
    queryKey: [...queryKeys.categoriaRuta, id],
    queryFn: () => categoriaService.obtenerRuta(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

// MUTATIONS

/**
 * Hook para crear una nueva categoría
 */
export function useCrearCategoria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      categoria,
      idPadre,
      usuarioId
    }: {
      categoria: NewCategoria
      idPadre?: string
      usuarioId?: string
    }) => categoriaService.crear(categoria, idPadre, usuarioId),

    onMutate: async (variables) => {
      // Cancelar queries salientes para evitar sobreescritura
      const categoriaKeys = queryInvalidationPatterns.categorias(variables.categoria.id_institucion)

      for (const key of categoriaKeys) {
        await queryClient.cancelQueries({ queryKey: key })
      }

      // Snapshot del valor previo para rollback
      const previousCategorias = queryClient.getQueryData(
        queryKeys.categoriasPorInstitucion(variables.categoria.id_institucion, true)
      )
      const previousArbol = queryClient.getQueryData(
        queryKeys.categoriaArbol(variables.categoria.id_institucion)
      )

      // Actualización optimista
      const newCategoria: Categoria = {
        id: 'temp-' + Date.now(), // ID temporal
        ...variables.categoria,
        activo: variables.categoria.activo ?? true,
        es_predeterminado: variables.categoria.es_predeterminado ?? false,
        categoria_padre_id: variables.idPadre || null,
        nivel: 0, // Se calculará en el backend
        orden: null,
        ruta_completa: null,
        creado_en: null,
        actualizado_en: null,
      }

      // Agregar al cache optimistamente
      queryClient.setQueryData(
        queryKeys.categoriasPorInstitucion(variables.categoria.id_institucion, true),
        (old: Categoria[] | undefined) => [...(old || []), newCategoria]
      )

      return { previousCategorias, previousArbol, newCategoria }
    },

    onError: (err, variables, context) => {
      // Rollback en caso de error
      if (context?.previousCategorias) {
        queryClient.setQueryData(
          queryKeys.categoriasPorInstitucion(variables.categoria.id_institucion, true),
          context.previousCategorias
        )
      }
      if (context?.previousArbol) {
        queryClient.setQueryData(
          queryKeys.categoriaArbol(variables.categoria.id_institucion),
          context.previousArbol
        )
      }
    },

    onSuccess: (newCategoria, variables) => {
      // Actualizar el cache con los datos reales del servidor
      queryClient.setQueryData(
        queryKeys.categoria(newCategoria.id),
        newCategoria
      )

      // Invalidar queries relacionadas usando los patrones
      const categoriaKeys = queryInvalidationPatterns.categorias(variables.categoria.id_institucion)
      for (const key of categoriaKeys) {
        queryClient.invalidateQueries({ queryKey: key })
      }
    },

    onSettled: (data, error, variables) => {
      // Siempre invalidar para asegurar sincronización
      const categoriaKeys = queryInvalidationPatterns.categorias(variables.categoria.id_institucion)
      for (const key of categoriaKeys) {
        queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}

/**
 * Hook para editar una categoría
 */
export function useEditarCategoria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      cambios,
      usuarioId
    }: {
      id: string
      cambios: CategoriaUpdate
      usuarioId?: string
    }) => categoriaService.editar(id, cambios, usuarioId),

    onMutate: async (variables) => {
      // Cancelar queries salientes
      await queryClient.cancelQueries({ queryKey: queryKeys.categorias })
      await queryClient.cancelQueries({ queryKey: queryKeys.categoria(variables.id) })

      // Snapshot para rollback
      const previousCategoria = queryClient.getQueryData(
        queryKeys.categoria(variables.id)
      )
      const previousCategorias = queryClient.getQueryData(
        queryKeys.categorias
      )

      // Actualización optimista
      queryClient.setQueryData(
        queryKeys.categoria(variables.id),
        (old: Categoria | undefined) =>
          old ? { ...old, ...variables.cambios } : undefined
      )

      return { previousCategoria, previousCategorias }
    },

    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousCategoria) {
        queryClient.setQueryData(
          queryKeys.categoria(variables.id),
          context.previousCategoria
        )
      }
      if (context?.previousCategorias) {
        queryClient.setQueryData(queryKeys.categorias, context.previousCategorias)
      }
    },

    onSuccess: (updatedCategoria) => {
      // Actualizar cache con datos del servidor
      queryClient.setQueryData(
        queryKeys.categoria(updatedCategoria.id),
        updatedCategoria
      )

      // Invalidar queries relacionados
      queryClient.invalidateQueries({ queryKey: queryKeys.categorias })
      queryClient.invalidateQueries({
        queryKey: queryKeys.categoriaArbol(updatedCategoria.id_institucion)
      })
    },

    onSettled: (data, error, variables) => {
      // Invalidar para asegurar sincronización
      queryClient.invalidateQueries({ queryKey: queryKeys.categorias })
      queryClient.invalidateQueries({ queryKey: queryKeys.categoria(variables.id) })
    },
  })
}

/**
 * Hook para eliminar una categoría
 */
export function useEliminarCategoria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      forzar,
      usuarioId
    }: {
      id: string
      forzar?: boolean
      usuarioId?: string
    }) => categoriaService.eliminar(id, forzar, usuarioId),

    onMutate: async (variables) => {
      // Obtener categoría antes de eliminar para rollback
      const previousCategoria = queryClient.getQueryData(
        queryKeys.categoria(variables.id)
      )

      // Remover del cache optimistamente
      queryClient.removeQueries({ queryKey: queryKeys.categoria(variables.id) })

      return { previousCategoria }
    },

    onError: (err, variables, context) => {
      // Restaurar si hubo error
      if (context?.previousCategoria) {
        queryClient.setQueryData(
          queryKeys.categoria(variables.id),
          context.previousCategoria
        )
      }
    },

    onSuccess: (_, variables) => {
      // Invalidar todos los queries relacionados
      queryClient.invalidateQueries({ queryKey: queryKeys.categorias })
      queryClient.invalidateQueries({ queryKey: queryKeys.categoriaArbol })
    },
  })
}

/**
 * Hook para mover una categoría
 */
export function useMoverCategoria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      idCategoria,
      nuevoPadreId,
      usuarioId
    }: {
      idCategoria: string
      nuevoPadreId: string | null
      usuarioId?: string
    }) => categoriaService.mover(idCategoria, nuevoPadreId, usuarioId),

    onSuccess: () => {
      // Invalidar todo el árbol ya que afecta la estructura jerárquica
      queryClient.invalidateQueries({ queryKey: queryKeys.categorias })
      queryClient.invalidateQueries({ queryKey: queryKeys.categoriaArbol })
    },
  })
}

/**
 * Hook para reordenar categorías
 */
export function useReordenarCategorias() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      reordenes,
      usuarioId
    }: {
      reordenes: Array<{ id_categoria: string; nuevo_orden: number }>
      usuarioId?: string
    }) => categoriaService.reordenar(reordenes, usuarioId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categorias })
      queryClient.invalidateQueries({ queryKey: queryKeys.categoriaArbol })
    },
  })
}

/**
 * Hook para activar/desactivar una categoría
 */
export function useToggleCategoriaActiva() {
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
    }) => categoriaService.toggleActivo(id, activar, usuarioId),

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categorias })

      const previous = queryClient.getQueryData(queryKeys.categorias)

      // Actualización optimista
      queryClient.setQueryData(
        queryKeys.categorias,
        (old: Categoria[] | undefined) =>
          old?.map(cat =>
            cat.id === variables.id
              ? { ...cat, activo: variables.activar }
              : cat
          )
      )

      return { previous }
    },

    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.categorias, context.previous)
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categorias })
      queryClient.invalidateQueries({ queryKey: queryKeys.categoriaArbol })
    },
  })
}