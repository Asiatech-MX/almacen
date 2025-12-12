"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MaskInput } from '@/components/ui/mask-input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FieldSet, FieldLegend, FieldGroup, FieldDescription } from '@/components/ui/fieldset'
import { Scroller } from '@/components/ui/scroller'
import { FileUpload } from '@/components/ui/file-upload'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { BarcodeGenerator } from '@/components/ui/BarcodeGenerator'

import useMateriaPrima from '../../hooks/useMateriaPrima'
import materiaPrimaService from '../../services/materiaPrimaService'
import { useReferenceDataQuery, useEditarPresentacionMutation, useEditarCategoriaMutation, useMoverCategoriaMutation } from '../../hooks/useReferenceDataQuery'
import { useDebounce } from '@/hooks/useDebounce'
import { MemoizedDynamicSelect } from '@/components/ui/DynamicSelect'
import { InlineEditModal } from '@/components/ui/InlineEditModal'
import type {
  NewMateriaPrima,
  MateriaPrimaUpdate
} from '../../../../shared/types/materiaPrima'
import type { MateriaPrimaDetail } from '../../../../shared/types'

import {
  extractValidationErrors
} from '../../utils/formDataNormalizer'

// Declaraciones para variables globales del navegador
declare global {
  var URL: typeof globalThis.URL;
  var File: typeof globalThis.File;
}

// Componente reutilizable para tooltips consistentes
const FieldTooltip: React.FC<{ content: string }> = ({ content }) => (
  <Tooltip delayDuration={300}>
    <TooltipTrigger asChild>
      <HelpCircle className="inline-block w-4 h-4 ml-1 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
    </TooltipTrigger>
    <TooltipContent
      className="max-w-xs text-sm bg-popover border border-border text-popover-foreground"
      side="top"
      align="center"
      sideOffset={4}
    >
      <p>{content}</p>
    </TooltipContent>
  </Tooltip>
)

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

