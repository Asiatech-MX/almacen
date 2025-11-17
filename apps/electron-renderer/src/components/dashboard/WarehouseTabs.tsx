import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Package,
  Truck,
  FileText,
  Settings,
  Search,
  Plus,
  Download,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import type { MateriaPrima } from '../../../../shared/types/materiaPrima'

interface WarehouseTabsProps {
  materials: MateriaPrima[]
  onNewMaterial: () => void
  onNewMovement: () => void
  onNewRequest: () => void
}

// Tabla simplificada de materiales
const MaterialsTable: React.FC<{ materials: MateriaPrima[] }> = ({ materials }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredMaterials = materials.filter(material =>
    material.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.codigo_barras?.includes(searchTerm) ||
    material.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStockStatus = (material: MateriaPrima) => {
    if (material.stock_actual === 0) return { status: 'agotado', color: 'destructive' as const, icon: AlertTriangle }
    if (material.stock_actual <= material.stock_minimo) return { status: 'bajo', color: 'secondary' as const, icon: AlertTriangle }
    return { status: 'normal', color: 'default' as const, icon: CheckCircle }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar materiales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            aria-label="Buscar materiales"
          />
        </div>
        <Button onClick={() => console.log('Exportar')} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label="Lista de materiales">
            <thead className="bg-muted">
              <tr>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                  Código
                </th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                  Nombre
                </th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                  Categoría
                </th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                  Stock Actual
                </th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                  Stock Mínimo
                </th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center">
                    No se encontraron materiales
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((material) => {
                  const stockStatus = getStockStatus(material)
                  const Icon = stockStatus.icon

                  return (
                    <tr key={material.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 align-middle font-mono text-sm">
                        {material.codigo_barras || 'N/A'}
                      </td>
                      <td className="p-4 align-middle font-medium">
                        {material.nombre}
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline">{material.categoria}</Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <span className={`font-medium ${
                          material.stock_actual <= material.stock_minimo
                            ? 'text-destructive'
                            : 'text-foreground'
                        }`}>
                          {material.stock_actual}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {material.stock_minimo}
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant={stockStatus.color} className="flex items-center gap-1 w-fit">
                          <Icon className="h-3 w-3" />
                          {stockStatus.status}
                        </Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Componente de movimientos
const MovementsPanel: React.FC = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Movimientos Recientes
        </CardTitle>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Movimiento
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay movimientos recientes</p>
          <p className="text-sm">Los movimientos de entrada y salida aparecerán aquí</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de solicitudes
const RequestsPanel: React.FC = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Solicitudes de Compra
        </CardTitle>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Solicitud
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay solicitudes pendientes</p>
          <p className="text-sm">Las solicitudes de compra aparecerán aquí</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de configuración
const SettingsPanel: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración del Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="outline">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Parámetros de Inventario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Alertas de stock bajo</span>
                <Badge variant="secondary">Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Umbral de alerta</span>
                <Badge variant="outline">20%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card variant="outline">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Correos electrónicos</span>
                <Badge variant="secondary">Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Notificaciones en app</span>
                <Badge variant="secondary">Activo</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente principal de Tabs
export const WarehouseTabs: React.FC<WarehouseTabsProps> = ({
  materials,
  onNewMaterial,
  onNewMovement,
  onNewRequest
}) => {
  return (
    <Tabs defaultValue="materiales" className="w-full">
      <TabsList className="grid w-full grid-cols-4" role="tablist">
        <TabsTrigger
          value="materiales"
          className="flex items-center gap-2"
          role="tab"
          aria-selected="true"
        >
          <Package className="h-4 w-4" />
          Materiales
        </TabsTrigger>
        <TabsTrigger
          value="movimientos"
          className="flex items-center gap-2"
          role="tab"
        >
          <Truck className="h-4 w-4" />
          Movimientos
        </TabsTrigger>
        <TabsTrigger
          value="solicitudes"
          className="flex items-center gap-2"
          role="tab"
        >
          <FileText className="h-4 w-4" />
          Solicitudes
        </TabsTrigger>
        <TabsTrigger
          value="configuracion"
          className="flex items-center gap-2"
          role="tab"
        >
          <Settings className="h-4 w-4" />
          Configuración
        </TabsTrigger>
      </TabsList>

      <TabsContent value="materiales" className="space-y-4" role="tabpanel">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Gestión de Materiales</h3>
            <p className="text-sm text-muted-foreground">
              Administra el inventario de materiales del almacén
            </p>
          </div>
          <Button onClick={onNewMaterial}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Material
          </Button>
        </div>
        <MaterialsTable materials={materials} />
      </TabsContent>

      <TabsContent value="movimientos" className="space-y-4" role="tabpanel">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Movimientos de Almacén</h3>
            <p className="text-sm text-muted-foreground">
              Registro de entradas y salidas de materiales
            </p>
          </div>
          <Button onClick={onNewMovement}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Movimiento
          </Button>
        </div>
        <MovementsPanel />
      </TabsContent>

      <TabsContent value="solicitudes" className="space-y-4" role="tabpanel">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Solicitudes de Compra</h3>
            <p className="text-sm text-muted-foreground">
              Gestiona las solicitudes de compra de materiales
            </p>
          </div>
          <Button onClick={onNewRequest}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Solicitud
          </Button>
        </div>
        <RequestsPanel />
      </TabsContent>

      <TabsContent value="configuracion" className="space-y-4" role="tabpanel">
        <div>
          <h3 className="text-lg font-semibold">Configuración del Sistema</h3>
          <p className="text-sm text-muted-foreground">
            Administra los parámetros y configuraciones del almacén
          </p>
        </div>
        <SettingsPanel />
      </TabsContent>
    </Tabs>
  )
}

export default WarehouseTabs