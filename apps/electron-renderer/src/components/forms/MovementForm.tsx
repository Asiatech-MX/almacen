import React, { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addDays } from 'date-fns'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

// Icons
import { ArrowDown, ArrowUp, Package, AlertTriangle, Check, X, Calculator, Calendar, FileText, User } from 'lucide-react'

// Types
import type { MateriaPrima } from '@/shared/types/materiaPrima'
import type { StockMovementData } from '@/shared/types/materiaPrima'

// Movement type options
type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE'
type MovementReason =
  | 'compra' | 'devolucion' | 'ajuste_positivo' | 'produccion'
  | 'venta' | 'merma' | 'ajuste_negativo' | 'prestamo' | 'otro'

// Zod Schema para validación robusta
const movementFormSchema = z.object({
  materiaPrimaId: z
    .string()
    .uuid('ID de material inválido')
    .min(1, 'Debe seleccionar un material'),
  tipo: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE'], {
    required_error: 'Debe seleccionar un tipo de movimiento',
  }),
  cantidad: z
    .coerce
    .number()
    .min(0.01, 'La cantidad debe ser mayor a 0')
    .max(99999, 'Máximo 99,999 unidades'),
  razon: z
    .string()
    .min(1, 'La razón es requerida')
    .max(200, 'Máximo 200 caracteres'),
  motivo: z
    .string()
    .min(5, 'El motivo debe tener al menos 5 caracteres')
    .max(500, 'Máximo 500 caracteres'),
  fecha_movimiento: z
    .string()
    .datetime('Fecha inválida')
    .transform((val) => val ? new Date(val) : null),
  usuario_id: z
    .string()
    .uuid('ID de usuario inválido')
    .optional(),
  referencia_documento: z
    .string()
    .max(50, 'Máximo 50 caracteres')
    .optional()
    .nullable(),
  observaciones: z
    .string()
    .max(1000, 'Máximo 1000 caracteres')
    .optional()
    .nullable(),
}).superRefine((data, ctx) => {
  // Validación personalizada según tipo de movimiento
  if (data.tipo === 'SALIDA' && data.materiaPrimaId) {
    // Esta validación se hará en el componente con el stock actual
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debe verificar el stock disponible',
      path: ['cantidad']
    })
  }

  // Validación de fecha futura para entradas
  if (data.tipo === 'ENTRADA' && data.fecha_movimiento && data.fecha_movimiento > addDays(new Date(), 30)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Las fechas futuras no pueden ser mayores a 30 días',
      path: ['fecha_movimiento']
    })
  }
})

type MovementFormValues = z.infer<typeof movementFormSchema>

export interface MovementFormProps {
  materiales: MateriaPrima[]
  movementType?: MovementType // Forzar un tipo específico
  materialId?: string // Material preseleccionado
  onSubmit: (data: MovementFormValues) => Promise<void>
  onCancel: () => void
  loading?: boolean
  error?: string | null
  currentUserId?: string // ID del usuario actual
  className?: string
}

// Razones predefinidas por tipo de movimiento
const MOVEMENT_REASONS: Record<MovementType, { value: MovementReason; label: string; description: string }[]> = {
  ENTRADA: [
    { value: 'compra', label: 'Compra', description: 'Material adquirido a proveedor' },
    { value: 'devolucion', label: 'Devolución', description: 'Material devuelto por cliente' },
    { value: 'ajuste_positivo', label: 'Ajuste Positivo', description: 'Corrección de inventario (+)' },
    { value: 'produccion', label: 'Producción', description: 'Material producido internamente' },
    { value: 'otro', label: 'Otro', description: 'Otra razón de entrada' },
  ],
  SALIDA: [
    { value: 'venta', label: 'Venta', description: 'Material vendido a cliente' },
    { value: 'produccion', label: 'Producción', description: 'Material utilizado en producción' },
    { value: 'merma', label: 'Merma', description: 'Pérdida o daño de material' },
    { value: 'ajuste_negativo', label: 'Ajuste Negativo', description: 'Corrección de inventario (-)' },
    { value: 'prestamo', label: 'Préstamo', description: 'Material prestado temporalmente' },
    { value: 'otro', label: 'Otro', description: 'Otra razón de salida' },
  ],
  AJUSTE: [
    { value: 'ajuste_positivo', label: 'Ajuste Positivo', description: 'Incremento de stock por corrección' },
    { value: 'ajuste_negativo', label: 'Ajuste Negativo', description: 'Decremento de stock por corrección' },
    { value: 'otro', label: 'Otro', description: 'Otro tipo de ajuste' },
  ],
}

