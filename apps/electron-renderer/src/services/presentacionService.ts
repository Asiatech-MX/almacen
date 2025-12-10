import type {
  Presentacion,
  NewPresentacion,
  PresentacionUpdate
} from '../../../../shared/types/referenceData'

/**
 * Servicio para manejar las operaciones IPC de presentaciones
 * Proporciona una capa de abstracción para comunicación con el main process
 */
class PresentacionService {
  /**
   * Obtiene el listado de presentaciones de una institución
   */
  async listar(idInstitucion: number, soloActivas = true): Promise<Presentacion[]> {
    return window.electronAPI.presentacion.listar(idInstitucion, soloActivas)
  }

  /**
   * Obtiene las presentaciones predeterminadas de una institución
   */
  async obtenerPredeterminadas(idInstitucion: number): Promise<Presentacion[]> {
    return window.electronAPI.presentacion.obtenerPredeterminadas(idInstitucion)
  }

  /**
   * Obtiene una presentación específica por su ID
   */
  async obtener(id: string, includeInactive = false): Promise<Presentacion> {
    return window.electronAPI.presentacion.obtener(id, includeInactive)
  }

  /**
   * Crea una nueva presentación
   */
  async crear(presentacion: NewPresentacion, usuarioId?: string): Promise<Presentacion> {
    return window.electronAPI.presentacion.crear(presentacion, usuarioId)
  }

  /**
   * Edita una presentación existente
   */
  async editar(id: string, cambios: PresentacionUpdate, usuarioId?: string): Promise<Presentacion> {
    return window.electronAPI.presentacion.editar(id, cambios, usuarioId)
  }

  /**
   * Establece una presentación como predeterminada para una institución
   */
  async establecerPredeterminada(
    id: string,
    idInstitucion: number,
    usuarioId?: string
  ): Promise<Presentacion> {
    return window.electronAPI.presentacion.establecerPredeterminada(id, idInstitucion, usuarioId)
  }

  /**
   * Elimina una presentación (soft delete)
   */
  async eliminar(id: string, forzar = false, usuarioId?: string): Promise<boolean> {
    return window.electronAPI.presentacion.eliminar(id, forzar, usuarioId)
  }

  /**
   * Activa o desactiva una presentación
   */
  async toggleActivo(id: string, activar: boolean, usuarioId?: string): Promise<Presentacion> {
    return window.electronAPI.presentacion.toggleActivo(id, activar, usuarioId)
  }

  /**
   * Verifica dependencias de una presentación
   */
  async verificarDependencias(id: string): Promise<{tiene_materiales: boolean}> {
    return window.electronAPI.presentacion.verificarDependencias(id)
  }

  /**
   * Busca presentaciones por término de búsqueda
   */
  async buscar(
    idInstitucion: number,
    termino: string,
    soloActivas?: boolean
  ): Promise<Presentacion[]> {
    return window.electronAPI.presentacion.buscar(idInstitucion, termino, soloActivas)
  }

  /**
   * Obtiene presentaciones por nombre exacto
   */
  async obtenerPorNombre(
    idInstitucion: number,
    nombre: string,
    includeInactive = false
  ): Promise<Presentacion | null> {
    return window.electronAPI.presentacion.obtenerPorNombre(idInstitucion, nombre, includeInactive)
  }

  /**
   * Lista todas las presentaciones incluyendo las inactivas
   */
  async listarTodas(idInstitucion: number): Promise<Presentacion[]> {
    return window.electronAPI.presentacion.listarTodas(idInstitucion)
  }

  /**
   * Restaura una presentación eliminada (reactivación)
   */
  async restaurar(id: string, usuarioId?: string): Promise<Presentacion> {
    return window.electronAPI.presentacion.restaurar(id, usuarioId)
  }
}

export const presentacionService = new PresentacionService()