import { toast } from 'sonner'
import type { Aprobacion, NotificacionAprobacion, ReglaAprobacion } from '@/types/aprobaciones'

export interface NotificationConfig {
  enableToasts: boolean
  enableEmail: boolean // Simulado
  enableInApp: boolean
  reminderIntervals: number[] // Minutos antes del vencimiento
  escalationEnabled: boolean
}

class NotificacionesService {
  private config: NotificationConfig = {
    enableToasts: true,
    enableEmail: false, // Deshabilitado por ahora
    enableInApp: true,
    reminderIntervals: [60, 24 * 60, 72 * 60], // 1h, 1d, 3d antes
    escalationEnabled: true
  }

  // Simulación de base de datos de notificaciones
  private notificaciones: NotificacionAprobacion[] = []

  /**
   * Envía notificaciones automáticas cuando se crea una nueva aprobación
   */
  async enviarNotificacionNuevaAprobacion(aprobacion: Aprobacion): Promise<void> {
    if (!this.config.enableInApp && !this.config.enableToasts) return

    try {
      // Notificación toast para el solicitante
      if (this.config.enableToasts) {
        toast.success(`Solicitud "${aprobacion.titulo}" enviada para aprobación`, {
          description: `Se ha notificado a ${aprobacion.aprobadores.length} aprobador(es)`,
          duration: 5000
        })
      }

      // Crear notificaciones en la aplicación para cada aprobador
      if (this.config.enableInApp) {
        for (const aprobador of aprobacion.aprobadores.filter(a => a.es_requerido)) {
          const notificacion: NotificacionAprobacion = {
            id: `notif-${Date.now()}-${aprobador.id}`,
            aprobacion_id: aprobacion.id,
            tipo: 'SOLICITUD_NUEVA',
            destinatario_id: aprobador.id,
            destinatario_email: aprobador.email,
            asunto: `Nueva solicitud de aprobación: ${aprobacion.titulo}`,
            mensaje: `Tiene una nueva solicitud de ${aprobacion.tipo} pendiente de su aprobación.\n\n` +
                     `Título: ${aprobacion.titulo}\n` +
                     `Solicitante: ${aprobacion.solicitante_nombre}\n` +
                     `Urgencia: ${aprobacion.nivel_urgencia}\n` +
                     (aprobacion.monto ? `Monto: $${aprobacion.monto.toLocaleString('es-MX')}\n` : '') +
                     `Fecha: ${new Date(aprobacion.fecha_solicitud).toLocaleDateString('es-MX')}`,
            fecha_envio: new Date(),
            leida: false
          }

          this.notificaciones.push(notificacion)

          // Simular email (console log por ahora)
          if (this.config.enableEmail) {
            console.log(`Email enviado a ${aprobador.email}:`, {
              subject: notificacion.asunto,
              body: notificacion.mensaje
            })
          }
        }
      }

      // Programar recordatorios
      if (aprobacion.fecha_limite) {
        this.programarRecordatorios(aprobacion)
      }

    } catch (error) {
      console.error('Error al enviar notificación de nueva aprobación:', error)
    }
  }

  /**
   * Envía notificación de aprobación
   */
  async enviarNotificacionAprobada(aprobacion: Aprobacion): Promise<void> {
    try {
      if (this.config.enableToasts) {
        toast.success(`Solicitud "${aprobacion.titulo}" aprobada exitosamente`, {
          description: 'La solicitud ha sido autorizada',
          duration: 4000
        })
      }

      if (this.config.enableInApp) {
        // Notificar al solicitante
        const notificacion: NotificacionAprobacion = {
          id: `notif-resuelta-${Date.now()}-${aprobacion.solicitante_id}`,
          aprobacion_id: aprobacion.id,
          tipo: 'RESUELTA',
          destinatario_id: aprobacion.solicitante_id,
          destinatario_email: '', // No tenemos email del solicitante
          asunto: `Solicitud aprobada: ${aprobacion.titulo}`,
          mensaje: `Su solicitud de ${aprobacion.tipo} ha sido aprobada exitosamente.\n\n` +
                   `Título: ${aprobacion.titulo}\n` +
                   `Fecha de resolución: ${new Date().toLocaleDateString('es-MX')}\n` +
                   (aprobacion.comentarios_resolucion ? `Comentarios: ${aprobacion.comentarios_resolucion}` : ''),
          fecha_envio: new Date(),
          leida: false
        }

        this.notificaciones.push(notificacion)
      }
    } catch (error) {
      console.error('Error al enviar notificación de aprobación:', error)
    }
  }

