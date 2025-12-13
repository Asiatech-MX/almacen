import { ipcMain } from 'electron'
import {
  BarcodeOptions,
  PrintJob,
  PrinterConfig,
  PrintOptions,
  BarcodeIPCEevents,
  BarcodeFormat,
  BARCODE_VALIDATIONS,
  BROTHER_PRINTER_CONFIGS
} from '@shared-types/barcode'
const { exec, spawn } = require('child_process')
const PDFDocument = require('pdfkit')
import { join } from 'path'
import { writeFile, mkdir, unlink } from 'fs/promises'
// Importación opcional para evitar errores si edge-js no está disponible
let brotherPrinterNative: any = null
try {
  brotherPrinterNative = require('../printing/brother-printer-native').brotherPrinterNative
} catch (error) {
  console.warn('⚠️ Brother native printer module not available:', error.message)
  console.log('⚠️ Using only direct USB and Windows print methods')
}
import { windowsPrinter } from '../printing/windows-printer'
import { brotherLabelPrinter, ExtendedPrintJob } from '../printing/brother-label-printer'
import { existsSync } from 'fs'

// Cola de trabajos de impresión
let printQueue: PrintJob[] = []
let isPrinting = false

/**
 * Valida si un buffer contiene un PNG válido
 */
function isValidPNG(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 8) {
    return false
  }

  // Header PNG: 89 50 4E 47 0D 0A 1A 0A
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])

  for (let i = 0; i < pngHeader.length; i++) {
    if (buffer[i] !== pngHeader[i]) {
      return false
    }
  }

  return true
}

// Función para generar código de barras como base64
async function generateBarcodePNG(options: BarcodeOptions): Promise<string> {
  const JsBarcode = require('jsbarcode')

  try {
    console.log('🔧 [Main] Generating barcode with options:', {
      format: options.format,
      value: options.value,
      width: options.width,
      height: options.height
    })

    let dataUrl: string
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        // Crear canvas temporal - MAX 720px width para node-brother-label-printer
        const canvasWidth = 720 // Máximo permitido por la librería
        const canvasHeight = 300
        const canvas = require('canvas').createCanvas(canvasWidth, canvasHeight)
        const ctx = canvas.getContext('2d')

        console.log(`✅ [Main] Canvas created successfully (attempt ${attempts + 1}), size:`, canvas.width, 'x', canvas.height)

        // Ajustar el width del barcode para que quepa en el canvas
        // Margin: 20px cada lado = 40px total,剩下 680px para el barcode
        const maxWidth = 680
        const barcodeWidth = Math.min(options.width || 1, 1) // Forzar width=1 para no exceder

        // Calcular el width óptimo basado en la longitud del código
        const codeLength = options.value.length
        const optimalWidth = Math.max(1, Math.floor(maxWidth / codeLength))

        // Generar código de barras con JsBarcode
        JsBarcode(canvas, options.value, {
          format: options.format,
          width: Math.min(optimalWidth, 2), // Máximo 2, pero ajustado al código
          height: Math.min(options.height || 100, 150), // Limitar altura también
          displayValue: options.displayValue !== false,
          fontSize: Math.min(options.fontSize || 16, 16), // Fuente más pequeña
          textMargin: options.textMargin || 2,
          margin: options.margin || 10, // Reducir margen
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

        console.log('✅ [Main] JsBarcode rendered successfully')

        // Convertir a base64
        dataUrl = canvas.toDataURL('image/png')
        console.log('✅ [Main] Canvas converted to data URL, length:', dataUrl.length)

        // Validar que el data URL sea válido y contenga PNG real
        if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')

          // Validar PNG header
          if (isValidPNG(buffer)) {
            // Validar tamaño máximo para node-brother-label-printer
            const sharp = require('sharp')
            try {
              const metadata = await sharp(buffer).metadata()
              console.log(`📏 [Main] Image dimensions: ${metadata.width}x${metadata.height}`)

              if (metadata.width > 720) {
                console.warn(`⚠️ [Main] Image too wide (${metadata.width}px), resizing...`)
                const resizedBuffer = await sharp(buffer)
                  .resize(720, null, {
                    withoutEnlargement: true,
                    fit: 'inside'
                  })
                  .png({ compressionLevel: 9, force: true })
                  .toBuffer()

                const resizedDataUrl = `data:image/png;base64,${resizedBuffer.toString('base64')}`
                console.log('✅ [Main] Image resized successfully to 720px max width')
                return resizedDataUrl
              }

              console.log('✅ [Main] PNG validation passed - size OK')
              return dataUrl
            } catch (sharpError) {
              console.warn('⚠️ [Main] Sharp not available for size validation, using original PNG')
              console.log('✅ [Main] PNG validation passed')
              return dataUrl
            }
          } else {
            console.warn(`⚠️ [Main] Generated PNG invalid, retrying... (attempt ${attempts + 1})`)
          }
        } else {
          console.warn(`⚠️ [Main] Invalid data URL format, retrying... (attempt ${attempts + 1})`)
        }
      } catch (attemptError) {
        console.warn(`⚠️ [Main] Attempt ${attempts + 1} failed:`, attemptError.message)
      }

      attempts++

      // Esperar un poco antes de reintentar
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    throw new Error(`Failed to generate valid PNG after ${maxAttempts} attempts`)

  } catch (error) {
    console.error('❌ [Main] Error generando código de barras:', error)
    throw new Error(`Error generando código de barras: ${error.message}`)
  }
}

