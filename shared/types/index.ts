// Re-exportar tipos compartidos con alias explícitos para evitar duplicados
export type {
  Proveedor as MateriaPrimaProveedor,
  ProveedorSearch as MateriaPrimaProveedorSearch,
  MateriaPrima,
  MateriaPrimaSearch
} from './materiaPrima'

export type {
  Proveedor as ProveedorType,
  ProveedorSearch as ProveedorSearchType
} from './proveedores'

// Tipos comunes globales
export interface User {
  id: string
  nombre: string
  email: string
  rol: 'admin' | 'operador' | 'visor'
  activo: boolean
}

export interface AppConfig {
  database: {
    url: string
    maxConnections: number
    connectionTimeout: number
  }
  auth: {
    sessionTimeout: number
    maxLoginAttempts: number
  }
  features: {
    barcodeScanning: boolean
    imageUpload: boolean
    auditTrail: boolean
    exportToCSV: boolean
    exportToPDF: boolean
  }
}

// Tipos de eventos globales de IPC
export interface GlobalIPCEvents {
  // Sistema
  'app:version': () => Promise<string>
  'app:quit': () => void
  'app:minimize': () => void
  'app:maximize': () => void

  // Base de datos
  'db:test': () => Promise<boolean>
  'db:status': () => Promise<{ connected: boolean; lastCheck: Date }>

  // Archivos
  'file:select': (options: { filters?: string[], multiple?: boolean }) => Promise<string[]>
  'file:save': (data: Buffer, filename: string) => Promise<boolean>
  'file:export': (data: any, format: 'csv' | 'excel' | 'pdf', filename: string) => Promise<string>

  // Notificaciones
  'notification:show': (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  'notification:error': (error: string) => void
  'notification:success': (message: string) => void

  // Logs
  'log:info': (message: string, data?: any) => void
  'log:error': (message: string, error?: Error) => void
  'log:debug': (message: string, data?: any) => void
}

// Utilidades comunes
export interface SelectOption<T = string> {
  value: T
  label: string
  disabled?: boolean
  group?: string
}

export interface TableColumn<T = any> {
  key: keyof T
  label: string
  sortable?: boolean
  width?: number | string
  align?: 'left' | 'center' | 'right'
  format?: 'text' | 'number' | 'currency' | 'date' | 'boolean'
  render?: (value: any, row: T) => React.ReactNode
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

export interface PaginationConfig {
  page: number
  limit: number
  total: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Date
}