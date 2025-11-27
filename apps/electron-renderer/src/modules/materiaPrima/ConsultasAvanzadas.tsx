import React, { useState, useEffect } from 'react'

import useMateriaPrima, { useBusquedaAvanzada, useStockMateriaPrima } from '../../hooks/useMateriaPrima'
import useDebounce from '../../hooks/useDebounce'

import type { MateriaPrima, LowStockItem } from '../../../../shared/types/materiaPrima'

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SegmentedInput, SegmentedInputItem } from "@/components/ui/segmented-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Scroller } from "@/components/ui/scroller"
import { X } from 'lucide-react'

type TabType = 'search' | 'lowStock' | 'statistics'

// Optimized utility functions for stock status evaluation
const getStockStatus = (material: MateriaPrima | LowStockItem): 'normal' | 'low' | 'out' => {
  const stock = material.stock_actual || 0
  const minStock = material.stock_minimo || 0

  if (stock === 0) return 'out'
  if (stock <= minStock) return 'low'
  return 'normal'
}

const getStockBadgeVariant = (material: MateriaPrima | LowStockItem): "default" | "secondary" | "destructive" | "outline" => {
  const status = getStockStatus(material)
  switch (status) {
    case 'normal': return 'default'
    case 'low': return 'secondary'
    case 'out': return 'destructive'
    default: return 'outline'
  }
}

const getStockStatusText = (material: MateriaPrima | LowStockItem): React.ReactNode => {
  const status = getStockStatus(material)
  switch (status) {
    case 'normal': return '✅ Normal'
    case 'low': return '⚠️ Bajo'
    case 'out': return (
      <span className="flex items-center gap-1">
        <X className="h-3 w-3 text-white" />
        Agotado
      </span>
    )
    default: return 'Desconocido'
  }
}