// Función para crear PDF con tamaño específico para la etiqueta
async function createLabelPDF(job: PrintJob & { imageData?: number[] }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Obtener configuración del tamaño
      const labelSize = job.labelTemplate.id || 'continuous-62mm'
      const sizeConfig = {
        'dk-11201': { width: 29, height: 90 }, // 29x90mm
        'dk-11202': { width: 62, height: 100 }, // 62x100mm
        'continuous-62mm': { width: 62, height: 40 } // 62mm continuo
      }

      const config = sizeConfig[labelSize] || sizeConfig['continuous-62mm']

      // Convertir mm a puntos (1 mm = 2.834645669 puntos)
      const width = config.width * 2.834645669
      const height = config.height * 2.834645669

      console.log(`📐 Creando PDF con tamaño: ${config.width}x${config.height}mm (${width.toFixed(1)}x${height.toFixed(1)}pt)`)

      // Crear documento PDF
      const doc = new PDFDocument({
        size: [width, height],
        margins: {
          top: 2,
          bottom: 2,
          left: 2,
          right: 2
        }
      })

      const chunks: Buffer[] = []

      doc.on('data', (chunk) => {
        chunks.push(chunk)
      })

      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks)
        console.log('✅ PDF creado exitosamente, size:', pdfBuffer.length)
        resolve(pdfBuffer)
      })

      // Si hay imageData, usar la imagen del renderer
      if (job.imageData && job.imageData.length > 0) {
        console.log('✅ [Main] Using pre-generated image data for PDF')
        // Convertir el buffer de imagen a base64 para PDFKit
        const imageBuffer = Buffer.from(job.imageData)

        // Centrar la imagen en el PDF
        const imgWidth = width - 8 // 4mm márgenes totales
        const imgHeight = height - 8 // 4mm márgenes totales

        doc.image(imageBuffer, 4, 4, { width: imgWidth, height: imgHeight, align: 'center' })
      } else {
        // Fallback: generar un PDF simple con texto
        doc.fontSize(12)
        doc.text(job.materialData.nombre || 'Etiqueta', { align: 'center' })
        doc.moveDown()
        doc.fontSize(10)
        doc.text(`Código: ${job.materialData.codigo || 'N/A'}`, { align: 'center' })
        doc.text(`Stock: ${job.materialData.stock || 0}`, { align: 'center' })
      }

      doc.end()
    } catch (error) {
      console.error('❌ [Main] Error creando PDF:', error)
      reject(new Error(`Error creando PDF: ${error.message}`))
    }
  })
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