export const MovementForm: React.FC<MovementFormProps> = ({
  materiales,
  movementType,
  materialId,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  currentUserId = '',
  className,
}) => {
  // Estados locales
  const [selectedMaterial, setSelectedMaterial] = useState<MateriaPrima | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [movementPreview, setMovementPreview] = useState<MovementFormValues | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  // Configuración del formulario con React Hook Form
  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      materiaPrimaId: materialId || '',
      tipo: movementType || 'ENTRADA',
      cantidad: 1,
      razon: '',
      motivo: '',
      fecha_movimiento: format(new Date(), 'yyyy-MM-dd'),
      usuario_id: currentUserId,
      referencia_documento: '',
      observaciones: '',
    },
    mode: 'onChange',
  })

  // Watch para cálculos automáticos
  const watchedMaterialId = form.watch('materiaPrimaId')
  const watchedTipo = form.watch('tipo')
  const watchedCantidad = form.watch('cantidad')
  const watchedRazon = form.watch('razon')

  // Encontrar material seleccionado
  useEffect(() => {
    if (watchedMaterialId && materiales.length > 0) {
      const material = materiales.find(m => m.id === watchedMaterialId)
      setSelectedMaterial(material || null)
    } else {
      setSelectedMaterial(null)
    }
  }, [watchedMaterialId, materiales])

  // Validación personalizada de stock disponible
  const validateStockDisponible = useCallback(() => {
    if (!selectedMaterial || watchedTipo !== 'SALIDA') return true

    const stockDisponible = selectedMaterial.stock_actual
    const nuevoStock = stockDisponible - watchedCantidad

    return nuevoStock >= 0
  }, [selectedMaterial, watchedTipo, watchedCantidad])

  // Calcular nuevo stock
  const calculateNewStock = useCallback(() => {
    if (!selectedMaterial) return null

    const stockActual = selectedMaterial.stock_actual
    const stockMinimo = selectedMaterial.stock_minimo

    let nuevoStock: number
    if (watchedTipo === 'ENTRADA') {
      nuevoStock = stockActual + watchedCantidad
    } else if (watchedTipo === 'SALIDA') {
      nuevoStock = stockActual - watchedCantidad
    } else { // AJUSTE
      // Para ajustes, se determinará según la razón
      if (watchedRazon.includes('positivo')) {
        nuevoStock = stockActual + watchedCantidad
      } else if (watchedRazon.includes('negativo')) {
        nuevoStock = stockActual - watchedCantidad
      } else {
        nuevoStock = stockActual // Por defecto no cambia
      }
    }

    return {
      actual: stockActual,
      nuevo: nuevoStock,
      minimo: stockMinimo,
      diferencia: nuevoStock - stockActual,
      estado: nuevoStock <= stockMinimo ? 'bajo' : nuevoStock === 0 ? 'agotado' : 'normal'
    }
  }, [selectedMaterial, watchedTipo, watchedCantidad, watchedRazon])

  const stockPreview = calculateNewStock()

  // Submit handler con confirmación
  const handlePreviewSubmit = useCallback(async (values: MovementFormValues) => {
    // Validar stock disponible para salidas
    if (values.tipo === 'SALIDA' && !validateStockDisponible()) {
      form.setError('cantidad', {
        type: 'manual',
        message: `Stock insuficiente. Disponible: ${selectedMaterial?.stock_actual || 0} unidades`
      })
      return
    }

    setMovementPreview(values)
    setShowConfirmation(true)
  }, [form, selectedMaterial, validateStockDisponible])

  const handleConfirmSubmit = useCallback(async () => {
    if (!movementPreview) return

    try {
      await onSubmit(movementPreview)
      setShowConfirmation(false)
    } catch (error) {
      console.error('Error submitting movement:', error)
    }
  }, [movementPreview, onSubmit])

  // Renderizado de información del material
  const renderMaterialInfo = () => {
    if (!selectedMaterial) return null

    return (
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-600" />
          <span className="font-medium">{selectedMaterial.nombre}</span>
          <Badge variant="outline">{selectedMaterial.codigo_barras}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Stock actual:</span>
            <span className="ml-2 font-medium">{selectedMaterial.stock_actual}</span>
          </div>
          <div>
            <span className="text-gray-600">Stock mínimo:</span>
            <span className="ml-2 font-medium">{selectedMaterial.stock_minimo}</span>
          </div>
          <div>
            <span className="text-gray-600">Presentación:</span>
            <span className="ml-2 font-medium">{selectedMaterial.presentacion}</span>
          </div>
        </div>
      </div>
    )
  }

  // Renderizado de preview del movimiento
  const renderMovementPreview = () => {
    if (!stockPreview) return null

    const { actual, nuevo, diferencia, estado } = stockPreview

    return (
      <div className={`p-4 rounded-lg border-2 ${
        estado === 'agotado' ? 'border-red-300 bg-red-50' :
        estado === 'bajo' ? 'border-yellow-300 bg-yellow-50' :
        'border-green-300 bg-green-50'
      }`}>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Previsualización del Movimiento
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Stock actual:</span>
            <div className="font-medium text-lg">{actual}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Nuevo stock:</span>
            <div className={`font-medium text-lg ${
              estado === 'agotado' ? 'text-red-600' :
              estado === 'bajo' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {nuevo}
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t">
          <span className="text-sm text-gray-600">Diferencia:</span>
          <span className={`ml-2 font-medium ${
            diferencia > 0 ? 'text-green-600' :
            diferencia < 0 ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {diferencia > 0 ? '+' : ''}{diferencia}
          </span>
        </div>
        {estado !== 'normal' && (
          <Alert className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {estado === 'agotado' ? '⚠️ El material quedará agotado' :
               estado === 'bajo' ? '⚠️ El material quedará con stock bajo' : ''}
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // Pasos del formulario para mejor UX
  const formSteps = [
    { id: 0, title: 'Tipo y Material', description: 'Selecciona el tipo de movimiento y material' },
    { id: 1, title: 'Cantidad y Razón', description: 'Especifica la cantidad y motivo del movimiento' },
    { id: 2, title: 'Detalles Adicionales', description: 'Agrega información complementaria' },
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {watchedTipo === 'ENTRADA' && <ArrowDown className="h-5 w-5 text-green-600" />}
            {watchedTipo === 'SALIDA' && <ArrowUp className="h-5 w-5 text-red-600" />}
            {watchedTipo === 'AJUSTE' && <Calculator className="h-5 w-5 text-blue-600" />}
            Movimiento de Inventario
          </CardTitle>

          <Badge variant={watchedTipo === 'ENTRADA' ? 'default' : watchedTipo === 'SALIDA' ? 'destructive' : 'secondary'}>
            {watchedTipo === 'ENTRADA' ? 'Entrada' : watchedTipo === 'SALIDA' ? 'Salida' : 'Ajuste'}
          </Badge>
        </div>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            {formSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.id + 1}
                </div>
                <span className="ml-2 hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={(currentStep + 1) / formSteps.length * 100} className="h-2" />
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form className="space-y-6">
            {currentStep === 0 && (
              <Tabs value={watchedTipo} onValueChange={(value) => form.setValue('tipo', value as MovementType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ENTRADA" className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4" />
                    Entrada
                  </TabsTrigger>
                  <TabsTrigger value="SALIDA" className="flex items-center gap-2">
                    <ArrowUp className="h-4 w-4" />
                    Salida
                  </TabsTrigger>
                  <TabsTrigger value="AJUSTE" className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Ajuste
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={watchedTipo} className="space-y-4">
                  {/* Material Selection */}
                  <FormField
                    control={form.control}
                    name="materiaPrimaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            if (value) setCurrentStep(1) // Auto avanzar al siguiente paso
                          }}
                          defaultValue={field.value || ''}
                          disabled={loading || materiales.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un material..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {materiales.map((material) => (
                              <SelectItem key={material.id} value={material.id}>
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">{material.nombre}</div>
                                    <div className="text-xs text-gray-500">
                                      Stock: {material.stock_actual} | {material.presentacion}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Selecciona el material para este movimiento
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {materiales.length === 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No hay materiales disponibles. Registra primero algunos materiales en el inventario.
                      </AlertDescription>
                    </Alert>
                  )}

                  {renderMaterialInfo()}
                </TabsContent>
              </Tabs>
            )}

            {currentStep === 1 && selectedMaterial && (
              <div className="space-y-4">
                {/* Cantidad */}
                <FormField
                  control={form.control}
                  name="cantidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0.01"
                          max="99999"
                          step="1"
                          placeholder="1"
                          aria-invalid={!!form.formState.errors.cantidad}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Cantidad de unidades a {watchedTipo === 'ENTRADA' ? 'agregar' : watchedTipo === 'SALIDA' ? 'retirar' : 'ajustar'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Razón */}
                <FormField
                  control={form.control}
                  name="razon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón del Movimiento *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || ''}
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una razón..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOVEMENT_REASONS[watchedTipo].map((razon) => (
                            <SelectItem key={razon.value} value={razon.value}>
                              <div>
                                <div className="font-medium">{razon.label}</div>
                                <div className="text-xs text-gray-500">{razon.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Razón principal por la cual se realiza este movimiento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Motivo Detallado */}
                <FormField
                  control={form.control}
                  name="motivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo Detallado *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe el motivo específico del movimiento..."
                          rows={3}
                          aria-invalid={!!form.formState.errors.motivo}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Proporciona detalles adicionales sobre este movimiento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {renderMovementPreview()}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                {/* Fecha del Movimiento */}
                <FormField
                  control={form.control}
                  name="fecha_movimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha del Movimiento *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          max={format(addDays(new Date(), watchedTipo === 'ENTRADA' ? 30 : 0), 'yyyy-MM-dd')}
                          aria-invalid={!!form.formState.errors.fecha_movimiento}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        {watchedTipo === 'ENTRADA' ?
                          'Fecha en que se recibió o se recibirá el material' :
                          'Fecha en que se realizó o se realizará el movimiento'
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Referencia de Documento */}
                <FormField
                  control={form.control}
                  name="referencia_documento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referencia de Documento</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: Factura #123, Orden #456"
                          value={field.value || ''}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Número de factura, orden de compra u otro documento de referencia
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Observaciones */}
                <FormField
                  control={form.control}
                  name="observaciones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Notas adicionales sobre el movimiento..."
                          rows={3}
                          value={field.value || ''}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Información adicional que sea relevante para este movimiento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Resumen final */}
                {stockPreview && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">Resumen del Movimiento</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Material:</span>
                        <span className="ml-2 font-medium text-blue-900">{selectedMaterial?.nombre}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Tipo:</span>
                        <span className="ml-2 font-medium text-blue-900">{watchedTipo}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Cantidad:</span>
                        <span className="ml-2 font-medium text-blue-900">{watchedCantidad}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Impacto en stock:</span>
                        <span className={`ml-2 font-medium ${
                          stockPreview.diferencia > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stockPreview.actual} → {stockPreview.nuevo}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Acciones */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    disabled={loading}
                  >
                    Anterior
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>

                {currentStep < formSteps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!watchedMaterialId || loading}
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={form.handleSubmit(handlePreviewSubmit)}
                    disabled={loading || !validateStockDisponible()}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Confirmar Movimiento
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>

        {/* Dialog de Confirmación */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Movimiento de Inventario</DialogTitle>
              <DialogDescription>
                Por favor confirma que la información es correcta antes de procesar el movimiento.
              </DialogDescription>
            </DialogHeader>

            {movementPreview && selectedMaterial && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Material:</span>
                      <div>{selectedMaterial.nombre}</div>
                    </div>
                    <div>
                      <span className="font-medium">Tipo:</span>
                      <div>{movementPreview.tipo}</div>
                    </div>
                    <div>
                      <span className="font-medium">Cantidad:</span>
                      <div>{movementPreview.cantidad}</div>
                    </div>
                    <div>
                      <span className="font-medium">Razón:</span>
                      <div>{MOVEMENT_REASONS[movementPreview.tipo].find(r => r.value === movementPreview.razon)?.label}</div>
                    </div>
                  </div>
                </div>

                {renderMovementPreview()}

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Esta acción modificará el inventario y no podrá deshacerse. ¿Deseas continuar?
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Movimiento
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default MovementForm