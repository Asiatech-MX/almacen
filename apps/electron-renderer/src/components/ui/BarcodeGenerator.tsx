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

  // Generar preview del código de barras usando el main process
  const generatePreview = useCallback(async (value: string, fmt: BarcodeFormat) => {
    if (!value.trim() || !validation.valid) return

    setIsGenerating(true)

    try {
      console.log('🔧 [Renderer] Requesting label generation from main process')

      // Usar la nueva función del main process para generar la etiqueta completa
      const result = await window.electronAPI.barcode.generateLabel({
        materialData: {
          ...materialData,
          // El preview usa el precio si existe
          precio: materialData.costo_unitario || materialData.precio
        },
        templateId: selectedTemplate,
        barcodeOptions: {
          format: fmt,
          value: value,
          displayValue: true,
          width: 2,
          height: 100
        }
      })

      if (result.success && result.data) {
        console.log('✅ [Renderer] Label generated successfully from main process')
        setPreviewUrl(result.data)
      } else {
        throw new Error(result.error || 'Failed to generate label')
      }
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
  }, [validation.valid, toast, selectedTemplate, materialData])

  // Función auxiliar para truncar texto
  const truncateText = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
    const ellipsis = '...'
    let truncated = text

    while (context.measureText(truncated + ellipsis).width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1)
    }

    return truncated.length === text.length ? text : truncated + ellipsis
  }

  // Imprimir etiqueta usando el main process
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
      console.log('🔧 [Renderer] Requesting label printing from main process')

      // Generar la etiqueta en el main process
      const result = await window.electronAPI.barcode.generateLabel({
        materialData: {
          ...materialData,
          // Usar costo_unitario si existe, sino precio
          precio: materialData.costo_unitario || materialData.precio
        },
        templateId: selectedTemplate,
        barcodeOptions: {
          format: format,
          value: barcodeValue,
          displayValue: true,
          width: 2,
          height: 100,
          printerId: selectedPrinter
        }
      })

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate label for printing')
      }

      // Convertir data URL a buffer para impresión
      const base64Data = result.data.replace('data:image/png;base64,', '')
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Obtener plantilla para el job de impresión
      const template = BROTHER_QL810W_TEMPLATES.find(t => t.id === selectedTemplate)
      if (!template) {
        throw new Error('Plantilla no encontrada')
      }

      // Crear job de impresión
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
          barcode: barcodeValue,
          // Usar costo_unitario si existe, sino precio
          precio: materialData.costo_unitario || materialData.precio
        },
        copies: 1,
        status: 'pending',
        createdAt: new Date()
      }

      // Enviar a impresión
      const printResult = await window.electronAPI.barcode.print({
        ...job,
        imageData: Array.from(bytes) // Convertir a array para IPC
      })

      if (printResult.success) {
        toast({
          title: "Impresión exitosa",
          description: `La etiqueta ${template.width}x${template.height}mm se ha enviado a la impresora`,
        })

        if (onPrint) {
          onPrint(job)
        }
      } else {
        throw new Error(printResult.message || 'Error en la impresión')
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
  }, [validation.valid, barcodeValue, format, selectedTemplate, selectedPrinter, materialData, onPrint, toast])

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
