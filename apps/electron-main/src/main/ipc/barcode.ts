import { ipcMain } from 'electron'
import { 
  BarcodeOptions, 
  PrintJob, 
  PrinterConfig, 
  PrintOptions,
  BarcodeIPCEvents,
  BarcodeFormat,
  BARCODE_VALIDATIONS
} from '@shared-types/barcode'
import { printPngFile } from 'node-brother-label-printer'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'

// Cola de trabajos de impresión
let printQueue: PrintJob[] = []
let isPrinting = false

// Función para generar código de barras como base64
async function generateBarcodePNG(options: BarcodeOptions): Promise<string> {
  const JsBarcode = require('jsbarcode')
  
  try {
    // Crear canvas temporal
    const canvas = require('canvas').createCanvas(720, 300) // 720px width para óptima impresión
    const ctx = canvas.getContext('2d')
    
    // Generar código de barras con JsBarcode
    JsBarcode(canvas, options.value, {
      format: options.format,
      width: options.width || 2,
      height: options.height || 100,
      displayValue: options.displayValue !== false,
      fontSize: options.fontSize || 20,
      textMargin: options.textMargin || 2,
      margin: options.margin || 10,
      background: options.background || '#ffffff',
      lineColor: options.lineColor || '#000000',
      font: options.font || 'monospace',
      fontOptions: options.fontOptions || '',
      textAlign: options.textAlign || 'center',
      textPosition: options.textPosition || 'bottom',
      flat: options.flat || false,
      lastChar: options.lastChar,
      mod43: options.mod43,
      ean128: options.ean128,
      valid: options.valid
    })
    
    // Convertir a base64
    const dataUrl = canvas.toDataURL('image/png')
    return dataUrl
  } catch (error) {
    console.error('❌ Error generando código de barras:', error)
    throw new Error(`Error generando código de barras: ${error.message}`)
  }
}

// Función para crear etiqueta completa con material
async function createLabelPNG(job: PrintJob): Promise<Buffer> {
  const JsBarcode = require('jsbarcode')
  const { createCanvas } = require('canvas')
  
  try {
    const template = job.labelTemplate
    const data = job.materialData
    
    // Crear canvas con dimensiones de la etiqueta
    const canvas = createCanvas(
      Math.round(template.width * template.dpi / 25.4), // Convertir mm a px
      Math.round(template.height * template.dpi / 25.4)
    )
    const ctx = canvas.getContext('2d')
    
    // Limpiar fondo
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Dibujar código de barras
    const barcodeCanvas = createCanvas(720, 300)
    JsBarcode(barcodeCanvas, job.barcodeData.value, {
      format: job.barcodeData.format,
      width: 2,
      height: 80,
      displayValue: false, // No mostrar valor en el barcode
      background: '#ffffff',
      lineColor: '#000000'
    })
    
    // Calcular posición y tamaño del barcode
    const barcodeX = Math.round(template.layout.barcode.x * template.dpi / 25.4)
    const barcodeY = Math.round(template.layout.barcode.y * template.dpi / 25.4)
    const barcodeWidth = Math.round(template.layout.barcode.width * template.dpi / 25.4)
    const barcodeHeight = Math.round(template.layout.barcode.height * template.dpi / 25.4)
    
    // Dibujar barcode escalado
    ctx.drawImage(barcodeCanvas, barcodeX, barcodeY, barcodeWidth, barcodeHeight)
    
    // Dibujar textos
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'center'
    
    template.layout.text.forEach((textItem, index) => {
      const textX = Math.round(textItem.x * template.dpi / 25.4 + (textItem.width * template.dpi / 50.8))
      const textY = Math.round(textItem.y * template.dpi / 25.4 + textItem.height)
      
      ctx.font = `${Math.round(textItem.fontSize * template.dpi / 72)}px Arial`
      ctx.fillText(getTextForPosition(textItem, data), textX, textY)
    })
    
    // Convertir a buffer
    return canvas.toBuffer('image/png')
  } catch (error) {
    console.error('❌ Error creando etiqueta:', error)
    throw new Error(`Error creando etiqueta: ${error.message}`)
  }
}

