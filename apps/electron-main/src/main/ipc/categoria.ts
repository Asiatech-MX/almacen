import { ipcMain } from 'electron'
import CategoriaRepository from '@backend/repositories/categoriaRepo'
import type {
  Categoria,
  CategoriaArbol,
  NewCategoria,
  CategoriaUpdate,
  OperacionMoverCategoria,
  OperacionReordenarCategorias
} from '@shared-types/referenceData'

// Variable privada para el repository (factory pattern)
let categoriaRepo: CategoriaRepository | null = null

/**
 * Factory function para obtener instancia de CategoriaRepository
 * Implementa lazy initialization para evitar errores TDZ
 */
function getCategoriaRepository(): CategoriaRepository {
  if (!categoriaRepo) {
    console.log('📦 CategoriaRepository created (lazy)')
    categoriaRepo = new CategoriaRepository()
  }
  return categoriaRepo
}

/**
 * Función de logging de auditoría para operaciones críticas
 */
function logAuditoria(accion: string, datos: any): void {
  console.log(`🔍 AUDITORÍA CATEGORÍA [${accion}]:`, {
    timestamp: new Date().toISOString(),
    accion,
    datos
  })
}

/**
 * Configura todos los handlers IPC para operaciones de categorías
 * Proporciona una API completa y type-safe para el renderer process
 */
