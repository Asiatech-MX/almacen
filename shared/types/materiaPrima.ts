import type {
  FindAllMateriaPrimaResult,
  FindMateriaPrimaByIdResult,
  FindMateriaPrimaByCodigoBarrasResult,
  SearchMateriaPrimaResult,
  FindLowStockItemsResult,
  CheckStockDisponibleResult,
  GetAuditTrailResult,
  GetMateriaPrimaStatsResult,
  GetCategoriaStatsResult
} from '../../backend/types/generated/materiaPrima.types'

import type {
  FindAllProveedoresResult,
  SearchProveedoresResult
} from '../../backend/types/generated/proveedores.types'

// Tipos principales de Materia Prima
export type MateriaPrima = FindAllMateriaPrimaResult
export type MateriaPrimaDetail = FindMateriaPrimaByIdResult
export type MateriaPrimaSearch = SearchMateriaPrimaResult
export type LowStockItem = FindLowStockItemsResult
export type StockCheck = CheckStockDisponibleResult
export type AuditTrail = GetAuditTrailResult
export type MateriaPrimaStats = GetMateriaPrimaStatsResult
export type CategoriaStats = GetCategoriaStatsResult

// Tipos de Proveedor
export type Proveedor = FindAllProveedoresResult
export type ProveedorSearch = SearchProveedoresResult

// Para operaciones de escritura (Kysely types)
export interface NewMateriaPrima {
  codigo_barras: string
  nombre: string
  marca?: string | null
  modelo?: string | null
  presentacion: string
  stock_actual?: number
  stock_minimo?: number
  costo_unitario?: number | null
  fecha_caducidad?: Date | null
  imagen_url?: string | null
  descripcion?: string | null
  categoria?: string | null
  proveedor_id?: string | null
}

export interface MateriaPrimaUpdate {
  codigo_barras?: string
  nombre?: string
  marca?: string | null
  modelo?: string | null
  presentacion?: string
  stock_actual?: number
  stock_minimo?: number
  costo_unitario?: number | null
  fecha_caducidad?: Date | null
  imagen_url?: string | null
  descripcion?: string | null
  categoria?: string | null
  proveedor_id?: string | null
}

// Tipos para filtros y búsquedas
export interface MateriaPrimaFilters {
  nombre?: string
  codigo_barras?: string  // Fixed: changed from codigoBarras to match service
  categoria?: string
  proveedorId?: string
  bajoStock?: boolean
  sinStock?: boolean
  rangoStock?: { min?: number; max?: number }  // Add stock range filtering
}

// Add new interface for advanced search criteria
export interface MateriaPrimaSearchCriteria {
  nombre?: string
  categoria?: string
  proveedorId?: string
  bajoStock?: boolean
  rangoStock?: { min?: number; max?: number }
}

export interface MateriaPrimaSearchOptions {
  term: string
  limit?: number
  categoria?: string
  proveedorId?: string
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

// Tipos para validaciones
export interface MateriaPrimaValidationErrors {
  codigo_barras?: string
  nombre?: string
  presentacion?: string
  stock_actual?: string
  stock_minimo?: string
  costo_unitario?: string
  fecha_caducidad?: string
  proveedor_id?: string
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

// Eventos de IPC
export interface MateriaPrimaIPCEvents {
  // Queries
  'materiaPrima:listar': (filters?: MateriaPrimaFilters) => Promise<MateriaPrima[]>
  'materiaPrima:obtener': (id: string) => Promise<MateriaPrimaDetail>
  'materiaPrima:buscarPorCodigo': (codigoBarras: string) => Promise<MateriaPrimaDetail>
  'materiaPrima:buscar': (searchTerm: string, limit?: number) => Promise<MateriaPrimaSearch[]>
  'materiaPrima:stockBajo': () => Promise<LowStockItem[]>
  'materiaPrima:verificarStock': (id: string, cantidad: number) => Promise<StockCheck>
  'materiaPrima:estadisticas': () => Promise<MateriaPrimaStats>
  'materiaPrima:auditoria': (materiaPrimaId: string, limit?: number) => Promise<AuditTrail[]>

  // Commands
  'materiaPrima:crear': (data: NewMateriaPrima, usuarioId?: string) => Promise<MateriaPrimaDetail>
  'materiaPrima:actualizar': (id: string, data: MateriaPrimaUpdate, usuarioId?: string) => Promise<MateriaPrimaDetail>
  'materiaPrima:eliminar': (id: string, usuarioId?: string) => Promise<boolean>
  'materiaPrima:actualizarStock': (id: string, cantidad: number, motivo: string, usuarioId?: string) => Promise<boolean>
  'materiaPrima:actualizarEstatus': (data: MateriaPrimaEstatusUpdate) => Promise<MateriaPrimaDetail>
  'materiaPrima:exportar': (options: MateriaPrimaExportOptions) => Promise<Buffer>
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