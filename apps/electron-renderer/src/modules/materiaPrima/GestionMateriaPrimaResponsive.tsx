import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
import { MoreHorizontal, Eye, Edit, Package, Trash2, Search, Filter, Plus, Power, PowerOff, X, Image as ImageIcon } from 'lucide-react'

// Importaciones de shadcn/ui para todos los componentes
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { MateriaPrimaErrorDisplay } from '../../components/MateriaPrimaErrorDisplay'
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
import { toast } from 'sonner'
import { Skeleton } from '../../components/ui/skeleton'

// Componentes de utilidad para loading y errores
const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
)

// Componente Skeleton para la tabla
const TableSkeleton = ({ rows = 10 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    ))}
  </div>
)

// Definición de columnas para el DataTable
const createColumns = (
  onEdit: (material: MateriaPrima) => void,
  onDelete: (material: MateriaPrima) => void,
  onStockUpdate: (material: MateriaPrima) => void,
  onViewDetails: (material: MateriaPrima) => void,
  onToggleStatus: (material: MateriaPrima) => void,
  updatingStatus: string | null
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
    id: 'imagen',
    accessorKey: 'imagen_url',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Imagen" />
    ),
    cell: ({ row }) => {
      const imageUrl = row.original.imagen_url as string

      return (
        <div className="h-10 w-10">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Imagen materia prima"
              className="h-full w-full object-cover rounded"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const placeholder = target.nextElementSibling as HTMLElement
                if (placeholder) {
                  placeholder.style.display = 'flex'
                }
              }}
              style={{ display: 'block' }}
            />
          ) : null}
          {!imageUrl || imageUrl === '' ? (
            <div className="h-full w-full bg-gray-200 rounded flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-gray-400" data-testid="image-icon" />
            </div>
          ) : null}
        </div>
      )
    },
    enableSorting: false,
    enableColumnFilter: false,
    meta: {
      label: 'Imagen',
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
        <div className="flex items-center justify-center">
          <span className="font-medium">{stockActual}</span>
          <span className="text-sm text-muted-foreground"> / {stockMinimo}</span>
        </div>
      )
    },
    enableColumnFilter: false,
  },
  {
    id: 'estatus',
    accessorKey: 'estatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
      const estatus = row.getValue('estatus') as string || 'ACTIVO'
      const stockActual = row.original.stock_actual || 0
      const stockMinimo = row.original.stock_minimo || 0

      let statusVariant: 'default' | 'secondary' | 'destructive' | 'outline'
      let label: string

      // Priorizar el estado del estatus del material
      if (estatus === 'INACTIVO') {
        statusVariant = 'outline'
        label = '🔒 Inhabilitado'
      } else if (stockActual === 0) {
        statusVariant = 'destructive'
        label = 'Agotado'
      } else if (stockActual <= stockMinimo) {
        statusVariant = 'secondary'
        label = '⚠️ Bajo'
      } else {
        statusVariant = 'default'
        label = '✅ Activo'
      }

      return (
        <Badge variant={statusVariant} className="whitespace-nowrap">
          {stockActual === 0 && <X className="h-3 w-3 text-white mr-1" />}
          {label}
        </Badge>
      )
    },
    enableColumnFilter: false, // Disable DataTable column filtering - using local state filtering instead
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const material = row.original
      const stockActual = material.stock_actual || 0
      const estatus = material.estatus || 'ACTIVO'
      const canDelete = estatus === 'INACTIVO'
      const isActive = estatus === 'ACTIVO'

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
            {/* 🔥 RESTRICCIÓN: Solo permitir editar materiales ACTIVO */}
            {isActive && (
              <DropdownMenuItem onClick={() => onEdit(material)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            {/* 🔥 RESTRICCIÓN: Solo permitir ajustar stock de materiales ACTIVO */}
            {isActive && (
              <DropdownMenuItem onClick={() => onStockUpdate(material)}>
                <Package className="mr-2 h-4 w-4" />
                Ajustar stock
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />

            {/* Acciones de estado - deshabilitar/habilitar */}
            {isActive ? (
              <DropdownMenuItem
                onClick={() => onToggleStatus(material)}
                disabled={updatingStatus === material.id}
              >
                {updatingStatus === material.id ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-amber-600" />
                ) : (
                  <PowerOff className="mr-2 h-4 w-4" />
                )}
                <span className="text-amber-600">
                  {updatingStatus === material.id ? 'Deshabilitando...' : 'Deshabilitar'}
                </span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => onToggleStatus(material)}
                disabled={updatingStatus === material.id}
              >
                {updatingStatus === material.id ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
                ) : (
                  <Power className="mr-2 h-4 w-4" />
                )}
                <span className="text-green-600">
                  {updatingStatus === material.id ? 'Habilitando...' : 'Habilitar'}
                </span>
              </DropdownMenuItem>
            )}

            {/* Eliminar solo si el estatus es INACTIVO */}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(material)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
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
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedMaterial, setSelectedMaterial] = useState<MateriaPrima | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [stockAmount, setStockAmount] = useState('')
  const [stockReason, setStockReason] = useState('')
  const [showViewModal, setShowViewModal] = useState(false)
  const [materialDetalle, setMaterialDetalle] = useState<MateriaPrimaDetail | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [detalleError, setDetalleError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

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
      const estatus = safeGet(material, 'estatus', 'ACTIVO')

      const matchesSearch = !debouncedSearchTerm ||
        nombre.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        codigoBarras.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (marca && marca.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))

      const matchesCategoria = !categoriaFilter || categoria === categoriaFilter

      const matchesStock = stockFilter === 'all' ||
        (stockFilter === 'low' && stockActual <= stockMinimo) ||
        (stockFilter === 'out' && stockActual === 0)

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'ACTIVO' && estatus === 'ACTIVO') ||
        (statusFilter === 'INACTIVO' && estatus === 'INACTIVO') ||
        (statusFilter === 'out' && stockActual === 0) ||
        (statusFilter === 'low' && stockActual <= stockMinimo && stockActual > 0)

      return matchesSearch && matchesCategoria && matchesStock && matchesStatus
    })
  }, [materiales, debouncedSearchTerm, categoriaFilter, stockFilter, statusFilter])

  useEffect(() => {
    // ✅ CORRECCIÓN: Incluir INACTIVO cuando se filtra por estado
    const includeInactive = statusFilter === 'INACTIVO' || statusFilter === 'all'

    cargarMateriales({
      ...(categoriaFilter && { categoria: categoriaFilter }),
      ...(stockFilter === 'low' && { bajoStock: true })
    }, { includeInactive })
  }, [categoriaFilter, stockFilter, statusFilter]) // ✅ AÑADIR: statusFilter dependency

  const handleEdit = (material: MateriaPrima) => {
    if (material?.id) {
      navigate(`/materia-prima/editar/${material.id}`)
    }
  }

  const handleDelete = async () => {
    if (!selectedMaterial) return

    try {
      await eliminarMaterial(selectedMaterial.id)
      toast.success('Material eliminado permanentemente')
      setShowDeleteModal(false)
      setSelectedMaterial(null)
      // Recargar materiales para reflejar el cambio
      cargarMateriales()
    } catch (err) {
      console.error('Error al eliminar material:', err)
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el material')
    }
  }

  const handleToggleStatus = async () => {
    if (!selectedMaterial) return

    setUpdatingStatus(selectedMaterial.id)

    try {
      // Validar que el estatus actual exista, si no, asumir ACTIVO por defecto
      const estatusActual = (selectedMaterial.estatus as 'ACTIVO' | 'INACTIVO') || 'ACTIVO'
      let nuevoEstatus: 'ACTIVO' | 'INACTIVO'

      // Determinar el nuevo estatus según el estado actual
      switch (estatusActual) {
        case 'ACTIVO':
          nuevoEstatus = 'INACTIVO'
          break
        case 'INACTIVO':
          nuevoEstatus = 'ACTIVO'
          break
        default:
          nuevoEstatus = 'ACTIVO'
      }

      // Llamar al servicio para actualizar el estatus
      await materiaPrimaService.actualizarEstatus({
        id: selectedMaterial.id,
        estatus: nuevoEstatus,
        usuarioId: null // Temporalmente null hasta implementar autenticación
      })

      // Mostrar notificación de éxito
      const mensaje = nuevoEstatus === 'ACTIVO'
        ? 'Material habilitado exitosamente'
        : 'Material deshabilitado exitosamente'

      toast.success(mensaje)

      // Cerrar modal y limpiar estado
      setShowStatusModal(false)
      setSelectedMaterial(null)

      // Recargar materiales para reflejar el cambio
      cargarMateriales()
    } catch (err) {
      console.error('Error al cambiar estatus del material:', err)
      toast.error(err instanceof Error ? err.message : 'Error al cambiar el estatus del material')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const openStatusModal = (material: MateriaPrima) => {
    setSelectedMaterial(material)
    setShowStatusModal(true)
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
      const detalle = await materiaPrimaService.obtener(material.id, { includeInactive: true })
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

  // Handler de recuperación para acciones de error
  const handleRecovery = useCallback((action: string) => {
    if (!selectedMaterial) return

    switch (action) {
      case 'gestionar_stock':
        openStockModal(selectedMaterial)
        break
      case 'desactivar_material':
        // TODO: Implementar lógica para desactivar material
        console.log('Desactivar material:', selectedMaterial.id)
        break
      case 'recargar_materiales':
        cargarMateriales()
        clearError()
        break
      default:
        clearError()
    }
  }, [selectedMaterial, cargarMateriales, clearError])

  // Definir columnas con las funciones de callback
  const columns = useMemo(
    () => createColumns(handleEdit, openDeleteModal, openStockModal, openViewModal, openStatusModal, updatingStatus),
    [updatingStatus]
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
      <div className="max-w-6xl mx-auto p-5">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-5">
          <h2 className="text-slate-700 text-2xl font-semibold flex items-center gap-2.5">
            🗂️ Gestión de Materia Prima
          </h2>
          <Button onClick={() => navigate('/materia-prima/nuevo')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Material
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Cargando materiales...</h3>
          </div>
          <TableSkeleton rows={8} />
        </div>
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
          <div className="mb-5">
            <MateriaPrimaErrorDisplay
              error={error}
              onDismiss={clearError}
              onRecovery={handleRecovery}
            />
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
          <DataTableToolbar
            table={table}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
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
                <div className="mb-5">
                  <MateriaPrimaErrorDisplay
                    error={error}
                    onDismiss={clearError}
                    onRecovery={handleRecovery}
                  />
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
                <DataTableToolbar
                  table={table}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                />
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
            <p><strong>¿Estás seguro de que deseas eliminar permanentemente este material?</strong></p>
            <p className="text-amber-600 font-medium">
              ⚠️ Esta acción eliminará el material permanentemente de la base de datos y no se puede deshacer.
            </p>
            <p className="text-sm text-muted-foreground">
              Solo se pueden eliminar materiales con estatus <span className="font-semibold">INACTIVO</span>.
            </p>
            <div className="space-y-2 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p><strong>Material:</strong> {safeGet(selectedMaterial, 'nombre', 'N/A')}</p>
              <p><strong>Código:</strong> {safeGet(selectedMaterial, 'codigo_barras', 'N/A')}</p>
              <p><strong>Estatus:</strong> {safeGet(selectedMaterial, 'estatus', 'N/A')}</p>
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

      {/* Modal de confirmación de cambio de estatus */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMaterial?.estatus === 'ACTIVO' ? '🔒 Deshabilitar Material' : '✅ Habilitar Material'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              <strong>
                {selectedMaterial?.estatus === 'ACTIVO'
                  ? '¿Estás seguro de que deseas deshabilitar este material?'
                  : '¿Estás seguro de que deseas habilitar este material?'
                }
              </strong>
            </p>
            <p>
              {selectedMaterial?.estatus === 'ACTIVO'
                ? 'El material deshabilitado no aparecerá en las búsquedas normales y no podrá ser utilizado en movimientos.'
                : 'El material habilitado volverá a aparecer en las búsquedas y podrá ser utilizado normalmente.'
              }
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Material:</strong> {safeGet(selectedMaterial, 'nombre', 'N/A')}</p>
              <p><strong>Código:</strong> {safeGet(selectedMaterial, 'codigo_barras', 'N/A')}</p>
              <p><strong>Estado actual:</strong>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  selectedMaterial?.estatus === 'ACTIVO'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {safeGet(selectedMaterial, 'estatus', 'N/A')}
                </span>
              </p>
              <p><strong>Stock actual:</strong> {safeGet(selectedMaterial, 'stock_actual', 0)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleToggleStatus}
              variant={selectedMaterial?.estatus === 'ACTIVO' ? 'secondary' : 'default'}
            >
              {selectedMaterial?.estatus === 'ACTIVO' ? 'Deshabilitar' : 'Habilitar'}
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

                  {/* Contenedor de imagen del producto */}
                  <div className="flex justify-center mb-6">
                    <div
                      className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg"
                      style={{ width: '200px', height: '150px' }}
                    >
                      {materialDetalle.imagen_url ? (
                        <img
                          src={materialDetalle.imagen_url}
                          alt="Imagen del material"
                          className="max-w-full max-h-full"
                          style={{ objectFit: 'contain' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const placeholder = target.nextElementSibling as HTMLElement
                            if (placeholder) {
                              placeholder.style.display = 'flex'
                            }
                          }}
                        />
                      ) : null}
                      {!materialDetalle.imagen_url || materialDetalle.imagen_url === '' ? (
                        <div className="flex flex-col items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500">Sin imagen</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

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