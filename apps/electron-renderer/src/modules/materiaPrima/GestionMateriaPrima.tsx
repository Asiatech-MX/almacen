import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useMateriaPrima, { useStockMateriaPrima } from '../../hooks/useMateriaPrima'
import useDebounce from '../../hooks/useDebounce'
import { materiaPrimaService } from '../../services/materiaPrimaService'
import type { MateriaPrima, MateriaPrimaDetail } from '../../../../shared/types/materiaPrima'

// Importar componentes de error mejorados
import { MateriaPrimaErrorDisplay } from '../../components/MateriaPrimaErrorDisplay'
import { MateriaPrimaErrorText } from '../../components/MateriaPrimaErrorDisplay'

// Importaciones de shadcn/ui
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'

interface GestionMateriaPrimaProps {
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

// Función helper para obtener stock como número de forma segura
const getStockAsNumber = (material: any): number => {
  const stock = safeGet(material, 'stock_actual', 0)
  // Convertir a número si es string
  return typeof stock === 'string' ? parseFloat(stock) || 0 : Number(stock) || 0
}

export const GestionMateriaPrima: React.FC<GestionMateriaPrimaProps> = () => {
  const navigate = useNavigate()
  const {
    materiales,
    loading,
    error,
    cargarMateriales,
    eliminarMaterial,
    estadisticas,
    clearError,
    obtenerMensajeUsuario,
    getErrorType,
    tieneAccionesRecuperacion,
    esStockDisponibleError
  } = useMateriaPrima({ autoLoad: true })

  const { loading: stockLoading, actualizarStock } = useStockMateriaPrima()

  const [searchTerm, setSearchTerm] = useState('')

  const handleEdit = (material: MateriaPrima) => {
    if (material?.id) {
      navigate(`/materia-prima/editar/${material.id}`)
    }
  }
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
  const [updatingStock, setUpdatingStock] = useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Obtener categorías únicas
  const categorias = Array.from(new Set(materiales.map(m => m.categoria).filter(Boolean)))

  // Filtrar materiales con validaciones robustas
  const materialesFiltrados = materiales.filter(material => {
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

  useEffect(() => {
    cargarMateriales({
      ...(categoriaFilter && { categoria: categoriaFilter }),
      ...(stockFilter === 'low' && { bajoStock: true })
    })
  }, [categoriaFilter, stockFilter])

  // Event listeners para acciones de recuperación desde componentes de error
  useEffect(() => {
    const handleRecargarMateriales = () => {
      clearError()
      cargarMateriales()
    }

    const handleReintentarOperacion = () => {
      clearError()
      // Reintentar la última operación si hay un material seleccionado
      if (selectedMaterial) {
        handleDelete()
      }
    }

    // Agregar event listeners
    window.addEventListener('recargarMateriales', handleRecargarMateriales)
    window.addEventListener('reintentarOperacion', handleReintentarOperacion)

    // Limpiar event listeners al desmontar
    return () => {
      window.removeEventListener('recargarMateriales', handleRecargarMateriales)
      window.removeEventListener('reintentarOperacion', handleReintentarOperacion)
    }
  }, [selectedMaterial, clearError, cargarMateriales])

  const getStockStatus = (material: MateriaPrima | null | undefined): 'normal' | 'low' | 'out' => {
    if (!material) return 'out'

    const stock = safeGet(material, 'stock_actual', 0)
    const minStock = safeGet(material, 'stock_minimo', 0)

    if (stock === 0) return 'out'
    if (stock <= minStock) return 'low'
    return 'normal'
  }

  const handleDelete = async () => {
    if (!selectedMaterial) return

    try {
      await eliminarMaterial(selectedMaterial.id)
      setShowDeleteModal(false)
      setSelectedMaterial(null)
    } catch (err) {
      console.error('Error al eliminar material:', err)
      // El error ya se maneja a través del hook y se muestra en el componente de error
      // No necesitamos manejarlo aquí con alerts
    }
  }

  // Manejador para acciones de recuperación desde el componente de error
  const handleRecovery = (action: string) => {
    if (!error) return

    switch (action) {
      case 'gestionar_stock':
        // Abrir modal de gestión de stock para el material con error
        if (esStockDisponibleError(error)) {
          // Buscar el material en la lista
          const material = materiales.find(m => m.id === error.idMaterial)
          if (material) {
            setSelectedMaterial(material)
            setShowStockModal(true)
          }
        }
        break

      case 'desactivar_material':
        // Navegar a desactivación o mostrar confirmación
        if (esStockDisponibleError(error)) {
          const confirmed = window.confirm(
            `¿Desea desactivar el material "${error.nombreMaterial}" en lugar de eliminarlo?\n\n` +
            'El material permanecerá en el sistema pero no estará disponible para nuevas operaciones.'
          )
          if (confirmed) {
            // Aquí iría la lógica para desactivar el material
            console.log('Desactivar material:', error.idMaterial)
          }
        }
        break

      case 'reintentar':
        // Reintentar la operación que falló
        if (selectedMaterial) {
          handleDelete()
        }
        break

      case 'recargar':
        // Recargar la lista de materiales
        clearError()
        cargarMateriales()
        break

      default:
        console.log('Acción de recuperación no reconocida:', action)
    }
  }

  const handleStockUpdate = async () => {
    if (!selectedMaterial || !stockAmount || !stockReason) return

    try {
      setUpdatingStock(true)
      const amount = parseFloat(stockAmount)

      // Actualizar stock y refrescar datos
      await actualizarStock(selectedMaterial.id, amount, stockReason)

      // Refrescar la lista de materiales para mostrar los cambios
      await cargarMateriales()

      // Cerrar modal y limpiar estado
      setShowStockModal(false)
      setSelectedMaterial(null)
      setStockAmount('')
      setStockReason('')
    } catch (err) {
      console.error('Error al actualizar stock:', err)
    } finally {
      setUpdatingStock(false)
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

  if (loading && materiales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-muted-foreground text-lg gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary"></div>
        <span>Cargando materiales...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-5 space-y-6">
      {/* Controles de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 max-w-2xl">
          <Input
            type="text"
            placeholder="Buscar por nombre, código o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las categorías</SelectItem>
              {categorias.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={(value: any) => setStockFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el stock</SelectItem>
              <SelectItem value="low">Stock bajo</SelectItem>
              <SelectItem value="out">Sin stock</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate('/materia-prima/nueva')}>
            ➕ Nuevo Material
          </Button>
        </div>
      </div>

      {/* Panel de errores mejorado */}
      <MateriaPrimaErrorDisplay
        error={error}
        onDismiss={clearError}
        onRecovery={handleRecovery}
      />

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardDescription className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
              Total Materiales
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-blue-500 mb-1">{estadisticas.total}</div>
            <p className="text-muted-foreground text-sm">Materiales registrados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <CardDescription className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
              Stock Bajo
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-amber-500 mb-1">{estadisticas.bajoStock}</div>
            <p className="text-muted-foreground text-sm">Necesitan reabastecer</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardDescription className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
              Sin Stock
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-red-500 mb-1">{estadisticas.sinStock}</div>
            <p className="text-muted-foreground text-sm">Agotados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-3">
            <CardDescription className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
              Valor Total
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-emerald-500 mb-1">
              ${estadisticas.valorTotal.toFixed(2)}
            </div>
            <p className="text-muted-foreground text-sm">Valor del inventario</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de materiales */}
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <TooltipProvider>
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-center">Disponibilidad</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materialesFiltrados.map((material) => {
              if (!material || !material.id) return null

              const codigoBarras = safeGet(material, 'codigo_barras', 'N/A')
              const nombre = safeGet(material, 'nombre', 'Sin nombre')
              const marca = safeGet(material, 'marca', '-')
              const categoria = safeGet(material, 'categoria', '-')
              const stockActual = safeGet(material, 'stock_actual', 0)
              const stockMinimo = safeGet(material, 'stock_minimo', 0)
              const stockStatus = getStockStatus(material)

              return (
                <TableRow
                  key={material.id}
                  className={selectedMaterial?.id === material.id ? 'bg-muted/50' : ''}
                >
                  <TableCell className="font-medium">{codigoBarras}</TableCell>
                  <TableCell>{nombre}</TableCell>
                  <TableCell>{marca}</TableCell>
                  <TableCell>{categoria}</TableCell>
                  <TableCell className="text-center">
                    <div className="font-medium">{stockActual}</div>
                    <div className="text-sm text-muted-foreground">/ {stockMinimo}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        stockStatus === 'normal' ? 'default' :
                        stockStatus === 'low' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {stockStatus === 'normal' && '✅ Normal'}
                      {stockStatus === 'low' && '⚠️ Bajo'}
                      {stockStatus === 'out' && '❌ Agotado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStockAsNumber(material) > 0 ? (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                        ❌ No eliminable
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        ✅ Puede eliminar
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewModal(material)}
                        title="Ver detalles"
                      >
                        👁️
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(material)}
                        title="Editar"
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openStockModal(material)}
                        title="Ajustar stock"
                      >
                        📦
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(material)}
                            className={
                              getStockAsNumber(material) > 0
                                ? "text-muted-foreground cursor-not-allowed opacity-50"
                                : "text-destructive hover:text-destructive hover:bg-destructive/10"
                            }
                          >
                            🗑️
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {getStockAsNumber(material) > 0
                              ? "No se puede eliminar: tiene stock disponible"
                              : "Eliminar material"
                            }
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          </Table>
        </TooltipProvider>

        {materialesFiltrados.length === 0 && !loading && (
          <div className="text-center p-10 text-muted-foreground">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium mb-2">No se encontraron materiales</h3>
            <p className="mb-4">
              {searchTerm || categoriaFilter || stockFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay materiales registrados'}
            </p>
            <Button onClick={() => navigate('/materia-prima/nueva')}>
              ➕ Crear primer material
            </Button>
          </div>
        )}
      </div>

          {/* Modal de confirmación de eliminación */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🗑️ Eliminar Material
            </DialogTitle>
            <DialogDescription>
              Confirmación para eliminar un material del inventario. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p><strong>¿Estás seguro de que deseas eliminar este material?</strong></p>
            <p>Este proceso no se puede deshacer.</p>

            <div className="space-y-2 text-sm">
              <p><strong>Material:</strong> {safeGet(selectedMaterial, 'nombre', 'N/A')}</p>
              <p><strong>Código:</strong> {safeGet(selectedMaterial, 'codigo_barras', 'N/A')}</p>
              <p><strong>Stock actual:</strong>
                <span className={
                  getStockAsNumber(selectedMaterial) > 0
                    ? 'text-red-600 font-bold ml-2'
                    : 'text-green-600 font-bold ml-2'
                }>
                  {getStockAsNumber(selectedMaterial)} unidades
                </span>
              </p>
            </div>

            {/* Warning for materials with stock */}
            {selectedMaterial && getStockAsNumber(selectedMaterial) > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-yellow-800">
                  <span className="text-lg">⚠️</span>
                  <strong>Advertencia de Inventario</strong>
                </div>
                <p className="text-yellow-700 text-sm">
                  Este material tiene {getStockAsNumber(selectedMaterial)} unidades en stock.
                  Por políticas de control de inventario, <strong>no se pueden eliminar materiales con stock disponible</strong>.
                </p>
                <p className="text-yellow-700 text-sm">
                  Para eliminar este material, primero debe ajustar su stock a cero usando la opción
                  <strong> "📦 Ajustar Stock"</strong>.
                </p>
              </div>
            )}

            {/* Warning for materials without stock */}
            {selectedMaterial && getStockAsNumber(selectedMaterial) === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-800">
                  <span className="text-lg">✅</span>
                  <span className="text-sm">Este material puede ser eliminado (stock: 0)</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || (selectedMaterial && getStockAsNumber(selectedMaterial) > 0)}
              title={selectedMaterial && getStockAsNumber(selectedMaterial) > 0
                ? "No se puede eliminar: tiene stock disponible"
                : "Eliminar material"
              }
            >
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
            <DialogDescription>
              Ajustar la cantidad de stock para el material seleccionado. Especifique la cantidad y el motivo del ajuste.
            </DialogDescription>
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
              <p className="text-xs text-muted-foreground">
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
              disabled={!stockAmount || !stockReason || updatingStock}
            >
              {updatingStock && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-primary mr-2"></div>
              )}
              {updatingStock ? 'Actualizando...' : 'Actualizar Stock'}
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
            <DialogDescription>
              Vista detallada de toda la información del material seleccionado, incluyendo especificaciones y datos de inventario.
            </DialogDescription>
          </DialogHeader>
          <div>
            {loadingDetalle ? (
              <div className="text-center p-10 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary mx-auto mb-4"></div>
                <p>Cargando detalles...</p>
              </div>
            ) : detalleError ? (
              <div className="bg-destructive/15 border border-destructive/50 text-destructive p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">⚠️</div>
                {detalleError}
              </div>
            ) : materialDetalle ? (
              <div className="space-y-6">
                {/* Información básica */}
                <div>
                  <h4 className="text-foreground mb-4 pb-2 border-b">
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
                  <h4 className="text-foreground mb-4 pb-2 border-b">
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
                  <h4 className="text-foreground mb-4 pb-2 border-b">
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
                      <span className="text-muted-foreground">
                        {materialDetalle.descripcion}
                      </span>
                    </div>
                  )}
                </div>

                {/* Fechas de auditoría */}
                <div>
                  <h4 className="text-foreground mb-4 pb-2 border-b">
                    🕒 Información de Auditoría
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
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

export default GestionMateriaPrima