// Importar tipos desde Kysely Codegen
import type {
  MateriaPrima as KyselyMateriaPrima,
  Presentacion,
  Categoria
} from '../../backend/types/generated/database.types'

import type {
  FindAllProveedoresResult,
  SearchProveedoresResult
} from '../../backend/types/generated/proveedores.types'

// Tipos principales de Materia Prima - usando Kysely types
export type MateriaPrima = KyselyMateriaPrima & {
  // Mapeo de campos Kysely a nombres del frontend
  stock_actual: KyselyMateriaPrima['stockActual']
  stock_minimo: KyselyMateriaPrima['stockMinimo']
  codigo_barras: KyselyMateriaPrima['codigoBarras']
  codigo_barras_formato: string | null // Manually added field (Kysely types not yet generated)
  costo_unitario: KyselyMateriaPrima['costoUnitario']
  fecha_caducidad: KyselyMateriaPrima['fechaCaducidad']
  imagen_url: KyselyMateriaPrima['imagenUrl']
  proveedor_id: KyselyMateriaPrima['proveedorId']
  categoria_id: KyselyMateriaPrima['categoriaId']
  presentacion_id: KyselyMateriaPrima['presentacionId']
  creado_en: KyselyMateriaPrima['creadoEn']
  actualizado_en: KyselyMateriaPrima['actualizadoEn']
  estatus: 'ACTIVO' | 'INACTIVO' // Derivado de activo
}

export type MateriaPrimaDetail = MateriaPrima & {
  proveedor_nombre?: string | null
  proveedor_rfc?: string | null
  proveedor_telefono?: string | null
  proveedor_email?: string | null
}

// Tipos de búsqueda y estadísticas (mantener compatibilidad temporal)
export type MateriaPrimaSearch = MateriaPrima
export type LowStockItem = MateriaPrima
export type StockCheck = {
  disponible: boolean
  stock_actual: number
  stock_minimo?: number
  stock_restante?: number
}
export type AuditTrail = any // TODO: Implementar con tipos Kysely
export type MateriaPrimaStats = {
  total_materiales: number
  bajo_stock: number
  sin_stock: number
  valor_total_inventario: number
  con_categoria: number
}
export type CategoriaStats = {
  categoria: string
  cantidad: number
  valor_total: number
  bajo_stock: number
}

// Tipos de Proveedor
export type Proveedor = FindAllProveedoresResult
export type ProveedorSearch = SearchProveedoresResult

// Para operaciones de escritura (Kysely types) - Actualizado para sistema de referencias y códigos de barras
export interface NewMateriaPrima {
  codigo_barras: string
  codigo_barras_formato?: string // New field for barcode format
  nombre: string
  marca?: string | null
  modelo?: string | null
  presentacion: string // Campo requerido en Kysely
  categoria?: string | null
  presentacion_id?: number | null
  categoria_id?: number | null
  stock_actual: number
  stock_minimo: number
  costo_unitario?: number | null
  fecha_caducidad?: Date | null
  imagen_url?: string | null
  descripcion?: string | null
  proveedor_id?: string | null
  id_institucion?: number
}

export interface MateriaPrimaUpdate {
  codigo_barras?: string
  codigo_barras_formato?: string // New field for barcode format
  nombre?: string
  marca?: string | null
  modelo?: string | null
  presentacion?: string
  categoria?: string | null
  presentacion_id?: number | null
  categoria_id?: number | null
  stock_actual?: number
  stock_minimo?: number
  costo_unitario?: number | null
  fecha_caducidad?: Date | null
  imagen_url?: string | null
  descripcion?: string | null
  proveedor_id?: string | null
  id_institucion?: number
}

// Tipos para migración de referencias
export interface MateriaPrimaConReferencias {
  id: string
  codigo_barras: string
  nombre: string
  marca?: string | null
  modelo?: string | null
  stock_actual: number
  stock_minimo: number
  costo_unitario?: number | null
  fecha_caducidad?: Date | null
  imagen_url?: string | null
  descripcion?: string | null
  proveedor_id?: string | null
  id_institucion: number
  activo: boolean
  creado_en: string
  actualizado_en: string
  // Compatibilidad backward
  presentacion?: string | null
  categoria?: string | null
  // Nuevos campos con IDs de referencia
  presentacion_id?: string | null
  categoria_id?: string | null
  // Datos enriquecidos (opcional)
  presentacion_data?: {
    id: string
    nombre: string
    abreviatura?: string | null
  } | null
  categoria_data?: {
    id: string
    nombre: string
    ruta_completa: string
    nivel: number
  } | null
}

