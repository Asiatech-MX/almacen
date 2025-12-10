import type {
  Categoria,
  NewCategoria,
  CategoriaUpdate,
  CategoriaArbol
} from '../../../../shared/types/referenceData'

/**
 * Servicio para gestionar categorías a través de IPC
 * Proporciona una capa de abstracción para operaciones CRUD con manejo de errores
 */
class CategoriaService {
  /**
   * Listar categorías con estructura de árbol
   * @param idInstitucion ID de la institución
   * @param soloActivas Filtrar solo categorías activas
   * @returns Lista jerárquica de categorías
   */
  async listarArbol(idInstitucion: number, soloActivas = true): Promise<CategoriaArbol[]> {
    return window.electronAPI.categoria.listarArbol(idInstitucion, soloActivas)
  }

  /**
   * Listar categorías planas (sin estructura de árbol)
   * @param idInstitucion ID de la institución
   * @param soloActivas Filtrar solo categorías activas
   * @returns Lista de categorías
   */
  async listar(idInstitucion: number, soloActivas = true): Promise<Categoria[]> {
    return window.electronAPI.categoria.listar(idInstitucion, soloActivas)
  }

  /**
   * Obtener una categoría por su ID
   * @param id ID de la categoría
   * @param includeInactive Incluir categorías inactivas
   * @returns Categoría encontrada
   */
  async obtener(id: string, includeInactive = false): Promise<Categoria> {
    return window.electronAPI.categoria.obtener(id, includeInactive)
  }

  /**
   * Crear una nueva categoría
   * @param categoria Datos de la nueva categoría
   * @param idPadre ID de la categoría padre (opcional)
   * @param usuarioId ID del usuario que crea la categoría
   * @returns Categoría creada
   */
  async crear(
    categoria: NewCategoria,
    idPadre?: string,
    usuarioId?: string
  ): Promise<Categoria> {
    return window.electronAPI.categoria.crear(categoria, idPadre, usuarioId)
  }

  /**
   * Editar una categoría existente
   * @param id ID de la categoría a editar
   * @param cambios Datos a actualizar
   * @param usuarioId ID del usuario que edita la categoría
   * @returns Categoría actualizada
   */
  async editar(
    id: string,
    cambios: CategoriaUpdate,
    usuarioId?: string
  ): Promise<Categoria> {
    return window.electronAPI.categoria.editar(id, cambios, usuarioId)
  }

  /**
   * Eliminar una categoría
   * @param id ID de la categoría a eliminar
   * @param forzar Forzar eliminación incluso si tiene hijos o materiales asociados
   * @param usuarioId ID del usuario que elimina la categoría
   * @returns true si se eliminó correctamente
   */
  async eliminar(
    id: string,
    forzar = false,
    usuarioId?: string
  ): Promise<boolean> {
    return window.electronAPI.categoria.eliminar(id, forzar, usuarioId)
  }

  /**
   * Mover una categoría a un nuevo padre
   * @param idCategoria ID de la categoría a mover
   * @param nuevoPadreId ID del nuevo padre (null para raíz)
   * @param usuarioId ID del usuario que realiza la operación
   * @returns Categoría actualizada
   */
  async mover(
    idCategoria: string,
    nuevoPadreId: string | null,
    usuarioId?: string
  ): Promise<Categoria> {
    return window.electronAPI.categoria.mover(idCategoria, nuevoPadreId, usuarioId)
  }

  /**
   * Reordenar categorías dentro del mismo nivel
   * @param reordenes Array de reordenamientos con ID y nuevo orden
   * @param usuarioId ID del usuario que realiza la operación
   * @returns Categorías reordenadas
   */
  async reordenar(
    reordenes: Array<{ id_categoria: string; nuevo_orden: number }>,
    usuarioId?: string
  ): Promise<Categoria[]> {
    const operaciones = { reordenes, usuario_id: usuarioId }
    return window.electronAPI.categoria.reordenar(operaciones)
  }

  /**
   * Activar o desactivar una categoría
   * @param id ID de la categoría
   * @param activar true para activar, false para desactivar
   * @param usuarioId ID del usuario que realiza la operación
   * @returns Categoría actualizada
   */
  async toggleActivo(
    id: string,
    activar: boolean,
    usuarioId?: string
  ): Promise<Categoria> {
    return window.electronAPI.categoria.toggleActivo(id, activar, usuarioId)
  }

  /**
   * Verificar si una categoría puede ser eliminada
   * @param id ID de la categoría
   * @returns Información sobre dependencias
   */
  async verificarDependencias(id: string): Promise<{
    tiene_hijos: boolean
    tiene_materiales: boolean
    num_hijos: number
    num_materiales: number
    puede_eliminar: boolean
  }> {
    return window.electronAPI.categoria.verificarDependencias(id)
  }

  /**
   * Obtener categorías por nivel
   * @param idInstitucion ID de la institución
   * @param nivel Nivel deseado (0-4)
   * @param soloActivas Filtrar solo activas
   * @returns Categorías del nivel especificado
   */
  async obtenerPorNivel(
    idInstitucion: number,
    nivel: number,
    soloActivas = true
  ): Promise<Categoria[]> {
    return window.electronAPI.categoria.obtenerPorNivel(idInstitucion, nivel, soloActivas)
  }

  /**
   * Buscar categorías por nombre o descripción
   * @param idInstitucion ID de la institución
   * @param terminos Términos de búsqueda
   * @param soloActivas Filtrar solo activas
   * @returns Categorías que coinciden con la búsqueda
   */
  async buscar(
    idInstitucion: number,
    terminos: string,
    soloActivas = true
  ): Promise<Categoria[]> {
    return window.electronAPI.categoria.buscar(idInstitucion, terminos, soloActivas)
  }

  /**
   * Obtener ruta completa de una categoría
   * @param id ID de la categoría
   * @returns Ruta jerárquica completa
   */
  async obtenerRuta(id: string): Promise<{
    id: string
    nombre: string
    nivel: number
  }[]> {
    return window.electronAPI.categoria.obtenerRutaCompleta(id)
  }
}

// Exportar instancia singleton del servicio
export const categoriaService = new CategoriaService()