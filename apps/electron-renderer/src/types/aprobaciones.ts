export enum TipoAprobacion {
  COMPRA = 'compra',
  MOVIMIENTO = 'movimiento',
  AJUSTE_INVENTARIO = 'ajuste_inventario',
  ELIMINACION = 'eliminacion'
}

export enum EstadoAprobacion {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  CANCELADO = 'cancelado'
}

export enum NivelUrgencia {
  BAJO = 'bajo',
  MEDIO = 'medio',
  ALTO = 'alto',
  CRITICO = 'critico'
}

export interface Aprobacion {
  id: string
  tipo: TipoAprobacion
  titulo: string
  descripcion: string
  solicitante_id: string
  solicitante_nombre: string
  monto?: number
  nivel_urgencia: NivelUrgencia
  estado: EstadoAprobacion
  datos_adicionales?: Record<string, any>
  aprobadores: Aprobador[]
  fecha_solicitud: Date
  fecha_limite?: Date
  fecha_resolucion?: Date
  comentarios_resolucion?: string
  institucion_id: string
}

export interface Aprobador {
  id: string
  nombre: string
  email: string
  rol: string
  departamento: string
  nivel_aprobacion: number
  ha_aprobado: boolean
  fecha_aprobacion?: Date
  comentarios?: string
  es_requerido: boolean
}

export interface ReglaAprobacion {
  id: string
  tipo: TipoAprobacion
  monto_minimo?: number
  monto_maximo?: number
  nivel_aprobacion_requerido: number
  aprobadores_requeridos: string[]
  departamentos_autorizados: string[]
  tiempo_maximo_aprobacion_horas: number
  escalado_automatico: boolean
  activo: boolean
  institucion_id: string
}

export interface NotificacionAprobacion {
  id: string
  aprobacion_id: string
  tipo: 'SOLICITUD_NUEVA' | 'RECORDATORIO' | 'ESCALADO' | 'RESUELTA'
  destinatario_id: string
  destinatario_email: string
  asunto: string
  mensaje: string
  fecha_envio: Date
  leida: boolean
  fecha_lectura?: Date
}

export interface CreateAprobacionData {
  tipo: TipoAprobacion
  titulo: string
  descripcion: string
  monto?: number
  nivel_urgencia: NivelUrgencia
  datos_adicionales?: Record<string, any>
  fecha_limite?: Date
  aprobadores_sugeridos?: string[]
}

export interface AprobacionFilters {
  tipo?: TipoAprobacion
  estado?: EstadoAprobacion
  nivel_urgencia?: NivelUrgencia
  solicitante_id?: string
  fecha_desde?: Date
  fecha_hasta?: Date
  solo_mis_pendientes?: boolean
}