// Tipos para operaciones de migración
export interface MateriaPrimaMigracionData {
  id: string
  presentacion_texto?: string | null
  categoria_texto?: string | null
  presentacion_id?: string | null
  categoria_id?: string | null
  migracion_status: 'pending' | 'completed' | 'failed'
  migracion_error?: string | null
}

export interface MateriaPrimaMigracionBatch {
  items: MateriaPrimaMigracionData[]
  total: number
  procesados: number
  fallidos: number
  fecha_inicio: Date
  fecha_fin?: Date
}

// Tipos para validación de compatibilidad
export interface MateriaPrimaCompatibilidadValidation {
  hasPresentacionText: boolean
  hasCategoriaText: boolean
  hasPresentacionId: boolean
  hasCategoriaId: boolean
  needsMigration: boolean
  canUseTextFallback: boolean
  warnings: string[]
}

// Tipos para formulario con soporte de migración
export interface MateriaPrimaFormData extends NewMateriaPrima {
  id?: string // Para modo edición
  // Campos adicionales para UI
  presentacion_search?: string // Búsqueda para select de presentación
  categoria_search?: string // Búsqueda para select de categoría
  // Estado de validación
  validation_errors?: Record<string, string>
  migration_warnings?: string[]
}

// Tipos para filtros y búsquedas - Actualizado para sistema de referencias
export interface MateriaPrimaFilters {
  nombre?: string
  codigo_barras?: string  // Fixed: changed from codigoBarras to match service
  // Compatibilidad backward
  categoria?: string
  categoria_id?: string
  // Nuevos filtros
  presentacion?: string
  presentacion_id?: string
  categoria_ruta?: string // Filtrar por ruta completa
  categoria_nivel?: number // Filtrar por nivel de jerarquía
  proveedorId?: string
  bajoStock?: boolean
  sinStock?: boolean
  rangoStock?: { min?: number; max?: number }  // Add stock range filtering
  id_institucion?: number
}

// Add new interface for advanced search criteria - Actualizado
export interface MateriaPrimaSearchCriteria {
  nombre?: string
  // Compatibilidad backward
  categoria?: string
  categoria_id?: string
  // Nuevos criterios
  presentacion?: string
  presentacion_id?: string
  categoria_ruta?: string
  categoria_nivel?: number
  proveedorId?: string
  bajoStock?: boolean
  rangoStock?: { min?: number; max?: number }
  id_institucion?: number
}

export interface MateriaPrimaSearchOptions {
  term: string
  limit?: number
  // Compatibilidad backward
  categoria?: string
  categoria_id?: string
  // Nuevas opciones
  presentacion?: string
  presentacion_id?: string
  categoria_ruta?: string
  proveedorId?: string
  id_institucion?: number
  includeReferencias?: boolean // Incluir datos enriquecidos
}

// Tipos para operaciones de stock
export interface StockMovementData {
  materiaPrimaId: string
  cantidad: number
  motivo: string
  usuarioId?: string
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
}

export interface StockUpdateResult {
  id: string
  stock_anterior: number
  stock_nuevo: number
  cantidad: number
  motivo: string
  fecha: Date
}

// Tipos para auditoría
export interface AuditoriaFilters {
  materiaPrimaId?: string
  usuarioId?: string
  accion?: 'INSERT' | 'UPDATE' | 'DELETE' | 'STOCK_UPDATE'
  fechaInicio?: Date
  fechaFin?: Date
}

// Tipos para exportación
export interface MateriaPrimaExportOptions {
  formato: 'csv' | 'excel' | 'pdf'
  columns?: string[]
  filters?: MateriaPrimaFilters
  includeProveedores?: boolean
}

