import React, { useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'

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
import { Skeleton } from '@/components/ui/skeleton'

// Icons
import { Save, X, Package, AlertTriangle, Check, Camera } from 'lucide-react'

// Types
import type { MateriaPrima, MateriaPrimaFormData, NewMateriaPrima, MateriaPrimaUpdate } from '@/shared/types/materiaPrima'
import type { Proveedor } from '@/shared/types/materiaPrima'

// Zod Schema para validación robusta
const materialFormSchema = z.object({
  codigo_barras: z
    .string()
    .min(1, 'El código de barras es requerido')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[A-Za-z0-9-]+$/, 'Solo se permiten letras, números y guiones'),
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]+$/, 'Solo se permiten letras, números, espacios y guiones'),
  marca: z
    .string()
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]*$/, 'Solo se permiten letras, números, espacios y guiones')
    .optional()
    .nullable(),
  modelo: z
    .string()
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]*$/, 'Solo se permiten letras, números, espacios y guiones')
    .optional()
    .nullable(),
  presentacion: z
    .string()
    .min(1, 'La presentación es requerida')
    .max(100, 'Máximo 100 caracteres'),
  stock_actual: z
    .coerce
    .number()
    .min(0, 'El stock no puede ser negativo')
    .max(99999, 'Máximo 99999 unidades')
    .default(0),
  stock_minimo: z
    .coerce
    .number()
    .min(0, 'El stock mínimo no puede ser negativo')
    .max(99999, 'Máximo 99999 unidades')
    .default(0),
  costo_unitario: z
    .coerce
    .number()
    .min(0, 'El costo no puede ser negativo')
    .max(999999, 'Máximo 999,999.00')
    .optional()
    .nullable(),
  fecha_caducidad: z
    .string()
    .datetime('Fecha inválida')
    .optional()
    .nullable()
    .transform((val) => val ? new Date(val) : null),
  imagen_url: z
    .string()
    .url('URL inválida')
    .optional()
    .nullable(),
  descripcion: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .nullable(),
  categoria: z
    .string()
    .max(50, 'Máximo 50 caracteres')
    .optional()
    .nullable(),
  proveedor_id: z
    .string()
    .uuid('ID de proveedor inválido')
    .optional()
    .nullable(),
}).superRefine((data, ctx) => {
  // Validación personalizada: stock mínimo no puede ser mayor al actual
  if (data.stock_minimo > data.stock_actual) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El stock mínimo no puede ser mayor al stock actual',
      path: ['stock_minimo']
    })
  }

  // Validación personalizada: fecha de caducidad no puede ser pasada
  if (data.fecha_caducidad && data.fecha_caducidad < new Date()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La fecha de caducidad no puede ser pasada',
      path: ['fecha_caducidad']
    })
  }
})

type MaterialFormValues = z.infer<typeof materialFormSchema>

export interface MaterialFormProps {
  material?: MateriaPrima // Para modo edición
  proveedores?: Proveedor[] // Lista de proveedores disponibles
  onSubmit: (data: MaterialFormValues) => Promise<void>
  onCancel: () => void
  loading?: boolean
  error?: string | null
  className?: string
}

// Categorías predefinidas
const CATEGORIAS_PREDEFINIDAS = [
  'Materiales de construcción',
  'Herramientas',
  'Equipos',
  'Suministros de oficina',
  'Limpiadores',
  'Seguridad',
  'Electricidad',
  'Plomería',
  'Otros'
]

