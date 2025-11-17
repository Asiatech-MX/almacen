import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import AprobacionesTable from '@/components/tables/AprobacionesTable'
import AprobacionForm from '@/components/forms/AprobacionForm'
import { useAprobacionesList } from '@/services/aprobacionesService'
import type { Aprobacion, TipoAprobacion, EstadoAprobacion, NivelUrgencia } from '@/types/aprobaciones'
import {
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  TrendingUp,
  Users
} from 'lucide-react'

const AprobacionesPage: React.FC = () => {
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState({
    tipo: undefined as TipoAprobacion | undefined,
    estado: undefined as EstadoAprobacion | undefined,
    solo_mis_pendientes: false
  })

  // Queries para diferentes vistas
  const { data: todasAprobaciones = [], isLoading: isLoadingAll } = useAprobacionesList()
  const { data: misPendientes = [], isLoading: isLoadingPendientes } = useAprobacionesList({
    solo_mis_pendientes: true
  })

  // Estadísticas
  const totalPendientes = todasAprobaciones.filter(a => a.estado === 'pendiente').length
  const totalAprobadas = todasAprobaciones.filter(a => a.estado === 'aprobado').length
  const totalRechazadas = todasAprobaciones.filter(a => a.estado === 'rechazado').length
  const urgentesCriticos = todasAprobaciones.filter(
    a => a.estado === 'pendiente' && (a.nivel_urgencia === 'alto' || a.nivel_urgencia === 'critico')
  ).length

  const handleFilterChange = (key: string, value: any) => {
    setSelectedFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }))
  }

  const handleClearFilters = () => {
    setSelectedFilters({
      tipo: undefined,
      estado: undefined,
      solo_mis_pendientes: false
    })
  }

  const getEstadoStats = () => [
    {
      title: 'Pendientes',
      value: totalPendientes,
      description: 'Esperando aprobación',
      icon: <Clock className="w-4 h-4" />,
      variant: 'secondary' as const,
      color: 'text-yellow-600'
    },
    {
      title: 'Aprobadas',
      value: totalAprobadas,
      description: 'Autorizadas exitosamente',
      icon: <CheckCircle className="w-4 h-4" />,
      variant: 'default' as const,
      color: 'text-green-600'
    },
    {
      title: 'Rechazadas',
      value: totalRechazadas,
      description: 'No autorizadas',
      icon: <XCircle className="w-4 h-4" />,
      variant: 'destructive' as const,
      color: 'text-red-600'
    },
    {
      title: 'Urgentes/Críticos',
      value: urgentesCriticos,
      description: 'Requieren atención inmediata',
      icon: <AlertTriangle className="w-4 h-4" />,
      variant: 'outline' as const,
      color: 'text-orange-600'
    }
  ]

  const handleVerDetalle = (aprobacion: Aprobacion) => {
    // Aquí podríamos abrir un diálogo con los detalles completos
    console.log('Ver detalles:', aprobacion)
    // TODO: Implementar diálogo de detalles
  }

  const handleFormSuccess = () => {
    setShowNewForm(false)
  }

  const hasActiveFilters = selectedFilters.tipo || selectedFilters.estado || selectedFilters.solo_mis_pendientes

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aprobaciones</h1>
          <p className="text-muted-foreground">
            Gestión de solicitudes de aprobación automatizadas
          </p>
        </div>
        <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Solicitud de Aprobación</DialogTitle>
              <DialogDescription>
                Complete el formulario para solicitar una aprobación según las políticas establecidas
              </DialogDescription>
            </DialogHeader>
            <AprobacionForm onSuccess={handleFormSuccess} onCancel={() => setShowNewForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {getEstadoStats().map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <Select
                value={selectedFilters.tipo || 'all'}
                onValueChange={(value) => handleFilterChange('tipo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="compra">Compra</SelectItem>
                  <SelectItem value="movimiento">Movimiento</SelectItem>
                  <SelectItem value="ajuste_inventario">Ajuste de Inventario</SelectItem>
                  <SelectItem value="eliminacion">Eliminación</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select
                value={selectedFilters.estado || 'all'}
                onValueChange={(value) => handleFilterChange('estado', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Vista rápida</label>
              <Select
                value={selectedFilters.solo_mis_pendientes ? 'mis_pendientes' : 'all'}
                onValueChange={(value) => handleFilterChange('solo_mis_pendientes', value === 'mis_pendientes')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las aprobaciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las aprobaciones</SelectItem>
                  <SelectItem value="mis_pendientes">Mis pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedFilters.tipo && (
                <Badge variant="secondary">
                  Tipo: {selectedFilters.tipo}
                </Badge>
              )}
              {selectedFilters.estado && (
                <Badge variant="secondary">
                  Estado: {selectedFilters.estado}
                </Badge>
              )}
              {selectedFilters.solo_mis_pendientes && (
                <Badge variant="secondary">
                  Mis pendientes
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs de diferentes vistas */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vista General
          </TabsTrigger>
          <TabsTrigger value="pendientes" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Mis Pendientes ({misPendientes.length})
          </TabsTrigger>
          <TabsTrigger value="estadisticas" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Tab de Vista General */}
        <TabsContent value="general" className="space-y-4">
          <AprobacionesTable
            filtros={selectedFilters}
            onVerDetalle={handleVerDetalle}
          />
        </TabsContent>

        {/* Tab de Mis Pendientes */}
        <TabsContent value="pendientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Mis Solicitudes Pendientes
              </CardTitle>
              <CardDescription>
                Solicitudes que requieren su aprobación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AprobacionesTable
                filtros={{ solo_mis_pendientes: true }}
                onVerDetalle={handleVerDetalle}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Estadísticas */}
        <TabsContent value="estadisticas" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resumen General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total de solicitudes</span>
                    <Badge variant="outline">{todasAprobaciones.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tasa de aprobación</span>
                    <Badge variant="default">
                      {todasAprobaciones.length > 0
                        ? Math.round((totalAprobadas / todasAprobaciones.length) * 100)
                        : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Solicitudes urgentes</span>
                    <Badge variant="destructive">{urgentesCriticos}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(['compra', 'movimiento', 'ajuste_inventario', 'eliminacion'] as TipoAprobacion[]).map(tipo => {
                    const count = todasAprobaciones.filter(a => a.tipo === tipo).length
                    return (
                      <div key={tipo} className="flex justify-between items-center">
                        <span className="capitalize">{tipo.replace('_', ' ')}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AprobacionesPage