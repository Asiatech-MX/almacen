import type {
  FindAllProveedoresResult,
  FindProveedorByIdResult,
  SearchProveedoresResult,
  FindProveedorByRFCResult
} from '../../backend/types/generated/proveedores.types'

// Tipos principales de Proveedores
export type Proveedor = FindAllProveedoresResult
export type ProveedorDetail = FindProveedorByIdResult
export type ProveedorSearch = SearchProveedoresResult
export type ProveedorByRFC = FindProveedorByRFCResult

// Para operaciones de escritura (Kysely types)
export interface NewProveedor {
  nombre: string
  rfc?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
}

export interface ProveedorUpdate {
  nombre?: string
  rfc?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
}

// Tipos para filtros y búsquedas
export interface ProveedorFilters {
  nombre?: string
  rfc?: string
  email?: string
  tieneMateriales?: boolean
}

export interface ProveedorSearchOptions {
  term: string
  limit?: number
}

// Tipos para validaciones
export interface ProveedorValidationErrors {
  nombre?: string
  rfc?: string
  email?: string
}

// Tipos para formulario
export interface ProveedorFormData extends NewProveedor {
  id?: string // Para modo edición
}

// Eventos de IPC
export interface ProveedorIPCEvents {
  // Queries
  'proveedor:listar': (filters?: ProveedorFilters) => Promise<Proveedor[]>
  'proveedor:obtener': (id: string) => Promise<ProveedorDetail>
  'proveedor:buscar': (searchTerm: string, limit?: number) => Promise<ProveedorSearch[]>
  'proveedor:buscarPorRFC': (rfc: string) => Promise<ProveedorByRFC>

  // Commands
  'proveedor:crear': (data: NewProveedor, usuarioId?: string) => Promise<ProveedorDetail>
  'proveedor:actualizar': (id: string, data: ProveedorUpdate, usuarioId?: string) => Promise<ProveedorDetail>
  'proveedor:eliminar': (id: string, usuarioId?: string) => Promise<boolean>
}