export const MaterialForm: React.FC<MaterialFormProps> = ({
  material,
  proveedores = [],
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  className,
}) => {
  // Configuración del formulario con React Hook Form
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      codigo_barras: material?.codigo_barras || '',
      nombre: material?.nombre || '',
      marca: material?.marca || '',
      modelo: material?.modelo || '',
      presentacion: material?.presentacion || '',
      stock_actual: material?.stock_actual || 0,
      stock_minimo: material?.stock_minimo || 0,
      costo_unitario: material?.costo_unitario || null,
      fecha_caducidad: material?.fecha_caducidad
        ? format(new Date(material.fecha_caducidad), 'yyyy-MM-dd')
        : '',
      imagen_url: material?.imagen_url || '',
      descripcion: material?.descripcion || '',
      categoria: material?.categoria || '',
      proveedor_id: material?.proveedor_id || '',
    },
    mode: 'onChange', // Validación en tiempo real
  })

  // Watch para cálculos automáticos
  const watchedStockActual = form.watch('stock_actual')
  const watchedStockMinimo = form.watch('stock_minimo')
  const watchedCostoUnitario = form.watch('costo_unitario')

  // Calcular valor total del inventario
  const valorTotal = watchedStockActual * (watchedCostoUnitario || 0)

  // Estado del stock
  const stockStatus = React.useMemo(() => {
    if (!watchedStockActual) return { status: 'out', label: 'Sin stock', color: 'destructive' }
    if (watchedStockActual <= watchedStockMinimo) return { status: 'low', label: 'Stock bajo', color: 'secondary' }
    return { status: 'normal', label: 'Stock normal', color: 'default' }
  }, [watchedStockActual, watchedStockMinimo])

  // Submit handler
  const handleSubmit = useCallback(async (values: MaterialFormValues) => {
    try {
      await onSubmit(values)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }, [onSubmit])

  // Manejo de errores
  const formErrors = form.formState.errors
  const hasErrors = Object.keys(formErrors).length > 0

  // Efecto para actualizar validation cuando cambia el material
  useEffect(() => {
    if (material) {
      form.reset({
        codigo_barras: material.codigo_barras,
        nombre: material.nombre,
        marca: material.marca,
        modelo: material.modelo,
        presentacion: material.presentacion,
        stock_actual: material.stock_actual,
        stock_minimo: material.stock_minimo,
        costo_unitario: material.costo_unitario,
        fecha_caducidad: material.fecha_caducidad
          ? format(new Date(material.fecha_caducidad), 'yyyy-MM-dd')
          : '',
        imagen_url: material.imagen_url,
        descripcion: material.descripcion,
        categoria: material.categoria,
        proveedor_id: material.proveedor_id,
      })
    }
  }, [material, form])

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {material ? 'Editar Material' : 'Nuevo Material'}
          </CardTitle>

          <Badge variant={stockStatus.color as any}>
            {stockStatus.label}
          </Badge>
        </div>

        {material && (
          <div className="text-sm text-gray-600">
            Editando: <span className="font-medium">{material.nombre}</span>
            {material.codigo_barras && (
              <> | Código: <span className="font-mono">{material.codigo_barras}</span></>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasErrors && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Por favor corrige los errores en el formulario antes de continuar.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue="basico" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basico">Básico</TabsTrigger>
                <TabsTrigger value="inventario">Inventario</TabsTrigger>
                <TabsTrigger value="detalles">Detalles</TabsTrigger>
                <TabsTrigger value="proveedor">Proveedor</TabsTrigger>
              </TabsList>

              <TabsContent value="basico" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Código de Barras */}
                  <FormField
                    control={form.control}
                    name="codigo_barras"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código de Barras *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ej: 1234567890123"
                            aria-describedby="codigo_barras-help"
                            aria-invalid={!!formErrors.codigo_barras}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormDescription id="codigo_barras-help">
                          Código único para identificación del producto
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Nombre */}
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Material *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ej: Cemento Portland"
                            aria-invalid={!!formErrors.nombre}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Marca */}
                  <FormField
                    control={form.control}
                    name="marca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ej: Cementos Argos"
                            value={field.value || ''}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Modelo */}
                  <FormField
                    control={form.control}
                    name="modelo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ej: Tipo II"
                            value={field.value || ''}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Presentación */}
                  <FormField
                    control={form.control}
                    name="presentacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presentación *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ej: Saco 50kg"
                            aria-invalid={!!formErrors.presentacion}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Categoría */}
                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || ''}
                          disabled={loading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIAS_PREDEFINIDAS.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Descripción */}
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe el material, usos, características especiales..."
                          rows={3}
                          value={field.value || ''}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="inventario" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Stock Actual */}
                  <FormField
                    control={form.control}
                    name="stock_actual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Actual *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            max="99999"
                            placeholder="0"
                            aria-invalid={!!formErrors.stock_actual}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Stock Mínimo */}
                  <FormField
                    control={form.control}
                    name="stock_minimo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Mínimo *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            max="99999"
                            placeholder="0"
                            aria-invalid={!!formErrors.stock_minimo}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormDescription>
                          Alertar cuando el stock llegue a este nivel
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Costo Unitario */}
                  <FormField
                    control={form.control}
                    name="costo_unitario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo Unitario</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormDescription>
                          Valor por unidad en moneda local
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Fecha de Caducidad */}
                  <FormField
                    control={form.control}
                    name="fecha_caducidad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Caducidad</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            value={field.value || ''}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            aria-invalid={!!formErrors.fecha_caducidad}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormDescription>
                          Para productos perecederos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Resumen de valor */}
                {watchedCostoUnitario && watchedCostoUnitario > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Resumen de Valor</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Valor total actual:</span>
                        <span className="ml-2 font-medium text-blue-900">
                          ${valorTotal.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">Costo unitario:</span>
                        <span className="ml-2 font-medium text-blue-900">
                          ${watchedCostoUnitario.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="detalles" className="space-y-4">
                {/* URL de Imagen */}
                <FormField
                  control={form.control}
                  name="imagen_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de Imagen</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://ejemplo.com/imagen.jpg"
                          value={field.value || ''}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Enlace a una imagen del material
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Preview de imagen si existe */}
                {form.watch('imagen_url') && (
                  <div className="border rounded-lg p-4">
                    <Label className="text-sm font-medium">Vista previa de imagen</Label>
                    <div className="mt-2">
                      <img
                        src={form.watch('imagen_url')!}
                        alt="Vista previa"
                        className="h-32 w-32 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                        onLoad={(e) => {
                          e.currentTarget.style.display = 'block'
                        }}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="proveedor" className="space-y-4">
                {/* Proveedor */}
                <FormField
                  control={form.control}
                  name="proveedor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || ''}
                        disabled={loading || proveedores.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un proveedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {proveedores.map((proveedor) => (
                            <SelectItem key={proveedor.id} value={proveedor.id}>
                              {proveedor.nombre} {proveedor.rfc && `(${proveedor.rfc})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Proveedor principal de este material
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {proveedores.length === 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          No hay proveedores registrados. Contacta al administrador para agregar proveedores.
                        </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>

            {/* Acciones */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-sm text-gray-500">
                Los campos marcados con * son obligatorios
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  aria-label="Cancelar y volver"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={loading || hasErrors}
                  aria-label={material ? 'Actualizar material' : 'Crear nuevo material'}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {material ? 'Actualizar' : 'Crear'} Material
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default MaterialForm