export const ConsultasAvanzadas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('search')

  // Estado para búsqueda avanzada
  const [searchFilters, setSearchFilters] = useState({
    nombre: '',
    categoria: '',
    proveedorId: '',
    bajoStock: false,
    estatus: 'ACTIVO', // 🔥 NUEVO: Por defecto excluir INACTIVO
    rangoStock: { min: undefined, max: undefined } as { min?: number; max?: number }
  })

  const debouncedNombre = useDebounce(searchFilters.nombre, 300)

  const {
    resultados: searchResults,
    loading: searchLoading,
    error: searchError,
    buscarPorCriterios,
    limpiarBusqueda
  } = useBusquedaAvanzada()

  const {
    getStockBajo,
    loading: stockLoading,
    error: stockError
  } = useStockMateriaPrima()

  const {
    materiales,
    loading: materialesLoading,
    estadisticas,
    cargarMateriales
  } = useMateriaPrima({ autoLoad: true })

  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])

  // Obtener categorías únicas
  const categorias = Array.from(new Set(materiales.map(m => m.categoria).filter(Boolean)))

  // Determinar si hay filtros activos
  const tieneFiltros = debouncedNombre ||
                      (searchFilters.categoria && searchFilters.categoria !== "") ||
                      searchFilters.proveedorId ||
                      searchFilters.bajoStock ||
                      searchFilters.estatus !== 'ACTIVO' || // 🔥 NUEVO: Considerar cambio de estatus
                      (searchFilters.rangoStock.min !== undefined || searchFilters.rangoStock.max !== undefined)

  // Ejecutar búsqueda cuando los filtros cambian
  useEffect(() => {
    if (activeTab === 'search') {
      // Si no hay filtros específicos, cargar todos los materiales
      if (!tieneFiltros) {
        cargarMateriales()
      } else {
        buscarPorCriterios({
          nombre: debouncedNombre,
          categoria: searchFilters.categoria || undefined,
          proveedorId: searchFilters.proveedorId || undefined,
          bajoStock: searchFilters.bajoStock,
          estatus: searchFilters.estatus !== 'ACTIVO' ? searchFilters.estatus : undefined, // 🔥 NUEVO: Incluir estatus en búsqueda
          rangoStock: searchFilters.rangoStock.min !== undefined || searchFilters.rangoStock.max !== undefined
            ? searchFilters.rangoStock
            : undefined
        })
      }
    }
  }, [debouncedNombre, searchFilters.categoria, searchFilters.proveedorId, searchFilters.bajoStock, searchFilters.estatus, searchFilters.rangoStock, activeTab, tieneFiltros, cargarMateriales, buscarPorCriterios])

  // Determinar qué datos mostrar
  const datosAMostrar = tieneFiltros ? searchResults : materiales

  // Cargar stock bajo cuando se activa la pestaña
  useEffect(() => {
    if (activeTab === 'lowStock') {
      loadLowStock()
    }
  }, [activeTab])

  const loadLowStock = async () => {
    try {
      const items = await getStockBajo()
      setLowStockItems(items)
    } catch (err) {
      console.error('Error al cargar stock bajo:', err)
    }
  }

  const handleFilterChange = (field: keyof typeof searchFilters) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value

    setSearchFilters(prev => ({
      ...prev,
      [field]: field === 'bajoStock'
        ? (e.target as HTMLInputElement).checked
        : field === 'rangoStock'
          ? prev.rangoStock
          : value
    }))
  }

  const handleRangeChange = (field: 'min' | 'max') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value ? Number(e.target.value) : undefined

    setSearchFilters(prev => ({
      ...prev,
      rangoStock: {
        ...prev.rangoStock,
        [field]: value
      }
    }))
  }

  const clearFilters = () => {
    setSearchFilters({
      nombre: '',
      categoria: '',
      proveedorId: '',
      bajoStock: false,
      rangoStock: { min: undefined, max: undefined }
    })
    limpiarBusqueda()
  }

  const exportResults = async () => {
    try {
      const data = activeTab === 'search' ? datosAMostrar : materiales
      const csv = [
        ['Código', 'Nombre', 'Marca', 'Presentación', 'Stock Actual', 'Stock Mínimo', 'Categoría', 'Proveedor'],
        ...data.map(item => [
          item.codigo_barras,
          item.nombre,
          item.marca || '',
          item.presentacion,
          item.stock_actual?.toString() || '0',
          item.stock_minimo?.toString() || '0',
          item.categoria || '',
          (item as any).proveedor_nombre || ''
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `materia_prima_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error al exportar datos:', err)
    }
  }

  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'search':
        return (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>🔍 Búsqueda Avanzada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Material</Label>
                    <Input
                      id="nombre"
                      type="text"
                      value={searchFilters.nombre}
                      onChange={handleFilterChange('nombre')}
                      placeholder="Buscar por nombre..."
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={searchFilters.categoria || "all"} onValueChange={(value) => setSearchFilters(prev => ({...prev, categoria: value === "all" ? "" : value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {categorias.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proveedorId">ID Proveedor</Label>
                    <Input
                      id="proveedorId"
                      type="text"
                      value={searchFilters.proveedorId}
                      onChange={handleFilterChange('proveedorId')}
                      placeholder="ID del proveedor..."
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rango de Stock</Label>
                    <SegmentedInput>
                      <SegmentedInputItem
                        type="number"
                        placeholder="Mínimo"
                        value={searchFilters.rangoStock.min || ''}
                        onChange={(e) => handleRangeChange('min')(e)}
                      />
                      <SegmentedInputItem
                        type="number"
                        placeholder="Máximo"
                        value={searchFilters.rangoStock.max || ''}
                        onChange={(e) => handleRangeChange('max')(e)}
                      />
                    </SegmentedInput>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="bajoStock"
                        checked={searchFilters.bajoStock}
                        onCheckedChange={(checked) => setSearchFilters(prev => ({...prev, bajoStock: checked as boolean}))}
                      />
                      <Label htmlFor="bajoStock">Mostrar solo stock bajo</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Estado del Material</Label>
                    <Select
                      value={searchFilters.estatus || "ACTIVO"}
                      onValueChange={(value) => setSearchFilters(prev => ({...prev, estatus: value === "all" ? "all" : value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVO">✅ Activos (Por defecto)</SelectItem>
                        <SelectItem value="INACTIVO">🔒 Inactivos</SelectItem>
                        <SelectItem value="all">📋 Todos los estados</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {searchFilters.estatus === 'ACTIVO' && 'Mostrando solo materiales activos'}
                      {searchFilters.estatus === 'INACTIVO' && 'Mostrando solo materiales inactivos'}
                      {searchFilters.estatus === 'all' && 'Mostrando todos los materiales'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
                  <Button variant="outline" onClick={clearFilters}>
                    🔄 Limpiar Filtros
                  </Button>
                  <Button variant="default" onClick={exportResults} disabled={datosAMostrar.length === 0}>
                    📊 Exportar Resultados
                  </Button>
                </div>
              </CardContent>
            </Card>

            {datosAMostrar.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{tieneFiltros ? 'Resultados de Búsqueda' : 'Todos los Materiales'}</CardTitle>
                    <Badge variant="secondary">{datosAMostrar.length} materiales</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Scroller orientation="horizontal" size={16} offset={8}>
                    <div className="min-w-max">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead className="w-32">Código</TableHead>
                            <TableHead className="w-48">Nombre</TableHead>
                            <TableHead className="w-32">Marca</TableHead>
                            <TableHead className="w-36">Categoría</TableHead>
                            <TableHead className="w-24 text-center">Stock</TableHead>
                            <TableHead className="w-28 text-center">Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {datosAMostrar.map((material) => (
                            <TableRow key={material.id}>
                              <TableCell className="font-medium w-32">{material.codigo_barras}</TableCell>
                              <TableCell className="w-48">{material.nombre}</TableCell>
                              <TableCell className="w-32">{material.marca || '-'}</TableCell>
                              <TableCell className="w-36">{material.categoria || '-'}</TableCell>
                              <TableCell className="w-24 text-center">{material.stock_actual}</TableCell>
                              <TableCell className="w-28 text-center">
                                <Badge variant={getStockBadgeVariant(material)}>
                                  {getStockStatusText(material)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Scroller>
                </CardContent>
              </Card>
            )}

            {datosAMostrar.length === 0 && !searchLoading && !materialesLoading && tieneFiltros && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
                  <p className="text-gray-500 text-center">Intenta ajustar los filtros de búsqueda</p>
                </CardContent>
              </Card>
            )}
          </>
        )

      case 'lowStock':
        return (
          <>
            <Alert className="mb-5">
              <AlertTitle>⚠️ Materiales con Stock Bajo</AlertTitle>
              <AlertDescription>
                Estos materiales necesitan ser reabastecidos pronto para evitar interrupciones en el inventario.
              </AlertDescription>
            </Alert>

            {lowStockItems.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Materiales con Stock Bajo</CardTitle>
                    <Badge variant="secondary">{lowStockItems.length} materiales</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Scroller orientation="horizontal" size={16} offset={8}>
                    <div className="min-w-max">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead className="w-32">Código</TableHead>
                            <TableHead className="w-48">Nombre</TableHead>
                            <TableHead className="w-32">Marca</TableHead>
                            <TableHead className="w-36">Presentación</TableHead>
                            <TableHead className="w-28 text-center">Stock Actual</TableHead>
                            <TableHead className="w-28 text-center">Stock Mínimo</TableHead>
                            <TableHead className="w-36">Categoría</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lowStockItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium w-32">{item.codigo_barras}</TableCell>
                              <TableCell className="w-48">{item.nombre}</TableCell>
                              <TableCell className="w-32">{item.marca || '-'}</TableCell>
                              <TableCell className="w-36">{item.presentacion}</TableCell>
                              <TableCell className="w-28 text-center">{item.stock_actual}</TableCell>
                              <TableCell className="w-28 text-center">{item.stock_minimo}</TableCell>
                              <TableCell className="w-36">{item.categoria || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Scroller>
                </CardContent>
              </Card>
            )}

            {lowStockItems.length === 0 && !stockLoading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">¡Buen trabajo!</h3>
                  <p className="text-gray-500 text-center">No hay materiales con stock bajo en este momento.</p>
                </CardContent>
              </Card>
            )}
          </>
        )

      case 'statistics':
        return (
          <Scroller viewportAware size={16} offset={8}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 pb-4">
              <Card className="border-l-4 border-l-blue-500 transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-105">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Total Materiales</h4>
                  <div className="text-3xl font-bold text-blue-600 transition-transform duration-200 ease-in-out hover:scale-110">{estadisticas.total}</div>
                  <p className="text-sm text-gray-500">Materiales registrados</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500 transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-105">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Stock Bajo</h4>
                  <div className="text-3xl font-bold text-amber-600 transition-transform duration-200 ease-in-out hover:scale-110">{estadisticas.bajoStock}</div>
                  <p className="text-sm text-gray-500">Necesitan reabastecer</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500 transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-105">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Sin Stock</h4>
                  <div className="text-3xl font-bold text-red-600 transition-transform duration-200 ease-in-out hover:scale-110">{estadisticas.sinStock}</div>
                  <p className="text-sm text-gray-500">Agotados</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-105">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Valor Total</h4>
                  <div className="text-3xl font-bold text-green-600 transition-transform duration-200 ease-in-out hover:scale-110">${estadisticas.valorTotal.toFixed(2)}</div>
                  <p className="text-sm text-gray-500">Valor del inventario</p>
                </CardContent>
              </Card>
            </div>
          </Scroller>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-5">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-2">
          📊 Consultas Avanzadas
        </h2>
        <p className="text-gray-600">
          Busca y analiza tu inventario de materia prima con herramientas avanzadas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
        <TabsList>
          <TabsTrigger value="search">🔍 Búsqueda</TabsTrigger>
          <TabsTrigger value="lowStock">⚠️ Stock Bajo</TabsTrigger>
          <TabsTrigger value="statistics">📈 Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          {renderTabContent()}
        </TabsContent>

        <TabsContent value="lowStock">
          {renderTabContent()}
        </TabsContent>

        <TabsContent value="statistics">
          {renderTabContent()}
        </TabsContent>
      </Tabs>

      {(searchLoading || stockLoading || materialesLoading) && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      )}

      {(searchError || stockError) && (
        <Alert className="mb-5" variant="destructive">
          <AlertTitle>⚠️ Error</AlertTitle>
          <AlertDescription>
            {searchError || stockError || 'Ocurrió un error al cargar los datos'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default ConsultasAvanzadas