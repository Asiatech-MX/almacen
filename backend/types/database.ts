// Interfaz principal de la base de datos para Kysely
export interface Database {
  // Tabla materia_prima
  materia_prima: {
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

  // Tabla proveedores
  proveedores: {
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

  // Tabla de auditoría
  materia_prima_auditoria: {
    id: string
    materia_prima_id: string
    accion: string
    datos_anteriores: any | null
    datos_nuevos: any | null
    usuario_id: string | null
    fecha: Date
  }
}