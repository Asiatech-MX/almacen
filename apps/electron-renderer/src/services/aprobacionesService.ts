import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import notificacionesService from './notificacionesService'
import {
  TipoAprobacion,
  EstadoAprobacion,
  NivelUrgencia
} from '@/types/aprobaciones'
import type {
  Aprobacion,
  CreateAprobacionData,
  AprobacionFilters,
  ReglaAprobacion,
  NotificacionAprobacion
} from '@/types/aprobaciones'

class AprobacionesService {
  // Simulación de datos - en producción esto se conectaría a la API real
  private mockAprobaciones: Aprobacion[] = [
    {
      id: '1',
      tipo: TipoAprobacion.COMPRA,
      titulo: 'Compra de materiales de oficina',
      descripcion: 'Se necesita autorización para compra de papelería y útiles por valor de $5,000',
      solicitante_id: 'user1',
      solicitante_nombre: 'Juan Pérez',
      monto: 5000,
      nivel_urgencia: NivelUrgencia.MEDIO,
      estado: EstadoAprobacion.PENDIENTE,
      aprobadores: [
        {
          id: 'approver1',
          nombre: 'María González',
          email: 'maria.gonzalez@empresa.com',
          rol: 'Gerente Administrativo',
          departamento: 'Administración',
          nivel_aprobacion: 1,
          ha_aprobado: false,
          es_requerido: true
        }
      ],
      fecha_solicitud: new Date('2024-11-15T10:00:00'),
      institucion_id: 'inst1'
    },
    {
      id: '2',
      tipo: TipoAprobacion.MOVIMIENTO,
      titulo: 'Salida de material crítico',
      descripcion: 'Autorización para salida de 100 unidades de componente X para producción urgente',
      solicitante_id: 'user2',
      solicitante_nombre: 'Ana López',
      monto: 15000,
      nivel_urgencia: NivelUrgencia.ALTO,
      estado: EstadoAprobacion.APROBADO,
      aprobadores: [
        {
          id: 'approver2',
          nombre: 'Carlos Rodríguez',
          email: 'carlos.rodriguez@empresa.com',
          rol: 'Jefe de Producción',
          departamento: 'Producción',
          nivel_aprobacion: 1,
          ha_aprobado: true,
          fecha_aprobacion: new Date('2024-11-15T14:30:00'),
          es_requerido: true
        }
      ],
      fecha_solicitud: new Date('2024-11-15T09:00:00'),
      fecha_resolucion: new Date('2024-11-15T14:30:00'),
      institucion_id: 'inst1'
    }
  ]

  private mockReglas: ReglaAprobacion[] = [
    {
      id: 'regla1',
      tipo: TipoAprobacion.COMPRA,
      monto_minimo: 1000,
      monto_maximo: 10000,
      nivel_aprobacion_requerido: 1,
      aprobadores_requeridos: ['approver1'],
      departamentos_autorizados: ['Administración', 'Compras'],
      tiempo_maximo_aprobacion_horas: 48,
      escalado_automatico: true,
      activo: true,
      institucion_id: 'inst1'
    },
    {
      id: 'regla2',
      tipo: TipoAprobacion.COMPRA,
      monto_minimo: 10000,
      monto_maximo: 50000,
      nivel_aprobacion_requerido: 2,
      aprobadores_requeridos: ['approver1', 'approver3'],
      departamentos_autorizados: ['Administración', 'Compras', 'Dirección'],
      tiempo_maximo_aprobacion_horas: 72,
      escalado_automatico: true,
      activo: true,
      institucion_id: 'inst1'
    }
  ]

