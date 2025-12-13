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

// Componente para renderizar la etiqueta con layout horizontal de dos columnas
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

    // Para preview, usar 96 DPI estándar del navegador
    const previewDPI = 96
    const mmToPx = previewDPI / 25.4

    return {
      width: `${width * mmToPx}px`, // Convert mm to px usando DPI correcto
      height: `${height * mmToPx}px`,
      transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
      transformOrigin: transformOriginMap[transformOrigin],
      transition: 'transform 0.2s ease-in-out'
    }
  }

  // Calcular tamaños relativos para layout horizontal
  const getBarcodeSize = () => {
    // Barcode ocupa 40% del ancho del área imprimible
    const printableWidth = width - 6 // Restar 3mm de margen cada lado
    const printableHeight = height - 6 // Restar 3mm de margen cada lado
    const barcodeWidth = printableWidth * 0.4 * layout.barcodeScale // 40% del ancho imprimible
    const barcodeHeight = printableHeight * 0.8 * layout.barcodeScale // 80% de la altura imprimible para máxima escaneabilidad
    return { width: barcodeWidth, height: barcodeHeight }
  }

  const getNameFontSize = () => {
    // Nombre del producto - fuente más grande para visibilidad
    const baseSize = height * 0.25 // 25% de la altura total
    return Math.max(12, Math.min(16, baseSize * layout.nameScale)) // Entre 12-16px
  }

  const getCodeFontSize = () => {
    // SKU - fuente monospace para claridad
    const baseSize = height * 0.18 // 18% de la altura total
    return Math.max(10, Math.min(12, baseSize * layout.codeScale)) // Entre 10-12px
  }

  const getPriceFontSize = () => {
    // Precio - fuente destacada pero más pequeña que el nombre
    const baseSize = height * 0.20 // 20% de la altura total
    return Math.max(11, Math.min(14, baseSize * layout.codeScale)) // Entre 11-14px
  }

  // Calcular el espaciado entre columnas (si no está definido, usar 4mm por defecto)
  const columnGap = layout.spacing.columnGap || 4

  return (
    <div className="flex justify-center items-center p-8 bg-gray-100 rounded-lg">
      <div
        className="bg-white border border-gray-300 shadow-md overflow-visible"
        style={getTransformStyles()}
      >
        <div className="flex h-full p-2" style={{ gap: `${columnGap * 3.78}px` }}>
          {/* Columna Izquierda - Texto (60% del ancho) */}
          <div className="flex flex-col justify-center" style={{ width: '60%' }}>
            {/* Nombre del producto - Prioridad principal */}
            {materialData.nombre && (
              <div
                className="text-black font-medium truncate"
                style={{ fontSize: `${getNameFontSize()}px`, lineHeight: layout.spacing.textLineHeight || 1.4 }}
                title={materialData.nombre} // Tooltip para nombre completo
              >
                {materialData.nombre}
              </div>
            )}

            {/* SKU - Siempre mostrar */}
            <div
              className="text-black font-mono"
              style={{
                fontSize: `${getCodeFontSize()}px`,
                marginTop: materialData.nombre ? '2px' : '0',
                lineHeight: layout.spacing.textLineHeight || 1.4
              }}
            >
              SKU: {materialData.codigo}
            </div>

            {/* Precio - Si está disponible */}
            {materialData.precio && (
              <div
                className="text-black font-bold"
                style={{
                  fontSize: `${getPriceFontSize()}px`,
                  marginTop: '2px',
                  lineHeight: layout.spacing.textLineHeight || 1.4
                }}
              >
                ${materialData.precio}
              </div>
            )}
          </div>

          {/* Columna Derecha - Código de Barras (40% del ancho) */}
          <div className="flex justify-end items-center" style={{ width: '40%' }}>
            {isGenerating ? (
              <div className="flex justify-center items-center" style={{ width: `${getBarcodeSize().width * 3.78}px`, height: `${getBarcodeSize().height * 3.78}px` }}>
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : barcodeUrl ? (
              <img
                src={barcodeUrl}
                alt="Código de barras"
                className="object-contain"
                style={{
                  width: `${getBarcodeSize().width * 3.78}px`,
                  height: `${getBarcodeSize().height * 3.78}px`
                }}
              />
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
          </div>
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

  // Generar preview del código de barras con layout horizontal
  const generatePreview = useCallback(async (value: string, fmt: BarcodeFormat) => {
    if (!value.trim() || !validation.valid) return

    setIsGenerating(true)

    try {
      console.log('🔧 [Renderer] Generating barcode with horizontal layout')

      // Generate barcode in renderer process to avoid canvas native dependency
      const { default: JsBarcode } = await import('jsbarcode')

      // Get template and calculate dimensions
      const template = BROTHER_QL810W_TEMPLATES.find(t => t.id === selectedTemplate)
      const dpi = template?.dpi || 300

      // Calculate actual label dimensions in pixels
      const mmToPx = dpi / 25.4
      const labelWidthPx = Math.round(template.width * mmToPx)
      const labelHeightPx = Math.round(template.height * mmToPx)

      // Calculate safety margins (3mm on each side)
      const marginPx = Math.round(3 * mmToPx)
      const printableWidth = labelWidthPx - (2 * marginPx)
      const printableHeight = labelHeightPx - (2 * marginPx)

      // Calculate column widths for horizontal layout
      const textColumnWidth = Math.round(printableWidth * 0.6) // 60% for text
      const barcodeColumnWidth = Math.round(printableWidth * 0.4) // 40% for barcode
      const columnGap = Math.round((labelSizeConfig.layout.spacing.columnGap || 4) * mmToPx)

      // Create canvas with actual label dimensions
      const canvas = document.createElement('canvas')
      canvas.width = labelWidthPx
      canvas.height = labelHeightPx

      // Clear canvas with white background
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No se pudo obtener el contexto del canvas')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, labelWidthPx, labelHeightPx)

      // ======== DIBUJAR COLUMNA IZQUIERDA (TEXTO) ========
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'left'

      // Configurar fuentes
      const nameFontSize = Math.round(16 * labelSizeConfig.layout.nameScale) // 16px base
      const codeFontSize = Math.round(12 * labelSizeConfig.layout.codeScale) // 12px base
      const priceFontSize = Math.round(14 * labelSizeConfig.layout.codeScale) // 14px base
      const lineHeight = labelSizeConfig.layout.spacing.textLineHeight || 1.4

      let currentY = marginPx + Math.round((printableHeight - (
        (materialData.nombre ? nameFontSize * lineHeight : 0) +
        codeFontSize * lineHeight +
        (materialData.precio ? priceFontSize * lineHeight : 0)
      )) / 2)

      // Nombre del producto
      if (materialData.nombre) {
        ctx.font = `${nameFontSize}px Arial, sans-serif`
        const truncatedText = truncateText(ctx, materialData.nombre, textColumnWidth - 10)
        ctx.fillText(truncatedText, marginPx, currentY)
        currentY += Math.round(nameFontSize * lineHeight)
      }

      // SKU
      ctx.font = `${codeFontSize}px monospace`
      ctx.fillText(`SKU: ${materialData.codigo}`, marginPx, currentY)
      currentY += Math.round(codeFontSize * lineHeight)

      // Precio
      if (materialData.precio) {
        ctx.font = `bold ${priceFontSize}px Arial, sans-serif`
        ctx.fillText(`$${materialData.precio}`, marginPx, currentY)
      }

      // ======== DIBUJAR COLUMNA DERECHA (CÓDIGO DE BARRAS) ========
      // Calcular dimensiones del barcode
      const barcodeWidth = Math.min(
        barcodeColumnWidth - 10,
        Math.round(barcodeColumnWidth * 0.9)
      )
      const barcodeHeight = Math.round(printableHeight * 0.8) // 80% de altura disponible
      const barcodeX = marginPx + textColumnWidth + columnGap + (barcodeColumnWidth - barcodeWidth)
      const barcodeY = marginPx + Math.round((printableHeight - barcodeHeight) / 2)

      // Calcular ancho de barras para escaneabilidad
      const minBarWidth = Math.max(2, Math.round(dpi / 150)) // Mínimo 2px a 300 DPI
      const maxBarWidth = Math.min(3, Math.round(barcodeWidth / (value.length * 1.5)))
      const barWidth = Math.max(minBarWidth, maxBarWidth)

      // Generar barcode con displayValue: false
      JsBarcode(canvas, value, {
        format: fmt,
        width: barWidth,
        height: barcodeHeight,
        displayValue: false, // No mostrar texto bajo el barcode
        background: '#ffffff',
        lineColor: '#000000',
        margin: 0,
        marginTop: barcodeY,
        marginLeft: barcodeX
      })

      console.log('✅ [Renderer] Horizontal barcode generated:', {
        dimensions: `${labelWidthPx}x${labelHeightPx}px`,
        columns: {
          text: `${textColumnWidth}px wide`,
          barcode: `${barcodeWidth}x${barcodeHeight}px`,
          gap: `${columnGap}px`
        },
        position: `barcode at (${barcodeX}, ${barcodeY})`,
        barWidth
      })

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png')
      console.log('✅ [Renderer] Canvas converted to data URL')

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
  }, [validation.valid, toast, selectedTemplate, materialData, labelSizeConfig])

  // Función auxiliar para truncar texto
  const truncateText = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
    const ellipsis = '...'
    let truncated = text

    while (context.measureText(truncated + ellipsis).width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1)
    }

    return truncated.length === text.length ? text : truncated + ellipsis
  }

  // Imprimir etiqueta con layout horizontal de dos columnas
  const printLabel = useCallback(async () => {
    if (!validation.valid || !barcodeValue.trim()) {
      toast({
        title: "Error",
        description: "Por favor genere un código de barras válido antes de imprimir",
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

      // Generate label in renderer with horizontal layout
      const { default: JsBarcode } = await import('jsbarcode')
      const canvas = document.createElement('canvas')

      // Calculate canvas size based on template with DPI
      const dpi = template.dpi || 300
      const mmToPx = dpi / 25.4 // Convertir mm a píxeles

      // Label dimensions in pixels
      const canvasWidth = Math.round(template.width * mmToPx)
      const canvasHeight = Math.round(template.height * mmToPx)
      canvas.width = canvasWidth
      canvas.height = canvasHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No se pudo obtener el contexto del canvas')

      // Fill background - white for thermal printing
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Calculate safety margins (3mm on each side)
      const marginPx = Math.round(3 * mmToPx)
      const printableWidth = canvasWidth - (2 * marginPx)
      const printableHeight = canvasHeight - (2 * marginPx)

      // Usar la configuración del tamaño de etiqueta actual
      const { layout } = labelSizeConfig

      // ======== LAYOUT HORIZONTAL: DOS COLUMNAS ========
      // Calcular dimensiones de columnas
      const textColumnWidth = Math.round(printableWidth * 0.6) // 60% para texto
      const barcodeColumnWidth = Math.round(printableWidth * 0.4) // 40% para barcode
      const columnGap = Math.round((layout.spacing.columnGap || 4) * mmToPx)

      // ======== DIBUJAR COLUMNA IZQUIERDA (TEXTO) ========
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'left'

      // Configurar fuentes
      const nameFontSize = Math.max(16, Math.round(18 * layout.nameScale))
      const codeFontSize = Math.max(12, Math.round(14 * layout.codeScale))
      const priceFontSize = Math.max(14, Math.round(16 * layout.codeScale))
      const lineHeight = layout.spacing.textLineHeight || 1.4

      // Calcular posición Y inicial para centrar verticalmente
      let currentY = marginPx + Math.round((printableHeight - (
        (materialData.nombre ? nameFontSize * lineHeight : 0) +
        codeFontSize * lineHeight +
        (materialData.precio ? priceFontSize * lineHeight : 0)
      )) / 2)

      // Nombre del producto
      if (materialData.nombre) {
        ctx.font = `${nameFontSize}px Arial, sans-serif`
        const truncatedText = truncateText(ctx, materialData.nombre, textColumnWidth - 10)
        ctx.fillText(truncatedText, marginPx, currentY)
        currentY += Math.round(nameFontSize * lineHeight)
      }

      // SKU
      ctx.font = `${codeFontSize}px monospace`
      ctx.fillText(`SKU: ${materialData.codigo}`, marginPx, currentY)
      currentY += Math.round(codeFontSize * lineHeight)

      // Precio
      if (materialData.precio) {
        ctx.font = `bold ${priceFontSize}px Arial, sans-serif`
        ctx.fillText(`$${materialData.precio}`, marginPx, currentY)
      }

      // ======== DIBUJAR COLUMNA DERECHA (CÓDIGO DE BARRAS) ========
      // Calcular dimensiones del barcode
      const barcodeWidth = Math.min(
        barcodeColumnWidth - 10,
        Math.round(barcodeColumnWidth * 0.9)
      )
      const barcodeHeight = Math.round(printableHeight * 0.8) // 80% de altura para máxima escaneabilidad
      const barcodeX = marginPx + textColumnWidth + columnGap + (barcodeColumnWidth - barcodeWidth)
      const barcodeY = marginPx + Math.round((printableHeight - barcodeHeight) / 2)

      // Generar el código de barras sin texto (displayValue: false)
      const barcodeCanvas = document.createElement('canvas')
      barcodeCanvas.width = barcodeWidth
      barcodeCanvas.height = barcodeHeight

      // Calcular el ancho de las barras para asegurar escaneabilidad
      // Mínimo 2 píxeles por barra a 300 DPI, óptimo 2-3px
      const minBarWidth = Math.max(2, Math.round(dpi / 150))
      const maxBarWidth = Math.min(3, Math.round(barcodeWidth / (barcodeValue.length * 1.5)))
      const barWidth = Math.max(minBarWidth, maxBarWidth)

      JsBarcode(barcodeCanvas, barcodeValue, {
        format: format,
        width: barWidth, // Ancho de barra optimizado para escaneo
        height: barcodeHeight, // Máxima altura posible
        displayValue: false, // No mostrar texto bajo el barcode
        background: '#ffffff',
        lineColor: '#000000',
        margin: 0 // Sin margen - controlamos posición manualmente
      })

      // Dibujar el código de barras en su columna
      ctx.drawImage(barcodeCanvas, barcodeX, barcodeY)

      console.log('✅ [Renderer] Horizontal label generated:', {
        dimensions: `${canvasWidth}x${canvasHeight}px (${template.width}x${template.height}mm)`,
        columns: {
          text: `${textColumnWidth}px wide at x=${marginPx}`,
          barcode: `${barcodeWidth}x${barcodeHeight}px at x=${barcodeX}`,
          gap: `${columnGap}px`
        },
        fonts: {
          name: `${nameFontSize}px`,
          code: `${codeFontSize}px`,
          price: `${priceFontSize}px`
        },
        barcode: {
          barWidth,
          format,
          value: barcodeValue
        }
      })

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
  }, [validation.valid, barcodeValue, format, selectedTemplate, selectedPrinter, materialData, onPrint, toast, labelSizeConfig])

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
