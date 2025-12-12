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
  MaterialLabelData
} from '@/types'
import {
  BARCODE_VALIDATIONS,
  BROTHER_QL810W_TEMPLATES,
  BROTHER_PRINTER_CONFIGS
} from '@/types'
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
      const options: BarcodeOptions = {
        format: fmt,
        value: value,
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 14,
        textMargin: 2,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000'
      }
      
      const result = await window.electronAPI.barcode.generate(options)
      if (result.success) {
        setPreviewUrl(result.data)
      }
    } catch (_error) {
      console.error('Error generando preview:', error)
      toast({
        title: "Error",
        description: "No se pudo generar la vista previa del código de barras",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }, [validation.valid, toast])

  // Imprimir etiqueta
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
      
      // Crear trabajo de impresión
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
      
      const result = await window.electronAPI.barcode.print(job)
      
      if (result.success) {
        toast({
          title: "Impresión exitosa",
          description: "La etiqueta se ha enviado a la impresora",
        })
        
        if (onPrint) {
          onPrint(job)
        }
      } else {
        throw new Error(result.message)
      }
    } catch (_error) {
      toast({
        title: "Error de impresión",
        description: error.message || "No se pudo imprimir la etiqueta",
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

  const selectedTemplateConfig = BROTHER_QL810W_TEMPLATES.find(t => t.id === selectedTemplate)

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
                {isGenerating ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : previewUrl ? (
                  <div className="flex justify-center">
                    <img 
                      src={previewUrl} 
                      alt="Vista previa del código de barras"
                      className="max-w-full h-auto border border-gray-200 rounded"
                    />
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-64 text-muted-foreground">
                    Ingrese un código válido para generar la vista previa
                  </div>
                )}
              </TabsContent>

              {showPrint && (
                <TabsContent value="label" className="mt-4">
                  {selectedTemplateConfig ? (
                    <div className="space-y-4">
                      {/* Preview de la etiqueta completa */}
                      <div 
                        className="mx-auto border-2 border-gray-300 bg-white p-4"
                        style={{
                          width: `${selectedTemplateConfig.width * 3}px`, // Zoom x3 para visualización
                          height: `${selectedTemplateConfig.height * 3}px`,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        {previewUrl && (
                          <div 
                            className="flex justify-center"
                            style={{
                              width: `${selectedTemplateConfig.layout.barcode.width * 3}px`,
                              height: `${selectedTemplateConfig.layout.barcode.height * 3}px`
                            }}
                          >
                            <img 
                              src={previewUrl} 
                              alt="Código de barras"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        
                        {selectedTemplateConfig.layout.text.map((textItem, index) => (
                          <div
                            key={index}
                            className="text-black"
                            style={{
                              fontSize: `${textItem.fontSize * 3}px`,
                              textAlign: textItem.align as 'left' | 'center' | 'right'
                            }}
                          >
                            {index === 0 && materialData.nombre}
                            {index === 1 && `Código: ${barcodeValue}`}
                            {index === 2 && `Stock: ${materialData.stock || 0}`}
                          </div>
                        ))}
                      </div>

                      {/* Botón de impresión */}
                      <div className="flex justify-center">
                        <Button
                          onClick={printLabel}
                          disabled={!validation.valid || isPrinting || disabled}
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
                  ) : (
                    <div className="flex justify-center items-center h-64 text-muted-foreground">
                      Seleccione una plantilla de etiqueta
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
