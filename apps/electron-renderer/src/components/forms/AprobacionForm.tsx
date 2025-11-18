import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCrearAprobacion, useAprobacionesReglas } from '@/services/aprobacionesService'
import type { CreateAprobacionData, TipoAprobacion, NivelUrgencia } from '@/types/aprobaciones'
import {
  DollarSign,
  AlertTriangle,
  Clock,
  Zap,
  Calendar,
  FileText,
  Scale
} from 'lucide-react'

const aprobacionSchema = z.object({
  tipo: z.enum(['compra', 'movimiento', 'ajuste_inventario', 'eliminacion'], {
    required_error: 'Debe seleccionar un tipo de aprobación',
  }),
  titulo: z.string().min(5, {
    message: 'El título debe tener al menos 5 caracteres',
  }).max(100, {
    message: 'El título no puede exceder 100 caracteres',
  }),
  descripcion: z.string().min(10, {
    message: 'La descripción debe tener al menos 10 caracteres',
  }).max(500, {
    message: 'La descripción no puede exceder 500 caracteres',
  }),
  monto: z.string().optional().refine((val) => {
    if (!val) return true
    const num = parseFloat(val.replace(/[^0-9.-]+/g, ''))
    return !isNaN(num) && num > 0
  }, {
    message: 'Ingrese un monto válido',
  }),
  nivel_urgencia: z.enum(['bajo', 'medio', 'alto', 'critico'], {
    required_error: 'Debe seleccionar un nivel de urgencia',
  }),
  fecha_limite: z.string().optional(),
})

type AprobacionFormValues = z.infer<typeof aprobacionSchema>

interface AprobacionFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialValues?: Partial<CreateAprobacionData>
}

