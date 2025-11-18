import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import notificacionesService from '@/services/notificacionesService'
import type { NotificacionAprobacion } from '@/types/aprobaciones'
import {
  Bell,
  BellRing,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Settings,
  Trash2
} from 'lucide-react'

interface NotificacionesPanelProps {
  className?: string
}

const NotificacionesPanel: React.FC<NotificacionesPanelProps> = ({ className }) => {
  const [notificaciones, setNotificaciones] = useState<NotificacionAprobacion[]>([])
  const [noLeidasCount, setNoLeidasCount] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    noLeidas: 0,
    porTipo: {} as Record<string, number>,
    recientes: 0
  })
  const [isOpen, setIsOpen] = useState(false)

  // Simular usuario actual
  const usuarioId = 'approver1' // En un caso real, vendría del contexto de autenticación

  useEffect(() => {
    cargarNotificaciones()
    cargarEstadisticas()

    // Inicializar revisión periódica
    notificacionesService.iniciarRevisionPeriodica()

    // Configurar intervalo de actualización
    const interval = setInterval(() => {
      cargarNotificaciones()
      cargarEstadisticas()
    }, 30000) // Cada 30 segundos

    return () => clearInterval(interval)
  }, [])

  const cargarNotificaciones = async () => {
    try {
      const data = await notificacionesService.getNotificacionesUsuario(usuarioId)
      const noLeidas = await notificacionesService.getNotificacionesUsuario(usuarioId, true)

      setNotificaciones(data)
      setNoLeidasCount(noLeidas.length)
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
    }
  }

  const cargarEstadisticas = async () => {
    try {
      const data = await notificacionesService.getEstadisticasNotificaciones(usuarioId)
      setStats(data)
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    }
  }

  const marcarComoLeida = async (notificacionId: string) => {
    try {
      await notificacionesService.marcarComoLeidas([notificacionId])
      cargarNotificaciones()
      cargarEstadisticas()
    } catch (error) {
      console.error('Error al marcar como leída:', error)
    }
  }

  const marcarTodasComoLeidas = async () => {
    try {
      const noLeidasIds = notificaciones.filter(n => !n.leida).map(n => n.id)
      if (noLeidasIds.length > 0) {
        await notificacionesService.marcarComoLeidas(noLeidasIds)
        cargarNotificaciones()
        cargarEstadisticas()
      }
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error)
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'SOLICITUD_NUEVA':
        return <Bell className="size-4 text-blue-500" />
      case 'RECORDATORIO':
        return <Clock className="size-4 text-yellow-500" />
      case 'ESCALADO':
        return <AlertTriangle className="size-4 text-red-500" />
      case 'RESUELTA':
        return <CheckCircle className="size-4 text-green-500" />
      default:
        return <Bell className="size-4 text-gray-500" />
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'SOLICITUD_NUEVA':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'RECORDATORIO':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'ESCALADO':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'RESUELTA':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const formatearFecha = (fecha: Date) => {
    const ahora = new Date()
    const diffMinutos = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60))

    if (diffMinutos < 1) {
      return 'Ahora mismo'
    } else if (diffMinutos < 60) {
      return `Hace ${diffMinutos} min`
    } else if (diffMinutos < 24 * 60) {
      const horas = Math.floor(diffMinutos / 60)
      return `Hace ${horas}h`
    } else {
      return format(fecha, 'dd/MM HH:mm', { locale: es })
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {noLeidasCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {noLeidasCount > 99 ? '99+' : noLeidasCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        <DropdownMenuLabel className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5" />
            <span className="font-semibold">Notificaciones</span>
            {noLeidasCount > 0 && (
              <Badge variant="secondary">{noLeidasCount} no leídas</Badge>
            )}
          </div>

          {noLeidasCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={marcarTodasComoLeidas}
              className="text-xs"
            >
              Marcar todas como leídas
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <ScrollArea className="h-96">
          {notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-muted-foreground">No hay notificaciones</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Las notificaciones aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notificaciones.map((notificacion) => (
                <DropdownMenuItem
                  key={notificacion.id}
                  className={`p-3 cursor-pointer flex flex-col items-start rounded-lg ${
                    !notificacion.leida ? 'bg-muted' : ''
                  }`}
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="mt-0.5">
                      {getTipoIcon(notificacion.tipo)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getTipoColor(notificacion.tipo)}`}
                        >
                          {notificacion.tipo.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatearFecha(notificacion.fecha_envio)}
                        </span>
                      </div>

                      <h4 className="font-medium text-sm mb-1 line-clamp-1">
                        {notificacion.asunto}
                      </h4>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notificacion.mensaje}
                      </p>

                      {!notificacion.leida && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs text-blue-600">No leída</span>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => marcarComoLeida(notificacion.id)}
                            className="text-xs h-6 px-2 ml-auto"
                          >
                            Marcar como leída
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />

        <div className="p-2">
          <DropdownMenuItem className="p-2 cursor-pointer">
            <Settings className="size-4 mr-2" />
            Configurar notificaciones
          </DropdownMenuItem>

          <DropdownMenuItem className="p-2 cursor-pointer text-red-600">
            <Trash2 className="size-4 mr-2" />
            Limpiar todas las notificaciones
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificacionesPanel