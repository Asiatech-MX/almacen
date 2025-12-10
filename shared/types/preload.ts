/**
 * Tipos para la API de Electron Preload
 * Define la interfaz completa de window.electronAPI para asegurar type safety
 */

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
  MateriaPrimaEstatusUpdate,
  Categoria,
  CategoriaArbol,
  NewCategoria,
  CategoriaUpdate,
  OperacionMoverCategoria,
  OperacionReordenarCategorias,
  Presentacion,
  NewPresentacion,
  PresentacionUpdate
} from './index'

// Interfaces para upload de imágenes
export interface ImageFileData {
  name: string
  type: string
  size: number
  buffer: ArrayBuffer
}

export interface ImageMetadata {
  materiaPrimaId: string
  codigoBarras: string
  nombre: string
}

export interface ImageUploadResult {
  success: boolean
  url?: string
  error?: string
  filename?: string
}

// Interface principal para la API de Electron
export interface ElectronAPI {
  // ==================== GESTIÓN DE MATERIA PRIMA ====================
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

  // ==================== GESTIÓN DE CATEGORÍAS ====================
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

    // Operaciones de estado
    toggleActivo: (id: string, activar: boolean, usuarioId?: string) => Promise<Categoria>

    // Operaciones de consulta
    verificarDependencias: (id: string) => Promise<{
      tiene_hijos: boolean
      tiene_materiales: boolean
      num_hijos: number
      num_materiales: number
      puede_eliminar: boolean
    }>
    obtenerPorNivel: (idInstitucion: number, nivel: number, soloActivas?: boolean) => Promise<Categoria[]>
    buscar: (idInstitucion: number, terminos: string, soloActivas?: boolean) => Promise<Categoria[]>
    obtenerRutaCompleta: (id: string) => Promise<{
      id: string
      nombre: string
      nivel: number
    }[]>

    // Utilidades
    validarJerarquia: (idInstitucion: number) => Promise<any>
  }

  // ==================== GESTIÓN DE PRESENTACIONES ====================
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

    // Operaciones de estado
    toggleActivo: (id: string, activar: boolean, usuarioId?: string) => Promise<Presentacion>

    // Operaciones de consulta
    verificarDependencias: (id: string) => Promise<{ tiene_materiales: boolean }>
    buscar: (idInstitucion: number, termino: string, soloActivas?: boolean) => Promise<Presentacion[]>
    obtenerPorNombre: (idInstitucion: number, nombre: string, includeInactive?: boolean) => Promise<Presentacion | null>
    listarTodas: (idInstitucion: number) => Promise<Presentacion[]>

    // Operaciones de restauración
    restaurar: (id: string, usuarioId?: string) => Promise<Presentacion>

    // Utilidades
    estadisticas: (idInstitucion: number) => Promise<any>
    validarIntegridad: (idInstitucion: number) => Promise<any>
  }

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

// Declaración global para TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}