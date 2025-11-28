import { contextBridge, ipcRenderer } from 'electron'
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
  MateriaPrimaSearch,
  MateriaPrimaEstatusUpdate
} from '@shared-types/index'

// Interfaces para upload de imágenes
interface ImageFileData {
  name: string
  type: string
  size: number
  buffer: ArrayBuffer
}

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

/**
 * API segura para el renderer process utilizando contextBridge
 * Proporciona acceso type-safe a las funcionalidades de materia prima
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ==================== GESTIÓN DE MATERIA PRIMA ====================
  materiaPrima: {
    // ✅ Operaciones de lectura
    listar: (filters?: MateriaPrimaFilters, options?: { includeInactive?: boolean }): Promise<MateriaPrima[]> =>
      ipcRenderer.invoke('materiaPrima:listar', filters, options),

    listarActivos: (filters?: MateriaPrimaFilters): Promise<MateriaPrima[]> =>
      ipcRenderer.invoke('materiaPrima:listarActivos', filters),

    listarInactivos: (filters?: MateriaPrimaFilters): Promise<MateriaPrima[]> =>
      ipcRenderer.invoke('materiaPrima:listarInactivos', filters),

    obtener: (id: string, options?: { includeInactive?: boolean }): Promise<MateriaPrimaDetail> =>
      ipcRenderer.invoke('materiaPrima:obtener', { id, includeInactive: options?.includeInactive ?? false }),

    buscarPorCodigo: (codigoBarras: string): Promise<MateriaPrimaDetail> =>
      ipcRenderer.invoke('materiaPrima:buscarPorCodigo', codigoBarras),

    buscar: (searchTerm: string, limit?: number): Promise<MateriaPrimaSearch[]> =>
      ipcRenderer.invoke('materiaPrima:buscar', searchTerm, limit),

    stockBajo: (): Promise<LowStockItem[]> =>
      ipcRenderer.invoke('materiaPrima:stockBajo'),

    verificarStock: (id: string, cantidad: number): Promise<StockCheck> =>
      ipcRenderer.invoke('materiaPrima:verificarStock', id, cantidad),

    estadisticas: (): Promise<MateriaPrimaStats> =>
      ipcRenderer.invoke('materiaPrima:estadisticas'),

    auditoria: (materiaPrimaId: string, limit?: number): Promise<AuditTrail[]> =>
      ipcRenderer.invoke('materiaPrima:auditoria', materiaPrimaId, limit),

    // ✅ Operaciones de escritura
    crear: (data: NewMateriaPrima, usuarioId?: string): Promise<MateriaPrimaDetail> =>
      ipcRenderer.invoke('materiaPrima:crear', data, usuarioId),

    actualizar: (id: string, data: MateriaPrimaUpdate, usuarioId?: string): Promise<MateriaPrimaDetail> =>
      ipcRenderer.invoke('materiaPrima:actualizar', id, data, usuarioId),

    actualizarEstatus: (data: MateriaPrimaEstatusUpdate): Promise<MateriaPrimaDetail> =>
      ipcRenderer.invoke('materiaPrima:actualizarEstatus', data),

    actualizarStock: (id: string, cantidad: number, motivo: string, usuarioId?: string): Promise<boolean> =>
      ipcRenderer.invoke('materiaPrima:actualizarStock', id, cantidad, motivo, usuarioId),

    eliminar: (id: string, usuarioId?: string): Promise<boolean> =>
      ipcRenderer.invoke('materiaPrima:eliminar', id, usuarioId),

    // ✅ Utilidades
    exportar: (options: { formato: 'csv' | 'excel' | 'pdf' }): Promise<Buffer> =>
      ipcRenderer.invoke('materiaPrima:exportar', options),

    // ✅ Upload de imágenes
    subirImagen: (fileData: ImageFileData, metadata: ImageMetadata): Promise<ImageUploadResult> =>
      ipcRenderer.invoke('materiaPrima:subirImagen', fileData, metadata)
  },

  // Sistema de archivos
  sistema: {
    leerArchivo: (ruta: string) => ipcRenderer.invoke('fs:leer', ruta),
    guardarArchivo: (ruta: string, contenido: string) => ipcRenderer.invoke('fs:guardar', ruta, contenido)
  },

  // Event listeners
  onActualizacionInventario: (callback: (data: any) => void) => {
    ipcRenderer.on('inventario:actualizado', (_, data) => callback(data))
  },

  // Métodos genéricos de IPC
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, callback)
  },
  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.off(channel, callback)
  },
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args)
})

// ==================== TIPOS PARA TYPESCRIPT ====================
/**
 * Tipos globales para window.electronAPI
 * Proporciona autocompletado y type safety en el renderer process
 */
declare global {
  interface Window {
    electronAPI: {
      // ==================== MATERIA PRIMA ====================
      materiaPrima: {
        // Operaciones de lectura
        listar: (filters?: MateriaPrimaFilters, options?: { includeInactive?: boolean }) => Promise<MateriaPrima[]>
        listarActivos: (filters?: MateriaPrimaFilters) => Promise<MateriaPrima[]>
        listarInactivos: (filters?: MateriaPrimaFilters) => Promise<MateriaPrima[]>
        obtener: (id: string, options?: { includeInactive?: boolean }) => Promise<MateriaPrimaDetail>
        buscarPorCodigo: (codigoBarras: string) => Promise<MateriaPrimaDetail>
        buscar: (searchTerm: string, limit?: number) => Promise<MateriaPrimaSearch[]>
        stockBajo: () => Promise<LowStockItem[]>
        verificarStock: (id: string, cantidad: number) => Promise<StockCheck>
        estadisticas: () => Promise<MateriaPrimaStats>
        auditoria: (materiaPrimaId: string, limit?: number) => Promise<AuditTrail[]>

        // Operaciones de escritura
        crear: (data: NewMateriaPrima, usuarioId?: string) => Promise<MateriaPrimaDetail>
        actualizar: (id: string, data: MateriaPrimaUpdate, usuarioId?: string) => Promise<MateriaPrimaDetail>
        actualizarEstatus: (data: MateriaPrimaEstatusUpdate) => Promise<MateriaPrimaDetail>
        actualizarStock: (id: string, cantidad: number, motivo: string, usuarioId?: string) => Promise<boolean>
        eliminar: (id: string, usuarioId?: string) => Promise<boolean>

        // Utilidades
        exportar: (options: { formato: 'csv' | 'excel' | 'pdf' }) => Promise<Buffer>

        // Upload de imágenes
        subirImagen: (fileData: ImageFileData, metadata: ImageMetadata): Promise<ImageUploadResult>
      }

      // ==================== SISTEMA ====================
      sistema: {
        leerArchivo: (ruta: string) => Promise<string>
        guardarArchivo: (ruta: string, contenido: string) => Promise<boolean>
      }

      // ==================== EVENTOS ====================
      onActualizacionInventario: (callback: (data: any) => void) => void

      // ==================== GENÉRICOS ====================
      invoke: (channel: string, ...args: any[]) => Promise<any>
      on: (channel: string, callback: (...args: any[]) => void) => void
      off: (channel: string, callback: (...args: any[]) => void) => void
      send: (channel: string, ...args: any[]) => void
    }
  }
}

export {}