  async listar(filters?: AprobacionFilters): Promise<Aprobacion[]> {
    try {
      // Simulación de delay de red
      await new Promise(resolve => setTimeout(resolve, 300))

      let filtered = [...this.mockAprobaciones]

      if (filters) {
        if (filters.tipo) {
          filtered = filtered.filter(a => a.tipo === filters.tipo)
        }
        if (filters.estado) {
          filtered = filtered.filter(a => a.estado === filters.estado)
        }
        if (filters.nivel_urgencia) {
          filtered = filtered.filter(a => a.nivel_urgencia === filters.nivel_urgencia)
        }
        if (filters.solicitante_id) {
          filtered = filtered.filter(a => a.solicitante_id === filters.solicitante_id)
        }
        if (filters.solo_mis_pendientes) {
          // En un caso real, esto filtraría por el usuario actual
          filtered = filtered.filter(a => a.estado === EstadoAprobacion.PENDIENTE)
        }
      }

      return filtered.sort((a, b) => b.fecha_solicitud.getTime() - a.fecha_solicitud.getTime())
    } catch (error) {
      console.error('Error al listar aprobaciones:', error)
      throw new Error('No se pudieron cargar las aprobaciones')
    }
  }

  async crear(data: CreateAprobacionData): Promise<Aprobacion> {
    try {
      // Simulación de delay de red
      await new Promise(resolve => setTimeout(resolve, 500))

      const nuevaAprobacion: Aprobacion = {
        id: Date.now().toString(),
        ...data,
        solicitante_id: 'user1', // En un caso real, sería el usuario autenticado
        solicitante_nombre: 'Usuario Actual', // En un caso real, sería el nombre del usuario
        estado: EstadoAprobacion.PENDIENTE,
        aprobadores: this.determinarAprobadores(data.tipo, data.monto || 0),
        fecha_solicitud: new Date(),
        institucion_id: 'inst1'
      }

      this.mockAprobaciones.unshift(nuevaAprobacion)

      // Enviar notificaciones automáticas
      notificacionesService.enviarNotificacionNuevaAprobacion(nuevaAprobacion)

      return nuevaAprobacion
    } catch (error) {
      console.error('Error al crear aprobación:', error)
      throw new Error('No se pudo crear la aprobación')
    }
  }

  async aprobar(id: string, comentarios?: string): Promise<Aprobacion> {
    try {
      await new Promise(resolve => setTimeout(resolve, 400))

      const aprobacion = this.mockAprobaciones.find(a => a.id === id)
      if (!aprobacion) {
        throw new Error('Aprobación no encontrada')
      }

      // Simular aprobación del primer aprobador requerido
      const aprobadorPendiente = aprobacion.aprobadores.find(a => a.es_requerido && !a.ha_aprobado)
      if (aprobadorPendiente) {
        aprobadorPendiente.ha_aprobado = true
        aprobadorPendiente.fecha_aprobacion = new Date()
        aprobadorPendiente.comentarios = comentarios
      }

      // Verificar si todos los aprobadores requeridos han aprobado
      const todosAprobados = aprobacion.aprobadores
        .filter(a => a.es_requerido)
        .every(a => a.ha_aprobado)

      if (todosAprobados) {
        aprobacion.estado = EstadoAprobacion.APROBADO
        aprobacion.fecha_resolucion = new Date()
        aprobacion.comentarios_resolucion = comentarios

        // Enviar notificación de aprobación
        notificacionesService.enviarNotificacionAprobada(aprobacion)
      }

      return aprobacion
    } catch (error) {
      console.error('Error al aprobar solicitud:', error)
      throw new Error('No se pudo aprobar la solicitud')
    }
  }

  async rechazar(id: string, comentarios: string): Promise<Aprobacion> {
    try {
      await new Promise(resolve => setTimeout(resolve, 400))

      const aprobacion = this.mockAprobaciones.find(a => a.id === id)
      if (!aprobacion) {
        throw new Error('Aprobación no encontrada')
      }

      aprobacion.estado = EstadoAprobacion.RECHAZADO
      aprobacion.fecha_resolucion = new Date()
      aprobacion.comentarios_resolucion = comentarios

      // Enviar notificación de rechazo
      notificacionesService.enviarNotificacionRechazada(aprobacion)

      return aprobacion
    } catch (error) {
      console.error('Error al rechazar solicitud:', error)
      throw new Error('No se pudo rechazar la solicitud')
    }
  }