  /**
   * Envía notificación de rechazo
   */
  async enviarNotificacionRechazada(aprobacion: Aprobacion): Promise<void> {
    try {
      if (this.config.enableToasts) {
        toast.error(`Solicitud "${aprobacion.titulo}" rechazada`, {
          description: 'La solicitud no ha sido autorizada',
          duration: 4000
        })
      }

      if (this.config.enableInApp) {
        // Notificar al solicitante
        const notificacion: NotificacionAprobacion = {
          id: `notif-resuelta-${Date.now()}-${aprobacion.solicitante_id}`,
          aprobacion_id: aprobacion.id,
          tipo: 'RESUELTA',
          destinatario_id: aprobacion.solicitante_id,
          destinatario_email: '',
          asunto: `Solicitud rechazada: ${aprobacion.titulo}`,
          mensaje: `Su solicitud de ${aprobacion.tipo} ha sido rechazada.\n\n` +
                   `Título: ${aprobacion.titulo}\n` +
                   `Fecha de resolución: ${new Date().toLocaleDateString('es-MX')}\n` +
                   `Motivo: ${aprobacion.comentarios_resolucion || 'No especificado'}`,
          fecha_envio: new Date(),
          leida: false
        }

        this.notificaciones.push(notificacion)
      }
    } catch (error) {
      console.error('Error al enviar notificación de rechazo:', error)
    }
  }

  /**
   * Programa recordatorios automáticos
   */
  private async programarRecordatorios(aprobacion: Aprobacion): Promise<void> {
    if (!aprobacion.fecha_limite) return

    const ahora = new Date()
    const fechaLimite = new Date(aprobacion.fecha_limite)

    for (const minutosAntes of this.config.reminderIntervals) {
      const fechaRecordatorio = new Date(fechaLimite.getTime() - minutosAntes * 60 * 1000)

      if (fechaRecordatorio > ahora) {
        const tiempoHastaRecordatorio = fechaRecordatorio.getTime() - ahora.getTime()

        setTimeout(() => {
          this.enviarRecordatorio(aprobacion, minutosAntes)
        }, tiempoHastaRecordatorio)
      }
    }

    // Escalado automático si está habilitado
    if (this.config.escalacionEnabled) {
      const tiempoEscalado = fechaLimite.getTime() - (2 * 60 * 60 * 1000) // 2 horas antes
      if (tiempoEscalado > ahora) {
        setTimeout(() => {
          this.escalarAprobacion(aprobacion)
        }, tiempoEscalado - ahora.getTime())
      }
    }
  }

  /**
   * Envía recordatorio de aprobación pendiente
   */
  private async enviarRecordatorio(aprobacion: Aprobacion, minutosAntes: number): Promise<void> {
    try {
      const tiempoFormateado = this.formatearTiempoRestante(minutosAntes)

      for (const aprobador of aprobacion.aprobadores.filter(a => a.es_requerido && !a.ha_aprobado)) {
        if (this.config.enableToasts) {
          toast.warning(`Recordatorio: ${aprobacion.titulo}`, {
            description: `Queda ${tiempoFormateado} para el vencimiento`,
            duration: 6000
          })
        }

        if (this.config.enableInApp) {
          const notificacion: NotificacionAprobacion = {
            id: `notif-recordatorio-${Date.now()}-${aprobador.id}`,
            aprobacion_id: aprobacion.id,
            tipo: 'RECORDATORIO',
            destinatario_id: aprobador.id,
            destinatario_email: aprobador.email,
            asunto: `Recordatorio: ${aprobacion.titulo}`,
            mensaje: `Recordatorio de solicitud pendiente de aprobación.\n\n` +
                     `Queda ${tiempoFormateado} para el vencimiento.\n\n` +
                     `Título: ${aprobacion.titulo}\n` +
                     `Urgencia: ${aprobacion.nivel_urgencia}\n` +
                     `Fecha límite: ${aprobacion.fecha_limite?.toLocaleDateString('es-MX')}`,
            fecha_envio: new Date(),
            leida: false
          }

          this.notificaciones.push(notificacion)
        }
      }
    } catch (error) {
      console.error('Error al enviar recordatorio:', error)
    }
  }

