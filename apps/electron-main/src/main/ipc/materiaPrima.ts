import { ipcMain, app } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'
import MateriaPrimaRepository from '@backend/repositories/materiaPrimaRepo'
import type {
  MateriaPrima,
  MateriaPrimaDetail,
  NewMateriaPrima,
  MateriaPrimaUpdate,
  MateriaPrimaFilters,
  StockCheck,
  LowStockItem,
  MateriaPrimaStats,
  AuditTrail,
  MateriaPrimaEstatusUpdate
} from '@shared-types/index'

// Interfaces para el upload de imágenes
interface ImageMetadata {
  materiaPrimaId: string
  codigoBarras: string
  nombre: string
}

interface ImageUploadResult {
  success: boolean
  url?: string
  error?: string
  filename?: string
}

// Configuración para el upload de imágenes
const IMAGE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  uploadsDir: 'assets/images/materia-prima'
}

// Variable privada para el repository (factory pattern)
let materiaPrimaRepo: MateriaPrimaRepository | null = null

/**
 * Factory function para obtener instancia de MateriaPrimaRepository
 * Implementa lazy initialization para evitar errores TDZ
 */
function getMateriaPrimaRepository(): MateriaPrimaRepository {
  if (!materiaPrimaRepo) {
    console.log('📦 MateriaPrimaRepository created (lazy)')
    materiaPrimaRepo = new MateriaPrimaRepository()
  }
  return materiaPrimaRepo
}

// ==================== UTILIDADES DE ARCHIVO ====================

/**
 * Valida el tipo MIME y extensión del archivo
 */
function validateFileType(mimeType: string, filename: string): boolean {
  const hasValidMimeType = IMAGE_CONFIG.allowedTypes.includes(mimeType)
  const fileExtension = path.extname(filename).toLowerCase()
  const hasValidExtension = IMAGE_CONFIG.allowedExtensions.includes(fileExtension)

  return hasValidMimeType && hasValidExtension
}

/**
 * Sanitiza un nombre de archivo para remover caracteres peligrosos
 */
function sanitizeFilename(filename: string): string {
  // Remover caracteres especiales, mantener solo alfanuméricos, guiones y guiones bajos
  return filename
    .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
}

/**
 * Genera un nombre de archivo único para la imagen de materia prima
 */
function generateUniqueFilename(codigoBarras: string, nombre: string, extension: string): string {
  const timestamp = Date.now()
  const uuid = uuidv4().slice(0, 8)
  const sanitizedNombre = sanitizeFilename(nombre)
  const sanitizedCodigo = sanitizeFilename(codigoBarras)

  return `${sanitizedCodigo}_${sanitizedNombre}_${timestamp}_${uuid}${extension}`
}

/**
 * Crea el directorio de uploads si no existe
 */
async function ensureUploadDirectory(): Promise<string> {
  const userDataPath = app.getPath('userData')
  const uploadsPath = path.join(userDataPath, IMAGE_CONFIG.uploadsDir)

  try {
    await fs.access(uploadsPath)
  } catch (error) {
    // El directorio no existe, crearlo con recursive: true
    console.log(`📁 Creando directorio de uploads: ${uploadsPath}`)
    await fs.mkdir(uploadsPath, { recursive: true })
  }

  return uploadsPath
}

/**
 * Guarda un archivo de imagen en el sistema de archivos
 */
async function saveImageFile(
  buffer: ArrayBuffer,
  filename: string
): Promise<{ success: boolean; filepath?: string; error?: string }> {
  try {
    const uploadsDir = await ensureUploadDirectory()
    const filepath = path.join(uploadsDir, filename)

    // Convertir ArrayBuffer a Buffer y guardar
    const nodeBuffer = Buffer.from(buffer)
    await fs.writeFile(filepath, nodeBuffer)

    console.log(`💾 Imagen guardada: ${filepath}`)
    return { success: true, filepath }
  } catch (error) {
    const errorMsg = `Error guardando archivo: ${(error as Error).message}`
    console.error(`❌ ${errorMsg}`)
    return { success: false, error: errorMsg }
  }
}