const AprobacionForm: React.FC<AprobacionFormProps> = ({
  onSuccess,
  onCancel,
  initialValues
}) => {
  const { data: reglas, isLoading: isLoadingReglas } = useAprobacionesReglas()
  const crearMutation = useCrearAprobacion()

  const form = useForm<AprobacionFormValues>({
    resolver: zodResolver(aprobacionSchema),
    defaultValues: {
      tipo: initialValues?.tipo || undefined,
      titulo: initialValues?.titulo || '',
      descripcion: initialValues?.descripcion || '',
      monto: initialValues?.monto?.toString() || '',
      nivel_urgencia: initialValues?.nivel_urgencia || 'medio',
      fecha_limite: initialValues?.fecha_limite
        ? format(initialValues.fecha_limite, 'yyyy-MM-dd', { locale: es })
        : '',
    },
  })

  const selectedTipo = form.watch('tipo')
  const selectedMonto = form.watch('monto')
  const selectedUrgencia = form.watch('nivel_urgencia')

  // Obtener la regla aplicable basada en el tipo y monto
  const getReglaAplicable = () => {
    if (!selectedTipo || !selectedMonto || !reglas) return null

    const montoNumerico = parseFloat(selectedMonto.replace(/[^0-9.-]+/g, ''))
    if (isNaN(montoNumerico)) return null

    return reglas.find(regla =>
      regla.tipo === selectedTipo &&
      regla.activo &&
      (!regla.monto_minimo || montoNumerico >= regla.monto_minimo) &&
      (!regla.monto_maximo || montoNumerico <= regla.monto_maximo)
    )
  }

  const reglaAplicable = getReglaAplicable()

  const onSubmit = (data: AprobacionFormValues) => {
    const aprobacionData: CreateAprobacionData = {
      tipo: data.tipo,
      titulo: data.titulo,
      descripcion: data.descripcion,
      monto: data.monto ? parseFloat(data.monto.replace(/[^0-9.-]+/g, '')) : undefined,
      nivel_urgencia: data.nivel_urgencia,
      fecha_limite: data.fecha_limite ? new Date(data.fecha_limite) : undefined,
    }

    crearMutation.mutate(aprobacionData, {
      onSuccess: () => {
        form.reset()
        onSuccess?.()
      },
    })
  }

  const getTipoDescription = (tipo: TipoAprobacion) => {
    const descriptions = {
      compra: 'Para autorizar compras de materiales, equipos o servicios',
      movimiento: 'Para autorizar movimientos de inventario significativos',
      ajuste_inventario: 'Para realizar ajustes en los registros de inventario',
      eliminacion: 'Para autorizar la eliminación de registros o materiales'
    }
    return descriptions[tipo]
  }

  const getUrgenciaIcon = (urgencia: NivelUrgencia) => {
    const icons = {
      bajo: <Clock className="size-4" />,
      medio: <AlertTriangle className="size-4" />,
      alto: <Zap className="size-4" />,
      critico: <div className="size-4 bg-red-500 rounded-full animate-pulse" />
    }
    return icons[urgencia]
  }

  const handleMontoChange = (value: string) => {
    // Permitir solo números y punto decimal
    const numericValue = value.replace(/[^0-9.]/g, '')
    form.setValue('monto', numericValue)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Nueva Solicitud de Aprobación
          </CardTitle>
          <CardDescription>
            Complete el formulario para solicitar una aprobación según las reglas de negocio establecidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Tipo de Aprobación */}
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Aprobación</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione el tipo de aprobación" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="compra">Compra</SelectItem>
                        <SelectItem value="movimiento">Movimiento</SelectItem>
                        <SelectItem value="ajuste_inventario">Ajuste de Inventario</SelectItem>
                        <SelectItem value="eliminacion">Eliminación</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value && getTipoDescription(field.value)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Título */}
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título de la Solicitud</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Compra de materiales de oficina"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Título claro y conciso que describa la solicitud
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descripción */}
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción Detallada</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describa detalladamente lo que solicita..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Incluya toda la información relevante para la toma de decisión
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monto (si aplica) */}
                <FormField
                  control={form.control}
                  name="monto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto (opcional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="0.00"
                            className="pl-9"
                            {...field}
                            value={field.value}
                            onChange={(e) => handleMontoChange(e.target.value)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Monto en moneda local (si aplica)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nivel de Urgencia */}
                <FormField
                  control={form.control}
                  name="nivel_urgencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel de Urgencia</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione el nivel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bajo">
                          <div className="flex items-center gap-2">
                            <Clock className="size-4" />
                            Bajo - Normal
                          </div>
                        </SelectItem>
                        <SelectItem value="medio">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="size-4" />
                            Medio - Prioritario
                          </div>
                        </SelectItem>
                        <SelectItem value="alto">
                          <div className="flex items-center gap-2">
                            <Zap className="size-4" />
                            Alto - Urgente
                          </div>
                        </SelectItem>
                        <SelectItem value="critico">
                          <div className="flex items-center gap-2">
                            <div className="size-4 bg-red-500 rounded-full" />
                            Crítico - Emergencia
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value && (
                        <div className="flex items-center gap-2 mt-1">
                          {getUrgenciaIcon(field.value)}
                          <span className="text-sm">
                            Prioridad de procesamiento: {field.value.charAt(0).toUpperCase() + field.value.slice(1)}
                          </span>
                        </div>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>

              {/* Fecha Límite */}
              <FormField
                control={form.control}
                name="fecha_limite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Límite (opcional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Fecha máxima para la resolución de la solicitud
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Información de Reglas Aplicables */}
              {reglaAplicable && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Scale className="w-5 h-5" />
                        <h3 className="font-semibold">Regla de Aprobación Aplicable</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-blue-700">Nivel requerido:</span>
                          <Badge variant="outline" className="ml-2">
                            Nivel {reglaAplicable.nivel_aprobacion_requerido}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Tiempo máximo:</span>
                          <span className="ml-2"> {reglaAplicable.tiempo_maximo_aprobacion_horas} horas</span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Aprobadores requeridos:</span>
                          <span className="ml-2"> {reglaAplicable.aprobadores_requeridos.length}</span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Escalado automático:</span>
                          <Badge variant={reglaAplicable.escalado_automatico ? 'default' : 'secondary'} className="ml-2">
                            {reglaAplicable.escalado_automatico ? 'Sí' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Acciones */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={crearMutation.isPending}
                  >
                    Cancelar
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={crearMutation.isPending}
                >
                  {crearMutation.isPending ? 'Creando solicitud...' : 'Crear Solicitud'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AprobacionForm