"use client"

import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MaskInput } from '@/components/ui/mask-input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FieldSet, FieldLegend, FieldGroup, FieldContent, FieldTitle, FieldDescription, FieldError, Field, FieldSeparator } from '@/components/ui/fieldset'

import useMateriaPrima, { UseMateriaPrimaOptions } from '../../hooks/useMateriaPrima'
import type {
  MateriaPrimaDetail,
  NewMateriaPrima,
  MateriaPrimaUpdate
} from '../../../../shared/types/materiaPrima'
import {
  prepareFormDataForSubmission,
  extractValidationErrors
} from '../../utils/formDataNormalizer'

const presentaciones = [
  'Unidad',
  'Caja',
  'Paquete',
  'Saco',
  'Bolsa',
  'Kilogramo',
  'Gramo',
  'Litro',
  'Mililitro',
  'Metro',
  'Centímetro',
  'Rollo',
  'Tubo',
  'Botella',
  'Frasco'
]

const categorias = [
  'Construcción',
  'Electricidad',
  'Plomería',
  'Pinturas',
  'Herramientas',
  'Ferretería',
  'Limpieza',
  'Oficina',
  'Seguridad',
  'Jardinería',
  'Automotriz',
  'Electrónica',
  'Otros'
]

// Función para validar dígito de control EAN-13
const validateEAN13 = (barcode: string): boolean => {
  // Remove any non-digit characters
  const digits = barcode.replace(/\D/g, '');

  // Must be exactly 13 digits
  if (digits.length !== 13) return false;

  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checksum = (10 - (sum % 10)) % 10;

  return checksum === parseInt(digits[12]);
};

