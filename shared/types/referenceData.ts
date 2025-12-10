import type { Timestamp } from 'postgres'

/**
 * Interfaz base para Categoria del lado del frontend
 * Transformada de la interfaz de Kysely para facilitar su uso
 */
export interface Categoria {
  id: string
  nombre: string
  descripcion: string | null
  categoria_padre_id: string | null
  id_institucion: number
  nivel: number
  orden: number | null
  ruta_completa: string | null
  icono: string | null
  color: string | null
  activo: boolean
  creado_en: Timestamp | null
  actualizado_en: Timestamp | null
  es_predeterminado: boolean
}

/**
 * Interfaz para crear una nueva categoría
 */
export interface NewCategoria {
  nombre: string
  descripcion?: string | null
  categoria_padre_id?: string | null
  id_institucion: number
  nivel?: number
  orden?: number | null
  icono?: string | null
  color?: string | null
  activo?: boolean
  es_predeterminado?: boolean
}

/**
 * Interfaz para actualizar una categoría existente
 */
export interface CategoriaUpdate {
  nombre?: string
  descripcion?: string | null
  categoria_padre_id?: string | null
  nivel?: number
  orden?: number | null
  icono?: string | null
  color?: string | null
  activo?: boolean
  es_predeterminado?: boolean
}

/**
 * Interfaz para representar la estructura de árbol de categorías
 */
export interface CategoriaArbol {
  id: string
  nombre: string
  descripcion: string | null
  nivel: number
  orden: number | null
  icono: string | null
  color: string | null
  activo: boolean
  hijos?: CategoriaArbol[]
  ruta_completa: string | null
}

/**
 * Interfaz para operación de mover categoría de padre
 */
export interface OperacionMoverCategoria {
  id_categoria: string
  nuevo_padre_id: string | null
  usuario_id?: string
}

/**
 * Interfaz para operación de reordenar categorías
 */
export interface OperacionReordenarCategorias {
  reordenes: Array<{
    id_categoria: string
    nuevo_orden: number
  }>
  usuario_id?: string
}

// Tipos para Presentaciones

/**
 * Interfaz base para Presentacion del lado del frontend
 */
export interface Presentacion {
  id: string
  nombre: string
  descripcion: string | null
  abreviatura: string | null
  id_institucion: number
  activo: boolean
  es_predeterminado: boolean
  creado_en: Timestamp | null
  actualizado_en: Timestamp | null
}

/**
 * Interfaz para crear una nueva presentación
 */
export interface NewPresentacion {
  nombre: string
  descripcion?: string | null
  abreviatura?: string | null
  id_institucion: number
  activo?: boolean
  es_predeterminado?: boolean
}

/**
 * Interfaz para actualizar una presentación existente
 */
export interface PresentacionUpdate {
  nombre?: string
  descripcion?: string | null
  abreviatura?: string | null
  activo?: boolean
  es_predeterminado?: boolean
}