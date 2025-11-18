import React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import InventoryDashboard from '../../components/dashboard/InventoryDashboard'
import WarehouseTabs from '../../components/dashboard/WarehouseTabs'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  BarChart3,
  TrendingUp,
  Package,
  AlertTriangle,
  Activity,
  Eye,
  ArrowRight,
  Loader2
} from 'lucide-react'
import {
  useMateriaPrimaList,
  useMateriaPrimaEstadisticas,
  useRefreshMateriaPrima
} from '../../hooks/useMateriaPrimaQuery'
import type { MateriaPrima } from '../../../../shared/types/materiaPrima'

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()

  // Usar React Query hooks
  const { data: materials = [], isLoading, error, refetch } = useMateriaPrimaList()
  const { data: estadisticas, isLoading: isLoadingEstadisticas } = useMateriaPrimaEstadisticas()
  const { refreshAll } = useRefreshMateriaPrima()

  const handleRefresh = () => {
    refreshAll()
  }

  const handleNewMaterial = () => {
    navigate('/materia-prima/nueva')
  }

  const handleNewMovement = () => {
    navigate('/movimientos')
  }

  const handleNewRequest = () => {
    navigate('/solicitudes')
  }

  const handleViewAllMaterials = () => {
    navigate('/materia-prima/gestion')
  }

  // Calcular estadísticas usando datos de React Query
  const totalMaterials = materials.length
  const lowStockItems = materials.filter(m => m.stock_actual <= m.stock_minimo).length
  const totalStock = materials.reduce((sum, m) => sum + m.stock_actual, 0)
  const outOfStockItems = materials.filter(m => m.stock_actual === 0).length

  if (isLoading || isLoadingEstadisticas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error al cargar datos</h3>
            <p className="text-muted-foreground mb-4">
              {error.message || 'Error desconocido al cargar los materiales'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Panel de control del sistema de gestión de almacén
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Última actualización: {new Date().toLocaleTimeString()}
          </Button>
          <Button onClick={handleRefresh} size="sm">
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Detalles
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Operaciones
          </TabsTrigger>
        </TabsList>

        {/* Tab de Resumen */}
        <TabsContent value="overview" className="space-y-6">
          <InventoryDashboard materials={materials} />

          {/* Tarjetas de estado rápido */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Materiales</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMaterials}</div>
                <p className="text-xs text-muted-foreground">
                  Tipos de materiales en inventario
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStock.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Unidades totales en almacén
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
                <p className="text-xs text-muted-foreground">
                  Materiales necesitan reabastecimiento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
                <p className="text-xs text-muted-foreground">
                  Materiales agotados
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Detalles */}
        <TabsContent value="details" className="space-y-6">
          <WarehouseTabs
            materials={materials}
            onNewMaterial={handleNewMaterial}
            onNewMovement={handleNewMovement}
            onNewRequest={handleNewRequest}
          />
        </TabsContent>

        {/* Tab de Operaciones */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleNewMaterial}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Nuevo Material
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Agregar un nuevo material al inventario
                </p>
                <Button className="w-full">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Crear Material
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleNewMovement}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Registro de Movimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Registrar entrada o salida de materiales
                </p>
                <Button className="w-full" variant="outline">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Registrar Movimiento
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewAllMaterials}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Ver Todos los Materiales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Acceso completo a la gestión de inventario
                </p>
                <Button className="w-full" variant="outline">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Ver Materiales
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Alertas críticas */}
          {(lowStockItems > 0 || outOfStockItems > 0) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas de Inventario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {outOfStockItems > 0 && (
                    <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
                      <span className="text-sm font-medium text-red-800">
                        {outOfStockItems} materiales sin stock
                      </span>
                      <Badge variant="destructive">Crítico</Badge>
                    </div>
                  )}
                  {lowStockItems > 0 && (
                    <div className="flex items-center justify-between p-3 bg-yellow-100 rounded-lg">
                      <span className="text-sm font-medium text-yellow-800">
                        {lowStockItems} materiales con stock bajo
                      </span>
                      <Badge variant="secondary">Advertencia</Badge>
                    </div>
                  )}
                  <div className="mt-3">
                    <Button size="sm" variant="outline">
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DashboardPage