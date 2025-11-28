import { ipcMain } from 'electron'
import PresentacionRepository from '@backend/repositories/presentacionRepo'
import type {
  Presentacion,
  NewPresentacion,
  PresentacionUpdate
} from '@shared-types/referenceData'

// Variable privada para el repository (factory pattern)
let presentacionRepo: PresentacionRepository | null = null

/**
 * Factory function para obtener instancia de PresentacionRepository
 * Implementa lazy initialization para evitar errores TDZ
 */
function getPresentacionRepository(): PresentacionRepository {
  if (!presentacionRepo) {
    console.log('📦 PresentacionRepository created (lazy)')
    presentacionRepo = new PresentacionRepository()
  }
  return presentacionRepo
}

/**
 * Función de logging de auditoría para operaciones críticas
 */
function logAuditoria(accion: string, datos: any): void {
  console.log(`🔍 AUDITORÍA PRESENTACIÓN [${accion}]:`, {
    timestamp: new Date().toISOString(),
    accion,
    datos
  })
}

/**
 * Configura todos los handlers IPC para operaciones de presentaciones
 * Proporciona una API completa y type-safe para el renderer process
 */
export function setupPresentacionHandlers(): void {
  console.log('🔧 Configurando handlers de presentaciones con Kysely + PostgreSQL...')

  // ==================== READ OPERATIONS ====================

  // ✅ Listar presentaciones por institución
  ipcMain.handle('presentacion:listar', async (_, { idInstitucion, soloActivas = true }: { idInstitucion: number, soloActivas?: boolean }) => {
    try {
      console.log('📡 presentacion:listar handled')

      if (!idInstitucion || typeof idInstitucion !== 'number') {
        throw new Error('ID de institución inválido')
      }

      const result = await getPresentacionRepository().listarPorInstitucion(idInstitucion, soloActivas)

      logAuditoria('LISTAR', {
        idInstitucion,
        soloActivas,
        totalPresentaciones: result.length,
        timestamp: new Date().toISOString()
      })

      console.log(`📋 Lista de presentaciones cargada: ${result.length} presentaciones para institución ${idInstitucion}`)
      return result
    } catch (error) {
      console.error('❌ Error listando presentaciones:', error)
      throw new Error(`Error al cargar la lista de presentaciones: ${(error as Error).message}`)
    }
  })

  // ✅ Obtener presentaciones predeterminadas
  ipcMain.handle('presentacion:obtenerPredeterminadas', async (_, { idInstitucion }: { idInstitucion: number }) => {
    try {
      console.log('📡 presentacion:obtenerPredeterminadas handled')

      if (!idInstitucion || typeof idInstitucion !== 'number') {
        throw new Error('ID de institución inválido')
      }

      const result = await getPresentacionRepository().obtenerPredeterminadas(idInstitucion)

      logAuditoria('OBTENER_PREDETERMINADAS', {
        idInstitucion,
        totalPresentaciones: result.length,
        timestamp: new Date().toISOString()
      })

      console.log(`⭐ Presentaciones predeterminadas: ${result.length} para institución ${idInstitucion}`)
      return result
    } catch (error) {
      console.error('❌ Error obteniendo presentaciones predeterminadas:', error)
      throw new Error(`Error al obtener presentaciones predeterminadas: ${(error as Error).message}`)
    }
  })

  // ✅ Obtener presentación por ID
  ipcMain.handle('presentacion:obtener', async (_, { id, includeInactive = false }: { id: string, includeInactive?: boolean }) => {
    try {
      console.log('📡 presentacion:obtener handled')

      if (!id || typeof id !== 'string') {
        throw new Error('ID de presentación inválido')
      }

      const result = await getPresentacionRepository().findById(id, includeInactive)

      if (!result) {
        throw new Error('Presentación no encontrada')
      }

      logAuditoria('OBTENER', {
        id,
        includeInactive,
        presentacion: result.nombre,
        abreviatura: result.abreviatura,
        timestamp: new Date().toISOString()
      })

      console.log(`📄 Presentación obtenida: ${result.nombre} (${result.abreviatura})`)
      return result
    } catch (error) {
      console.error('❌ Error obteniendo presentación:', error)
      throw error
    }
  })

  // ✅ Buscar presentación por nombre
  ipcMain.handle('presentacion:buscarPorNombre', async (_, { nombre, idInstitucion, soloActivas = true }: { nombre: string, idInstitucion: number, soloActivas?: boolean }) => {
    try {
      console.log('📡 presentacion:buscarPorNombre handled')

      if (!nombre || typeof nombre !== 'string') {
        throw new Error('Nombre de búsqueda inválido')
      }

      if (!idInstitucion || typeof idInstitucion !== 'number') {
        throw new Error('ID de institución inválido')
      }

      const result = await getPresentacionRepository().findByNombre(nombre, idInstitucion, soloActivas)

      logAuditoria('BUSCAR_POR_NOMBRE', {
        nombre,
        idInstitucion,
        soloActivas,
        encontrada: !!result,
        timestamp: new Date().toISOString()
      })

      console.log(`🔍 Búsqueda por nombre "${nombre}": ${result ? 'Encontrada' : 'No encontrada'}`)
      return result
    } catch (error) {
      console.error('❌ Error buscando presentación por nombre:', error)
      throw error
    }
  })

  // ✅ Buscar presentación por abreviatura
  ipcMain.handle('presentacion:buscarPorAbreviatura', async (_, { abreviatura, idInstitucion, soloActivas = true }: { abreviatura: string, idInstitucion: number, soloActivas?: boolean }) => {
    try {
      console.log('📡 presentacion:buscarPorAbreviatura handled')

      if (!abreviatura || typeof abreviatura !== 'string') {
        throw new Error('Abreviatura de búsqueda inválida')
      }

      if (!idInstitucion || typeof idInstitucion !== 'number') {
        throw new Error('ID de institución inválido')
      }

      const result = await getPresentacionRepository().findByAbreviatura(abreviatura, idInstitucion, soloActivas)

      logAuditoria('BUSCAR_POR_ABREVIATURA', {
        abreviatura,
        idInstitucion,
        soloActivas,
        encontrada: !!result,
        timestamp: new Date().toISOString()
      })

      console.log(`🔍 Búsqueda por abreviatura "${abreviatura}": ${result ? 'Encontrada' : 'No encontrada'}`)
      return result
    } catch (error) {
      console.error('❌ Error buscando presentación por abreviatura:', error)
      throw error
    }
  })

  // ✅ Búsqueda de texto en múltiples campos
  ipcMain.handle('presentacion:buscar', async (_, { searchTerm, idInstitucion, limit }: { searchTerm: string, idInstitucion: number, limit?: number }) => {
    try {
      console.log('📡 presentacion:buscar handled')

      if (!searchTerm || typeof searchTerm !== 'string') {
        throw new Error('Término de búsqueda inválido')
      }

      if (searchTerm.length < 2) {
        throw new Error('El término de búsqueda debe tener al menos 2 caracteres')
      }

      if (!idInstitucion || typeof idInstitucion !== 'number') {
        throw new Error('ID de institución inválido')
      }

      const result = await getPresentacionRepository().search(searchTerm, idInstitucion, limit)

      logAuditoria('BUSCAR', {
        searchTerm,
        idInstitucion,
        limit,
        totalResultados: result.length,
        timestamp: new Date().toISOString()
      })

      console.log(`🔍 Búsqueda "${searchTerm}": ${result.length} resultados`)
      return result
    } catch (error) {
      console.error('❌ Error en búsqueda de presentaciones:', error)
      throw new Error('Error en la búsqueda: ' + (error as Error).message)
    }
  })

  // ==================== CREATE OPERATIONS ====================

  // ✅ Crear nueva presentación
  ipcMain.handle('presentacion:crear', async (_, { presentacion, usuarioId }: { presentacion: NewPresentacion, usuarioId?: string }) => {
    try {
      console.log('📡 presentacion:crear handled')

      // Validaciones básicas
      if (!presentacion || typeof presentacion !== 'object') {
        throw new Error('Datos de presentación inválidos')
      }

      if (!presentacion.nombre || presentacion.nombre.trim().length === 0) {
        throw new Error('El nombre de la presentación es requerido')
      }

      if (!presentacion.id_institucion || typeof presentacion.id_institucion !== 'number') {
        throw new Error('ID de institución inválido')
      }

      const result = await getPresentacionRepository().crear(presentacion, usuarioId)

      logAuditoria('CREAR', {
        presentacion: result.nombre,
        abreviatura: result.abreviatura,
        idInstitucion: presentacion.id_institucion,
        usuarioId,
        timestamp: new Date().toISOString()
      })

      console.log(`✅ Presentación creada: ${result.nombre} (${result.abreviatura})`)
      return result
    } catch (error) {
      console.error('❌ Error creando presentación:', error)
      throw error
    }
  })

  // ==================== UPDATE OPERATIONS ====================

  // ✅ Actualizar presentación existente
  ipcMain.handle('presentacion:editar', async (_, { id, cambios, usuarioId }: { id: string, cambios: PresentacionUpdate, usuarioId?: string }) => {
    try {
      console.log('📡 presentacion:editar handled')

      // Validaciones
      if (!id || typeof id !== 'string') {
        throw new Error('ID de presentación inválido')
      }

      if (!cambios || typeof cambios !== 'object' || Object.keys(cambios).length === 0) {
        throw new Error('No se proporcionaron cambios para actualizar')
      }

      const result = await getPresentacionRepository().actualizar(id, cambios, usuarioId)

      logAuditoria('EDITAR', {
        id,
        presentacion: result.nombre,
        cambios: Object.keys(cambios),
        usuarioId,
        timestamp: new Date().toISOString()
      })

      console.log(`✏️ Presentación actualizada: ${result.nombre}`)
      return result
    } catch (error) {
      console.error('❌ Error actualizando presentación:', error)
      throw error
    }
  })

  // ✅ Establecer como predeterminada
  ipcMain.handle('presentacion:establecerPredeterminada', async (_, { id, idInstitucion, usuarioId }: { id: string, idInstitucion: number, usuarioId?: string }) => {
    try {
      console.log('📡 presentacion:establecerPredeterminada handled')

      // Validaciones
      if (!id || typeof id !== 'string') {
        throw new Error('ID de presentación inválido')
      }

      if (!idInstitucion || typeof idInstitucion !== 'number') {
        throw new Error('ID de institución inválido')
      }

      const result = await getPresentacionRepository().establecerComoPredeterminada(id, idInstitucion, usuarioId)

      logAuditoria('ESTABLECER_PREDETERMINADA', {
        id,
        presentacion: result.nombre,
        idInstitucion,
        usuarioId,
        timestamp: new Date().toISOString()
      })

      console.log(`⭐ Establecida como predeterminada: ${result.nombre}`)
      return result
    } catch (error) {
      console.error('❌ Error estableciendo presentación predeterminada:', error)
      throw error
    }
  })

  // ==================== DELETE OPERATIONS ====================

  // ✅ Eliminar presentación (soft delete)
  ipcMain.handle('presentacion:eliminar', async (_, { id, forzar = false, usuarioId }: { id: string, forzar?: boolean, usuarioId?: string }) => {
    try {
      console.log('📡 presentacion:eliminar handled')

      // Validaciones
      if (!id || typeof id !== 'string') {
        throw new Error('ID de presentación inválido')
      }

      // Obtener información para auditoría antes de eliminar
      const presentacionAEliminar = await getPresentacionRepository().findById(id, true)
      if (!presentacionAEliminar) {
        throw new Error('Presentación no encontrada')
      }

      await getPresentacionRepository().eliminar(id, forzar, usuarioId)

      logAuditoria('ELIMINAR', {
        id,
        presentacion: presentacionAEliminar.nombre,
        abreviatura: presentacionAEliminar.abreviatura,
        esPredeterminada: presentacionAEliminar.es_predeterminado,
        forzar,
        usuarioId,
        timestamp: new Date().toISOString()
      })

      console.log(`🗑️ Presentación eliminada: ${presentacionAEliminar.nombre} (${forzar ? 'forzado' : 'soft delete'})`)
      return true
    } catch (error) {
      console.error('❌ Error eliminando presentación:', error)
      throw error
    }
  })

  // ==================== UTILITY OPERATIONS ====================

  // ✅ Obtener estadísticas de presentaciones
  ipcMain.handle('presentacion:estadisticas', async (_, { idInstitucion }: { idInstitucion: number }) => {
    try {
      console.log('📡 presentacion:estadisticas handled')

      if (!idInstitucion || typeof idInstitucion !== 'number') {
        throw new Error('ID de institución inválido')
      }

      const presentaciones = await getPresentacionRepository().listarPorInstitucion(idInstitucion, false) // Incluir inactivas

      const estadisticas = {
        total: presentaciones.length,
        activas: presentaciones.filter(p => p.activo).length,
        inactivas: presentaciones.filter(p => !p.activo).length,
        predeterminadas: presentaciones.filter(p => p.es_predeterminado).length,
        conAbreviatura: presentaciones.filter(p => p.abreviatura).length,
        conUnidadBase: presentaciones.filter(p => p.unidad_base).length,
        conFactorConversion: presentaciones.filter(p => p.factor_conversion).length,
        creacionesHoy: presentaciones.filter(p => {
          const today = new Date()
          const createdDate = new Date(p.creado_en)
          return createdDate.toDateString() === today.toDateString()
        }).length,
        actualizacionesHoy: presentaciones.filter(p => {
          const today = new Date()
          const updatedDate = new Date(p.actualizado_en)
          return updatedDate.toDateString() === today.toDateString()
        }).length
      }

      logAuditoria('ESTADISTICAS', {
        idInstitucion,
        estadisticas,
        timestamp: new Date().toISOString()
      })

      console.log(`📊 Estadísticas de presentaciones: ${estadisticas.total} total, ${estadisticas.activas} activas`)
      return estadisticas
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de presentaciones:', error)
      throw new Error(`Error al obtener estadísticas: ${(error as Error).message}`)
    }
  })

  // ✅ Validar integridad de datos
  ipcMain.handle('presentacion:validarIntegridad', async (_, { idInstitucion }: { idInstitucion: number }) => {
    try {
      console.log('📡 presentacion:validarIntegridad handled')

      if (!idInstitucion || typeof idInstitucion !== 'number') {
        throw new Error('ID de institución inválido')
      }

      const presentaciones = await getPresentacionRepository().listarPorInstitucion(idInstitucion, false) // Incluir inactivas

      const validaciones = {
        total: presentaciones.length,
        problemas: [] as string[],
        advertencias: [] as string[]
      }

      // Validar reglas de negocio
      presentaciones.forEach(pres => {
        // Validar que no haya más de una predeterminada
        const predeterminadas = presentaciones.filter(p => p.es_predeterminado && p.activo)
        if (predeterminadas.length > 1) {
          validaciones.problemas.push(`Hay ${predeterminadas.length} presentaciones predeterminadas activas (debería ser solo 1)`)
        }

        // Validar nombre no vacío
        if (!pres.nombre || pres.nombre.trim().length === 0) {
          validaciones.problemas.push(`Presentación ${pres.id} tiene nombre vacío`)
        }

        // Validar abreviatura única si existe
        if (pres.abreviatura) {
          const duplicadas = presentaciones.filter(p =>
            p.abreviatura === pres.abreviatura &&
            p.id !== pres.id &&
            p.activo
          )
          if (duplicadas.length > 0) {
            validaciones.problemas.push(`Abreviatura duplicada: "${pres.abreviatura}"`)
          }
        }

        // Advertencia si no tiene abreviatura
        if (!pres.abreviatura && pres.activo) {
          validaciones.advertencias.push(`Presentación activa "${pres.nombre}" sin abreviatura`)
        }

        // Validar factor de conversión si tiene unidad base
        if (pres.unidad_base && !pres.factor_conversion) {
          validaciones.advertencias.push(`Presentación "${pres.nombre}" tiene unidad base pero no factor de conversión`)
        }
      })

      // Verificar que exista al menos una presentación predeterminada
      const predeterminadas = presentaciones.filter(p => p.es_predeterminado && p.activo)
      if (predeterminadas.length === 0) {
        validaciones.advertencias.push('No hay presentaciones predeterminadas activas')
      }

      logAuditoria('VALIDAR_INTEGRIDAD', {
        idInstitucion,
        validaciones,
        timestamp: new Date().toISOString()
      })

      console.log(`✅ Validación completada: ${validaciones.problemas.length} problemas, ${validaciones.advertencias.length} advertencias`)
      return validaciones
    } catch (error) {
      console.error('❌ Error validando integridad de presentaciones:', error)
      throw new Error(`Error al validar integridad: ${(error as Error).message}`)
    }
  })

  console.log('✅ Handlers de presentaciones configurados correctamente')
}