function getTextForPosition(textItem: any, data: any): string {
  switch (textItem.content) {
    case 'nombre':
      return data.nombre || ''
    case 'codigo':
      return data.codigo || ''
    case 'stock':
      return `Stock: ${data.stock || 0}`
    case 'ubicacion':
      return `Ubicación: ${data.ubicacion || 'N/A'}`
    case 'categoria':
      return data.categoria || ''
    case 'presentacion':
      return data.presentacion || ''
    case 'barcode':
      return data.barcode || ''
    default:
      return ''
  }
}

// Función principal de impresión
async function printLabel(job: PrintJob): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('🏷️ Iniciando impresión de etiqueta:', job.id)
    
    // Crear imagen de la etiqueta
    const labelBuffer = await createLabelPNG(job)
    
    // Guardar imagen temporal
    const tempDir = join(process.cwd(), 'temp')
    await mkdir(tempDir, { recursive: true })
    const tempFile = join(tempDir, `label_${job.id}_${Date.now()}.png`)
    await writeFile(tempFile, labelBuffer)
    
    // Configuración de impresora
    const { BROTHER_PRINTER_CONFIGS } = require('@shared-types/barcode')
    const printerConfig = BROTHER_PRINTER_CONFIGS
      .find((p: PrinterConfig) => p.id === job.barcodeData.printerId || 'ql-810w-usb')
    
    if (!printerConfig) {
      throw new Error('Impresora no configurada')
    }
    
    // Imprimir usando node-brother-label-printer
    await printPngFile({
      vendorId: printerConfig.vendorId,
      productId: printerConfig.productId,
      filename: tempFile,
      options: {
        landscape: false,
        labelWidth: getLabelWidthName(job.labelTemplate.id)
      },
      compression: {
        enable: true
      }
    })
    
    console.log('✅ Etiqueta impresa exitosamente:', job.id)
    return { success: true, message: 'Etiqueta impresa exitosamente' }
  } catch (error) {
    console.error('❌ Error en impresión:', error)
    return { 
      success: false, 
      message: `Error en impresión: ${error.message}` 
    }
  }
}

function getLabelWidthName(templateId: string): string {
  switch (templateId) {
    case 'dk-11201':
      return '29-mm-wide'
    case 'dk-11202':
      return '62-mm-wide'
    case 'continuous-62mm':
      return '62-mm-wide continuous'
    default:
      return '62-mm-wide continuous'
  }
}

// Procesar cola de impresión
async function processPrintQueue() {
  if (isPrinting || printQueue.length === 0) return
  
  isPrinting = true
  
  while (printQueue.length > 0) {
    const job = printQueue.shift()
    if (job) {
      job.status = 'printing'
      
      const result = await printLabel(job)
      
      if (result.success) {
        job.status = 'completed'
        job.completedAt = new Date()
      } else {
        job.status = 'error'
        job.error = result.message
      }
    }
  }
  
  isPrinting = false
}

