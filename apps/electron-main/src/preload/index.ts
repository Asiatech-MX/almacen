import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '@shared-types/preload'
import type { BarcodeIPCEvents } from '@shared/types/barcode'

/**
 * API segura para el renderer process utilizando contextBridge
 * Proporciona acceso type-safe a las funcionalidades de materia prima
 */
const electronAPI: ElectronAPI = {
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

    // ✅ Operaciones de estado
    toggleActivo: (id: string, activar: boolean, usuarioId?: string): Promise<Categoria> =>
      ipcRenderer.invoke('categoria:toggleActivo', { id, activar, usuario_id: usuarioId }),

    // ✅ Operaciones de consulta
    verificarDependencias: (id: string): Promise<{
      tiene_hijos: boolean
      tiene_materiales: boolean
      num_hijos: number
      num_materiales: number
      puede_eliminar: boolean
    }> =>
      ipcRenderer.invoke('categoria:verificarDependencias', { id }),

    obtenerPorNivel: (idInstitucion: number, nivel: number, soloActivas?: boolean): Promise<Categoria[]> =>
      ipcRenderer.invoke('categoria:obtenerPorNivel', { id_institucion: idInstitucion, nivel, solo_activas: soloActivas }),

    buscar: (idInstitucion: number, terminos: string, soloActivas?: boolean): Promise<Categoria[]> =>
      ipcRenderer.invoke('categoria:buscar', { id_institucion: idInstitucion, terminos, solo_activas: soloActivas }),

    obtenerRutaCompleta: (id: string): Promise<{
      id: string
      nombre: string
      nivel: number
    }[]> =>
      ipcRenderer.invoke('categoria:obtenerRuta', { id }),

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

    // ✅ Operaciones de escritura
    crear: (presentacion: NewPresentacion, usuarioId?: string): Promise<Presentacion> =>
      ipcRenderer.invoke('presentacion:crear', { presentacion, usuarioId }),

    editar: (id: string, cambios: PresentacionUpdate, usuarioId?: string): Promise<Presentacion> =>
      ipcRenderer.invoke('presentacion:editar', { id, cambios, usuarioId }),

    establecerPredeterminada: (id: string, idInstitucion: number, usuarioId?: string): Promise<Presentacion> =>
      ipcRenderer.invoke('presentacion:establecerPredeterminada', { id, idInstitucion, usuarioId }),

    eliminar: (id: string, forzar?: boolean, usuarioId?: string): Promise<boolean> =>
      ipcRenderer.invoke('presentacion:eliminar', { id, forzar, usuarioId }),

    // ✅ Operaciones de estado
    toggleActivo: (id: string, activar: boolean, usuarioId?: string): Promise<Presentacion> =>
      ipcRenderer.invoke('presentacion:toggleActivo', { id, activar, usuarioId }),

    // ✅ Operaciones de consulta
    verificarDependencias: (id: string): Promise<{ tiene_materiales: boolean }> =>
      ipcRenderer.invoke('presentacion:verificarDependencias', { id }),

    buscar: (idInstitucion: number, termino: string, soloActivas?: boolean): Promise<Presentacion[]> =>
      ipcRenderer.invoke('presentacion:buscar', { idInstitucion, termino, soloActivas }),

    obtenerPorNombre: (idInstitucion: number, nombre: string, includeInactive?: boolean): Promise<Presentacion | null> =>
      ipcRenderer.invoke('presentacion:obtenerPorNombre', { idInstitucion, nombre, includeInactive }),

    listarTodas: (idInstitucion: number): Promise<Presentacion[]> =>
      ipcRenderer.invoke('presentacion:listarTodas', { idInstitucion }),

    // ✅ Operaciones de restauración
    restaurar: (id: string, usuarioId?: string): Promise<Presentacion> =>
      ipcRenderer.invoke('presentacion:restaurar', { id, usuarioId }),

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

  // ==================== SISTEMA DE CÓDIGOS DE BARRAS ====================
  barcode: {
    // Generar código de barras como base64
    generate: (options: import('@shared/types/barcode').BarcodeOptions) => 
      ipcRenderer.invoke('barcode:generate', options) as Promise<{ success: boolean; data?: string; error?: string }>,

    // Validar formato de código de barras
    validate: (format: import('@shared/types/barcode').BarcodeFormat, value: string) =>
      ipcRenderer.invoke('barcode:validate', format, value) as Promise<{ valid: boolean; error?: string }>,

    // Imprimir etiqueta individual
    print: (job: import('@shared/types/barcode').PrintJob) =>
      ipcRenderer.invoke('barcode:print', job) as Promise<{ success: boolean; message?: string; jobId?: string }>,

    // Imprimir lote de etiquetas
    printBatch: (jobs: import('@shared/types/barcode').PrintJob[]) =>
      ipcRenderer.invoke('barcode:printBatch', jobs) as Promise<{ success: boolean; message?: string; results?: any[] }>,

    // Descubrir impresoras disponibles
    discover: () => 
      ipcRenderer.invoke('printer:discover') as Promise<import('@shared/types/barcode').PrinterConfig[]>,

    // Verificar estado de impresora
    status: (printerId: string) =>
      ipcRenderer.invoke('printer:status', printerId) as Promise<{ connected: boolean; status: string; error?: string }>,

    // Obtener configuración de impresora
    getConfig: (printerId: string) =>
      ipcRenderer.invoke('printer:getConfig', printerId) as Promise<import('@shared/types/barcode').PrinterConfig | null>,

    // Establecer configuración de impresora
    setConfig: (config: import('@shared/types/barcode').PrinterConfig) =>
      ipcRenderer.invoke('printer:setConfig', config) as Promise<boolean>,

    // Obtener historial de impresión
    getHistory: () =>
      ipcRenderer.invoke('print:getHistory') as Promise<import('@shared/types/barcode').PrintJob[]>,

    // Limpiar historial de impresión
    clearHistory: () =>
      ipcRenderer.invoke('print:clearHistory') as Promise<boolean>
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
}

// Exponer la API al renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export {}