export function setupCategoriaHandlers(): void {
  console.log('🔧 Configurando handlers de categorías con Kysely + PostgreSQL...')

  // ==================== READ OPERATIONS ====================

  // ✅ Listar categorías con estructura de árbol
  ipcMain.handle('categoria:listarArbol', async (_, { idInstitucion, soloActivas = true }: { idInstitucion: number, soloActivas?: boolean }) => {
    try {
      console.log('📡 categoria:listarArbol handled')

      if (!idInstitucion || typeof idInstitucion !== 'number') {
        throw new Error('ID de institución inválido')
      }

      const result = await getCategoriaRepository().listarArbol(idInstitucion, soloActivas)

      logAuditoria('LISTAR_ARBOL', {
        idInstitucion,
        soloActivas,
        totalCategorias: result.length,
        timestamp: new Date().toISOString()
      })

      console.log(`🌳 Árbol de categorías cargado: ${result.length} categorías raíz para institución ${idInstitucion}`)
      return result
    } catch (error) {
      console.error('❌ Error listando árbol de categorías:', error)
      throw new Error(`Error al cargar el árbol de categorías: ${(error as Error).message}`)
    }
  })

  // ✅ Listar categorías planas
  ipcMain.handle('categoria:listar', async (_, { idInstitucion, soloActivas = true }: { idInstitucion: number, soloActivas?: boolean }) => {
    try {
      console.log('📡 categoria:listar handled')

      if (!idInstitucion || typeof idInstitucion !== 'number') {
        throw new Error('ID de institución inválido')
      }

      const result = await getCategoriaRepository().listarPorInstitucion(idInstitucion, soloActivas)

      logAuditoria('LISTAR_PLANAS', {
        idInstitucion,
        soloActivas,
        totalCategorias: result.length,
        timestamp: new Date().toISOString()
      })

      console.log(`📋 Lista de categorías cargada: ${result.length} categorías para institución ${idInstitucion}`)
      return result
    } catch (error) {
      console.error('❌ Error listando categorías:', error)
      throw new Error(`Error al cargar la lista de categorías: ${(error as Error).message}`)
    }
  })

  // ✅ Obtener categoría por ID
  ipcMain.handle('categoria:obtener', async (_, { id, includeInactive = false }: { id: string, includeInactive?: boolean }) => {
    try {
      console.log('📡 categoria:obtener handled')

      if (!id || typeof id !== 'string') {
        throw new Error('ID de categoría inválido')
      }

      const result = await getCategoriaRepository().findById(id, includeInactive)

      if (!result) {
        throw new Error('Categoría no encontrada')
      }

      logAuditoria('OBTENER', {
        id,
        includeInactive,
        categoria: result.nombre,
        timestamp: new Date().toISOString()
      })

      console.log(`📄 Categoría obtenida: ${result.nombre}`)
      return result
    } catch (error) {
      console.error('❌ Error obteniendo categoría:', error)
      throw error
    }
  })

  // ✅ Obtener subcategorías directas
  ipcMain.handle('categoria:obtenerHijos', async (_, { idPadre, soloActivas = true }: { idPadre: string, soloActivas?: boolean }) => {
    try {
      console.log('📡 categoria:obtenerHijos handled')

      if (!idPadre || typeof idPadre !== 'string') {
        throw new Error('ID de categoría padre inválido')
      }

      const result = await getCategoriaRepository().obtenerHijosDirectos(idPadre, soloActivas)

      logAuditoria('OBTENER_HIJOS', {
        idPadre,
        soloActivas,
        totalHijos: result.length,
        timestamp: new Date().toISOString()
      })

      console.log(`👶 Subcategorías obtenidas: ${result.length} hijos directos`)
      return result
    } catch (error) {
      console.error('❌ Error obteniendo subcategorías:', error)
      throw error
    }
  })

  // ✅ Obtener ruta completa de una categoría
  ipcMain.handle('categoria:obtenerRuta', async (_, { id }: { id: string }) => {
    try {
      console.log('📡 categoria:obtenerRuta handled')

      if (!id || typeof id !== 'string') {
        throw new Error('ID de categoría inválido')
      }

      const result = await getCategoriaRepository().obtenerRutaCompleta(id)

      logAuditoria('OBTENER_RUTA', {
        id,
        ruta: result,
        timestamp: new Date().toISOString()
      })

      console.log(`🛤️ Ruta obtenida: ${result}`)
      return result
    } catch (error) {
      console.error('❌ Error obteniendo ruta:', error)
      throw error
    }
  })

  // ✅ Verificar si una categoría es descendiente de otra
  ipcMain.handle('categoria:verificarDescendiente', async (_, { idPosibleDescendiente, idPosiblePadre }: { idPosibleDescendiente: string, idPosiblePadre: string }) => {
    try {
      console.log('📡 categoria:verificarDescendiente handled')

      if (!idPosibleDescendiente || !idPosiblePadre) {
        throw new Error('IDs de categorías inválidos')
      }

      const result = await getCategoriaRepository().esDescendiente(idPosibleDescendiente, idPosiblePadre)

      logAuditoria('VERIFICAR_DESCENDIENTE', {
        idPosibleDescendiente,
        idPosiblePadre,
        esDescendiente: result,
        timestamp: new Date().toISOString()
      })

      console.log(`🔗 Verificación descendiente: ${result ? 'Es descendiente' : 'No es descendiente'}`)
      return result
    } catch (error) {
      console.error('❌ Error verificando descendiente:', error)
      throw error
    }
  })

  // ==================== CREATE OPERATIONS ====================

  // ✅ Crear nueva categoría con jerarquía
  ipcMain.handle('categoria:crear', async (_, { categoria, idPadre, usuarioId }: { categoria: NewCategoria, idPadre?: string, usuarioId?: string }) => {
    try {
      console.log('📡 categoria:crear handled')

      // Validaciones básicas
      if (!categoria || typeof categoria !== 'object') {
        throw new Error('Datos de categoría inválidos')
      }

      if (!categoria.nombre || categoria.nombre.trim().length === 0) {
        throw new Error('El nombre de la categoría es requerido')
      }

      if (!categoria.id_institucion || typeof categoria.id_institucion !== 'number') {
        throw new Error('ID de institución inválido')
      }

      const result = await getCategoriaRepository().crearConJerarquia(categoria, idPadre, usuarioId)

      logAuditoria('CREAR', {
        categoria: result.nombre,
        idPadre,
        idInstitucion: categoria.id_institucion,
        nivel: result.nivel,
        ruta: result.ruta_completa,
        usuarioId,
        timestamp: new Date().toISOString()
      })

      console.log(`✅ Categoría creada: ${result.nombre} (nivel ${result.nivel}, ruta: ${result.ruta_completa})`)
      return result
    } catch (error) {
      console.error('❌ Error creando categoría:', error)
      throw error
    }
  })

  // ==================== UPDATE OPERATIONS ====================

  // ✅ Actualizar categoría existente
  ipcMain.handle('categoria:editar', async (_, { id, cambios, usuarioId }: { id: string, cambios: CategoriaUpdate, usuarioId?: string }) => {
    try {
      console.log('📡 categoria:editar handled')

      // Validaciones
      if (!id || typeof id !== 'string') {
        throw new Error('ID de categoría inválido')
      }

      if (!cambios || typeof cambios !== 'object' || Object.keys(cambios).length === 0) {
        throw new Error('No se proporcionaron cambios para actualizar')
      }

      const result = await getCategoriaRepository().actualizar(id, cambios, usuarioId)

      logAuditoria('EDITAR', {
        id,
        categoria: result.nombre,
        cambios: Object.keys(cambios),
        usuarioId,
        timestamp: new Date().toISOString()
      })

      console.log(`✏️ Categoría actualizada: ${result.nombre}`)
      return result
    } catch (error) {
      console.error('❌ Error actualizando categoría:', error)
      throw error
    }
  })

  // ✅ Mover categoría en jerarquía
  ipcMain.handle('categoria:mover', async (_, { idCategoria, nuevoPadreId, usuarioId }: OperacionMoverCategoria & { usuarioId?: string }) => {
    try {
      console.log('📡 categoria:mover handled')

      // Validaciones
      if (!idCategoria || typeof idCategoria !== 'string') {
        throw new Error('ID de categoría a mover inválido')
      }

      const result = await getCategoriaRepository().moverCategoria(idCategoria, nuevoPadreId, usuarioId)

      logAuditoria('MOVER', {
        idCategoria,
        categoria: result.nombre,
        nuevoPadreId,
        rutaAnterior: result.ruta_completa, // Nota: ruta se actualiza por trigger en BD
        usuarioId,
        timestamp: new Date().toISOString()
      })

      console.log(`🔄 Categoría movida: ${result.nombre} (ruta: ${result.ruta_completa})`)
      return result
    } catch (error) {
      console.error('❌ Error moviendo categoría:', error)
      throw error
    }
  })

  // ✅ Reordenar categorías del mismo nivel
  ipcMain.handle('categoria:reordenar', async (_, { operaciones, usuarioId }: OperacionReordenarCategorias & { usuarioId?: string }) => {
    try {
      console.log('📡 categoria:reordenar handled')

      // Validaciones
      if (!operaciones || !Array.isArray(operaciones) || operaciones.length === 0) {
        throw new Error('Operaciones de reordenamiento inválidas')
      }

      // Validar formato de cada operación
      for (const op of operaciones) {
        if (!op.id || typeof op.id !== 'string') {
          throw new Error('ID de categoría inválido en operaciones de reordenamiento')
        }
        if (typeof op.orden !== 'number' || op.orden < 0) {
          throw new Error('Orden inválido en operaciones de reordenamiento')
        }
      }

      await getCategoriaRepository().reordenarCategorias(operaciones, usuarioId)

      logAuditoria('REORDENAR', {
        totalOperaciones: operaciones.length,
        operaciones: operaciones.map(op => ({ id: op.id, orden: op.orden })),
        usuarioId,
        timestamp: new Date().toISOString()
      })

      console.log(`🔢 Reordenadas ${operaciones.length} categorías`)
      return true
    } catch (error) {
      console.error('❌ Error reordenando categorías:', error)
      throw error
    }
  })

  // ==================== DELETE OPERATIONS ====================

  // ✅ Eliminar categoría (soft delete)
  ipcMain.handle('categoria:eliminar', async (_, { id, forzar = false, usuarioId }: { id: string, forzar?: boolean, usuarioId?: string }) => {
    try {
      console.log('📡 categoria:eliminar handled')

      // Validaciones
      if (!id || typeof id !== 'string') {
        throw new Error('ID de categoría inválido')
      }

      // Obtener información para auditoría antes de eliminar
      const categoriaAEliminar = await getCategoriaRepository().findById(id, true)
      if (!categoriaAEliminar) {
        throw new Error('Categoría no encontrada')
      }

      await getCategoriaRepository().eliminar(id, forzar, usuarioId)

      logAuditoria('ELIMINAR', {
        id,
        categoria: categoriaAEliminar.nombre,
        ruta: categoriaAEliminar.ruta_completa,
        nivel: categoriaAEliminar.nivel,
        forzar,
        usuarioId,
        timestamp: new Date().toISOString()
      })

      console.log(`🗑️ Categoría eliminada: ${categoriaAEliminar.nombre} (${forzar ? 'forzado' : 'soft delete'})`)
      return true
    } catch (error) {
      console.error('❌ Error eliminando categoría:', error)
      throw error
    }
  })

  // ==================== UTILITY OPERATIONS ====================

  // ✅ Validar estructura de jerarquía
  ipcMain.handle('categoria:validarJerarquia', async (_, { idInstitucion }: { idInstitucion: number }) => {
    try {
      console.log('📡 categoria:validarJerarquia handled')

      if (!idInstitucion || typeof idInstitucion !== 'number') {
        throw new Error('ID de institución inválido')
      }

      const categorias = await getCategoriaRepository().listarPorInstitucion(idInstitucion, false) // Incluir inactivas
      const arbol = await getCategoriaRepository().listarArbol(idInstitucion, false)

      const validaciones = {
        total: categorias.length,
        activas: categorias.filter(c => c.activo).length,
        inactivas: categorias.filter(c => !c.activo).length,
        niveles: Math.max(...categorias.map(c => c.nivel)),
        raices: arbol.length,
        problemas: [] as string[]
      }

      // Validar reglas de negocio
      categorias.forEach(cat => {
        // Validar niveles máximos
        if (cat.nivel > 4) {
          validaciones.problemas.push(`Categoría "${cat.nombre}" excede nivel máximo (4)`)
        }

        // Validar unicidad de nombres en el mismo nivel
        const hermanos = categorias.filter(c =>
          c.categoria_padre_id === cat.categoria_padre_id &&
          c.id !== cat.id &&
          c.activo
        )
        const duplicados = hermanos.filter(h => h.nombre === cat.nombre)
        if (duplicados.length > 0) {
          validaciones.problemas.push(`Nombre duplicado: "${cat.nombre}" en nivel ${cat.nivel}`)
        }
      })

      logAuditoria('VALIDAR_JERARQUIA', {
        idInstitucion,
        validaciones,
        timestamp: new Date().toISOString()
      })

      console.log(`✅ Validación completada: ${validaciones.problemas.length} problemas encontrados`)
      return validaciones
    } catch (error) {
      console.error('❌ Error validando jerarquía:', error)
      throw new Error(`Error al validar jerarquía: ${(error as Error).message}`)
    }
  })

  console.log('✅ Handlers de categorías configurados correctamente')
}