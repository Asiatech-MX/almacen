import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type {
  BarcodeFormat,
  BarcodeOptions,
  PrintJob,
  MaterialLabelData,
  LabelSize,
  LabelSizeConfig
} from '@shared-types'
import {
  BARCODE_VALIDATIONS,
  BROTHER_QL810W_TEMPLATES,
  BROTHER_PRINTER_CONFIGS,
  LABEL_SIZE_CONFIGS,
  getLabelSizeFromTemplate
} from '@shared-types'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Barcode, Printer, Check, X } from 'lucide-react'

interface BarcodeGeneratorProps {
  materialData: MaterialLabelData
  onBarcodeChange?: (barcode: string) => void
  onPrint?: (job: PrintJob) => void
  initialBarcode?: string
  initialFormat?: BarcodeFormat
  showPreview?: boolean
  showPrint?: boolean
  disabled?: boolean
}

// Componente para renderizar la etiqueta con la jerarquía visual correcta
const LabelPreview: React.FC<{
  materialData: MaterialLabelData
  barcodeValue: string
  barcodeUrl?: string
  sizeConfig: LabelSizeConfig
  isGenerating?: boolean
}> = ({ materialData, barcodeValue, barcodeUrl, sizeConfig, isGenerating = false }) => {
  const { width, height, rotation, transformOrigin, layout } = sizeConfig

  // Estilos CSS para la transformación según la configuración
  const getTransformStyles = () => {
    const transformOriginMap = {
      'center': 'center',
      'top-left': '0 0',
      'top-right': '100% 0',
      'bottom-left': '0 100%',
      'bottom-right': '100% 100%'
    }

    return {
      width: `${width * 3.78}px`, // Convert mm to px (1mm ≈ 3.78px at 96dpi)
      height: `${height * 3.78}px`,
      transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
      transformOrigin: transformOriginMap[transformOrigin],
      transition: 'transform 0.2s ease-in-out'
    }
  }

  // Calcular tamaños relativos basados en la configuración - MEJORADO
  const getBarcodeSize = () => {
    // El barcode debe ser el elemento dominante - 70% del ancho de la etiqueta
    const barcodeWidth = width * 0.7 * layout.barcodeScale
    const barcodeHeight = height * 0.35 * layout.barcodeScale // Altura proporcional
    return { width: barcodeWidth, height: barcodeHeight }
  }

  const getCodeFontSize = () => {
    // Texto del código debe ser legible - mínimo 14px
    const baseSize = Math.max(width, height) * 0.15 // 15% del lado más grande
    return Math.max(14, baseSize * layout.codeScale) // Mínimo 14px para legibilidad
  }

  const getNameFontSize = () => {
    // Texto del nombre debe ser legible - mínimo 10px
    const baseSize = Math.max(width, height) * 0.10 // 10% del lado más grande
    return Math.max(10, baseSize * layout.nameScale) // Mínimo 10px para legibilidad
  }

  // Determinar la posición del nombre según el espacio disponible
  const shouldShowNameOnTop = height > (width * 1.5) // Si es mucho más alto que ancho

  return (
    <div className="flex justify-center items-center p-8 bg-gray-100 rounded-lg">
      <div
        className="bg-white border border-gray-300 shadow-md overflow-visible"
        style={getTransformStyles()}
      >
        <div className="flex flex-col h-full p-2" style={{ gap: `${layout.spacing.barcodeToCode * 3.78}px` }}>
          {/* Nombre del producto (arriba si hay espacio) */}
          {shouldShowNameOnTop && materialData.nombre && (
            <div
              className="text-black text-center font-medium truncate"
              style={{ fontSize: `${getNameFontSize()}px` }}
            >
              {materialData.nombre}
            </div>
          )}

          {/* Código de barras - Siempre el elemento más grande */}
          {isGenerating ? (
            <div className="flex justify-center items-center" style={{ height: `${getBarcodeSize().height * 3.78}px` }}>
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : barcodeUrl ? (
            <div className="flex justify-center">
              <img
                src={barcodeUrl}
                alt="Código de barras"
                className="object-contain"
                style={{
                  width: `${getBarcodeSize().width * 3.78}px`,
                  height: `${getBarcodeSize().height * 3.78}px`
                }}
              />
            </div>
          ) : (
            <div
              className="flex justify-center items-center bg-gray-200"
              style={{
                width: `${getBarcodeSize().width * 3.78}px`,
                height: `${getBarcodeSize().height * 3.78}px`
              }}
            >
              <span className="text-gray-500 text-xs">Sin código</span>
            </div>
          )}

          {/* Código numérico - Segundo en jerarquía */}
          <div
            className="text-black text-center font-mono font-bold"
            style={{ fontSize: `${getCodeFontSize()}px` }}
          >
            {barcodeValue}
          </div>

          {/* Nombre del producto (abajo si no hay espacio arriba) */}
          {!shouldShowNameOnTop && materialData.nombre && (
            <div
              className="text-black text-center font-medium truncate"
              style={{
                fontSize: `${getNameFontSize()}px`,
                marginTop: `${layout.spacing.codeToName * 3.78}px`
              }}
            >
              {materialData.nombre}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  materialData,
  onBarcodeChange,
  onPrint,
  initialBarcode = '',
  initialFormat = 'CODE128',
  showPreview = true,
  showPrint = true,
  disabled = false
}) => {
  const { toast } = useToast()
  const [format, setFormat] = useState<BarcodeFormat>(initialFormat)
  const [barcodeValue, setBarcodeValue] = useState(initialBarcode)
  const [validation, setValidation] = useState<{ valid: boolean; error?: string }>({ valid: true })
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('dk-11201')
  const [selectedPrinter, setSelectedPrinter] = useState<string>('ql-810w-usb')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isGeneratingFromMaterial, setIsGeneratingFromMaterial] = useState(false)

  // Obtener la configuración del tamaño de etiqueta actual
  const currentLabelSize: LabelSize = getLabelSizeFromTemplate(selectedTemplate)
  const labelSizeConfig: LabelSizeConfig = LABEL_SIZE_CONFIGS[currentLabelSize]

  // Auto-genera código de barras desde datos del material
  const generateFromMaterial = useCallback(async () => {
    setIsGeneratingFromMaterial(true)
    
    try {
      let generatedValue = ''
      
      // Lógica de generación según formato
      switch (format) {
        case 'CODE128':
        case 'CODE128A':
        case 'CODE128B':
        case 'CODE128C':
          // Usar código del material
          generatedValue = materialData.codigo || materialData.id
          break
          
        case 'CODE39':
          // Usar código con formato CODE39 (mayúsculas y números)
          generatedValue = (materialData.codigo || materialData.id)
            .toUpperCase()
            .replace(/[^A-Z0-9-.$/+%]/g, '')
          break
          
        case 'EAN13': {
          // Generar EAN-13 (12 dígitos + checksum)
          const baseNumber = materialData.id.slice(0, 12).padEnd(12, '0')
          generatedValue = baseNumber
          break
        }

        case 'UPC': {
          // Generar UPC (11 dígitos + checksum)
          const upcBase = materialData.id.slice(0, 11).padEnd(11, '0')
          generatedValue = upcBase
          break
        }

        case 'SKU': {
          // Formato SKU personalizado: [INST]-[CAT]-[CODIGO]
          const parts = [
            materialData.institucion?.slice(0, 3) || 'GEN',
            materialData.categoria?.slice(0, 3) || 'CAT',
            materialData.codigo || materialData.id
          ]
          generatedValue = parts.join('-')
          break
        }
          
        default:
          generatedValue = materialData.codigo || materialData.id
      }
      
      setBarcodeValue(generatedValue)
      toast({
        title: "Código generado",
        description: `Se ha generado un código de barras ${format} automáticamente`,
      })
    } catch (_error) {
      toast({
        title: "Error",
        description: "No se pudo generar el código de barras",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingFromMaterial(false)
    }
  }, [format, materialData, toast])

  // Validar código de barras cuando cambia el valor o formato
  const validateBarcode = useCallback(async (value: string, fmt: BarcodeFormat) => {
    if (!value.trim()) {
      setValidation({ valid: false, error: 'El código de barras no puede estar vacío' })
      return
    }
    
    try {
      const result = await window.electronAPI.barcode.validate(fmt, value)
      setValidation(result)
    } catch (_error) {
      setValidation({ valid: false, error: 'Error en validación' })
    }
  }, [])

  // Generar preview del código de barras
  const generatePreview = useCallback(async (value: string, fmt: BarcodeFormat) => {
    if (!value.trim() || !validation.valid) return

    setIsGenerating(true)

    try {
      console.log('🔧 [Renderer] Generating barcode locally with improved sizing')

      // Generate barcode in renderer process to avoid canvas native dependency
      const { default: JsBarcode } = await import('jsbarcode')

      // Create canvas element in renderer - TAMAÑO DINÁMICO BASADO EN LA ETIQUETA
      const template = BROTHER_QL810W_TEMPLATES.find(t => t.id === selectedTemplate)
      const dpi = template?.dpi || 300

      // Usar un factor de escala para el preview (más grande para mejor visualización)
      const previewScale = 2
      const canvasWidth = Math.round((template?.width || 29) * dpi / 25.4 * previewScale)
      const canvasHeight = Math.round((template?.height || 90) * dpi / 25.4 * previewScale)

      const canvas = document.createElement('canvas')
      canvas.width = canvasWidth
      canvas.height = canvasHeight

      // Calcular dimensiones optimizadas para el barcode
      const barcodeWidth = Math.round(canvasWidth * 0.7) // 70% del ancho
      const barcodeHeight = Math.round(canvasHeight * 0.35) // 35% del alto

      // Calcular el ancho de las barras para asegurar que sean escaneables
      // Mínimo 3 píxeles por barra a 300 DPI
      const barWidth = Math.max(3, Math.min(5, Math.round(barcodeWidth / (value.length * 1.5))))

      // Generate barcode con opciones mejoradas
      JsBarcode(canvas, value, {
        format: fmt,
        width: barWidth, // Ancho de barra calculado dinámicamente
        height: barcodeHeight, // Altura proporcional
        displayValue: false, // No mostrar texto, lo manejamos manualmente
        background: '#ffffff',
        lineColor: '#000000',
        margin: 5 // Márgen reducido para usar más espacio
      })

      console.log('✅ [Renderer] Barcode generated successfully with barWidth:', barWidth)

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png')
      console.log('✅ [Renderer] Canvas converted to data URL, dimensions:', canvasWidth, 'x', canvasHeight)

      setPreviewUrl(dataUrl)
    } catch (error) {
      console.error('❌ [Renderer] Error generando preview:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar la vista previa del código de barras",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }, [validation.valid, toast, selectedTemplate])

  // Función auxiliar para truncar texto
  const truncateText = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
    const ellipsis = '...'
    let truncated = text

    while (context.measureText(truncated + ellipsis).width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1)
    }

    return truncated.length === text.length ? text : truncated + ellipsis
  }

  // Imprimir etiqueta con el nuevo layout consciente del tamaño
  const printLabel = useCallback(async () => {
    if (!validation.valid || !barcodeValue.trim()) {
      toast({
        title: "Error",
        description: "Por favor genere un código de barras válido antes de imprimir",
        variant: "destructive",
      })
      return
    }

    if (!previewUrl) {
      toast({
        title: "Error",
        description: "No hay vista previa del código de barras para imprimir",
        variant: "destructive",
      })
      return
    }

    setIsPrinting(true)

    try {
      // Obtener plantilla seleccionada
      const template = BROTHER_QL810W_TEMPLATES.find(t => t.id === selectedTemplate)
      if (!template) {
        throw new Error('Plantilla no encontrada')
      }

      // Generate label in renderer with size-aware layout
      const { default: JsBarcode } = await import('jsbarcode')
      const canvas = document.createElement('canvas')

      // Calculate canvas size based on template with DPI
      const dpi = template.dpi || 300
      const canvasWidth = Math.round(template.width * dpi / 25.4)
      const canvasHeight = Math.round(template.height * dpi / 25.4)
      canvas.width = canvasWidth
      canvas.height = canvasHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No se pudo obtener el contexto del canvas')

      // Fill background - white for thermal printing
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Usar la configuración del tamaño de etiqueta actual
      const { layout } = labelSizeConfig
      const mmToPx = dpi / 25.4 // Convertir mm a píxeles

      // Calcular el tamaño del código de barras - MEJORADO
      // El barcode debe ocupar el 70% del ancho de la etiqueta
      const barcodeWidth = Math.round(template.width * mmToPx * 0.7 * layout.barcodeScale)
      const barcodeHeight = Math.round(template.height * mmToPx * 0.35 * layout.barcodeScale)

      // Generar el código de barras sin texto
      const barcodeCanvas = document.createElement('canvas')
      barcodeCanvas.width = barcodeWidth
      barcodeCanvas.height = barcodeHeight

      // Calcular el ancho de las barras para asegurar escaneabilidad
      // Mínimo 3 píxeles por barra a 300 DPI para garantizar escaneo
      const barWidth = Math.max(3, Math.min(6, Math.round(barcodeWidth / (barcodeValue.length * 1.2))))

      JsBarcode(barcodeCanvas, barcodeValue, {
        format: format,
        width: barWidth, // Ancho de barra optimizado para escaneo
        height: barcodeHeight, // Usar altura completa
        displayValue: false, // No mostrar texto, lo manejamos manualmente
        background: '#ffffff',
        lineColor: '#000000',
        margin: 3 // Márgen reducido para maximize el espacio
      })

      // Posicionar elementos según la jerarquía visual
      let currentY = Math.round((template.height * mmToPx - barcodeHeight -
        Math.round(layout.spacing.barcodeToCode * mmToPx) -
        Math.round(20 * layout.codeScale) -
        (materialData.nombre ? Math.round(15 * layout.nameScale + layout.spacing.codeToName * mmToPx) : 0)) / 2)

      // Dibujar el código de barras centrado
      const barcodeX = Math.round((canvasWidth - barcodeWidth) / 2)
      ctx.drawImage(barcodeCanvas, barcodeX, currentY)

      currentY += barcodeHeight + Math.round(layout.spacing.barcodeToCode * mmToPx)

      // Dibujar el código numérico (segunda prioridad) - FUENTES MÁS GRANDES
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'center'
      // Tamaño mínimo de 16px para el código numérico
      const codeFontSize = Math.max(16, Math.round(18 * layout.codeScale))
      ctx.font = `bold ${codeFontSize}px monospace`
      ctx.fillText(barcodeValue, canvasWidth / 2, currentY)

      // Dibujar el nombre del producto (última prioridad)
      if (materialData.nombre) {
        currentY += Math.round(codeFontSize * 0.8) + Math.round(layout.spacing.codeToName * mmToPx)
        // Tamaño mínimo de 12px para el nombre del producto
        const nameFontSize = Math.max(12, Math.round(14 * layout.nameScale))
        ctx.font = `${nameFontSize}px Arial, sans-serif`

        // Truncar si el texto es muy largo
        const maxTextWidth = canvasWidth - 20
        const truncatedText = truncateText(ctx, materialData.nombre, maxTextWidth)
        ctx.fillText(truncatedText, canvasWidth / 2, currentY)
      }

      // Convert to base64
      const labelDataUrl = canvas.toDataURL('image/png')

      // Convert data URL to buffer for printing
      const base64Data = labelDataUrl.replace('data:image/png;base64,', '')
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Create job with pre-generated barcode
      const job: PrintJob = {
        id: `job_${Date.now()}`,
        barcodeData: {
          format,
          value: barcodeValue,
          printerId: selectedPrinter
        },
        labelTemplate: template,
        materialData: {
          ...materialData,
          barcode: barcodeValue
        },
        copies: 1,
        status: 'pending',
        createdAt: new Date()
      }

      // Send to main process for printing
      const result = await window.electronAPI.barcode.print({
        ...job,
        imageData: Array.from(bytes) // Convert Uint8Array to regular array for IPC
      })

      if (result.success) {
        toast({
          title: "Impresión exitosa",
          description: `La etiqueta ${labelSizeConfig.width}x${labelSizeConfig.height}mm se ha enviado a la impresora`,
        })

        if (onPrint) {
          onPrint(job)
        }
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('❌ Error printing label:', error)
      toast({
        title: "Error de impresión",
        description: error instanceof Error ? error.message : "No se pudo imprimir la etiqueta",
        variant: "destructive",
      })
    } finally {
      setIsPrinting(false)
    }
  }, [validation.valid, barcodeValue, format, selectedTemplate, selectedPrinter, materialData, onPrint, toast, previewUrl, labelSizeConfig])

  // Efectos
  useEffect(() => {
    validateBarcode(barcodeValue, format)
  }, [barcodeValue, format, validateBarcode])
  
  useEffect(() => {
    if (barcodeValue && validation.valid) {
      generatePreview(barcodeValue, format)
    }
  }, [barcodeValue, format, validation.valid, generatePreview])
  
  // Usamos useRef para evitar el bucle infinito con onBarcodeChange
  // Esto previene el problema de "Maximum update depth exceeded"
  // al mantener estable el callback entre renders
  const previousBarcodeRef = useRef(barcodeValue)
  const onBarcodeChangeRef = useRef(onBarcodeChange)

  // Actualizar la ref del callback cuando cambia para evitar stale closures
  // Mantiene el callback actualizado sin disparar el efecto principal
  useEffect(() => {
    onBarcodeChangeRef.current = onBarcodeChange
  }, [onBarcodeChange])

  useEffect(() => {
    // Solo disparar onBarcodeChange si el valor realmente cambió
    // y onBarcodeChange está disponible
    // 🔑 CLAVE: Removemos onBarcodeChange de las dependencias para prevenir bucles
    if (onBarcodeChangeRef.current && barcodeValue !== previousBarcodeRef.current) {
      previousBarcodeRef.current = barcodeValue
      onBarcodeChangeRef.current(barcodeValue)
    }
  }, [barcodeValue]) // Removemos onBarcodeChange de las dependencias - previene bucles

  // Formatos disponibles con sus descripciones
  const formatOptions = [
    { value: 'CODE128', label: 'CODE128', description: 'Alta densidad, ASCII completo' },
    { value: 'CODE39', label: 'CODE39', description: 'Industrial, alfanumérico' },
    { value: 'EAN13', label: 'EAN-13', description: 'Retail, 13 dígitos' },
    { value: 'UPC', label: 'UPC', description: 'Retail EE.UU./Canadá' },
    { value: 'SKU', label: 'SKU', description: 'Personalizado para inventario' }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Barcode className="w-5 h-5" />
            Generador de Código de Barras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de formato */}
            <div className="space-y-2">
              <Label htmlFor="format">Formato</Label>
              <Select value={format} onValueChange={(value) => setFormat(value as BarcodeFormat)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar formato" />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-sm text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor del código de barras */}
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  value={barcodeValue}
                  onChange={(e) => setBarcodeValue(e.target.value)}
                  placeholder="Ingrese código de barras"
                  className={validation.valid ? '' : 'border-red-500'}
                  disabled={disabled}
                />
                <Button
                  onClick={generateFromMaterial}
                  disabled={disabled || isGeneratingFromMaterial}
                  variant="outline"
                  size="icon"
                  title="Generar desde material"
                >
                  {isGeneratingFromMaterial ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {/* Validación */}
              {validation.error && (
                <Alert variant="destructive" className="mt-2">
                  <X className="w-4 h-4" />
                  <AlertDescription>{validation.error}</AlertDescription>
                </Alert>
              )}
              
              {/* Información del formato */}
              {format !== 'SKU' && BARCODE_VALIDATIONS[format] && (
                <div className="text-sm text-muted-foreground mt-2">
                  <Badge variant="secondary" className="mb-1">
                    {BARCODE_VALIDATIONS[format].description}
                  </Badge>
                  <div>Ejemplos: {BARCODE_VALIDATIONS[format].examples.join(', ')}</div>
                </div>
              )}
            </div>
          </div>

          {/* Opciones de impresión */}
          {showPrint && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="template">Plantilla de Etiqueta</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    {BROTHER_QL810W_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span>{template.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {template.width}x{template.height}mm @ {template.dpi}dpi
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="printer">Impresora</Label>
                <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar impresora" />
                  </SelectTrigger>
                  <SelectContent>
                    {BROTHER_PRINTER_CONFIGS.map((printer) => (
                      <SelectItem key={printer.id} value={printer.id}>
                        <div className="flex flex-col">
                          <span>{printer.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {printer.connection === 'usb' ? 'USB' : `Red: ${printer.address}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview y botón de impresión */}
      {(showPreview || showPrint) && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="preview" className="w-full">
              <TabsList>
                <TabsTrigger value="preview">Vista Previa</TabsTrigger>
                {showPrint && <TabsTrigger value="label">Etiqueta Completa</TabsTrigger>}
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                <div className="space-y-6">
                  {/* Información del tamaño actual */}
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="outline" className="px-3 py-1">
                      Tamaño: {labelSizeConfig.width}x{labelSizeConfig.height}mm
                    </Badge>
                    {labelSizeConfig.rotation !== 0 && (
                      <Badge variant="outline" className="px-3 py-1">
                        Rotación: {labelSizeConfig.rotation}°
                      </Badge>
                    )}
                  </div>

                  {/* Preview con jerarquía visual correcta */}
                  <LabelPreview
                    materialData={materialData}
                    barcodeValue={barcodeValue}
                    barcodeUrl={previewUrl}
                    sizeConfig={labelSizeConfig}
                    isGenerating={isGenerating}
                  />
                </div>
              </TabsContent>

              {showPrint && (
                <TabsContent value="label" className="mt-4">
                  <div className="space-y-6">
                    {/* Título e información */}
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold">Vista Previa de Impresión</h3>
                      <p className="text-sm text-muted-foreground">
                        La etiqueta se imprimirá con las dimensiones exactas de {labelSizeConfig.width}x{labelSizeConfig.height}mm
                      </p>
                    </div>

                    {/* Preview de la etiqueta a tamaño real */}
                    <div className="flex justify-center overflow-auto">
                      <LabelPreview
                        materialData={materialData}
                        barcodeValue={barcodeValue}
                        barcodeUrl={previewUrl}
                        sizeConfig={labelSizeConfig}
                        isGenerating={isGenerating}
                      />
                    </div>

                    {/* Botón de impresión */}
                    <div className="flex justify-center">
                      <Button
                        onClick={printLabel}
                        disabled={!validation.valid || isPrinting || disabled || !previewUrl}
                        className="w-full max-w-md"
                      >
                        {isPrinting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Imprimiendo...
                          </>
                        ) : (
                          <>
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir Etiqueta
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