// Registro de handlers IPC
export function registerBarcodeHandlers() {
  console.log('🔧 Registrando handlers de códigos de barras...')
  
  // Generar código de barras
  ipcMain.handle('barcode:generate', async (_, options: BarcodeOptions) => {
    try {
      const base64 = await generateBarcodePNG(options)
      return { success: true, data: base64 }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  
  // Validar código de barras
  ipcMain.handle('barcode:validate', async (_, format: BarcodeFormat, value: string) => {
    try {
      if (format === 'SKU') {
        // SKU es flexible - solo verificar que no esté vacío
        return { 
          valid: value.trim().length > 0, 
          error: value.trim().length === 0 ? 'El SKU no puede estar vacío' : undefined 
        }
      }
      
      if (format === 'QR') {
        // QR codes aceptan cualquier texto
        return { 
          valid: value.trim().length > 0, 
          error: value.trim().length === 0 ? 'El texto para QR no puede estar vacío' : undefined 
        }
      }
      
      const validation = BARCODE_VALIDATIONS[format]
      if (!validation) {
        return { valid: false, error: `Formato no soportado: ${format}` }
      }
      
      // Verificar longitud
      if (typeof validation.length === 'number') {
        if (value.length !== validation.length) {
          // Permitir longitud sin checksum si aplica
          if (validation.checkDigit && value.length === validation.length - 1) {
            return { valid: true } // JsBarcode agregará checksum
          }
          return { 
            valid: false, 
            error: `Longitud inválida. Se esperan ${validation.length} dígitos` 
          }
        }
      } else {
        if (value.length < validation.length.min || value.length > validation.length.max) {
          return { 
            valid: false, 
            error: `Longitud inválida. Se esperan entre ${validation.length.min} y ${validation.length.max} caracteres` 
          }
        }
      }
      
      // Verificar patrón
      if (!validation.pattern.test(value)) {
        return { 
          valid: false, 
          error: `Formato inválido para ${format}. Ejemplo: ${validation.examples[0]}` 
        }
      }
      
      return { valid: true }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  })
  
  // Imprimir etiqueta individual
  ipcMain.handle('barcode:print', async (_, job: PrintJob) => {
    try {
      job.status = 'pending'
      job.createdAt = new Date()
      
      printQueue.push(job)
      processPrintQueue() // Iniciar procesamiento asíncrono
      
      return { success: true, jobId: job.id }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  
  // Imprimir lote de etiquetas
  ipcMain.handle('barcode:printBatch', async (_, jobs: PrintJob[]) => {
    try {
      const results = []
      
      for (const job of jobs) {
        job.status = 'pending'
        job.createdAt = new Date()
        printQueue.push(job)
        results.push({ jobId: job.id, success: true })
      }
      
      processPrintQueue() // Iniciar procesamiento asíncrono
      
      return { success: true, results }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  
  // Descubrir impresoras
  ipcMain.handle('printer:discover', async () => {
    try {
      const configs = require('@shared/types/barcode').BROTHER_PRINTER_CONFIGS
      return configs
    } catch (error) {
      return []
    }
  })
  
  // Verificar estado de impresora
  ipcMain.handle('printer:status', async (_, printerId: string) => {
    try {
      // Simulación - en implementación real verificar conexión física
      const { BROTHER_PRINTER_CONFIGS } = require('@shared-types/barcode')
      const configs = BROTHER_PRINTER_CONFIGS
      const config = configs.find((p: PrinterConfig) => p.id === printerId)
      
      if (!config) {
        return { connected: false, status: 'not_found', error: 'Impresora no encontrada' }
      }
      
      // Aquí iría lógica real de verificación de conexión
      return { connected: true, status: 'ready' }
    } catch (error) {
      return { connected: false, status: 'error', error: error.message }
    }
  })
  
  // Obtener configuración de impresora
  ipcMain.handle('printer:getConfig', async (_, printerId: string) => {
    try {
      const { BROTHER_PRINTER_CONFIGS } = require('@shared-types/barcode')
      const configs = BROTHER_PRINTER_CONFIGS
      const config = configs.find((p: PrinterConfig) => p.id === printerId)
      return config || null
    } catch (error) {
      return null
    }
  })
  
  // Establecer configuración de impresora
  ipcMain.handle('printer:setConfig', async (_, config: PrinterConfig) => {
    try {
      // En implementación real guardaría en archivo de configuración
      console.log('⚙️ Configuración de impresora actualizada:', config.name)
      return true
    } catch (error) {
      return false
    }
  })
  
  // Obtener historial de impresión
  ipcMain.handle('print:getHistory', async () => {
    try {
      return printQueue.filter(job => job.status === 'completed' || job.status === 'error')
    } catch (error) {
      return []
    }
  })
  
  // Limpiar historial de impresión
  ipcMain.handle('print:clearHistory', async () => {
    try {
      printQueue = printQueue.filter(job => job.status === 'pending' || job.status === 'printing')
      return true
    } catch (error) {
      return false
    }
  })
  
  console.log('✅ Handlers de códigos de barras registrados')
}
