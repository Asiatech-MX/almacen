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
import type {
  Categoria,
  CategoriaArbol,
  NewCategoria,
  CategoriaUpdate,
  OperacionMoverCategoria,
  OperacionReordenarCategorias,
  Presentacion,
  NewPresentacion,
  PresentacionUpdate
} from '@shared-types/referenceData'

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

  // ==================== GESTIÓN DE CATEGORÍAS ====================
  categoria: {
    // ✅ Operaciones de lectura
    listarArbol: (idInstitucion: number, soloActivas?: boolean): Promise<CategoriaArbol[]> =>
      ipcRenderer.invoke('categoria:listarArbol', { idInstitucion, soloActivas }),

    listar: (idInstitucion: number, soloActivas?: boolean): Promise<Categoria[]> =>
      ipcRenderer.invoke('categoria:listar', { idInstitucion, soloActivas }),

    obtener: (id: string, includeInactive?: boolean): Promise<Categoria> =>
      ipcRenderer.invoke('categoria:obtener', { id, includeInactive }),

    obtenerHijos: (idPadre: string, soloActivas?: boolean): Promise<Categoria[]> =>
      ipcRenderer.invoke('categoria:obtenerHijos', { idPadre, soloActivas }),

    obtenerRuta: (id: string): Promise<string> =>
      ipcRenderer.invoke('categoria:obtenerRuta', { id }),

    verificarDescendiente: (idPosibleDescendiente: string, idPosiblePadre: string): Promise<boolean> =>
      ipcRenderer.invoke('categoria:verificarDescendiente', { idPosibleDescendiente, idPosiblePadre }),

    // ✅ Operaciones de escritura
    crear: (categoria: NewCategoria, idPadre?: string, usuarioId?: string): Promise<Categoria> =>
      ipcRenderer.invoke('categoria:crear', { categoria, idPadre, usuarioId }),

    editar: (id: string, cambios: CategoriaUpdate, usuarioId?: string): Promise<Categoria> =>
      ipcRenderer.invoke('categoria:editar', { id, cambios, usuarioId }),

    mover: (idCategoria: string, nuevoPadreId?: string, usuarioId?: string): Promise<Categoria> =>
      ipcRenderer.invoke('categoria:mover', { idCategoria, nuevoPadreId, usuarioId }),

    reordenar: (operaciones: OperacionReordenarCategorias, usuarioId?: string): Promise<boolean> =>
      ipcRenderer.invoke('categoria:reordenar', { operaciones, usuarioId }),

    eliminar: (id: string, forzar?: boolean, usuarioId?: string): Promise<boolean> =>
      ipcRenderer.invoke('categoria:eliminar', { id, forzar, usuarioId }),

    // ✅ Utilidades
    validarJerarquia: (idInstitucion: number): Promise<any> =>
      ipcRenderer.invoke('categoria:validarJerarquia', { idInstitucion })
  },

  // ==================== GESTIÓN DE PRESENTACIONES ====================
  presentacion: {
    // ✅ Operaciones de lectura
    listar: (idInstitucion: number, soloActivas?: boolean): Promise<Presentacion[]> =>
      ipcRenderer.invoke('presentacion:listar', { idInstitucion, soloActivas }),

    obtenerPredeterminadas: (idInstitucion: number): Promise<Presentacion[]> =>
      ipcRenderer.invoke('presentacion:obtenerPredeterminadas', { idInstitucion }),

    obtener: (id: string, includeInactive?: boolean): Promise<Presentacion> =>
      ipcRenderer.invoke('presentacion:obtener', { id, includeInactive }),

    buscarPorNombre: (nombre: string, idInstitucion: number, soloActivas?: boolean): Promise<Presentacion | null> =>
      ipcRenderer.invoke('presentacion:buscarPorNombre', { nombre, idInstitucion, soloActivas }),

    buscarPorAbreviatura: (abreviatura: string, idInstitucion: number, soloActivas?: boolean): Promise<Presentacion | null> =>
      ipcRenderer.invoke('presentacion:buscarPorAbreviatura', { abreviatura, idInstitucion, soloActivas }),

    buscar: (searchTerm: string, idInstitucion: number, limit?: number): Promise<Presentacion[]> =>
      ipcRenderer.invoke('presentacion:buscar', { searchTerm, idInstitucion, limit }),

    // ✅ Operaciones de escritura
    crear: (presentacion: NewPresentacion, usuarioId?: string): Promise<Presentacion> =>
      ipcRenderer.invoke('presentacion:crear', { presentacion, usuarioId }),

    editar: (id: string, cambios: PresentacionUpdate, usuarioId?: string): Promise<Presentacion> =>
      ipcRenderer.invoke('presentacion:editar', { id, cambios, usuarioId }),

    establecerPredeterminada: (id: string, idInstitucion: number, usuarioId?: string): Promise<Presentacion> =>
      ipcRenderer.invoke('presentacion:establecerPredeterminada', { id, idInstitucion, usuarioId }),

    eliminar: (id: string, forzar?: boolean, usuarioId?: string): Promise<boolean> =>
      ipcRenderer.invoke('presentacion:eliminar', { id, forzar, usuarioId }),

    // ✅ Utilidades
    estadisticas: (idInstitucion: number): Promise<any> =>
      ipcRenderer.invoke('presentacion:estadisticas', { idInstitucion }),

    validarIntegridad: (idInstitucion: number): Promise<any> =>
      ipcRenderer.invoke('presentacion:validarIntegridad', { idInstitucion })
  },

  // Sistema de archivos
  sistema: {
    leerArchivo: (ruta: string) => ipcRenderer.invoke('fs:leer', ruta),
    guardarArchivo: (ruta: string, contenido: string) => ipcRenderer.invoke('fs:guardar', ruta, contenido)
  },

  // ==================== FEATURE FLAGS ====================
  featureFlags: {
    isEnabled: (feature: string, userId?: string): Promise<boolean> =>
      ipcRenderer.invoke('featureFlags:isEnabled', feature, userId),

    getFlag: (feature: string): Promise<any> =>
      ipcRenderer.invoke('featureFlags:getFlag', feature),

    getAllFlags: (): Promise<any> =>
      ipcRenderer.invoke('featureFlags:getAllFlags'),

    // Admin operations (may require additional permissions)
    enableFeature: (feature: string): Promise<boolean> =>
      ipcRenderer.invoke('featureFlags:enableFeature', feature),

    disableFeature: (feature: string): Promise<boolean> =>
      ipcRenderer.invoke('featureFlags:disableFeature', feature),

    setRolloutPercentage: (feature: string, percentage: number): Promise<boolean> =>
      ipcRenderer.invoke('featureFlags:setRolloutPercentage', feature, percentage),

    completeMigration: (feature: string): Promise<boolean> =>
      ipcRenderer.invoke('featureFlags:completeMigration', feature),

    // Remote configuration
    loadRemoteConfig: (configUrl?: string): Promise<boolean> =>
      ipcRenderer.invoke('featureFlags:loadRemoteConfig', configUrl)
  },

  // ==================== MONITORING ====================
  monitoring: {
    // Get error statistics
    getErrorStats: (): Promise<Record<string, number>> =>
      ipcRenderer.invoke('monitoring:getErrorStats'),

    // Get performance metrics
    getPerformanceMetrics: (): Promise<any> =>
      ipcRenderer.invoke('monitoring:getPerformanceMetrics'),

    // Export logs for debugging
    exportLogs: (): Promise<string> =>
      ipcRenderer.invoke('monitoring:exportLogs'),

    // Perform health check
    healthCheck: (): Promise<{ status: 'healthy' | 'warning' | 'error', details: any }> =>
      ipcRenderer.invoke('monitoring:healthCheck'),

    // Log user action
    logUserAction: (action: string, userId?: string, context?: any): Promise<boolean> =>
      ipcRenderer.invoke('monitoring:logUserAction', action, userId, context),

    // Log performance event
    logPerformanceEvent: (event: string, duration: number, context?: any): Promise<boolean> =>
      ipcRenderer.invoke('monitoring:logPerformanceEvent', event, duration, context),

    // Get monitoring configuration
    getConfig: (): Promise<any> =>
      ipcRenderer.invoke('monitoring:getConfig'),

    // Get system information
    getSystemInfo: (): Promise<any> =>
      ipcRenderer.invoke('monitoring:getSystemInfo'),

    // Admin operations
    clearErrorStats: (): Promise<boolean> =>
      ipcRenderer.invoke('monitoring:clearErrorStats'),

    toggleFeature: (feature: 'performanceMonitoring' | 'remoteLogging', enabled: boolean): Promise<boolean> =>
      ipcRenderer.invoke('monitoring:toggleFeature', feature, enabled)
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
        subirImagen: (fileData: ImageFileData, metadata: ImageMetadata) => Promise<ImageUploadResult>
      }

      // ==================== CATEGORÍAS ====================
      categoria: {
        // Operaciones de lectura
        listarArbol: (idInstitucion: number, soloActivas?: boolean) => Promise<CategoriaArbol[]>
        listar: (idInstitucion: number, soloActivas?: boolean) => Promise<Categoria[]>
        obtener: (id: string, includeInactive?: boolean) => Promise<Categoria>
        obtenerHijos: (idPadre: string, soloActivas?: boolean) => Promise<Categoria[]>
        obtenerRuta: (id: string) => Promise<string>
        verificarDescendiente: (idPosibleDescendiente: string, idPosiblePadre: string) => Promise<boolean>

        // Operaciones de escritura
        crear: (categoria: NewCategoria, idPadre?: string, usuarioId?: string) => Promise<Categoria>
        editar: (id: string, cambios: CategoriaUpdate, usuarioId?: string) => Promise<Categoria>
        mover: (idCategoria: string, nuevoPadreId?: string, usuarioId?: string) => Promise<Categoria>
        reordenar: (operaciones: OperacionReordenarCategorias, usuarioId?: string) => Promise<boolean>
        eliminar: (id: string, forzar?: boolean, usuarioId?: string) => Promise<boolean>

        // Utilidades
        validarJerarquia: (idInstitucion: number) => Promise<any>
      },

      // ==================== PRESENTACIONES ====================
      presentacion: {
        // Operaciones de lectura
        listar: (idInstitucion: number, soloActivas?: boolean) => Promise<Presentacion[]>
        obtenerPredeterminadas: (idInstitucion: number) => Promise<Presentacion[]>
        obtener: (id: string, includeInactive?: boolean) => Promise<Presentacion>
        buscarPorNombre: (nombre: string, idInstitucion: number, soloActivas?: boolean) => Promise<Presentacion | null>
        buscarPorAbreviatura: (abreviatura: string, idInstitucion: number, soloActivas?: boolean) => Promise<Presentacion | null>
        buscar: (searchTerm: string, idInstitucion: number, limit?: number) => Promise<Presentacion[]>

        // Operaciones de escritura
        crear: (presentacion: NewPresentacion, usuarioId?: string) => Promise<Presentacion>
        editar: (id: string, cambios: PresentacionUpdate, usuarioId?: string) => Promise<Presentacion>
        establecerPredeterminada: (id: string, idInstitucion: number, usuarioId?: string) => Promise<Presentacion>
        eliminar: (id: string, forzar?: boolean, usuarioId?: string) => Promise<boolean>

        // Utilidades
        estadisticas: (idInstitucion: number) => Promise<any>
        validarIntegridad: (idInstitucion: number) => Promise<any>
      },

      // ==================== SISTEMA ====================
      sistema: {
        leerArchivo: (ruta: string) => Promise<string>
        guardarArchivo: (ruta: string, contenido: string) => Promise<boolean>
      }

      // ==================== FEATURE FLAGS ====================
      featureFlags: {
        isEnabled: (feature: string, userId?: string) => Promise<boolean>
        getFlag: (feature: string) => Promise<any>
        getAllFlags: () => Promise<any>
        enableFeature: (feature: string) => Promise<boolean>
        disableFeature: (feature: string) => Promise<boolean>
        setRolloutPercentage: (feature: string, percentage: number) => Promise<boolean>
        completeMigration: (feature: string) => Promise<boolean>
        loadRemoteConfig: (configUrl?: string) => Promise<boolean>
      }

      // ==================== MONITORING ====================
      monitoring: {
        getErrorStats: () => Promise<Record<string, number>>
        getPerformanceMetrics: () => Promise<any>
        exportLogs: () => Promise<string>
        healthCheck: () => Promise<{ status: 'healthy' | 'warning' | 'error', details: any }>
        logUserAction: (action: string, userId?: string, context?: any) => Promise<boolean>
        logPerformanceEvent: (event: string, duration: number, context?: any) => Promise<boolean>
        getConfig: () => Promise<any>
        getSystemInfo: () => Promise<any>
        clearErrorStats: () => Promise<boolean>
        toggleFeature: (feature: 'performanceMonitoring' | 'remoteLogging', enabled: boolean) => Promise<boolean>
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