// Schema Zod para validación
const materiaPrimaSchema = z.object({
  codigo_barras: z.string()
    .min(13, 'El código de barras debe tener exactamente 13 dígitos')
    .max(13, 'El código de barras debe tener exactamente 13 dígitos')
    .regex(/^\d{13}$/, 'El código de barras debe contener solo números')
    .refine((barcode) => validateEAN13(barcode), 'Código de barras EAN-13 inválido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  presentacion: z.string().min(1, 'La presentación es requerida'),
  stock_actual: z.number().min(0, 'El stock actual no puede ser negativo'),
  stock_minimo: z.number().min(0, 'El stock mínimo no puede ser negativo'),
  costo_unitario: z.number().nullable().optional(),
  fecha_caducidad: z.string().nullable().optional(),
  imagen_url: z.string().nullable().optional(),
  descripcion: z.string().optional(),
  categoria: z.string().optional(),
  proveedor_id: z.string().nullable().optional()
})

type MateriaPrimaFormData = z.infer<typeof materiaPrimaSchema>

interface FormularioMateriaPrimaProps {
  materialId?: string
  onSave?: (material: MateriaPrimaDetail) => void
  onCancel?: () => void
}

export const MateriaPrimaFormulario: React.FC<FormularioMateriaPrimaProps> = ({
  materialId,
  onSave,
  onCancel
}) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const esEdicion = Boolean(materialId || id)
  const finalId = materialId || id

  const {
    crearMaterial,
    actualizarMaterial,
    obtenerMaterial,
    loading,
    error,
    clearError
  } = useMateriaPrima({ autoLoad: false })

  const [success, setSuccess] = useState(false)
  const [imagePreviewError, setImagePreviewError] = useState(false)

  // Configuración de React Hook Form
  const form = useForm<MateriaPrimaFormData>({
    resolver: zodResolver(materiaPrimaSchema),
    defaultValues: {
      codigo_barras: '',
      nombre: '',
      marca: '',
      modelo: '',
      presentacion: 'Unidad',
      stock_actual: 0,
      stock_minimo: 0,
      costo_unitario: null,
      fecha_caducidad: '',
      imagen_url: '',
      descripcion: '',
      categoria: '',
      proveedor_id: null
    },
    mode: 'onChange'
  })

  useEffect(() => {
    if (esEdicion && finalId) {
      cargarMateriaPrima(finalId)
    }
  }, [esEdicion, finalId])

  const cargarMateriaPrima = async (id: string) => {
    try {
      clearError()
      const data = await obtenerMaterial(id)

      form.reset({
        codigo_barras: data.codigo_barras || '',
        nombre: data.nombre || '',
        marca: data.marca || '',
        modelo: data.modelo || '',
        presentacion: data.presentacion || 'Unidad',
        stock_actual: data.stock_actual || 0,
        stock_minimo: data.stock_minimo || 0,
        costo_unitario: data.costo_unitario || null,
        fecha_caducidad: data.fecha_caducidad ?
          new Date(data.fecha_caducidad).toISOString().split('T')[0] : '',
        imagen_url: data.imagen_url || '',
        descripcion: data.descripcion || '',
        categoria: data.categoria || '',
        proveedor_id: data.proveedor_id || null
      })
    } catch (err) {
      console.error('Error al cargar material:', err)
    }
  }

  const handleSubmit = async (data: MateriaPrimaFormData) => {
    clearError()
    setSuccess(false)

    try {
      // Preparar y normalizar datos antes de enviar
      const normalizedData = prepareFormDataForSubmission(data, esEdicion)

      let materialGuardado: MateriaPrimaDetail

      if (esEdicion && finalId) {
        materialGuardado = await actualizarMaterial(finalId, normalizedData as MateriaPrimaUpdate)
      } else {
        materialGuardado = await crearMaterial(normalizedData as NewMateriaPrima)
      }

      setSuccess(true)
      setTimeout(() => {
        if (onSave) {
          onSave(materialGuardado)
        } else {
          navigate('/materia-prima')
        }
      }, 1500)

    } catch (err: any) {
      console.error('Error al guardar material:', err)

      // Enhanced error mapping
      const { generalError, fieldErrors } = extractValidationErrors(err)

      // Actualizar errores de campo específicos
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof MateriaPrimaFormData, {
            type: 'manual',
            message: message as string
          })
        })
      }
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      navigate('/materia-prima')
    }
  }

  const handleImageError = () => {
    setImagePreviewError(true)
  }

  if (loading && esEdicion) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando materia prima...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-background">
      {/* Contenedor principal sin width constraints */}
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {/* Mensajes de estado */}
        {error && (
          <div className="mb-6 p-4 rounded-md bg-destructive/15 border border-destructive/30">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="text-destructive font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-md bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span className="text-green-800 dark:text-green-200 font-medium">
                {esEdicion ? 'Material actualizado correctamente' : 'Material creado correctamente'}
              </span>
            </div>
          </div>
        )}

        {/* Layout Dashboard Moderno con Cards Mejoradas */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/95 backdrop-blur-sm">
          {/* Header Optimizado con métricas contextuales */}
          <CardHeader className="pb-6 border-b bg-muted/30">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <span className="text-3xl">📝</span>
                  <span>Formulario de Material</span>
                  <div className="ml-auto">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      esEdicion
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {esEdicion ? '✏️ Editando' : '➕ Creando'}
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Complete la información para {esEdicion ? 'actualizar' : 'registrar'} un nuevo material en el sistema.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 lg:p-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <Tabs defaultValue="basic-info" className="w-full">
                  {/* Tabs Navigation - Dashboard Moderno */}
                  <TabsList className="grid w-full grid-cols-3 h-auto p-1 mb-8 bg-muted/50 backdrop-blur-sm rounded-xl">
                    <TabsTrigger
                      value="basic-info"
                      className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border rounded-lg py-3 transition-all duration-200"
                    >
                      <span className="text-lg">📋</span>
                      <span className="hidden xs:inline sm:hidden">Info</span>
                      <span className="hidden sm:inline lg:hidden">Información</span>
                      <span className="hidden lg:inline">Información Básica</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="stock-management"
                      className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border rounded-lg py-3 transition-all duration-200"
                    >
                      <span className="text-lg">📦</span>
                      <span className="hidden sm:inline">Gestión de Stock</span>
                      <span className="sm:hidden">Stock</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="additional-info"
                      className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border rounded-lg py-3 transition-all duration-200"
                    >
                      <span className="text-lg">ℹ️</span>
                      <span className="hidden xs:inline sm:hidden">Más</span>
                      <span className="hidden sm:inline lg:hidden">Adicional</span>
                      <span className="hidden lg:inline">Información Adicional</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab Content */}
                  <div className="space-y-6">
                    {/* Sección: Información Básica */}
                    <TabsContent value="basic-info" className="space-y-6 mt-0">
                      <FieldSet className="space-y-4">
                        <FieldLegend className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                          <span className="text-3xl">📋</span>
                          Información Básica
                        </FieldLegend>
                        <FieldDescription className="text-base text-muted-foreground leading-relaxed">
                          Datos principales del material para identificación en el sistema. Los campos marcados con <span className="text-destructive">*</span> son obligatorios.
                        </FieldDescription>
                        <FieldGroup className="grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                            <FormField
                              control={form.control}
                              name="codigo_barras"
                              render={({ field, fieldState }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel className="font-medium flex items-center gap-2">
                                    Código de Barras
                                    <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <MaskInput
                                      mask="custom"
                                      pattern="9999999999999"
                                      placeholder="Ej: 7501234567890"
                                      value={field.value}
                                      onValueChange={(masked, unmasked) => {
                                        field.onChange(unmasked)
                                      }}
                                      className={`transition-colors focus:ring-2 focus:ring-primary/20 ${fieldState.invalid ? "border-destructive" : ""}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="nombre"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nombre del Material</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Ej: Tornillo Phillips"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="marca"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Marca</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ej: Stanley" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="modelo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Modelo</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ej: PH-2" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="presentacion"
                              render={({ field, fieldState }) => (
                                <FormItem>
                                  <FormLabel>Presentación</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className={fieldState.invalid ? "border-destructive" : ""}>
                                        <SelectValue placeholder="Seleccionar presentación" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {presentaciones.map(pres => (
                                        <SelectItem key={pres} value={pres}>
                                          {pres}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="categoria"
                              render={({ field }) => (
                                <FormItem className="sm:col-span-2 lg:col-span-1 xl:col-span-1 2xl:col-span-2">
                                  <FormLabel>Categoría</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar categoría" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {categorias.map(cat => (
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
                        </FieldGroup>
                      </FieldSet>
                    </TabsContent>

                    {/* Sección: Gestión de Stock */}
                    <TabsContent value="stock-management" className="space-y-6 mt-0">
                      <FieldSet className="space-y-4">
                        <FieldLegend className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                          <span className="text-3xl">📦</span>
                          Gestión de Stock
                        </FieldLegend>
                        <FieldDescription className="text-base text-muted-foreground leading-relaxed">
                          Configure los niveles de inventario y costos del material. Mantenga el control sobre el flujo de productos.
                        </FieldDescription>
                        <FieldGroup className="grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8">
                            <FormField
                              control={form.control}
                              name="stock_actual"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stock Actual</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="0"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="stock_minimo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stock Mínimo</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="0"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="costo_unitario"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Costo Unitario</FormLabel>
                                  <FormControl>
                                    <MaskInput
                                      mask="currency"
                                      currency="USD"
                                      placeholder="$0.00"
                                      value={field.value?.toString() || ''}
                                      onValueChange={(masked, unmasked) => {
                                        field.onChange(unmasked ? parseFloat(unmasked) : null)
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="fecha_caducidad"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Fecha de Caducidad</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="date"
                                      {...field}
                                      value={field.value || ''}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                      </FieldGroup>
                      </FieldSet>
                    </TabsContent>

                    {/* Sección: Información Adicional */}
                    <TabsContent value="additional-info" className="space-y-6 mt-0">
                      <FieldSet className="space-y-4">
                        <FieldLegend className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                          <span className="text-3xl">ℹ️</span>
                          Información Adicional
                        </FieldLegend>
                        <FieldDescription className="text-base text-muted-foreground leading-relaxed">
                          Información complementaria y detalles extra del material. Agregue contexto para mejorar la gestión.
                        </FieldDescription>
                        <FieldGroup className="grid-cols-1 xs:grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                            <FormField
                              control={form.control}
                              name="proveedor_id"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ID del Proveedor</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="UUID del proveedor (opcional)"
                                      {...field}
                                      value={field.value || ''}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="imagen_url"
                              render={({ field }) => (
                                <FormItem className="space-y-3">
                                  <FormLabel>URL de Imagen</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="url"
                                      placeholder="https://ejemplo.com/imagen.jpg"
                                      {...field}
                                      value={field.value || ''}
                                    />
                                  </FormControl>
                                  <FormMessage />

                                  {/* Preview de imagen */}
                                  {field.value && (
                                    <div className="mt-3">
                                      <FormDescription>Vista previa de la imagen:</FormDescription>
                                      <div className="mt-2 p-4 border-2 border-dashed border-border rounded-lg bg-muted/30">
                                        {!imagePreviewError ? (
                                          <img
                                            src={field.value}
                                            alt="Vista previa"
                                            className="max-w-xs max-h-48 object-contain rounded mx-auto"
                                            onError={handleImageError}
                                          />
                                        ) : (
                                          <div className="text-center text-muted-foreground py-8">
                                            <div className="text-4xl mb-2">🖼️</div>
                                            <p className="text-sm">No se pudo cargar la imagen</p>
                                            <p className="text-xs mt-1">URL: {field.value}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </FormItem>
                              )}
                            />

                            {/* Campo de descripción con span responsivo */}
                            <FormField
                              control={form.control}
                              name="descripcion"
                              render={({ field }) => (
                                <FormItem className="xs:col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-3 2xl:col-span-4">
                                  <FormLabel>Descripción</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Descripción detallada del material..."
                                      className="min-h-[120px] resize-y"
                                      {...field}
                                      value={field.value || ''}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </FieldGroup>
                      </FieldSet>
                    </TabsContent>
                  </div>

                  {/* Botones de acción - Optimizado para Mobile */}
                  <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 pt-8 border-t bg-muted/20 -mx-10 px-10 py-6 rounded-b-xl">
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting || success}
                      className="w-full xs:w-auto min-w-[140px] h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 order-2 xs:order-1"
                      size="lg"
                    >
                      {form.formState.isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          {esEdicion ? '💾 Actualizar' : '➕ Crear'}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={form.formState.isSubmitting}
                      className="w-full xs:w-auto min-w-[140px] h-12 text-base font-medium order-1 xs:order-2"
                      size="lg"
                    >
                      ❌ Cancelar
                    </Button>
                  </div>
                </Tabs>
                    </form>
                  </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Export por defecto para compatibilidad
export default MateriaPrimaFormulario