/**
 * Genera URL segura para la base de datos usando protocolo personalizado
 */
function generateRelativeUrl(filename: string): string {
  // Usar protocolo personalizado en lugar de file:// para evitar restricciones de seguridad
  return `almacen-img://${filename}`
}

/**
 * Configura todos los handlers IPC para operaciones de materia prima
 * Proporciona una API completa y type-safe para el renderer process
 */
export function setupMateriaPrimaHandlers(): void {
  console.log('🔧 Configurando handlers de materia prima con Kysely + PostgreSQL...')

  // ==================== READ OPERATIONS ====================

  // ✅ Listar todos los materiales con filtros opcionales
  ipcMain.handle('materiaPrima:listar', async (_, filters?: MateriaPrimaFilters, options?: { includeInactive?: boolean }) => {
    try {
      console.log('📡 materiaPrima:listar handled')
      const result = await getMateriaPrimaRepository().findAll(filters, options)

      // Migrar URLs antiguas de file:// a almacen-img://
      const migratedResult = result.map(material => {
        if (material.imagen_url && material.imagen_url.startsWith('file://')) {
          // Extraer nombre del archivo de la URL file://
          const filename = material.imagen_url.split('\\').pop().split('/').pop()
          if (filename) {
            const newUrl = `almacen-img://${filename}`
            console.log(`🔄 Migrating URL: ${material.imagen_url} → ${newUrl}`)
            material.imagen_url = newUrl
          }
        }
        return material
      })

      console.log(`📋 Listados ${migratedResult.length} materiales (${options?.includeInactive ? 'incluyendo INACTIVO' : 'solo ACTIVO'})`)
      return migratedResult
    } catch (error) {
      console.error('❌ Error listando materia prima:', error)
      throw new Error(`Error al cargar la lista de materiales: ${(error as Error).message}`)
    }
  })

  // ✅ Listar solo materiales ACTIVOs (para consultas normales)
  ipcMain.handle('materiaPrima:listarActivos', async (_, filters?: MateriaPrimaFilters) => {
    try {
      console.log('📡 materiaPrima:listarActivos handled')
      const result = await getMateriaPrimaRepository().findActivos(filters)
      console.log(`📋 Listados ${result.length} materiales ACTIVOs`)
      return result
    } catch (error) {
      console.error('❌ Error listando materia prima ACTIVA:', error)
      throw new Error(`Error al cargar la lista de materiales activos: ${(error as Error).message}`)
    }
  })

  // ✅ Listar solo materiales INACTIVOs (para módulo de gestión)
  ipcMain.handle('materiaPrima:listarInactivos', async (_, filters?: MateriaPrimaFilters) => {
    try {
      console.log('📡 materiaPrima:listarInactivos handled')
      const result = await getMateriaPrimaRepository().findInactivos(filters)
      console.log(`📋 Listados ${result.length} materiales INACTIVOs`)
      return result
    } catch (error) {
      console.error('❌ Error listando materia prima INACTIVA:', error)
      throw new Error(`Error al cargar la lista de materiales inactivos: ${(error as Error).message}`)
    }
  })

  // ✅ Obtener material por ID con información completa
  ipcMain.handle('materiaPrima:obtener', async (_, { id, includeInactive = false }: { id: string, includeInactive?: boolean }) => {
    try {
      console.log('📡 materiaPrima:obtener handled')
      // Validación básica del ID
      if (!id || typeof id !== 'string') {
        throw new Error('ID inválido')
      }

      const result = await getMateriaPrimaRepository().findById(id, { includeInactive })
      if (!result) {
        throw new Error('Material no encontrado')
      }

      // Migrar URL antigua de file:// a almacen-img:// si es necesario
      if (result.imagen_url && result.imagen_url.startsWith('file://')) {
        const filename = result.imagen_url.split('\\').pop().split('/').pop()
        if (filename) {
          const newUrl = `almacen-img://${filename}`
          console.log(`🔄 Migrating URL in obtener: ${result.imagen_url} → ${newUrl}`)
          result.imagen_url = newUrl
        }
      }

      console.log(`📄 Obtenido material: ${result.nombre}`)
      return result
    } catch (error) {
      console.error('❌ Error obteniendo materia prima:', error)
      throw error
    }
  })

  // ✅ Buscar material por código de barras
  ipcMain.handle('materiaPrima:buscarPorCodigo', async (_, codigoBarras: string) => {
    try {
      console.log('📡 materiaPrima:buscarPorCodigo handled')
      if (!codigoBarras || typeof codigoBarras !== 'string') {
        throw new Error('Código de barras inválido')
      }

      const result = await getMateriaPrimaRepository().findByCodigoBarras(codigoBarras)
      if (!result) {
        throw new Error('No se encontró material con ese código de barras')
      }

      console.log(`🔍 Encontrado por código: ${result.nombre}`)
      return result
    } catch (error) {
      console.error('❌ Error buscando por código de barras:', error)
      throw error
    }
  })

  // ✅ Búsqueda de texto en múltiples campos
  ipcMain.handle('materiaPrima:buscar', async (_, searchTerm: string, limit?: number) => {
    try {
      console.log('📡 materiaPrima:buscar handled')
      if (!searchTerm || typeof searchTerm !== 'string') {
        throw new Error('Término de búsqueda inválido')
      }

      if (searchTerm.length < 2) {
        throw new Error('El término de búsqueda debe tener al menos 2 caracteres')
      }

      const result = await getMateriaPrimaRepository().search(searchTerm, limit)
      console.log(`🔍 Búsqueda "${searchTerm}": ${result.length} resultados`)
      return result
    } catch (error) {
      console.error('❌ Error en búsqueda de materia prima:', error)
      throw new Error('Error en la búsqueda: ' + (error as Error).message)
    }
  })

  // ✅ Obtener materiales con stock bajo
  ipcMain.handle('materiaPrima:stockBajo', async () => {
    try {
      console.log('📡 materiaPrima:stockBajo handled')
      const result = await getMateriaPrimaRepository().getLowStockItems()
      console.log(`⚠️ Materiales con stock bajo: ${result.length}`)
      return result
    } catch (error) {
      console.error('❌ Error obteniendo stock bajo:', error)
      throw new Error('Error al obtener materiales con stock bajo: ' + (error as Error).message)
    }
  })

  // ✅ Verificar disponibilidad de stock
  ipcMain.handle('materiaPrima:verificarStock', async (_, id: string, cantidad: number) => {
    try {
      console.log('📡 materiaPrima:verificarStock handled')
      if (!id || typeof id !== 'string') {
        throw new Error('ID inválido')
      }

      if (!cantidad || cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a cero')
      }

      const result = await getMateriaPrimaRepository().checkStock(id, cantidad)
      console.log(`📊 Stock verificado para ${id}: ${result.disponible ? 'Disponible' : 'No disponible'}`)
      return result
    } catch (error) {
      console.error('❌ Error verificando stock:', error)
      throw error
    }
  })

  // ✅ Obtener estadísticas generales
  ipcMain.handle('materiaPrima:estadisticas', async () => {
    try {
      console.log('📡 materiaPrima:estadisticas handled')
      const result = await getMateriaPrimaRepository().getStats()
      console.log(`📈 Estadísticas: ${result.total} materiales, valor total: $${result.valorTotal.toFixed(2)}`)
      return result
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error)
      throw new Error('Error al obtener estadísticas: ' + (error as Error).message)
    }
  })

  // ✅ Obtener trail de auditoría
  ipcMain.handle('materiaPrima:auditoria', async (_, materiaPrimaId: string, limit?: number) => {
    try {
      console.log('📡 materiaPrima:auditoria handled')
      if (!materiaPrimaId || typeof materiaPrimaId !== 'string') {
        throw new Error('ID de materia prima inválido')
      }

      const result = await getMateriaPrimaRepository().getAuditTrail(materiaPrimaId, limit)
      console.log(`📜 Auditoría para ${materiaPrimaId}: ${result.length} registros`)
      return result
    } catch (error) {
      console.error('❌ Error obteniendo auditoría:', error)
      throw new Error('Error al obtener auditoría: ' + (error as Error).message)
    }
  })

  // ==================== CREATE OPERATIONS ====================

  // ✅ Crear nuevo material
  ipcMain.handle('materiaPrima:crear', async (_, data: NewMateriaPrima, usuarioId?: string) => {
    try {
      console.log('📡 materiaPrima:crear handled')
      // Validación básica
      if (!data.codigo_barras || !data.nombre || !data.presentacion_id) {
        throw new Error('Datos incompletos: código de barras, nombre y presentación son requeridos')
      }

      const result = await getMateriaPrimaRepository().create(data, usuarioId)
      console.log(`✅ Creado material: ${result.nombre} (${result.codigo_barras})`)
      return result
    } catch (error) {
      console.error('❌ Error creando materia prima:', error)
      throw error
    }
  })

  // ✅ Subir imagen de materia prima
  ipcMain.handle('materiaPrima:subirImagen', async (
    _,
    fileData: {
      name: string
      type: string
      size: number
      buffer: ArrayBuffer
    },
    metadata: ImageMetadata
  ): Promise<ImageUploadResult> => {
    try {
      console.log('📡 materiaPrima:subirImagen handled')
      console.log(`📄 Archivo recibido: ${fileData.name} (${fileData.type}, ${(fileData.size / 1024).toFixed(1)}KB)`)

      // Validaciones del archivo
      if (!fileData.name || !fileData.type || !fileData.buffer) {
        throw new Error('Datos del archivo incompletos')
      }

      if (!validateFileType(fileData.type, fileData.name)) {
        throw new Error(`Tipo de archivo no soportado. Tipos permitidos: ${IMAGE_CONFIG.allowedExtensions.join(', ')}`)
      }

      if (fileData.size > IMAGE_CONFIG.maxSize) {
        throw new Error(`Archivo demasiado grande. Tamaño máximo: ${(IMAGE_CONFIG.maxSize / 1024 / 1024).toFixed(1)}MB`)
      }

      // Validaciones de metadata
      if (!metadata.materiaPrimaId || !metadata.codigoBarras || !metadata.nombre) {
        throw new Error('Metadatos incompletos: materiaPrimaId, codigoBarras y nombre son requeridos')
      }

      // Generar nombre único para el archivo
      const extension = path.extname(fileData.name).toLowerCase()
      const filename = generateUniqueFilename(
        metadata.codigoBarras,
        metadata.nombre,
        extension
      )

      console.log(`🏷️ Nombre generado: ${filename}`)

      // Guardar archivo en sistema de archivos
      const saveResult = await saveImageFile(fileData.buffer, filename)
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Error guardando el archivo')
      }

      // Generar URL relativa para almacenar en base de datos
      const relativeUrl = generateRelativeUrl(filename)

      console.log(`✅ Imagen subida exitosamente: ${relativeUrl}`)

      return {
        success: true,
        url: relativeUrl,
        filename: filename
      }
    } catch (error) {
      const errorMessage = (error as Error).message
      console.error('❌ Error subiendo imagen:', errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    }
  })

  // ==================== UPDATE OPERATIONS ====================

  // ✅ Actualizar material existente
  ipcMain.handle('materiaPrima:actualizar', async (_, id: string, data: MateriaPrimaUpdate, usuarioId?: string) => {
    try {
      console.log('📡 materiaPrima:actualizar handled')
      if (!id || typeof id !== 'string') {
        throw new Error('ID inválido')
      }

      if (Object.keys(data).length === 0) {
        throw new Error('No se proporcionaron datos para actualizar')
      }

      const result = await getMateriaPrimaRepository().update(id, data, usuarioId)
      console.log(`✏️ Actualizado material: ${result.nombre}`)
      return result
    } catch (error) {
      console.error('❌ Error actualizando materia prima:', error)
      throw error
    }
  })

  // ✅ Actualizar estatus del material
  ipcMain.handle('materiaPrima:actualizarEstatus', async (_, data: MateriaPrimaEstatusUpdate) => {
    try {
      console.log('📡 materiaPrima:actualizarEstatus handled')

      // Validación de parámetros
      if (!data || typeof data !== 'object') {
        throw new Error('Datos de actualización inválidos')
      }

      if (!data.id || typeof data.id !== 'string') {
        throw new Error('ID del material es requerido')
      }

      if (!data.estatus || !['ACTIVO', 'INACTIVO'].includes(data.estatus)) {
        throw new Error('Estatus inválido. Debe ser ACTIVO o INACTIVO')
      }

      if (data.usuarioId && typeof data.usuarioId !== 'string') {
        throw new Error('ID de usuario debe ser una cadena de texto')
      }

      const result = await getMateriaPrimaRepository().updateEstatus(data)
      console.log(`🔄 Estatus actualizado para ${data.id}: ${data.estatus}`)
      return result
    } catch (error) {
      console.error('❌ Error actualizando estatus de materia prima:', error)
      throw error
    }
  })

  // ✅ Actualizar stock
  ipcMain.handle('materiaPrima:actualizarStock', async (_, id: string, cantidad: number, motivo: string, usuarioId?: string) => {
    try {
      console.log('📡 materiaPrima:actualizarStock handled')
      if (!id || typeof id !== 'string') {
        throw new Error('ID inválido')
      }

      if (!cantidad || cantidad === 0) {
        throw new Error('La cantidad no puede ser cero')
      }

      if (!motivo || motivo.trim().length === 0) {
        throw new Error('El motivo es requerido')
      }

      await getMateriaPrimaRepository().updateStock(id, cantidad, motivo, usuarioId)
      console.log(`📦 Stock actualizado para ${id}: ${cantidad > 0 ? '+' : ''}${cantidad} (${motivo})`)
      return true
    } catch (error) {
      console.error('❌ Error actualizando stock:', error)
      throw error
    }
  })

  // ==================== DELETE OPERATIONS ====================

  // ✅ Eliminar material (soft delete)
  ipcMain.handle('materiaPrima:eliminar', async (_, id: string, usuarioId?: string) => {
    try {
      console.log('📡 materiaPrima:eliminar handled')
      if (!id || typeof id !== 'string') {
        throw new Error('ID inválido')
      }

      await getMateriaPrimaRepository().delete(id, usuarioId)
      console.log(`🗑️ Eliminado material: ${id}`)
      return true
    } catch (error) {
      console.error('❌ Error eliminando materia prima:', error)
      throw error
    }
  })

  // ==================== UTILITY OPERATIONS ====================

  // ✅ Exportar datos (placeholder para implementación futura)
  ipcMain.handle('materiaPrima:exportar', async (_, options: { formato: 'csv' | 'excel' | 'pdf' }) => {
    try {
      console.log('📡 materiaPrima:exportar handled')
      // TODO: Implementar exportación a diferentes formatos
      console.log(`📄 Solicitada exportación en formato: ${options.formato}`)
      throw new Error('Función de exportación no implementada aún')
    } catch (error) {
      console.error('❌ Error exportando materia prima:', error)
      throw new Error('Error al exportar datos: ' + (error as Error).message)
    }
  })

  console.log('✅ Handlers de materia prima configurados correctamente')
}