import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toastService } from '@/lib/toastService'
import { useConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { LoadingState } from '@/components/feedback/LoadingState'
import { FormError } from '@/components/feedback/FormError'
import MaterialTable from '@/components/tables/MaterialTable'
import MaterialForm from '@/components/forms/MaterialForm'
import MovementForm from '@/components/forms/MovementForm'

// Icons
import { Package, Plus, Edit, Trash2, ArrowUpDown, AlertTriangle, CheckCircle } from 'lucide-react'

// Types - Mock data para demostración
const mockMateriales = [
  {
    id: '1',
    codigo_barras: '1234567890123',
    nombre: 'Cemento Portland',
    marca: 'Argos',
    modelo: 'Tipo II',
    presentacion: 'Saco 50kg',
    stock_actual: 150,
    stock_minimo: 20,
    costo_unitario: 120.50,
    fecha_caducidad: null,
    imagen_url: null,
    descripcion: 'Cemento de alta resistencia para construcción',
    categoria: 'Materiales de construcción',
    proveedor_id: 'prov-1',
  },
  {
    id: '2',
    codigo_barras: '9876543210987',
    nombre: 'Varilla Corrugada',
    marca: 'Ternium',
    modelo: '#3',
    presentacion: 'Varilla 12m',
    stock_actual: 8,
    stock_minimo: 15,
    costo_unitario: 85.75,
    fecha_caducidad: null,
    imagen_url: null,
    descripcion: 'Varilla de acero para refuerzo estructural',
    categoria: 'Materiales de construcción',
    proveedor_id: 'prov-2',
  },
  {
    id: '3',
    codigo_barras: '5555666677777',
    nombre: 'Pintura Látex',
    marca: 'Comex',
    modelo: 'Premium',
    presentacion: 'Galón 3.78L',
    stock_actual: 0,
    stock_minimo: 10,
    costo_unitario: 145.00,
    fecha_caducidad: new Date('2024-12-31'),
    imagen_url: null,
    descripcion: 'Pintura de interior lavable',
    categoria: 'Acabados',
    proveedor_id: 'prov-3',
  },
]

const mockProveedores = [
  { id: 'prov-1', nombre: 'Constructora del Norte', rfc: 'CNM123456' },
  { id: 'prov-2', nombre: 'Aceros del Pacífico', rfc: 'ADP789012' },
  { id: 'prov-3', nombre: 'Distribuidora de Pinturas', rfc: 'DDP345678' },
]

/**
 * Ejemplo completo de gestión de materiales con todos los componentes ISO 9241
 */
export const MaterialManagementExample: React.FC = () => {
  const [materiales, setMateriales] = useState(mockMateriales)
  const [loading, setLoading] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [activeTab, setActiveTab] = useState('tabla')
  const [formErrors, setFormErrors] = useState(null)
  const [showMovementForm, setShowMovementForm] = useState(false)

  const { showConfirm, ConfirmDialog } = useConfirmDialog()

  // Simular carga de datos
  const loadMateriales = async () => {
    setLoading(true)
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      setMateriales(mockMateriales)
      toastService.success('Materiales cargados exitosamente')
    } catch (error) {
      toastService.error('Error al cargar materiales', {
        description: 'No se pudo cargar la lista de materiales',
        action: {
          label: 'Reintentar',
          onClick: loadMateriales,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  // Handlers para la tabla
  const handleEditMaterial = (material: any) => {
    setSelectedMaterial(material)
    setActiveTab('formulario')
    toastService.info(`Editando: ${material.nombre}`)
  }

  const handleDeleteMaterial = async (material: any) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      showConfirm({
        title: `Eliminar ${material.nombre}`,
        description: `¿Estás seguro que deseas eliminar "${material.nombre}"? Esta acción no se puede deshacer.`,
        type: 'destructive',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })

    if (confirmed) {
      setLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setMateriales(prev => prev.filter(m => m.id !== material.id))
        toastService.crud.delete('Material', material)
      } catch (error) {
        toastService.crud.error('Material', 'eliminar', error as Error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleViewMaterial = (material: any) => {
    toastService.info(`Detalles de: ${material.nombre}`, {
      description: `Stock: ${material.stock_actual} | Código: ${material.codigo_barras}`,
    })
  }

  const handleStockUpdate = (material: any) => {
    setSelectedMaterial(material)
    setShowMovementForm(true)
  }

  // Handlers para formularios
  const handleMaterialSubmit = async (data: any) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (selectedMaterial) {
        // Actualizar material existente
        setMateriales(prev => prev.map(m =>
          m.id === selectedMaterial.id ? { ...m, ...data } : m
        ))
        toastService.crud.update('Material', data)
      } else {
        // Crear nuevo material
        const nuevoMaterial = {
          ...data,
          id: Date.now().toString(),
        }
        setMateriales(prev => [...prev, nuevoMaterial])
        toastService.crud.create('Material', nuevoMaterial)
      }

      setSelectedMaterial(null)
      setActiveTab('tabla')
    } catch (error) {
      toastService.crud.error('Material', 'guardar', error as Error)
      setFormErrors({
        general: 'Error al guardar el material',
        codigo_barras: 'Este código ya existe',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMovementSubmit = async (data: any) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Simular actualización de stock
      setMateriales(prev => prev.map(m => {
        if (m.id === data.materiaPrimaId) {
          const material = prev.find(p => p.id === data.materiaPrimaId)
          if (material) {
            const stockActual = material.stock_actual
            const nuevoStock = data.tipo === 'ENTRADA'
              ? stockActual + data.cantidad
              : stockActual - data.cantidad

            return { ...m, stock_actual: nuevoStock }
          }
        }
        return m
      }))

      toastService.success('Movimiento registrado', {
        description: `Stock actualizado correctamente`,
      })

      setShowMovementForm(false)
    } catch (error) {
      toastService.crud.error('Movimiento', 'registrar', error as Error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelForm = () => {
    setSelectedMaterial(null)
    setFormErrors(null)
    setActiveTab('tabla')
  }

  // Estadísticas
  const stats = React.useMemo(() => {
    const total = materiales.length
    const sinStock = materiales.filter(m => m.stock_actual === 0).length
    const stockBajo = materiales.filter(m => m.stock_actual <= m.stock_minimo && m.stock_actual > 0).length
    const valorTotal = materiales.reduce((sum, m) => sum + (m.stock_actual * (m.costo_unitario || 0)), 0)

    return { total, sinStock, stockBajo, valorTotal }
  }, [materiales])

  // Cargar datos al montar
  useEffect(() => {
    loadMateriales()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Materiales</h1>
          <p className="text-gray-600 mt-1">
            Sistema integral de control de inventario - Fase 2 ISO 9241
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedMaterial(null)
            setActiveTab('formulario')
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo Material
        </Button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Materiales</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sin Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.sinStock}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.stockBajo}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">${stats.valorTotal.toFixed(2)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tabla" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Lista de Materiales
          </TabsTrigger>
          <TabsTrigger value="formulario" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            {selectedMaterial ? 'Editar Material' : 'Nuevo Material'}
          </TabsTrigger>
          <TabsTrigger value="movimiento" className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Movimientos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tabla" className="space-y-4">
          {loading ? (
            <LoadingState
              type="skeleton"
              text="Cargando materiales..."
              size="lg"
            />
          ) : (
            <MaterialTable
              data={materiales}
              onEdit={handleEditMaterial}
              onDelete={handleDeleteMaterial}
              onView={handleViewMaterial}
              onStockUpdate={handleStockUpdate}
              loading={loading}
            />
          )}
        </TabsContent>

        <TabsContent value="formulario" className="space-y-4">
          {formErrors && (
            <FormError
              errors={formErrors}
              message="Hay errores en el formulario que deben ser corregidos"
              severity="error"
              dismissible
              onDismiss={() => setFormErrors(null)}
              fieldMapping={{
                codigo_barras: 'Código de Barras',
                nombre: 'Nombre del Material',
              }}
            />
          )}

          <MaterialForm
            material={selectedMaterial}
            proveedores={mockProveedores}
            onSubmit={handleMaterialSubmit}
            onCancel={handleCancelForm}
            loading={loading}
            error={formErrors?.general}
          />
        </TabsContent>

        <TabsContent value="movimiento" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Registra movimientos de entrada, salida o ajuste de inventario para los materiales existentes.
            </AlertDescription>
          </Alert>

          <MovementForm
            materiales={materiales}
            onSubmit={handleMovementSubmit}
            onCancel={() => setShowMovementForm(false)}
            loading={loading}
            currentUserId="user-1"
          />
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmación */}
      <ConfirmDialog />

      {/* Demo de accesibilidad - Mensaje informativo */}
      <Alert className="mt-6">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Características ISO 9241 implementadas:</strong>{' '}
          Navegación por teclado completa, lectores de pantalla compatibles,
          validación en tiempo real, feedback claro y descriptivo,
          y conformidad con WCAG 2.1 AA.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default MaterialManagementExample