  async obtenerReglas(): Promise<ReglaAprobacion[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      return this.mockReglas.filter(r => r.activo)
    } catch (error) {
      console.error('Error al obtener reglas:', error)
      throw new Error('No se pudieron cargar las reglas de aprobación')
    }
  }

  private determinarAprobadores(tipo: TipoAprobacion, monto: number): any[] {
    const regla = this.mockReglas.find(r =>
      r.tipo === tipo &&
      r.activo &&
      (!r.monto_minimo || monto >= r.monto_minimo) &&
      (!r.monto_maximo || monto <= r.monto_maximo)
    )

    if (!regla) {
      return []
    }

    // Simular obtención de datos de aprobadores
    return regla.aprobadores_requeridos.map(id => ({
      id,
      nombre: `Aprobador ${id}`,
      email: `${id}@empresa.com`,
      rol: 'Aprobador',
      departamento: 'Administración',
      nivel_aprobacion: 1,
      ha_aprobado: false,
      es_requerido: true
    }))
  }

  private enviarNotificacionesAutomaticas(aprobacion: Aprobacion): void {
    console.log('Enviando notificaciones automáticas para aprobación:', aprobacion.id)
    // En un caso real, esto enviaría correos/e-mails a los aprobadores
  }
}

// Instancia del servicio
const aprobacionesService = new AprobacionesService()

// Hooks para React Query
export const useAprobacionesList = (filters?: AprobacionFilters, options?: Partial<UseQueryOptions<Aprobacion[]>>) => {
  return useQuery({
    queryKey: ['aprobaciones', filters],
    queryFn: () => aprobacionesService.listar(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    ...options
  })
}

export const useAprobacion = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['aprobacion', id],
    queryFn: () => aprobacionesService.listar().then(aprobaciones =>
      aprobaciones.find(a => a.id === id)
    ).then(aprobacion => {
      if (!aprobacion) {
        throw new Error('Aprobación no encontrada')
      }
      return aprobacion
    }),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

export const useCrearAprobacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAprobacionData) => aprobacionesService.crear(data),
    onSuccess: (aprobacion) => {
      toast.success(`Solicitud "${aprobacion.titulo}" creada exitosamente`)
      queryClient.invalidateQueries({ queryKey: ['aprobaciones'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error al crear la aprobación')
    }
  })
}

export const useAprobarSolicitud = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, comentarios }: { id: string; comentarios?: string }) =>
      aprobacionesService.aprobar(id, comentarios),
    onSuccess: (aprobacion) => {
      toast.success(`Solicitud "${aprobacion.titulo}" aprobada exitosamente`)
      queryClient.invalidateQueries({ queryKey: ['aprobaciones'] })
      queryClient.invalidateQueries({ queryKey: ['aprobacion', aprobacion.id] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error al aprobar la solicitud')
    }
  })
}

export const useRechazarSolicitud = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, comentarios }: { id: string; comentarios: string }) =>
      aprobacionesService.rechazar(id, comentarios),
    onSuccess: (aprobacion) => {
      toast.success(`Solicitud "${aprobacion.titulo}" rechazada`)
      queryClient.invalidateQueries({ queryKey: ['aprobaciones'] })
      queryClient.invalidateQueries({ queryKey: ['aprobacion', aprobacion.id] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error al rechazar la solicitud')
    }
  })
}

export const useAprobacionesReglas = () => {
  return useQuery({
    queryKey: ['aprobaciones-reglas'],
    queryFn: () => aprobacionesService.obtenerReglas(),
    staleTime: 30 * 60 * 1000, // 30 minutos
  })
}

export default aprobacionesService