// Schema Zod mejorado - maneja correctamente los IDs de referencia del DynamicSelect y códigos de barras flexibles
const materiaPrimaSchema = z.object({
  // Código de barras flexible - soporta múltiples formatos
  codigo_barras: z.string()
    .min(1, 'El código de barras no puede estar vacío')
    .max(50, 'El código de barras es demasiado largo'),
  // Metadatos del código de barras (opcional para compatibilidad)
  codigo_barras_formato: z.enum(['EAN13', 'UPC', 'CODE128', 'CODE39', 'SKU']).optional(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  // IDs de referencia con coercion automática de string a number
  // Permitimos 0 como estado "no seleccionado" para evitar conflictos de validación
  presentacion_id: z.coerce.number()
    .min(0, 'La presentación es requerida'),
  categoria_id: z.coerce.number()
    .min(0, 'La categoría es requerida'),
  stock_actual: z.number().min(0, 'El stock actual no puede ser negativo'),
  stock_minimo: z.number().min(0, 'El stock mínimo no puede ser negativo'),
  costo_unitario: z.number().nullable().optional(),
  fecha_caducidad: z.string().nullable().optional(),
  imagen_url: z.string().nullable().optional(),
  descripcion: z.string().optional(),
  proveedor_id: z.coerce.number().nullable().optional()
});

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Estados para el sistema de referencias
  const [presentacionEditando, setPresentacionEditando] = useState<any>(null)
  const [categoriaEditando, setCategoriaEditando] = useState<any>(null)
  const [showPresentacionModal, setShowPresentacionModal] = useState(false)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [isEditingReference, setIsEditingReference] = useState(false)



  // ID de institución actual (esto debería venir de un contexto o configuración)
  const CURRENT_INSTITUTION_ID = 1 // Cambiar esto por el ID real de la institución

  // Configuración de React Hook Form
  const form = useForm<MateriaPrimaFormData>({
    resolver: zodResolver(materiaPrimaSchema),
    defaultValues: {
      codigo_barras: '',
      codigo_barras_formato: 'CODE128',
      nombre: '',
      marca: '',
      modelo: '',
      // IDs de referencia como números (vienen del DynamicSelect como strings pero se coercen)
      presentacion_id: 0,
      categoria_id: 0,
      stock_actual: 0,
      stock_minimo: 0,
      costo_unitario: null,
      fecha_caducidad: '',
      imagen_url: '',
      descripcion: '',
      proveedor_id: null
    },
    mode: isEditingReference ? 'onSubmit' : 'onBlur',  // Evitar validación durante edición de referencias
    reValidateMode: 'onBlur'  // Re-validar solo al perder focus para mejor UX
  })

  // Hook para datos de referencia con TanStack Query
  const {
    categorias,
    categoriasArbol,
    presentaciones,
    isLoading: loadingReferencias,
    error: referenciaError
  } = useReferenceDataQuery(CURRENT_INSTITUTION_ID);

  // Mutaciones de TanStack Query para gestión de referencias
  const editarPresentacionMutation = useEditarPresentacionMutation();
  const editarCategoriaMutation = useEditarCategoriaMutation();
  const moverCategoriaMutation = useMoverCategoriaMutation();

  // Validación debounced para el código de barras (evita bucles infinitos)
  // Se usa debounce de 500ms para prevenir re-validaciones excesivas mientras el usuario escribe
  // Esto resuelve el problema de "Maximum update depth exceeded" caused by shouldValidate: true
  const debouncedBarcodeValue = useDebounce(form.watch('codigo_barras'), 500);

  // Función de validación para el código de barras con debounce
  // Se usa getValues() en lugar de watch() para evitar re-renders innecesarios
  // La validación se dispara manualmente con form.trigger() en lugar de shouldValidate: true
  const handleBarcodeValidation = useCallback(() => {
    const barcodeValue = form.getValues('codigo_barras');
    if (barcodeValue && barcodeValue.trim()) {
      form.trigger('codigo_barras');
    }
  }, [form.trigger]);

  // Validar el código de barras cuando el valor debounced cambia
  // Este efecto se dispara solo cuando el valor debounced cambia, no en cada render
  // Previene bucles infinitos al usar dependencias específicas en lugar de form completo
  useEffect(() => {
    if (debouncedBarcodeValue && debouncedBarcodeValue.trim()) {
      form.trigger('codigo_barras');
    }
  }, [debouncedBarcodeValue, form.trigger]);

  // Memoizar el callback onBarcodeChange para evitar re-renders
  // Este callback sigue el patrón establecido en DynamicSelect.tsx del proyecto
  // CLAVE: shouldValidate: false previene el bucle infinito que ocurría con shouldValidate: true
  const handleBarcodeChange = useCallback((barcode: string) => {
    const currentValue = form.getValues('codigo_barras');
    if (barcode !== currentValue) {  // Solo actualiza si el valor cambió
      form.setValue('codigo_barras', barcode, {
        shouldValidate: false,   // 🔑 CLAVE: Previene bucle infinito (ver DynamicSelect.tsx línea 84)
        shouldDirty: true,       // Marcar como sucio para reflejar cambios del usuario
        shouldTouch: true        // Marcar como touched para UX
      });
      // Validar después de un breve delay para simular onBlur behavior sin causar bucles
      setTimeout(handleBarcodeValidation, 150);
    }
  }, [form.setValue, handleBarcodeValidation]);

  useEffect(() => {
    if (esEdicion && finalId && !loadingReferencias) {
      cargarMateriaPrima(finalId)
    }
  }, [esEdicion, finalId, loadingReferencias])

  // Actualizar modo de validación cuando cambia el estado de edición
  useEffect(() => {
    // Cambiar el modo de validación para evitar validaciones durante edición
    form.reset(form.getValues(), { 
      keepErrors: false,  // Limpiar errores previos
      keepDirty: false,  // Limpiar estado dirty
      keepTouched: false // Limpiar estado touched
    })
  }, [isEditingReference, form])

  // Limpiar Object URLs cuando el componente se desmonta
  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => {
        URL.revokeObjectURL(URL.createObjectURL(file))
      })
    }
  }, [selectedFiles])

  const cargarMateriaPrima = async (id: string) => {
    try {
      clearError()
      const data = await obtenerMaterial(id)

      form.reset({
        codigo_barras: data.codigo_barras || '',
        codigo_barras_formato: data.codigo_barras_formato || 'CODE128',
        nombre: data.nombre || '',
        marca: data.marca || '',
        modelo: data.modelo || '',
        // IDs de referencia como números (la coerción manejará la conversión)
        presentacion_id: data.presentacion_id || 0,
        categoria_id: data.categoria_id || 0,
        stock_actual: data.stock_actual || 0,
        stock_minimo: data.stock_minimo || 0,
        costo_unitario: data.costo_unitario || null,
        fecha_caducidad: data.fecha_caducidad ?
          new Date(data.fecha_caducidad).toISOString().split('T')[0] : '',
        imagen_url: data.imagen_url || '',
        descripcion: data.descripcion || '',
        proveedor_id: data.proveedor_id || null
      })
    } catch (err) {
      console.error('Error al cargar material:', err)
    }
  }

  const handleSubmit = async (data: MateriaPrimaFormData) => {
    // Prevenir envío si estamos editando referencias
    if (isEditingReference) {
      console.log('⏸️ Envío del formulario bloqueado mientras se editan referencias')
      return
    }

    clearError()
    setSuccess(false)
    setGeneralError(null) // Limpiar errores generales previos

    try {
      // Pipeline de datos simplificado y directo (sin conversión manual gracias a z.coerce)
      const submissionData = {
        codigo_barras: data.codigo_barras,
        codigo_barras_formato: data.codigo_barras_formato,
        nombre: data.nombre,
        marca: data.marca || null,
        modelo: data.modelo || null,
        presentacion_id: data.presentacion_id,
        categoria_id: data.categoria_id,
        stock_actual: data.stock_actual,
        stock_minimo: data.stock_minimo,
        costo_unitario: data.costo_unitario || null,
        fecha_caducidad: data.fecha_caducidad || null,
        imagen_url: data.imagen_url || null,
        descripcion: data.descripcion || null,
        proveedor_id: data.proveedor_id,
        id_institucion: CURRENT_INSTITUTION_ID
      }

      let materialGuardado: MateriaPrimaDetail

      if (esEdicion && finalId) {
        materialGuardado = await actualizarMaterial(finalId, submissionData as MateriaPrimaUpdate)
      } else {
        materialGuardado = await crearMaterial(submissionData as NewMateriaPrima)
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

      // Mostrar error general si no hay errores de campo específicos
      if (generalError && Object.keys(fieldErrors).length === 0) {
        setGeneralError(generalError)
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

  const handleFileChange = async (files: File[]) => {
    setUploadError(null)

    if (files.length === 0) {
      setSelectedFiles([])
      form.setValue('imagen_url', '')
      return
    }

    const file = files[0] // Solo permitimos un archivo
    setSelectedFiles([file])

    // Iniciar carga
    setIsUploading(true)

    try {
      // Obtener valores del formulario para metadata
      const formValues = form.getValues()

      const result = await materiaPrimaService.subirImagen(file, {
        materiaPrimaId: finalId || 'temp',
        codigoBarras: formValues.codigo_barras || 'temp',
        nombre: formValues.nombre || 'temp'
      })

      if (result.success && result.url) {
        // Actualizar campo del formulario con la URL generada
        form.setValue('imagen_url', result.url)
        setImagePreviewError(false)
      } else {
        setUploadError(result.error || 'Error al cargar la imagen')
      }
    } catch (error) {
      console.error('Error al subir imagen:', error)
      setUploadError(error instanceof Error ? error.message : 'Error desconocido al subir la imagen')
    } finally {
      setIsUploading(false)
    }
  }

  
  // Funciones para manejar edición inline
  const handleEditarPresentacion = (presentacion: any) => {
    setPresentacionEditando(presentacion)
    setShowPresentacionModal(true)
    setIsEditingReference(true)
  }

  const handleEditarCategoria = (categoria: any) => {
    setCategoriaEditando(categoria)
    setShowCategoriaModal(true)
    setIsEditingReference(true)
  }

  const handleGuardarPresentacion = async (data: any) => {
    try {
      // Add missing idInstitucion parameter
      const result = await editarPresentacionMutation.mutateAsync({
        id: presentacionEditando.id,
        cambios: data,
        idInstitucion: CURRENT_INSTITUTION_ID
      })

      if (result) {
        // Close modal after successful update
        setShowPresentacionModal(false)
        setPresentacionEditando(null)
        setIsEditingReference(false)

        // Seleccionar automáticamente la presentación editada en el formulario
        // Similar a como funciona handleCreateOption en DynamicSelect
        try {
          // Usar setValue con configuración completa para evitar eventos
          form.setValue('presentacion_id', parseInt(result.id.toString(), 10) || 0, {
            shouldValidate: false,  // Evitar validación del formulario principal
            shouldDirty: false,     // Evitar marcar como sucio para prevenir validaciones
            shouldTouch: false       // Evitar marcar como touched
          })
          console.log('✅ Campo presentacion_id actualizado sin errores:', result.id)
        } catch (error) {
          console.warn('Error al actualizar campo presentacion_id después de edición:', error)
          // No bloquear el flujo por errores de validación
        }

        // Return expected format for modal
        return { success: true, data: result }
      }

      return { success: false, error: 'No se pudo actualizar la presentación' }
    } catch (error) {
      console.error('Error al editar presentación:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  const handleGuardarCategoria = async (data: any) => {
    try {
      // Add missing idInstitucion parameter
      const result = await editarCategoriaMutation.mutateAsync({
        id: categoriaEditando.id,
        cambios: data,
        idInstitucion: CURRENT_INSTITUTION_ID
      })

      if (result) {
        // Close modal after successful update
        setShowCategoriaModal(false)
        setCategoriaEditando(null)
        setIsEditingReference(false)

        // Seleccionar automáticamente la categoría editada en el formulario
        // Similar a como funciona handleCreateOption en DynamicSelect
        try {
          // Usar setValue con configuración completa para evitar eventos
          form.setValue('categoria_id', parseInt(result.id.toString(), 10) || 0, {
            shouldValidate: false,  // Evitar validación del formulario principal
            shouldDirty: false,     // Evitar marcar como sucio para prevenir validaciones
            shouldTouch: false       // Evitar marcar como touched
          })
          console.log('✅ Campo categoria_id actualizado sin errores:', result.id)
        } catch (error) {
          console.warn('Error al actualizar campo categoria_id después de edición:', error)
          // No bloquear el flujo por errores de validación
        }

        // Return expected format for modal
        return { success: true, data: result }
      }

      return { success: false, error: 'No se pudo actualizar la categoría' }
    } catch (error) {
      console.error('Error al editar categoría:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  const handleMoverCategoria = async (idCategoria: string, nuevoPadreId?: string) => {
    try {
      const result = await moverCategoriaMutation.mutateAsync({
        idCategoria,
        nuevoPadreId
      })
      // TanStack Query maneja automáticamente la actualización del cache
      return result
    } catch (error) {
      console.error('Error al mover categoría:', error)
      return { success: false, error: error.message }
    }
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
    <TooltipProvider delayDuration={300}>
      <div className="w-full bg-background">
        {/* Contenedor principal con max-width para evitar estiramiento excesivo */}
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Mensajes de estado */}
        {error && (
          <div className="mb-6 p-4 rounded-md bg-destructive/15 border border-destructive/30">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="text-destructive font-medium">{error}</span>
            </div>
          </div>
        )}

        {generalError && (
          <div className="mb-6 p-4 rounded-md bg-destructive/15 border border-destructive/30">
            <div className="flex items-center gap-2">
              <span className="text-lg">❌</span>
              <span className="text-destructive font-medium">{generalError}</span>
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
            <Scroller viewportAware size={16} offset={8}>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  method="POST"
                  action="#"
                  className="space-y-6 pb-4"
                >
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
                        <FieldGroup className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                            {/* Hidden field for barcode value to integrate with form */}
                            <FormField
                              control={form.control}
                              name="codigo_barras"
                              render={({ field }) => (
                                <input
                                  type="hidden"
                                  {...field}
                                />
                              )}
                            />
                            
                            {/* Barcode Generator Component */}
                            <FormField
                              control={form.control}
                              name="codigo_barras_formato"
                              render={({ field }) => (
                                <input
                                  type="hidden"
                                  {...field}
                                />
                              )}
                            />

                            {/* Barcode Generator - spans full width */}
                            <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                              <FormItem className="space-y-2">
                                <FormLabel className="font-medium flex items-center gap-2">
                                  Código de Barras
                                  <span className="text-destructive">*</span>
                                  <FieldTooltip content="Genere códigos de barras en múltiples formatos (EAN-13, UPC, CODE128, SKU) para identificación única del producto en el sistema" />
                                </FormLabel>
                                <FormControl>
                                  <div className="w-full">
                                    <BarcodeGenerator
                                      materialData={{
                                        id: finalId || '',
                                        codigo: form.getValues('codigo_barras') || '',
                                        nombre: form.getValues('nombre') || '',
                                        descripcion: form.getValues('descripcion') || '',
                                        stock: form.getValues('stock_actual'),
                                        ubicacion: '', // Could be added later
                                        institucion: 'Institución', // Could come from context
                                        categoria: form.getValues('categoria_id')
                                          ? categorias.find(c => c.id === form.getValues('categoria_id'))?.nombre || ''
                                          : form.getValues('categoria') || '',
                                        presentacion: form.getValues('presentacion_id')
                                          ? presentaciones.find(p => p.id === form.getValues('presentacion_id'))?.nombre || ''
                                          : form.getValues('presentacion') || ''
                                      }}
                                      initialBarcode={form.getValues('codigo_barras') || ''}
                                      initialFormat={form.getValues('codigo_barras_formato') as any || 'CODE128'}
                                      // Usar el callback memoizado que previene bucles infinitos
                                      onBarcodeChange={handleBarcodeChange}
                                      onPrint={(job) => {
                                        console.log('Print job created:', job)
                                      }}
                                      showPreview={true}
                                      showPrint={true}
                                      disabled={form.formState.isSubmitting}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            </div>

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
                              name="presentacion_id"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    Presentación
                                    <span className="text-destructive">*</span>
                                    <FieldTooltip content="Unidad de medida o empaque del producto (caja, kilogramo, unidad, etc.)" />
                                  </FormLabel>
                                  <FormControl>
                                    <MemoizedDynamicSelect
                                      control={form.control}
                                      name="presentacion_id"
                                      label=""
                                      type="presentacion"
                                      placeholder="Seleccionar presentación..."
                                      creatable={true}
                                      allowEdit={true}
                                      required={true}
                                      disabled={loadingReferencias}
                                      onEdit={(presentacion) => {
                                        handleEditarPresentacion(presentacion)
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                  {/* Advertencia de compatibilidad backward */}
                                  {form.watch('presentacion') && !field.value && (
                                    <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                                      ⚠️ Modo compatibilidad: usando presentación de texto. Seleccione una presentación de la lista para mejor experiencia.
                                    </div>
                                  )}
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="categoria_id"
                              render={({ field }) => (
                                <FormItem className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                                  <FormLabel className="flex items-center gap-2">
                                  Categoría
                                  <span className="text-destructive">*</span>
                                  <FieldTooltip content="Clasificación principal para organización, reportes y análisis" />
                                </FormLabel>
                                  <FormControl>
                                    <MemoizedDynamicSelect
                                      control={form.control}
                                      name="categoria_id"
                                      label=""
                                      type="categoria"
                                      placeholder="Seleccionar categoría..."
                                      creatable={true}
                                      allowEdit={true}
                                      disabled={loadingReferencias}
                                      onEdit={(categoria) => {
                                        handleEditarCategoria(categoria)
                                      }}
                                      onMove={async (idCategoria, nuevoPadreId) => {
                                        const result = await handleMoverCategoria(idCategoria, nuevoPadreId)
                                        if (result.success) {
                                          // Mostrar toast de éxito
                                          console.log('Categoría movida exitosamente')
                                        } else {
                                          console.error('Error al mover categoría:', result.error)
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                  {/* Advertencia de compatibilidad backward */}
                                  {form.watch('categoria') && !field.value && (
                                    <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                                      ⚠️ Modo compatibilidad: usando categoría de texto. Seleccione una categoría de la lista para mejor experiencia.
                                    </div>
                                  )}
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
                        <FieldGroup className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
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
                                  <FormLabel className="flex items-center gap-2">
                                  Stock Mínimo
                                  <FieldTooltip content="Nivel mínimo para activar alertas de reposición automática" />
                                </FormLabel>
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
                                  <FormLabel className="flex items-center gap-2">
                                  Costo Unitario
                                  <FieldTooltip content="Costo por unidad sin incluir impuestos ni gastos de envío" />
                                </FormLabel>
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
                                  <FormLabel className="flex items-center gap-2">
                                  Fecha de Caducidad
                                  <FieldTooltip content="Fecha en que el producto pierde su validez (aplicable solo para perecederos)" />
                                </FormLabel>
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
                        <FieldGroup className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
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
                                  <FormLabel>Imagen del Material</FormLabel>
                                  <FormControl>
                                    <Controller
                                      name="imagen_url"
                                      control={form.control}
                                      render={({ field }) => (
                                        <div className="space-y-3">
                                          <FileUpload
                                            value={selectedFiles}
                                            onValueChange={handleFileChange}
                                            maxFiles={1}
                                            maxSize={5 * 1024 * 1024} // 5MB
                                            accept="image/*"
                                            disabled={isUploading}
                                            error={uploadError || form.formState.errors.imagen_url?.message}
                                          >
                                            <div className="text-center">
                                              <p className="text-sm font-medium">
                                                {isUploading ? 'Subiendo imagen...' : 'Arrastra y suelta una imagen aquí o'}
                                              </p>
                                              {!isUploading && (
                                                <p className="text-xs text-muted-foreground">
                                                  haz clic para seleccionar un archivo
                                                </p>
                                              )}
                                              <p className="text-xs text-muted-foreground">
                                                PNG, JPG, JPEG, WebP hasta 5MB
                                              </p>
                                            </div>
                                          </FileUpload>
                                        </div>
                                      )}
                                    />
                                  </FormControl>
                                  <FormMessage />

                                  {/* Preview de imagen existente o subida */}
                                  {(field.value || selectedFiles.length > 0) && (
                                    <div className="mt-3">
                                      <FormDescription>
                                        Vista previa de la imagen:
                                      </FormDescription>
                                      <div className="mt-2 p-4 border-2 border-dashed border-border rounded-lg bg-muted/30">
                                        {selectedFiles.length > 0 ? (
                                          // Preview del archivo seleccionado
                                          <div className="text-center">
                                            <img
                                              src={URL.createObjectURL(selectedFiles[0])}
                                              alt="Vista previa"
                                              className="max-w-xs max-h-48 object-contain rounded mx-auto"
                                              onLoad={() => URL.revokeObjectURL(URL.createObjectURL(selectedFiles[0]))}
                                            />
                                            <div className="mt-2 text-xs text-muted-foreground">
                                              {isUploading ? (
                                                <div className="flex items-center justify-center gap-2">
                                                  <div className="animate-spin size-3 border-2 border-primary border-t-transparent rounded-full"></div>
                                                  <span>Subiendo...</span>
                                                </div>
                                              ) : (
                                                <span>✅ Imagen lista</span>
                                              )}
                                            </div>
                                          </div>
                                        ) : field.value && !imagePreviewError ? (
                                          // Preview de la imagen existente (URL)
                                          <img
                                            src={field.value}
                                            alt="Vista previa"
                                            className="max-w-xs max-h-48 object-contain rounded mx-auto"
                                            onError={handleImageError}
                                          />
                                        ) : (
                                          // Error o placeholder
                                          <div className="text-center text-muted-foreground py-8">
                                            <div className="text-4xl mb-2">🖼️</div>
                                            <p className="text-sm">
                                              {imagePreviewError ? 'No se pudo cargar la imagen' : 'No hay imagen seleccionada'}
                                            </p>
                                            {field.value && imagePreviewError && (
                                              <p className="text-xs mt-1">URL: {field.value}</p>
                                            )}
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
                                <FormItem className="col-span-1 sm:col-span-2 lg:col-span-3">
                                  <FormLabel className="flex items-center gap-2">
                                  Descripción
                                  <FieldTooltip content="Detalles adicionales, especificaciones técnicas o notas importantes del material" />
                                </FormLabel>
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
                      disabled={form.formState.isSubmitting || loading || success}
                      className="w-full xs:w-auto min-w-[140px] h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 order-2 xs:order-1"
                      size="lg"
                    >
                      {form.formState.isSubmitting || loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          {loading ? 'Procesando...' : 'Guardando...'}
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

                {/* Modales de edición inline */}
                {showPresentacionModal && presentacionEditando && (
                  <InlineEditModal
                    isOpen={showPresentacionModal}
                    onClose={() => {
                      setShowPresentacionModal(false)
                      setPresentacionEditando(null)
                      setIsEditingReference(false)
                    }}
                    item={presentacionEditando}
                    type="presentacion"
                    onSave={handleGuardarPresentacion}
                  />
                )}

                {showCategoriaModal && categoriaEditando && (
                  <InlineEditModal
                    isOpen={showCategoriaModal}
                    onClose={() => {
                      setShowCategoriaModal(false)
                      setCategoriaEditando(null)
                      setIsEditingReference(false)
                    }}
                    item={categoriaEditando}
                    type="categoria"
                    onSave={handleGuardarCategoria}
                  />
                )}
                </form>
              </Form>
            </Scroller>
          </CardContent>
        </Card>
      </div>
    </div>
    </TooltipProvider>
  )
}

// Export por defecto para compatibilidad
export default MateriaPrimaFormulario