// Tipos para validaciones - Actualizado para sistema de referencias
export interface MateriaPrimaValidationErrors {
  codigo_barras?: string
  nombre?: string
  // Compatibilidad backward
  presentacion?: string
  categoria?: string
  // Nuevas validaciones
  presentacion_id?: string
  categoria_id?: string
  presentacion_compatibility?: string
  categoria_compatibility?: string
  stock_actual?: string
  stock_minimo?: string
  costo_unitario?: string
  fecha_caducidad?: string
  proveedor_id?: string
  id_institucion?: string
  migracion?: string
}

// Tipos para advertencias de migración
export interface MateriaPrimaMigrationWarnings {
  presentacion_text_fallback?: string
  categoria_text_fallback?: string
  missing_reference_id?: string
  duplicate_references?: string[]
  incompatible_data?: string
}

// Tipos para formulario
export interface MateriaPrimaFormData extends NewMateriaPrima {
  id?: string // Para modo edición
}

// Tipos para UI/UX
export interface MateriaPrimaTableColumn {
  key: keyof MateriaPrima
  label: string
  sortable?: boolean
  width?: number
  format?: 'text' | 'number' | 'currency' | 'date' | 'boolean'
}

export interface MateriaPrimaQuickActions {
  scan: boolean
  search: boolean
  create: boolean
  edit: boolean
  delete: boolean
  updateStock: boolean
  export: boolean
}

// Tipos para configuración
export interface MateriaPrimaSettings {
  defaultLowStockThreshold: number
  enableBarcodeScanning: boolean
  enableImageUpload: boolean
  enableAuditTrail: boolean
  autoCalculateValue: boolean
}

// Eventos de IPC - Actualizado para sistema de referencias
export interface MateriaPrimaIPCEvents {
  // Queries
  'materiaPrima:listar': (filters?: MateriaPrimaFilters, options?: { includeInactive?: boolean; includeReferencias?: boolean }) => Promise<MateriaPrima[] | MateriaPrimaConReferencias[]>
  'materiaPrima:listarActivos': (filters?: MateriaPrimaFilters) => Promise<MateriaPrima[]>
  'materiaPrima:listarInactivos': (filters?: MateriaPrimaFilters) => Promise<MateriaPrima[]>
  'materiaPrima:obtener': (id: string, options?: { includeReferencias?: boolean }) => Promise<MateriaPrimaDetail | MateriaPrimaConReferencias>
  'materiaPrima:buscarPorCodigo': (codigoBarras: string, options?: { includeReferencias?: boolean }) => Promise<MateriaPrimaDetail | MateriaPrimaConReferencias>
  'materiaPrima:buscar': (searchTerm: string, limit?: number, options?: { includeReferencias?: boolean }) => Promise<MateriaPrimaSearch[]>
  'materiaPrima:stockBajo': (idInstitucion?: number) => Promise<LowStockItem[]>
  'materiaPrima:verificarStock': (id: string, cantidad: number) => Promise<StockCheck>
  'materiaPrima:estadisticas': (idInstitucion?: number) => Promise<MateriaPrimaStats>
  'materiaPrima:auditoria': (materiaPrimaId: string, limit?: number) => Promise<AuditTrail[]>

  // Commands - Actualizados para soportar IDs de referencia
  'materiaPrima:crear': (data: NewMateriaPrima, usuarioId?: string) => Promise<MateriaPrimaDetail | MateriaPrimaConReferencias>
  'materiaPrima:actualizar': (id: string, data: MateriaPrimaUpdate, usuarioId?: string) => Promise<MateriaPrimaDetail | MateriaPrimaConReferencias>
  'materiaPrima:eliminar': (id: string, usuarioId?: string) => Promise<boolean>
  'materiaPrima:actualizarStock': (id: string, cantidad: number, motivo: string, usuarioId?: string) => Promise<boolean>
  'materiaPrima:actualizarEstatus': (data: MateriaPrimaEstatusUpdate) => Promise<MateriaPrimaDetail>
  'materiaPrima:exportar': (options: MateriaPrimaExportOptions) => Promise<Buffer>

