import { ipcMain } from 'electron'
import { ProveedorMappingService } from '@backend/services/proveedorMappingService'
import type { Database } from '@backend/types/database'
import { getDatabase } from '@backend/db/pool'

/**
 * IPC Handlers para gestión de proveedores con compatibilidad UUID/INTEGER
 * Implementa la estrategia de Dual Keys para transición transparente
 */

// Variable privada para el servicio (lazy initialization)
let proveedorService: ProveedorMappingService | null = null

/**
 * Factory function para obtener instancia de ProveedorMappingService
 */
function getProveedorService(): ProveedorMappingService {
  if (!proveedorService) {
    console.log('🏭 ProveedorMappingService created (lazy)')
    proveedorService = new ProveedorMappingService(getDatabase())
  }
  return proveedorService
}

/**
 * Registrar todos los handlers de IPC para proveedores
 */
export function registerProveedorHandlers(): void {
  console.log('📡 Registering proveedor IPC handlers...')

  const service = getProveedorService()

  // Listar proveedores con ambos IDs (UUID e INTEGER) para compatibilidad
  ipcMain.handle('proveedor:listar', async () => {
    try {
      const proveedores = await service.listProveedoresCompatibles()
      console.log(`🏭 Listed ${proveedores.length} providers with dual IDs`)
      return { success: true, data: proveedores }
    } catch (error) {
      console.error('❌ Error listing providers:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Obtener UUID por ID (para compatibilidad con sistema antiguo)
  ipcMain.handle('proveedor:obtenerUuid', async (_, proveedorId: number) => {
    try {
      if (!proveedorId || proveedorId <= 0) {
        throw new Error('ID de proveedor inválido')
      }

      const uuid = await service.getUuidByProveedorId(proveedorId)
      if (!uuid) {
        throw new Error(`No se encontró UUID para proveedor con ID ${proveedorId}`)
      }

      console.log(`🏭 Provider ${proveedorId} UUID: ${uuid}`)
      return { success: true, data: uuid }
    } catch (error) {
      console.error('❌ Error getting provider UUID:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Obtener ID por UUID (para compatibilidad con sistema nuevo)
  ipcMain.handle('proveedor:obtenerId', async (_, uuid: string) => {
    try {
      if (!uuid) {
        throw new Error('UUID de proveedor inválido')
      }

      const id = await service.getProveedorIdByUuid(uuid)
      if (id === null) {
        throw new Error(`No se encontró ID para proveedor con UUID ${uuid}`)
      }

      console.log(`🏭 Provider UUID ${uuid} ID: ${id}`)
      return { success: true, data: id }
    } catch (error) {
      console.error('❌ Error getting provider ID:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Validar proveedor (soporta ambos tipos de ID)
  ipcMain.handle('proveedor:validar', async (_, proveedorId: number | string) => {
    try {
      if (!proveedorId) {
        throw new Error('ID de proveedor requerido')
      }

      const proveedor = await service.validateProveedor(proveedorId)
      if (!proveedor) {
        throw new Error('El proveedor especificado no existe')
      }

      console.log(`🏭 Provider validated: ${proveedor.nombre} (${proveedor.id}/${proveedor.uuid_proveedor})`)
      return { success: true, data: proveedor }
    } catch (error) {
      console.error('❌ Error validating provider:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Convertir ID a UUID (para uso en materia_prima)
  ipcMain.handle('proveedor:convertirUuid', async (_, proveedorId: number | string | null) => {
    try {
      const uuid = await service.convertToUuid(proveedorId)

      console.log(`🏭 Converted provider ID ${proveedorId} to UUID: ${uuid}`)
      return { success: true, data: uuid }
    } catch (error) {
      console.error('❌ Error converting to UUID:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Crear nuevo proveedor con dual keys
  ipcMain.handle('proveedor:crear', async (_, data: {
    id_fiscal: string
    nombre: string
    domicilio?: string
    telefono?: string
    email?: string
    contacto?: string
    rfc?: string
    curp?: string
    id_institucion: number
  }) => {
    try {
      if (!data.id_fiscal || !data.nombre || !data.id_institucion) {
        throw new Error('Datos requeridos faltantes: id_fiscal, nombre, id_institucion')
      }

      const proveedor = await service.createWithDualKeys(data)

      console.log(`🏭 Created provider: ${proveedor.nombre} (${proveedor.id}/${proveedor.uuid_proveedor})`)
      return { success: true, data: proveedor }
    } catch (error) {
      console.error('❌ Error creating provider:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Verificar consistencia de datos
  ipcMain.handle('proveedor:verificarConsistencia', async () => {
    try {
      const consistency = await service.checkConsistency()

      console.log(`🏭 Consistency check: ${consistency.totalProveedores} total, ${consistency.conUuid} with UUID`)

      if (consistency.inconsistencias.length > 0) {
        console.warn('⚠️ Provider inconsistencies found:', consistency.inconsistencias)
      }

      return { success: true, data: consistency }
    } catch (error) {
      console.error('❌ Error checking consistency:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  console.log('✅ Proveedor IPC handlers registered successfully')
}

/**
 * Limpiar todos los handlers de IPC para proveedores
 */
export function unregisterProveedorHandlers(): void {
  console.log('🗑️ Unregistering proveedor IPC handlers...')

  const channels = [
    'proveedor:listar',
    'proveedor:obtenerUuid',
    'proveedor:obtenerId',
    'proveedor:validar',
    'proveedor:convertirUuid',
    'proveedor:crear',
    'proveedor:verificarConsistencia'
  ]

  channels.forEach(channel => {
    ipcMain.removeAllListeners(channel)
  })

  // Reset service instance
  proveedorService = null

  console.log('✅ Proveedor IPC handlers unregistered successfully')
}