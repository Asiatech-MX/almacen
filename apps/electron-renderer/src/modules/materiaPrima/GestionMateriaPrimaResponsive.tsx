import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useMateriaPrima, { useStockMateriaPrima } from '../../hooks/useMateriaPrima'
import useDebounce from '../../hooks/useDebounce'
import { materiaPrimaService } from '../../services/materiaPrimaService'
import type { MateriaPrima, MateriaPrimaDetail } from '../../../../shared/types/materiaPrima'
import {
  ScrollSpy,
  ScrollSpyNav,
  ScrollSpyLink,
  ScrollSpyViewport,
  ScrollSpySection
} from '../../components/ui/scroll-spy'

// Importaciones para diceUI DataTable
import { DataTable } from '../../components/data-table/data-table'
import { DataTableColumnHeader } from '../../components/data-table/data-table-column-header'
import { DataTableToolbar } from '../../components/data-table/data-table-toolbar'
import { useDataTable } from '../../hooks/use-data-table'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Eye, Edit, Package, Trash2, Search, Filter, Plus } from 'lucide-react'

// Importaciones de shadcn/ui para todos los componentes
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'

// Componentes de utilidad para loading y errores
const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
)

// Definición de columnas para el DataTable
const createColumns = (
  onEdit: (material: MateriaPrima) => void,
  onDelete: (material: MateriaPrima) => void,
  onStockUpdate: (material: MateriaPrima) => void,
  onViewDetails: (material: MateriaPrima) => void
): ColumnDef<MateriaPrima>[] => [
  {
    id: 'codigo_barras',
    accessorKey: 'codigo_barras',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Código" />
    ),
    cell: ({ row }) => <div>{row.getValue('codigo_barras')}</div>,
    enableColumnFilter: true,
    meta: {
      label: 'Código',
      placeholder: 'Buscar por código...',
      variant: 'text',
    },
  },
  {
    id: 'nombre',
    accessorKey: 'nombre',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nombre" />
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue('nombre')}</div>,
    enableColumnFilter: true,
    meta: {
      label: 'Nombre',
      placeholder: 'Buscar por nombre...',
      variant: 'text',
    },
  },
  {
    id: 'marca',
    accessorKey: 'marca',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Marca" />
    ),
    cell: ({ row }) => (
      <div>
        {row.getValue('marca') || '-'}
      </div>
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Marca',
      placeholder: 'Buscar por marca...',
      variant: 'text',
    },
  },
  {
    id: 'categoria',
    accessorKey: 'categoria',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Categoría" />
    ),
    cell: ({ row }) => (
      <div>
        {row.getValue('categoria') || '-'}
      </div>
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Categoría',
      placeholder: 'Buscar por categoría...',
      variant: 'text',
    },
  },
  {
    id: 'stock_actual',
    accessorKey: 'stock_actual',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stock" />
    ),
    cell: ({ row }) => {
      const stockActual = row.getValue('stock_actual') as number
      const stockMinimo = row.original.stock_minimo || 0
      return (
        <div className="text-center">
          <div className="font-medium">{stockActual}</div>
          <div className="text-sm text-muted-foreground">/ {stockMinimo}</div>
        </div>
      )
    },
    enableColumnFilter: false,
  },
  {
    id: 'estado',
    accessorKey: 'stock_actual',
    header: 'Estado',
    cell: ({ row }) => {
      const stockActual = row.getValue('stock_actual') as number
      const stockMinimo = row.original.stock_minimo || 0

      let status: 'default' | 'secondary' | 'destructive'
      let label: string

      if (stockActual === 0) {
        status = 'destructive'
        label = 'Agotado'
      } else if (stockActual <= stockMinimo) {
        status = 'secondary'
        label = 'Bajo'
      } else {
        status = 'default'
        label = 'Normal'
      }

      return (
        <Badge variant={status}>
          {label}
        </Badge>
      )
    },
    enableColumnFilter: true,
    meta: {
      label: 'Estado',
      variant: 'select',
      options: [
        { label: 'Normal', value: 'normal' },
        { label: 'Bajo', value: 'low' },
        { label: 'Agotado', value: 'out' },
      ],
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const material = row.original

      return (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewDetails(material)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(material)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStockUpdate(material)}>
              <Package className="mr-2 h-4 w-4" />
              Ajustar stock
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(material)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

interface GestionMateriaPrimaResponsiveProps {
  // La prop onEdit ya no es necesaria ya que usamos navegación programática
}

// Función utilitaria para validación segura de propiedades
const safeGet = <T, K extends keyof T>(obj: T | null | undefined, key: K, defaultValue: T[K]): T[K] => {
  // Primero verificamos que obj no sea null ni undefined
  if (obj === null || obj === undefined) {
    return defaultValue
  }

  // Ahora es seguro acceder a la propiedad
  const value = obj[key]
  return (value === undefined || value === null) ? defaultValue : value
}

export const GestionMateriaPrimaResponsive: React.FC<GestionMateriaPrimaResponsiveProps> = () => {
  const navigate = useNavigate()
  const {
    materiales,
    loading,
    error,
    cargarMateriales,
    eliminarMaterial,
    estadisticas,
    clearError
  } = useMateriaPrima({ autoLoad: true })

  const { loading: stockLoading, actualizarStock } = useStockMateriaPrima()

  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')
  const [selectedMaterial, setSelectedMaterial] = useState<MateriaPrima | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [stockAmount, setStockAmount] = useState('')
  const [stockReason, setStockReason] = useState('')
  const [showViewModal, setShowViewModal] = useState(false)
  const [materialDetalle, setMaterialDetalle] = useState<MateriaPrimaDetail | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [detalleError, setDetalleError] = useState<string | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Obtener categorías únicas
  const categorias = Array.from(new Set(materiales.map(m => m.categoria).filter(Boolean)))

  // Filtrar materiales con validaciones robustas
  const materialesFiltrados = useMemo(() => {
    return materiales.filter(material => {
      if (!material) return false

      const nombre = safeGet(material, 'nombre', '')
      const codigoBarras = safeGet(material, 'codigo_barras', '')
      const marca = safeGet(material, 'marca', '')
      const categoria = safeGet(material, 'categoria', '')
      const stockActual = safeGet(material, 'stock_actual', 0)
      const stockMinimo = safeGet(material, 'stock_minimo', 0)

      const matchesSearch = !debouncedSearchTerm ||
        nombre.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        codigoBarras.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (marca && marca.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))

      const matchesCategoria = !categoriaFilter || categoria === categoriaFilter

      const matchesStock = stockFilter === 'all' ||
        (stockFilter === 'low' && stockActual <= stockMinimo) ||
        (stockFilter === 'out' && stockActual === 0)

      return matchesSearch && matchesCategoria && matchesStock
    })
  }, [materiales, debouncedSearchTerm, categoriaFilter, stockFilter])

  useEffect(() => {
    cargarMateriales({
      ...(categoriaFilter && { categoria: categoriaFilter }),
      ...(stockFilter === 'low' && { bajoStock: true })
    })
  }, [categoriaFilter, stockFilter])

  const handleEdit = (material: MateriaPrima) => {
    if (material?.id) {
      navigate(`/materia-prima/editar/${material.id}`)
    }
  }

  const handleDelete = async () => {
    if (!selectedMaterial) return

    try {
      await eliminarMaterial(selectedMaterial.id)
      setShowDeleteModal(false)
      setSelectedMaterial(null)
    } catch (err) {
      console.error('Error al eliminar material:', err)
    }
  }

  const handleStockUpdate = async () => {
    if (!selectedMaterial || !stockAmount || !stockReason) return

    try {
      const amount = parseFloat(stockAmount)
      await actualizarStock(selectedMaterial.id, amount, stockReason)
      setShowStockModal(false)
      setSelectedMaterial(null)
      setStockAmount('')
      setStockReason('')
    } catch (err) {
      console.error('Error al actualizar stock:', err)
    }
  }

  const openDeleteModal = (material: MateriaPrima) => {
    setSelectedMaterial(material)
    setShowDeleteModal(true)
  }

  const openStockModal = (material: MateriaPrima) => {
    setSelectedMaterial(material)
    setShowStockModal(true)
  }

  const openViewModal = async (material: MateriaPrima) => {
    setSelectedMaterial(material)
    setShowViewModal(true)
    setDetalleError(null)
    setLoadingDetalle(true)

    try {
      const detalle = await materiaPrimaService.obtener(material.id)
      setMaterialDetalle(detalle)
    } catch (error) {
      console.error('Error al cargar detalles:', error)
      setDetalleError(error instanceof Error ? error.message : 'Error al cargar los detalles del material')
    } finally {
      setLoadingDetalle(false)
    }
  }

  const closeViewModal = () => {
    setShowViewModal(false)
    setSelectedMaterial(null)
    setMaterialDetalle(null)
    setDetalleError(null)
    setLoadingDetalle(false)
  }

  // Definir columnas con las funciones de callback
  const columns = useMemo(
    () => createColumns(handleEdit, openDeleteModal, openStockModal, openViewModal),
    []
  )

  // Configurar DataTable
  const { table } = useDataTable({
    data: materialesFiltrados,
    columns,
    pageCount: Math.ceil(materialesFiltrados.length / 10),
    initialState: {
      sorting: [{ id: "nombre", desc: false }],
      pagination: { pageSize: 10 },
    },
    getRowId: (row) => row.id!,
  })

  if (loading && materiales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-600 text-lg gap-4">
        <LoadingSpinner />
        <span>Cargando materiales...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-5">
  
      {/* Desktop Layout - Con DataTable */}
      <div className="hidden md:block">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-5">
          <h2 className="text-slate-700 text-2xl font-semibold flex items-center gap-2.5">
            🗂️ Gestión de Materia Prima
          </h2>
          <div className="flex gap-4 flex-wrap items-center flex-1 max-w-md">
            <Button onClick={() => navigate('/materia-prima/nueva')} className="flex items-center gap-2">
              <Plus className="size-4" />
              Nuevo Material
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 p-4 rounded-lg mb-5 flex items-center gap-2.5">
            <span className="text-xl">⚠️</span>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-500 text-sm font-medium uppercase tracking-wide">
                Total Materiales
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-blue-500 mb-1">{estadisticas.total}</div>
              <p className="text-gray-400 text-sm">Materiales registrados</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-500 text-sm font-medium uppercase tracking-wide">
                Stock Bajo
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-amber-500 mb-1">{estadisticas.bajoStock}</div>
              <p className="text-gray-400 text-sm">Necesitan reabastecer</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-500 text-sm font-medium uppercase tracking-wide">
                Sin Stock
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-red-500 mb-1">{estadisticas.sinStock}</div>
              <p className="text-gray-400 text-sm">Agotados</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-500 text-sm font-medium uppercase tracking-wide">
                Valor Total
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-emerald-500 mb-1">
                ${estadisticas.valorTotal.toFixed(2)}
              </div>
              <p className="text-gray-400 text-sm">Valor del inventario</p>
            </CardContent>
          </Card>
        </div>

        {/* DataTable Integration */}
        <DataTable table={table}>
          <DataTableToolbar table={table} />
        </DataTable>
      </div>

      {/* Mobile Layout - With Scroll-Spy */}
      <div className="md:hidden">
        <ScrollSpy defaultValue="busqueda" orientation="vertical">
          <ScrollSpyNav>
            <ScrollSpyLink value="busqueda">🔍 Búsqueda</ScrollSpyLink>
            <ScrollSpyLink value="estadisticas">📊 Estadísticas</ScrollSpyLink>
            <ScrollSpyLink value="tabla">📋 Materiales</ScrollSpyLink>
          </ScrollSpyNav>

          <ScrollSpyViewport>
            {/* Search Section */}
            <ScrollSpySection value="busqueda">
              <div className="mb-5 pt-0">
                <h2 className="text-slate-700 text-xl mb-4">
                  🔍 Búsqueda y Filtros
                </h2>
                <Button onClick={() => navigate('/materia-prima/nueva')} className="mb-4 flex items-center gap-2">
                  <Plus className="size-4" />
                  Nuevo Material
                </Button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-300 text-red-600 p-4 rounded-lg mb-5 flex items-center gap-2.5">
                  <span className="text-xl">⚠️</span>
                  {error}
                </div>
              )}
            </ScrollSpySection>

            {/* Stats Section */}
            <ScrollSpySection value="estadisticas">
              <h2 className="text-slate-700 text-xl mb-5">
                📊 Estadísticas del Inventario
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-gray-500 text-sm font-medium uppercase tracking-wide">
                      Total Materiales
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-3xl font-bold text-blue-500 mb-1">{estadisticas.total}</div>
                    <p className="text-gray-400 text-sm">Materiales registrados</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-gray-500 text-sm font-medium uppercase tracking-wide">
                      Stock Bajo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-3xl font-bold text-amber-500 mb-1">{estadisticas.bajoStock}</div>
                    <p className="text-gray-400 text-sm">Necesitan reabastecer</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-gray-500 text-sm font-medium uppercase tracking-wide">
                      Sin Stock
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-3xl font-bold text-red-500 mb-1">{estadisticas.sinStock}</div>
                    <p className="text-gray-400 text-sm">Agotados</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-gray-500 text-sm font-medium uppercase tracking-wide">
                      Valor Total
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-3xl font-bold text-emerald-500 mb-1">
                      ${estadisticas.valorTotal.toFixed(2)}
                    </div>
                    <p className="text-gray-400 text-sm">Valor del inventario</p>
                  </CardContent>
                </Card>
              </div>
            </ScrollSpySection>

            {/* Table Section - Mobile versión simplificada */}
            <ScrollSpySection value="tabla">
              <h2 className="text-slate-700 text-xl mb-5">
                📋 Lista de Materiales
              </h2>
              <DataTable table={table}>
                <DataTableToolbar table={table} />
              </DataTable>
            </ScrollSpySection>
          </ScrollSpyViewport>
        </ScrollSpy>
      </div>

      {/* Modals con shadcn/ui Dialog */}
      {/* Modal de confirmación de eliminación */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🗑️ Eliminar Material
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p><strong>¿Estás seguro de que deseas eliminar este material?</strong></p>
            <p>Este proceso no se puede deshacer.</p>
            <div className="space-y-2 text-sm">
              <p><strong>Material:</strong> {safeGet(selectedMaterial, 'nombre', 'N/A')}</p>
              <p><strong>Código:</strong> {safeGet(selectedMaterial, 'codigo_barras', 'N/A')}</p>
              <p><strong>Stock actual:</strong> {safeGet(selectedMaterial, 'stock_actual', 0)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de ajuste de stock */}
      <Dialog open={showStockModal} onOpenChange={setShowStockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📦 Ajustar Stock
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <p><strong>Material:</strong> {safeGet(selectedMaterial, 'nombre', 'N/A')}</p>
              <p><strong>Stock actual:</strong> {safeGet(selectedMaterial, 'stock_actual', 0)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockAmount">Cantidad a ajustar:</Label>
              <Input
                id="stockAmount"
                type="number"
                value={stockAmount}
                onChange={(e) => setStockAmount(e.target.value)}
                placeholder="Usa números positivos para agregar, negativos para restar"
              />
              <p className="text-xs text-gray-500">
                Ejemplo: 10 para agregar 10 unidades, -5 para restar 5 unidades
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockReason">Motivo del ajuste:</Label>
              <Textarea
                id="stockReason"
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                placeholder="Describe el motivo del ajuste de stock..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowStockModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleStockUpdate}
              disabled={!stockAmount || !stockReason || stockLoading}
            >
              {stockLoading ? 'Actualizando...' : 'Actualizar Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de ver detalles */}
      <Dialog open={showViewModal} onOpenChange={closeViewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📋 Detalles del Material
            </DialogTitle>
          </DialogHeader>
          <div>
            {loadingDetalle ? (
              <div className="text-center p-10 text-gray-600">
                <LoadingSpinner />
                <p className="mt-4">Cargando detalles...</p>
              </div>
            ) : detalleError ? (
              <div className="bg-red-50 border border-red-300 text-red-600 p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">⚠️</div>
                {detalleError}
              </div>
            ) : materialDetalle ? (
              <div className="space-y-6">
                {/* Información básica */}
                <div>
                  <h4 className="text-slate-700 mb-4 pb-2 border-b-2 border-gray-100">
                    📦 Información General
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold">Código de Barras:</span><br />
                      {materialDetalle.codigo_barras || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Nombre:</span><br />
                      {materialDetalle.nombre || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Marca:</span><br />
                      {materialDetalle.marca || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Modelo:</span><br />
                      {materialDetalle.modelo || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Categoría:</span><br />
                      {materialDetalle.categoria || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Presentación:</span><br />
                      {materialDetalle.presentacion || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Información de stock */}
                <div>
                  <h4 className="text-slate-700 mb-4 pb-2 border-b-2 border-gray-100">
                    📊 Información de Stock
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold">Stock Actual:</span><br />
                      <span className={`text-lg font-bold ${
                        materialDetalle.stock_actual > materialDetalle.stock_minimo ? 'text-emerald-600' :
                        materialDetalle.stock_actual > 0 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {materialDetalle.stock_actual || 0} unidades
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold">Stock Mínimo:</span><br />
                      {materialDetalle.stock_minimo || 0} unidades
                    </div>
                    <div>
                      <span className="font-semibold">Estado:</span><br />
                      <Badge variant={
                        materialDetalle.stock_actual > materialDetalle.stock_minimo ? 'default' :
                        materialDetalle.stock_actual > 0 ? 'secondary' : 'destructive'
                      }>
                        {materialDetalle.stock_actual > materialDetalle.stock_minimo ? '✅ Normal' :
                         materialDetalle.stock_actual > 0 ? '⚠️ Stock Bajo' : '❌ Agotado'}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-semibold">Costo Unitario:</span><br />
                      ${materialDetalle.costo_unitario?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div>
                  <h4 className="text-slate-700 mb-4 pb-2 border-b-2 border-gray-100">
                    ℹ️ Información Adicional
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold">ID Proveedor:</span><br />
                      {materialDetalle.proveedor_id || 'No especificado'}
                    </div>
                    <div>
                      <span className="font-semibold">Fecha de Caducidad:</span><br />
                      {materialDetalle.fecha_caducidad
                        ? new Date(materialDetalle.fecha_caducidad).toLocaleDateString('es-ES')
                        : 'No especificada'
                      }
                    </div>
                  </div>
                  {materialDetalle.descripcion && (
                    <div className="mt-4">
                      <span className="font-semibold">Descripción:</span><br />
                      <span className="text-gray-600">
                        {materialDetalle.descripcion}
                      </span>
                    </div>
                  )}
                </div>

                {/* Fechas de auditoría */}
                <div>
                  <h4 className="text-slate-700 mb-4 pb-2 border-b-2 border-gray-100">
                    🕒 Información de Auditoría
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-semibold">Creado:</span><br />
                      {materialDetalle.creado_en
                        ? new Date(materialDetalle.creado_en).toLocaleString('es-ES')
                        : 'N/A'
                      }
                    </div>
                    <div>
                      <span className="font-semibold">Actualizado:</span><br />
                      {materialDetalle.actualizado_en
                        ? new Date(materialDetalle.actualizado_en).toLocaleString('es-ES')
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button onClick={closeViewModal}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default GestionMateriaPrimaResponsive