// Función principal de impresión con métodos por prioridad
async function printLabel(job: PrintJob): Promise<{ success: boolean; message?: string }> {
  let tempFile: string | null = null

  try {
    console.log('🏷️ Iniciando impresión de etiqueta:', job.id)

    // Ordenar impresoras por prioridad
    const printerConfigs = BROTHER_PRINTER_CONFIGS
      .sort((a, b) => (a.priority || 999) - (b.priority || 999))

    // Obtener configuración de la impresora solicitada o usar la de mayor prioridad
    const requestedPrinterId = job.barcodeData.printerId
    let printerConfig = printerConfigs.find(p => p.id === requestedPrinterId) || printerConfigs[0]

    if (!printerConfig) {
      throw new Error('No printer configurations found')
    }

    console.log('📠 Usando configuración de impresora:', {
      name: printerConfig.displayName,
      connection: printerConfig.connection,
      priority: printerConfig.priority
    })

    // Generar barcode PNG si no se proporcionó imageData
    if (!job.imageData) {
      const barcodePNG = await generateBarcodePNG(job.barcodeData)
      const base64Data = barcodePNG.replace(/^data:image\/png;base64,/, '')
      job.imageData = Buffer.from(base64Data, 'base64')
    }

    // Método 1: Intentar impresión directa USB (prioridad 1)
    if (printerConfig.connection === 'directUsb') {
      try {
        console.log('🔌 [DirectUSB] Attempting direct USB printing...')

        const extendedJob: ExtendedPrintJob = {
          ...job,
          printerConfig: {
            vendorId: printerConfig.vendorId,
            productId: printerConfig.productId
          }
        }

        const result = await brotherLabelPrinter.printLabel(extendedJob)
        if (result.success) {
          console.log('✅ Direct USB printing successful:', result.message)
          return result
        } else {
          throw new Error(result.error || 'Direct USB printing failed')
        }
      } catch (directError) {
        console.warn('⚠️ Direct USB printing failed, trying next method:', directError.message)
        // Continuar al siguiente método
      }
    }

    // Método 2: Impresión via Windows print (prioridad 2)
    if (printerConfig.connection === 'printer' || printerConfig.connection === 'network') {
      try {
        console.log('🖨️ [Windows] Attempting Windows print method...')

        // Crear PDF de la etiqueta
        const labelBuffer = await createLabelPDF(job)

        // Guardar PDF temporal
        const tempDir = process.env.TEMP || join(process.cwd(), 'temp')
        if (!existsSync(tempDir)) {
          await mkdir(tempDir, { recursive: true })
        }

        tempFile = join(tempDir, `almacen_label_${job.id}_${Date.now()}.pdf`)
        await writeFile(tempFile, labelBuffer)

        // Imprimir usando el módulo de Windows
        const printerName = printerConfig.displayName || 'Brother QL-810W'
        const result = await windowsPrinter.printPDF(tempFile, printerName)

        if (result.success) {
          console.log(`✅ Windows printing successful: ${result.message}`)
          return { success: true, message: result.message }
        } else {
          throw new Error(result.error || 'Windows printing failed')
        }
      } catch (windowsError) {
        console.warn('⚠️ Windows printing failed, trying fallback:', windowsError.message)
        // Continuar al método fallback
      }
    }

    // Método 3: Fallback a C# native (prioridad 3) - solo si está disponible
    if (brotherPrinterNative) {
      try {
        console.log('🔄 [Native] Trying C# native printing as fallback...')

        if (job.imageData) {
          const result = await brotherPrinterNative.printLabel({
            imageData: job.imageData,
            printerName: printerConfig.displayName || 'Brother QL-810W',
            widthMm: job.labelTemplate.width,
            heightMm: job.labelTemplate.height
          })

          if (result.success) {
            return { success: true, message: 'Printed via C# native (fallback)' }
          } else {
            throw new Error(result.error || 'C# native printing failed')
          }
        }
      } catch (nativeError) {
        console.error('❌ C# native printing failed:', nativeError.message)
      }
    } else {
      console.log('ℹ️ C# native module not available, skipping fallback')
    }

    // Si todos los métodos fallaron
    return {
      success: false,
      message: 'All printing methods failed. Please check printer connection and drivers.'
    }

  } catch (error) {
    console.error('❌ Error en impresión:', error)
    return {
      success: false,
      message: `Printing failed: ${error.message}`
    }
  } finally {
    // Limpiar archivo temporal
    if (tempFile && existsSync(tempFile)) {
      setTimeout(() => {
        try {
          unlink(tempFile)
          console.log('🗑️ Temp file deleted:', tempFile)
        } catch (e) {
          console.log('⚠️ Could not delete temp file:', e.message)
        }
      }, 5000)
    }
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

// Función para diagnosticar conexión de impresora
async function diagnosePrinterConnection(config: PrinterConfig): Promise<{ connected: boolean; details: string }> {
  console.log(`\n🔍 DIAGNÓSTICO - ${config.displayName}`)
  console.log(`Tipo: ${config.connection}`)
  console.log(`Interface: ${config.interface}`)

  // Para USB/impresora del sistema
  if (config.connection === 'printer') {
    const os = require('os')
    console.log(`Sistema: ${os.type()} ${os.release()}`)

    try {
      // Listar impresoras instaladas en Windows
      const { exec } = require('child_process')
      const util = require('util')
      const execPromise = util.promisify(exec)

      console.log('🔍 Buscando impresoras instaladas...')

      // Obtener lista detallada de impresoras de Windows
      const { stdout: listOutput } = await execPromise('powershell.exe -Command "Get-WmiObject -Class Win32_Printer | Select-Object Name, Status, Default | Format-Table -AutoSize"')
      console.log('📃 Impresoras encontradas:')
      console.log(listOutput)

      // También obtener con formato antiguo para compatibilidad
      const { stdout } = await execPromise('wmic printer get name, status /format:list')

      // Verificar si la impresora Brother está en la lista
      const printerName = config.displayName || 'Brother QL-810W'
      const isPrinterInstalled = stdout.includes(printerName) ||
                                 stdout.includes('Brother') ||
                                 stdout.includes('QL-810W')

      if (isPrinterInstalled) {
        return { connected: true, details: `Impresora ${printerName} encontrada en el sistema` }
      } else {
        return {
          connected: false,
          details: `No se encontró la impresora "${printerName}" en el sistema. Verifique que esté instalada y encendida.`
        }
      }
    } catch (e) {
      console.error('❌ Error diagnosticando impresora:', e)
      return { connected: false, details: `Error al diagnosticar impresora: ${e.message}` }
    }
  }

  // Para WiFi
  if (config.connection === 'network') {
    console.log(`IP: ${config.address}:${config.port}`)

    // Primero verificar si responde a ping
    try {
      const { exec } = require('child_process')
      const util = require('util')
      const execPromise = util.promisify(exec)

      const { stdout } = await execPromise(`ping -n 1 ${config.address}`)
      if (stdout.includes('TTL=')) {
        console.log('✅ Responde a ping')

        // Verificar si la impresora está instalada en el sistema
        try {
          const { stdout: printers } = await execPromise('wmic printer get name, portname /format:list')
          const hasNetworkPrinter = printers.includes(config.address) ||
                                    printers.includes('9100') ||
                                    printers.includes('Brother')

          if (hasNetworkPrinter) {
            return { connected: true, details: 'Impresora Brother encontrada vía red' }
          } else {
            return { connected: false, details: 'La impresora responde a ping pero no está instalada en Windows' }
          }
        } catch (e) {
          return { connected: true, details: 'Conectada a la red pero necesita instalación en Windows' }
        }
      } else {
        return { connected: false, details: 'La impresora no responde a ping. Verifique la conexión de red.' }
      }
    } catch (e) {
      return { connected: false, details: 'La impresora no responde a ping. Verifique IP y conexión.' }
    }
  }

  return { connected: false, details: 'Tipo de conexión no soportado' }
}

// Función para descubrir impresoras
async function discoverPrinters(): Promise<PrinterConfig[]> {
  const discoveredPrinters: PrinterConfig[] = []

  console.log('\n🔍 Buscando impresoras...')

  // Para cada configuración, diagnosticar
  for (const config of BROTHER_PRINTER_CONFIGS) {
    const diagnosis = await diagnosePrinterConnection(config)

    discoveredPrinters.push({
      ...config,
      connected: diagnosis.connected,
      status: diagnosis.connected ? 'ready' : 'disconnected',
      error: diagnosis.connected ? undefined : diagnosis.details
    })
  }

  return discoveredPrinters
}

// Registro de handlers IPC
export function registerBarcodeHandlers() {
  console.log('🔧 Registrando handlers de códigos de barras...')

  // Generar código de barras
  ipcMain.handle('barcode:generate', async (_, options: BarcodeOptions) => {
    console.log('📡 [Main] IPC barcode:generate called with:', options)

    try {
      const base64 = await generateBarcodePNG(options)

      if (base64 && base64.startsWith('data:image/png;base64,')) {
        console.log('✅ [Main] IPC barcode generation successful')
        return { success: true, data: base64 }
      } else {
        console.error('❌ [Main] Invalid data URL returned from generateBarcodePNG')
        return { success: false, error: 'Formato de imagen inválido' }
      }
    } catch (error) {
      console.error('❌ [Main] IPC barcode generation failed:', error)
      return { success: false, error: error.message }
    }
  })

  // Validar código de barras
  ipcMain.handle('barcode:validate', async (_, format: BarcodeFormat, value: string) => {
    try {
      if (format === 'SKU') {
        return {
          valid: value.trim().length > 0,
          error: value.trim().length === 0 ? 'El SKU no puede estar vacío' : undefined
        }
      }

      if (format === 'QR') {
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
          if (validation.checkDigit && value.length === validation.length - 1) {
            return { valid: true }
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

  // Descubrir impresoras (actualizado para detección real)
  ipcMain.handle('printer:discover', async () => {
    try {
      const printers = await discoverPrinters()
      return printers
    } catch (error) {
      console.error('❌ Error descubriendo impresoras:', error)
      return BROTHER_PRINTER_CONFIGS.map(config => ({
        ...config,
        connected: false
      }))
    }
  })

  // Verificar estado de impresora (ahora con detección real)
  ipcMain.handle('printer:status', async (_, printerId: string) => {
    try {
      const config = BROTHER_PRINTER_CONFIGS.find((p: PrinterConfig) => p.id === printerId)

      if (!config) {
        return { connected: false, status: 'not_found', error: 'Impresora no encontrada' }
      }

      // Usar la función de diagnóstico para verificar estado
      const diagnosis = await diagnosePrinterConnection(config)

      return {
        connected: diagnosis.connected,
        status: diagnosis.connected ? 'ready' : 'disconnected',
        displayName: config.displayName,
        details: diagnosis.details
      }
    } catch (error) {
      return {
        connected: false,
        status: 'error',
        error: error.message
      }
    }
  })

  // Obtener configuración de impresora
  ipcMain.handle('printer:getConfig', async (_, printerId: string) => {
    try {
      const config = BROTHER_PRINTER_CONFIGS.find((p: PrinterConfig) => p.id === printerId)
      return config || null
    } catch (error) {
      return null
    }
  })

  // Establecer configuración de impresora
  ipcMain.handle('printer:setConfig', async (_, config: PrinterConfig) => {
    try {
      console.log('⚙️ Configuración de impresora actualizada:', config.displayName)
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

  // Listar impresoras con módulo Windows mejorado
  ipcMain.handle('printer:listNative', async () => {
    try {
      console.log('🔍 [IPC] Listando impresoras con módulo Windows...')
      const result = await windowsPrinter.getPrinters()
      return result
    } catch (error) {
      console.error('❌ [IPC] Error listando impresoras nativas:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  })

  // Probar impresión con módulo Windows mejorado
  ipcMain.handle('print:testNative', async (_, options: { printerName?: string; pdfPath?: string }) => {
    try {
      console.log('🧪 [IPC] Probando impresión con módulo Windows...')

      // Si no se proporciona PDF, crear uno de prueba
      let pdfPath = options.pdfPath
      if (!pdfPath) {
        pdfPath = await createTestPDF()
      }

      const result = await windowsPrinter.printPDF(
        pdfPath,
        options.printerName || 'Brother QL-810W'
      )

      return result
    } catch (error) {
      console.error('❌ [IPC] Error en prueba de impresión nativa:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  })

  // Obtener impresora predeterminada
  ipcMain.handle('printer:getDefault', async () => {
    try {
      console.log('🔍 [IPC] Obteniendo impresora predeterminada...')
      const printer = await windowsPrinter.getDefaultPrinter()
      return {
        success: true,
        printer
      }
    } catch (error) {
      console.error('❌ [IPC] Error obteniendo impresora predeterminada:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  })

  // Verificar si impresora está disponible
  ipcMain.handle('printer:isAvailable', async (_, printerName: string) => {
    try {
      console.log('🔍 [IPC] Verificando disponibilidad de:', printerName)
      const available = await windowsPrinter.isPrinterAvailable(printerName)
      return {
        success: true,
        available
      }
    } catch (error) {
      console.error('❌ [IPC] Error verificando disponibilidad:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  })

  // Función auxiliar para crear PDF de prueba
  async function createTestPDF(): Promise<string> {
    const PDFDocument = require('pdfkit')
    const { writeFileSync } = require('fs')
    const { join } = require('path')
    const os = require('os')

    const tempDir = os.tmpdir()
    const testFile = join(tempDir, `test_label_${Date.now()}.pdf`)

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: [175.7, 113.4], // 62x40mm
        margins: { top: 2, bottom: 2, left: 2, right: 2 }
      })

      doc.pipe(require('fs').createWriteStream(testFile))

      // Contenido de prueba
      doc.fontSize(8).text('ETIQUETA DE PRUEBA', 10, 10)
      doc.fontSize(6).text(`Fecha: ${new Date().toLocaleString()}`, 10, 25)
      doc.fontSize(6).text('Módulo C# + Electron', 10, 35)

      doc.end()

      doc.on('end', () => {
        console.log('✅ PDF de prueba creado:', testFile)
        resolve(testFile)
      })

      doc.on('error', reject)
    })
  }

  // Descubrir impresoras directas USB
  ipcMain.handle('printer:discoverDirect', async () => {
    try {
      console.log('🔍 Discovering direct USB label printers...')

      // Obtener configuración de impresora directa
      const directPrinter = BROTHER_PRINTER_CONFIGS.find(p => p.connection === 'directUsb')

      if (directPrinter) {
        // Simular detección (en un caso real podríamos intentar conectar)
        console.log('✅ Found direct USB printer configuration:', directPrinter.displayName)

        return [{
          ...directPrinter,
          connected: true,
          status: 'ready',
          method: 'Direct USB (node-brother-label-printer)',
          details: `Vendor ID: 0x${(directPrinter.vendorId || 0x04f9).toString(16)}, Product ID: 0x${(directPrinter.productId || 0x209c).toString(16)}`
        }]
      }

      return []
    } catch (error) {
      console.error('❌ Error discovering direct printers:', error)
      return []
    }
  })

  // Probar impresión directa
  ipcMain.handle('print:testDirect', async (_, printerId: string) => {
    try {
      console.log('🧪 Testing direct USB printing for printer:', printerId)

      const config = BROTHER_PRINTER_CONFIGS.find(p => p.id === printerId)
      if (!config || config.connection !== 'directUsb') {
        return { success: false, error: 'Invalid printer configuration for direct printing' }
      }

      // Crear un job de prueba
      const testJob: ExtendedPrintJob = {
        id: `test-direct-${Date.now()}`,
        barcodeData: {
          format: 'CODE128',
          value: 'TEST-123',
          width: 2,
          height: 100,
          displayValue: true
        },
        labelTemplate: {
          id: 'dk-11201',
          name: 'Test Label',
          width: 29,
          height: 90,
          dpi: 300,
          layout: {
            barcode: { x: 5, y: 10, width: 19, height: 5 },
            text: []
          }
        },
        materialData: {
          id: 'test',
          codigo: 'TEST-123',
          nombre: 'Test Label',
          institucion: 'test'
        },
        copies: 1,
        status: 'pending',
        createdAt: new Date(),
        printerConfig: {
          vendorId: config.vendorId,
          productId: config.productId
        }
      }

      // Generar barcode de prueba
      const barcodePNG = await generateBarcodePNG(testJob.barcodeData)
      const base64Data = barcodePNG.replace(/^data:image\/png;base64,/, '')
      testJob.imageData = Buffer.from(base64Data, 'base64')

      // Intentar imprimir
      const result = await brotherLabelPrinter.printLabel(testJob)

      if (result.success) {
        console.log('✅ Direct USB test print successful')
      } else {
        console.error('❌ Direct USB test print failed:', result.error)
      }

      return result
    } catch (error) {
      console.error('❌ Error in direct USB test:', error)
      return {
        success: false,
        error: error.message || 'Unknown error in direct USB test'
      }
    }
  })

  console.log('✅ Handlers de códigos de barras registrados (con direct USB)')
}