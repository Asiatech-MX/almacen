import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Package, TrendingUp, Activity } from 'lucide-react'
import type { MateriaPrima } from '@shared/materiaPrima'

interface InventoryDashboardProps {
  materials: MateriaPrima[]
}

// Card para mostrar el total de materiales
export const StockLevelCard: React.FC<{
  title: string
  value: string | number
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
}> = ({ title, value, icon, variant = 'default' }) => {
  const variantStyles = {
    default: 'bg-card text-card-foreground border-border',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800'
  }

  return (
    <Card className={`${variantStyles[variant]} transition-all duration-200 hover:shadow-md`} role="region" aria-label={`${title}: ${value}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium sr-only">{title}</CardTitle>
        {icon && (
          <div className="h-8 w-8 text-muted-foreground" aria-hidden="true">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" aria-live="polite">{value}</div>
        <p className="text-xs text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  )
}

// Card para alertas de stock bajo
export const LowStockAlerts: React.FC<{
  materials: MateriaPrima[]
}> = ({ materials }) => {
  const lowStockItems = materials.filter(material =>
    material.stock_actual <= material.stock_minimo
  )

  const getStockLevel = (current: number, minimum: number) => {
    const ratio = current / minimum
    if (ratio <= 0.5) return { level: 'critical', color: 'destructive' as const }
    if (ratio <= 0.8) return { level: 'low', color: 'secondary' as const }
    return { level: 'normal', color: 'default' as const }
  }

  return (
    <Card role="region" aria-label={`Alertas de stock: ${lowStockItems.length} productos con stock bajo`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Alertas de Stock</CardTitle>
        <AlertTriangle className="h-4 w-4 text-yellow-500" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" aria-live="polite">
          {lowStockItems.length}
        </div>
        <p className="text-xs text-muted-foreground">Productos con stock bajo</p>

        {lowStockItems.length > 0 && (
          <div className="mt-3 space-y-1" role="list" aria-label="Productos con stock bajo">
            {lowStockItems.slice(0, 3).map((material) => {
              const stockLevel = getStockLevel(material.stock_actual, material.stock_minimo)
              return (
                <div
                  key={material.id}
                  className="flex items-center justify-between text-xs p-1 rounded bg-muted/50"
                  role="listitem"
                >
                  <span className="truncate font-medium">{material.nombre}</span>
                  <Badge
                    variant={stockLevel.color}
                    aria-label={`Stock crítico: ${material.stock_actual} unidades`}
                  >
                    {material.stock_actual}
                  </Badge>
                </div>
              )
            })}
            {lowStockItems.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                y {lowStockItems.length - 3} más...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Card para movimientos recientes (simulado)
export const RecentMovements: React.FC<{
  count?: number
}> = ({ count = 0 }) => {
  return (
    <Card role="region" aria-label={`Movimientos hoy: ${count}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Movimientos Hoy</CardTitle>
        <Activity className="h-4 w-4 text-blue-500" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" aria-live="polite">{count}</div>
        <p className="text-xs text-muted-foreground">Entradas y salidas</p>
      </CardContent>
    </Card>
  )
}

// Card de acciones rápidas
export const QuickActions: React.FC<{
  onNewMaterial: () => void
  onNewMovement: () => void
  onGenerateReport: () => void
}> = ({ onNewMaterial, onNewMovement, onGenerateReport }) => {
  return (
    <Card role="region" aria-label="Acciones rápidas">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <button
          onClick={onNewMaterial}
          className="w-full text-left px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          aria-label="Crear nuevo material"
        >
          ➕ Nuevo Material
        </button>
        <button
          onClick={onNewMovement}
          className="w-full text-left px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 transition-colors"
          aria-label="Registrar movimiento"
        >
          📊 Registrar Movimiento
        </button>
        <button
          onClick={onGenerateReport}
          className="w-full text-left px-3 py-2 text-sm bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors"
          aria-label="Generar reporte"
        >
          📈 Generar Reporte
        </button>
      </CardContent>
    </Card>
  )
}

// Dashboard principal
export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  materials
}) => {
  const totalMaterials = materials.length
  const totalStock = materials.reduce((sum, material) => sum + material.stock_actual, 0)
  const categories = [...new Set(materials.map(m => m.categoria))].length

  return (
    <div className="space-y-6" role="main" aria-label="Panel de control de inventario">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StockLevelCard
          title="Total de Materiales"
          value={totalMaterials.toLocaleString()}
          icon={<Package className="h-4 w-4" />}
          variant="default"
        />

        <StockLevelCard
          title="Unidades en Stock"
          value={totalStock.toLocaleString()}
          icon={<TrendingUp className="h-4 w-4" />}
          variant="success"
        />

        <LowStockAlerts materials={materials} />

        <RecentMovements count={12} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <QuickActions
          onNewMaterial={() => console.log('Nuevo material')}
          onNewMovement={() => console.log('Nuevo movimiento')}
          onGenerateReport={() => console.log('Generar reporte')}
        />

        <StockLevelCard
          title="Categorías"
          value={categories}
          icon={<Package className="h-4 w-4" />}
          variant="default"
        />
      </div>
    </div>
  )
}

export default InventoryDashboard