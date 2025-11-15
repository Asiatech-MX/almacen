export interface FindAllProveedoresParams {
  // No parameters for this query
}

export interface FindAllProveedoresResult {
  id: string
  nombre: string
  rfc: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  creado_en: Date
  actualizado_en: Date
}

export interface FindProveedorByIdParams {
  id: string
}

export interface FindProveedorByIdResult {
  id: string
  nombre: string
  rfc: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  activo: boolean
  creado_en: Date
  actualizado_en: Date
}

export interface SearchProveedoresParams {
  searchTerm: string
  limit: number
}

export interface SearchProveedoresResult {
  id: string
  nombre: string
  rfc: string | null
  telefono: string | null
  email: string | null
}

export interface FindProveedorByRFCParams {
  rfc: string
}

export interface FindProveedorByRFCResult {
  id: string
  nombre: string
  rfc: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  activo: boolean
  creado_en: Date
  actualizado_en: Date
}