  /**
   * Escala una aprobación a niveles superiores
   */
  private async escalarAprobacion(aprobacion: Aprobacion): Promise<void> {
    try {
      if (this.config.enableToasts) {
        toast.error(`Escalado: ${aprobacion.titulo}`, {
          description: 'La solicitud ha sido escalada por falta de respuesta',
          duration: 8000
        })
      }

      if (this.config.enableInApp) {
        // Notificar a administradores sobre el escalado
        const notificacion: NotificacionAprobacion = {
          id: `notif-escalado-${Date.now()}`,
          aprobacion_id: aprobacion.id,
          tipo: 'ESCALADO',
          destinatario_id: 'admin',
          destinatario_email: 'admin@empresa.com',
          asunto: `Solicitud escalada: ${aprobacion.titulo}`,
          mensaje: `La solicitud de aprobación ha sido escalada por falta de respuesta.\n\n` +
                   `Título: ${aprobacion.titulo}\n` +
                   `Solicitante: ${aprobacion.solicitante_nombre}\n` +
                   `Fecha límite: ${aprobacion.fecha_limite?.toLocaleDateString('es-MX')}\n` +
                   `Aprobadores pendientes: ${aprobacion.aprobadores.filter(a => a.es_requerido && !a.ha_aprobado).length}`,
          fecha_envio: new Date(),
          leida: false
        }

        this.notificaciones.push(notificacion)
      }
    } catch (error) {
      console.error('Error al escalar aprobación:', error)
    }
  }

  /**
   * Obtiene notificaciones para un usuario específico
   */
  async getNotificacionesUsuario(usuarioId: string, soloNoLeidas = false): Promise<NotificacionAprobacion[]> {
    let notificaciones = this.notificaciones.filter(n => n.destinatario_id === usuarioId)

    if (soloNoLeidas) {
      notificaciones = notificaciones.filter(n => !n.leida)
    }

    return notificaciones.sort((a, b) => b.fecha_envio.getTime() - a.fecha_envio.getTime())
  }

  /**
   * Marca notificaciones como leídas
   */
  async marcarComoLeidas(notificacionIds: string[]): Promise<void> {
    for (const id of notificacionIds) {
      const notificacion = this.notificaciones.find(n => n.id === id)
      if (notificacion) {
        notificacion.leida = true
        notificacion.fecha_lectura = new Date()
      }
    }
  }

  /**
   * Obtiene estadísticas de notificaciones
   */
  async getEstadisticasNotificaciones(usuarioId?: string): Promise<{
    total: number
    noLeidas: number
    porTipo: Record<string, number>
    recientes: number
  }> {
    let notificaciones = this.notificaciones

    if (usuarioId) {
      notificaciones = notificaciones.filter(n => n.destinatario_id === usuarioId)
    }

    const stats = {
      total: notificaciones.length,
      noLeidas: notificaciones.filter(n => !n.leida).length,
      porTipo: notificaciones.reduce((acc, n) => {
        acc[n.tipo] = (acc[n.tipo] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recientes: notificaciones.filter(n => {
        const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return n.fecha_envio > hace24Horas
      }).length
    }

    return stats
  }

  /**
   * Configura las preferencias de notificación
   */
  configurarNotificaciones(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Obtiene la configuración actual
   */
  getConfiguracion(): NotificationConfig {
    return { ...this.config }
  }

  /**
   * Formatea el tiempo restante de manera legible
   */
  private formatearTiempoRestante(minutos: number): string {
    if (minutos < 60) {
      return `${minutos} minuto(s)`
    } else if (minutos < 24 * 60) {
      const horas = Math.floor(minutos / 60)
      return `${horas} hora(s)`
    } else {
      const dias = Math.floor(minutos / (24 * 60))
      return `${dias} día(s)`
    }
  }

  /**
   * Inicializa el proceso de revisión periódica de aprobaciones
   */
  iniciarRevisionPeriodica(): void {
    // Revisar cada 5 minutos si hay aprobaciones por vencer
    setInterval(async () => {
      await this.revisarAprobacionesPorVencer()
    }, 5 * 60 * 1000)
  }

  /**
   * Revisa aprobaciones que están por vencer
   */
  private async revisarAprobacionesPorVencer(): Promise<void> {
    // Esta función se conectará con el servicio de aprobaciones
    // para obtener la lista de aprobaciones pendientes y revisar vencimientos
    // Por ahora es un placeholder
    console.log('Revisando aprobaciones por vencer...')
  }
}

// Instancia global del servicio
const notificacionesService = new NotificacionesService()

export default notificacionesService