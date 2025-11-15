export interface FindAllMateriaPrimaParams {
  // No parameters for this query
}

export interface FindAllMateriaPrimaResult {
  id: string
  codigo_barras: string
  nombre: string
  marca: string | null
  modelo: string | null
  presentacion: string
  stock_actual: number
  stock_minimo: number
  costo_unitario: number | null
  fecha_caducidad: Date | null
  imagen_url: string | null
  descripcion: string | null
  categoria: string | null
  proveedor_id: string | null
  proveedor_nombre: string | null
  proveedor_rfc: string | null
  creado_en: Date
  actualizado_en: Date
}

export interface FindMateriaPrimaByIdParams {
  id: string
}

export interface FindMateriaPrimaByIdResult {
  id: string
  codigo_barras: string
  nombre: string
  marca: string | null
  modelo: string | null
  presentacion: string
  stock_actual: number
  stock_minimo: number
  costo_unitario: number | null
  fecha_caducidad: Date | null
  imagen_url: string | null
  descripcion: string | null
  categoria: string | null
  proveedor_id: string | null
  activo: boolean
  creado_en: Date
  actualizado_en: Date
  eliminado_en: Date | null
  proveedor_nombre: string | null
  proveedor_rfc: string | null
  proveedor_telefono: string | null
  proveedor_email: string | null
}

export interface FindMateriaPrimaByCodigoBarrasParams {
  codigoBarras: string
}

export interface FindMateriaPrimaByCodigoBarrasResult {
  id: string
  codigo_barras: string
  nombre: string
  marca: string | null
  modelo: string | null
  presentacion: string
  stock_actual: number
  stock_minimo: number
  costo_unitario: number | null
  fecha_caducidad: Date | null
  imagen_url: string | null
  descripcion: string | null
  categoria: string | null
  proveedor_id: string | null
  activo: boolean
  creado_en: Date
  actualizado_en: Date
  eliminado_en: Date | null
}

export interface SearchMateriaPrimaParams {
  searchTerm: string
  limit: number
}

export interface SearchMateriaPrimaResult {
  id: string
  codigo_barras: string
  nombre: string
  marca: string | null
  presentacion: string
  stock_actual: number
  stock_minimo: number
  categoria: string | null
  imagen_url: string | null
  costo_unitario: number | null
}

export interface FindLowStockItemsParams {
  // No parameters for this query
}

export interface FindLowStockItemsResult {
  id: string
  codigo_barras: string
  nombre: string
  marca: string | null
  presentacion: string
  stock_actual: number
  stock_minimo: number
  categoria: string | null
  stock_ratio: number | null
}

export interface CheckStockDisponibleParams {
  id: string
  cantidad: number
}

export interface CheckStockDisponibleResult {
  disponible: boolean
  stock_actual: number
  stock_minimo: number
  stock_restante: number | null
}

export interface FindMateriaPrimaByCategoriaParams {
  categoria: string
}

export interface FindMateriaPrimaByCategoriaResult {
  id: string
  codigo_barras: string
  nombre: string
  marca: string | null
  presentacion: string
  stock_actual: number
  stock_minimo: number
  categoria: string | null
  imagen_url: string | null
}

export interface FindMateriaPrimaByProveedorParams {
  proveedorId: string
}

export interface FindMateriaPrimaByProveedorResult {
  id: string
  codigo_barras: string
  nombre: string
  marca: string | null
  presentacion: string
  stock_actual: number
  stock_minimo: number
  categoria: string | null
  proveedor_nombre: string | null
}

export interface GetMateriaPrimaStatsParams {
  // No parameters for this query
}

export interface GetMateriaPrimaStatsResult {
  total_materiales: number
  bajo_stock: number
  sin_stock: number
  valor_total_inventario: number
  con_categoria: number
}

export interface GetCategoriaStatsParams {
  // No parameters for this query
}

export interface GetCategoriaStatsResult {
  categoria: string | null
  cantidad: number
  valor_total: number
  bajo_stock: number
}

export interface FindMateriaPrimaParaActualizarParams {
  id: string
}

export interface FindMateriaPrimaParaActualizarResult {
  id: string
  stock_actual: number
  actualizado_en: Date
}

export interface GetAuditTrailParams {
  materiaPrimaId: string
  limit: number
}

export interface GetAuditTrailResult {
  id: string
  accion: string
  datos_anteriores: any | null
  datos_nuevos: any | null
  usuario_id: string | null
  fecha: Date
  usuario_nombre: string | null
}