  // Nuevos eventos para migración y gestión de referencias
  'materiaPrima:validarCompatibilidad': (id: string) => Promise<MateriaPrimaCompatibilidadValidation>
  'materiaPrima:migrarReferencias': (batchSize?: number) => Promise<MateriaPrimaMigracionBatch>
  'materiaPrima:verificarMigracion': () => Promise<{ total: number; migrados: number; pendientes: number }>
  'materiaPrima:mapearTextoAReferencia': (tipo: 'presentacion' | 'categoria', texto: string, idInstitucion: number) => Promise<{ id?: string; encontrado: boolean }>
}

// Tipos para gestión de estatus
export type MateriaPrimaEstatus = 'ACTIVO' | 'INACTIVO'

export interface MateriaPrimaEstatusUpdate {
  id: string
  estatus: MateriaPrimaEstatus
  usuarioId?: string
}

// Tipos de respuesta estandarizados
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Utilidades para compatibilidad y migración
export interface MateriaPrimaCompatibilityUtils {
  // Métodos para validar compatibilidad
  validarPresentacion: (data: MateriaPrimaConReferencias) => MateriaPrimaCompatibilidadValidation
  validarCategoria: (data: MateriaPrimaConReferencias) => MateriaPrimaCompatibilidadValidation
  validarCompatibilidadCompleta: (data: MateriaPrimaConReferencias) => MateriaPrimaCompatibilidadValidation

  // Métodos para normalizar datos
  normalizarParaCreacion: (data: NewMateriaPrima) => NewMateriaPrima
  normalizarParaActualizacion: (data: MateriaPrimaUpdate, currentData?: MateriaPrimaConReferencias) => MateriaPrimaUpdate

  // Métodos para fallback
  obtenerPresentacionFallback: (data: MateriaPrimaConReferencias) => string | null
  obtenerCategoriaFallback: (data: MateriaPrimaConReferencias) => string | null

  // Métodos para migración
  preparaParaMigracion: (data: any) => MateriaPrimaMigracionData
  verificarMigracionCompleta: (data: MateriaPrimaConReferencias) => boolean
}

// Tipos para estadísticas actualizadas con referencias
export interface MateriaPrimaStatsConReferencias extends MateriaPrimaStats {
  estadisticasPorPresentacion: Array<{
    presentacion_id: string
    presentacion_nombre: string
    cantidad: number
    valor_total: number
    porcentaje: number
  }>
  estadisticasPorCategoria: Array<{
    categoria_id: string
    categoria_nombre: string
    categoria_ruta: string
    cantidad: number
    valor_total: number
    porcentaje: number
    subcategorias?: Array<{
      id: string
      nombre: string
      cantidad: number
      valor_total: number
    }>
  }>
  migracionStatus: {
    total_materia_prima: number
    con_presentacion_id: number
    con_categoria_id: number
    pendientes_migracion: number
    migracion_completa: boolean
  }
}

// Tipos para configuración de sistema de referencias
export interface ReferenceSystemConfig {
  modoMigracion: 'gradual' | 'inmediato' | 'manual'
  mostrarAdvertenciasCompatibilidad: boolean
  permitirCreacionTextoFallback: boolean
  autoMapearTextosReconocidos: boolean
  validacionEstrictaIds: boolean
  habilitarJerarquiaCategorias: boolean
  maximosNivelesJerarquia: number
  cachingReferencias: boolean
  cacheExpirationMinutes: number
}

// Configuración por defecto
export const DefaultReferenceSystemConfig: ReferenceSystemConfig = {
  modoMigracion: 'gradual',
  mostrarAdvertenciasCompatibilidad: true,
  permitirCreacionTextoFallback: true,
  autoMapearTextosReconocidos: true,
  validacionEstrictaIds: false,
  habilitarJerarquiaCategorias: true,
  maximosNivelesJerarquia: 4,
  cachingReferencias: true,
  cacheExpirationMinutes: 30
}

// Exportaciones extendidas para mantener compatibilidad
export type MateriaPrimaConCompatibilidad = MateriaPrimaConReferencias & {
  compatibilidad: MateriaPrimaCompatibilidadValidation
  migrationWarnings: MateriaPrimaMigrationWarnings
  referenceSystemConfig: ReferenceSystemConfig
}