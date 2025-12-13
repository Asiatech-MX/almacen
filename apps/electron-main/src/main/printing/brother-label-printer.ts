import { printPngFile } from 'node-brother-label-printer/lib/labelPrinter'
import { PrintJob, PrintResult, PrinterConfig } from '@shared-types/barcode'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export interface ExtendedPrintJob extends PrintJob {
  printerConfig?: {
    vendorId?: number
    productId?: number
  }
}

export class BrotherLabelPrinterModule {
  async printLabel(job: ExtendedPrintJob): Promise<PrintResult> {
    let tempFile: string | null = null

    try {
      // Obtener configuración de la impresora
      const config = job.printerConfig || {
        vendorId: 0x04f9,
        productId: 0x209c
      }

      // Convertir imageData a PNG temporal si es necesario
      if (!job.imageData) {
        throw new Error('No image data provided for printing')
      }

      console.log('📋 [Brother] Image data type:', typeof job.imageData)
      console.log('📋 [Brother] Image data length:', job.imageData?.length)

      // Guardar imagen como archivo PNG temporal
      const tempDir = process.env.TEMP || process.cwd()
      tempFile = join(tempDir, `label_${job.id}_${Date.now()}.png`)

      // Validar y convertir imageData a PNG válido
      const pngBuffer = await this.validateAndFixImage(job.imageData)

      // Validar tamaño FINAL antes de enviar a node-brother-label-printer
      let finalBuffer = pngBuffer
      try {
        // Verificar dimensiones del PNG final
        const sharp = require('sharp')
        const metadata = await sharp(pngBuffer).metadata()
        console.log(`📏 [Brother] Final image dimensions: ${metadata.width}x${metadata.height}`)

        if (metadata.width > 720) {
          console.warn(`⚠️ [Brother] CRITICAL: Image width ${metadata.width}px > 720px, RESIZING...`)
          finalBuffer = await sharp(pngBuffer)
            .resize(720, null, {
              withoutEnlargement: true,
              fit: 'inside',
              kernel: 'lanczos3'
            })
            .png({
              compressionLevel: 9,
              force: true,
              quality: 90
            })
            .toBuffer()

          const resizedMetadata = await sharp(finalBuffer).metadata()
          console.log(`✅ [Brother] RESIZED to: ${resizedMetadata.width}x${resizedMetadata.height}`)
        } else {
          console.log(`✅ [Brother] Image size OK: ${metadata.width}px ≤ 720px`)
        }
      } catch (sharpError) {
        console.warn(`⚠️ [Brother] Sharp not available for final validation, using original`)
        // Intentar resize con canvas como fallback
        try {
          const { createCanvas } = require('canvas')
          const canvas = createCanvas(720, 300)
          const ctx = canvas.getContext('2d')

          // Cargar la imagen original y redimensionar
          const { loadImage } = require('canvas')
          const img = await loadImage(pngBuffer)

          // Calcular dimensiones para mantener proporción
          const aspectRatio = img.width / img.height
          const newWidth = Math.min(720, img.width)
          const newHeight = newWidth / aspectRatio

          ctx.clearRect(0, 0, 720, 300)
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, 720, 300)

          // Centrar la imagen redimensionada
          const x = (720 - newWidth) / 2
          const y = (300 - newHeight) / 2
          ctx.drawImage(img, x, y, newWidth, newHeight)

          finalBuffer = canvas.toBuffer('image/png')
          console.log(`✅ [Brother] Resized with canvas fallback: 720x300`)
        } catch (canvasError) {
          console.warn(`⚠️ [Brother] Canvas fallback also failed, using original`)
        }
      }

      // Verificar tamaño del archivo final
      console.log(`📦 [Brother] Final buffer size: ${finalBuffer.length} bytes`)

      // Verificar que el archivo se escriba correctamente
      try {
        await writeFile(tempFile, finalBuffer)
        console.log(`✅ PNG file written successfully: ${tempFile} (${finalBuffer.length} bytes)`)
      } catch (writeError) {
        console.error('❌ Failed to write PNG file:', writeError)
        throw new Error(`Failed to write PNG file: ${writeError.message}`)
      }

      // Mapear tamaño de etiqueta a labelWidth
      const labelWidth = this.mapLabelSize(job.labelTemplate.id || 'continuous-62mm')

      console.log(`🔌 [DirectUSB] Printing with labelWidth: ${labelWidth}`)

      // Imprimir usando node-brother-label-printer
      await new Promise<void>((resolve, reject) => {
        printPngFile({
          vendorId: config.vendorId || 0x04f9,
          productId: config.productId || 0x209c,
          filename: tempFile!,
          options: {
            landscape: false,
            labelWidth: labelWidth
          },
          compression: { enable: true }
        }, (error) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      })

      return {
        success: true,
        message: `Label printed via direct USB (${job.copies || 1} copies)`
      }

      } catch (error) {
      console.error('❌ Error in direct USB printing:', error)

      // Intentar fallback con comandos del sistema
      console.log('🔄 Attempting fallback to system commands...')

      try {
        return await this.printWithSystemCommand(tempFile!, job.printerConfig?.displayName || 'Brother QL-810W')
      } catch (fallbackError) {
        console.error('❌ All printing methods failed:', fallbackError)
        return {
          success: false,
          error: `All printing methods failed. Direct USB: ${error.message}. Fallback: ${fallbackError.message}`
        }
      }
    } finally {
      // Limpiar archivo temporal
      if (tempFile && existsSync(tempFile)) {
        setTimeout(async () => {
          try {
            await unlink(tempFile!)
          } catch (e) {
            console.log('⚠️ Could not delete temp file:', e.message)
          }
        }, 5000)
      }
    }
  }

  private mapLabelSize(templateId: string): string {
    // Mapear IDs de plantilla a labelWidth de la librería
    const sizeMap: Record<string, string> = {
      'dk-11201': '62-mm-wide continuous', // Usar continuous para 29mm
      'dk-11202': '62-mm-wide continuous',
      'continuous-62mm': '62-mm-wide continuous'
    }
    return sizeMap[templateId] || '62-mm-wide continuous'
  }

  /**
   * Valida y corrige el formato de imagen para asegurar que sea un PNG válido
   */
  private async validateAndFixImage(imageData: Buffer | string | any): Promise<Buffer> {
    let buffer: Buffer

    try {
      // Convertir string base64 a Buffer si es necesario
      if (typeof imageData === 'string') {
        if (imageData.startsWith('data:image/png;base64,')) {
          const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
          buffer = Buffer.from(base64Data, 'base64')
        } else {
          // Si no tiene prefijo, asumir que es base64
          buffer = Buffer.from(imageData, 'base64')
        }
      } else if (Buffer.isBuffer(imageData)) {
        buffer = imageData
      } else if (Array.isArray(imageData)) {
        // Si es un array de números ( Uint8Array ), convertir a Buffer
        console.log('📋 [Brother] Converting array to Buffer, length:', imageData.length)
        buffer = Buffer.from(imageData)
      } else if (imageData && typeof imageData === 'object') {
        // Si es un objeto con propiedad data
        if (imageData.data && Array.isArray(imageData.data)) {
          console.log('📋 [Brother] Converting object.data to Buffer, length:', imageData.data.length)
          buffer = Buffer.from(imageData.data)
        } else if (imageData.type === 'Buffer' && Array.isArray(imageData.data)) {
          console.log('📋 [Brother] Converting Buffer object to Buffer, length:', imageData.data.length)
          buffer = Buffer.from(imageData.data)
        } else {
          console.warn('⚠️ [Brother] Unknown object type, attempting string conversion')
          buffer = Buffer.from(String(imageData))
        }
      } else {
        console.warn('⚠️ [Brother] Unknown image data type:', typeof imageData, imageData)
        throw new Error(`Invalid image data type: ${typeof imageData}. Must be Buffer, string, or array`)
      }
    } catch (conversionError) {
      console.error('❌ [Brother] Error converting image data:', conversionError)
      throw new Error(`Failed to convert image data: ${conversionError.message}`)
    }

    // Validar header PNG
    if (!this.isValidPNG(buffer)) {
      console.warn('⚠️ Invalid PNG header detected, attempting to fix...')

      // Intentar regenerar usando Sharp (si está disponible)
      try {
        const sharp = require('sharp')
        const fixedBuffer = await sharp(buffer)
          .png({ compressionLevel: 9, force: true })
          .toBuffer()

        console.log('✅ PNG regenerated successfully with Sharp')
        return fixedBuffer
      } catch (sharpError) {
        console.warn('⚠️ Sharp not available, trying canvas fallback...')

        // Fallback: intentar generar PNG desde el barcode data
        if (job) {
          console.log('🔄 Regenerating PNG from barcode data...')
          return await this.regeneratePNGFromBarcode(job)
        }

        throw new Error(`Invalid PNG format and unable to fix: ${sharpError.message}`)
      }
    }

    return buffer
  }

  /**
   * Verifica si un buffer tiene un header PNG válido
   */
  private isValidPNG(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 8) {
      return false
    }

    // Header PNG: 89 50 4E 47 0D 0A 1A 0A
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])

    if (buffer.length < pngHeader.length) {
      return false
    }

    // Comparar los primeros 8 bytes
    for (let i = 0; i < pngHeader.length; i++) {
      if (buffer[i] !== pngHeader[i]) {
        return false
      }
    }

    return true
  }

  /**
   * Regenera PNG desde los datos del código de barras
   */
  private async regeneratePNGFromBarcode(job: any): Promise<Buffer> {
    const { createCanvas } = require('canvas')
    const { loadImage } = require('canvas')

    try {
      // Crear canvas de 720px de ancho (recomendado)
      const canvas = createCanvas(720, 300)
      const ctx = canvas.getContext('2d')

      // Generar código de barras con JsBarcode
      const JsBarcode = require('jsbarcode')

      await new Promise<void>((resolve, reject) => {
        const data = job.barcodeData || job
        JsBarcode(canvas, data.value || data.codigo || 'SAMPLE', {
          format: data.format || 'CODE128',
          width: data.width || 2,
          height: data.height || 100,
          displayValue: data.displayValue !== false,
          fontSize: data.fontSize || 20,
          textMargin: data.textMargin || 2,
          margin: data.margin || 10,
          background: data.background || '#ffffff',
          lineColor: data.lineColor || '#000000'
        }, (error) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      })

      // Convertir a buffer PNG
      const pngBuffer = canvas.toBuffer('image/png')
      console.log('✅ PNG regenerated from canvas data')
      return pngBuffer

    } catch (error) {
      console.error('❌ Failed to regenerate PNG:', error)
      throw new Error(`Failed to regenerate PNG: ${error.message}`)
    }
  }

  /**
   * Fallback: Imprimir usando comandos del sistema
   */
  private async printWithSystemCommand(pngPath: string, printerName: string): Promise<PrintResult> {
    console.log('🔄 Attempting fallback with system commands...')

    try {
      // Método 1: Windows Photo Viewer
      console.log(`🖼️ Trying Windows Photo Viewer: ${pngPath}`)
      const { exec } = require('child_process')
      const util = require('util')
      const execAsync = util.promisify(exec)

      await execAsync(`rundll32.exe shimgvw.dll,ImageView_PrintTo "${pngPath}" "${printerName}"`)

      return {
        success: true,
        message: 'Printed via Windows Photo Viewer (fallback)'
      }
    } catch (error) {
      console.warn('⚠️ Windows Photo Viewer failed, trying copy method...')

      try {
        // Método 2: Copia directa al puerto (menos fiable)
        console.log('📋 Trying direct copy method...')

        // Intentar detectar el puerto de la impresora
        const port = await this.detectPrinterPort(printerName)
        if (port) {
          console.log(`🔌 Found printer port: ${port}`)
          const { exec } = require('child_process')
          await exec(`copy /b "${pngPath}" "${port}"`)

          return {
            success: true,
            message: 'Printed via direct port copy (fallback)'
          }
        }

        throw new Error('Printer port not found')
      } catch (portError) {
        console.error('❌ All fallback methods failed')
        return {
          success: false,
          error: `All fallback methods failed: ${error.message}`
        }
      }
    }
  }

  /**
   * Detecta el puerto de una impresora Brother
   */
  private async detectPrinterPort(printerName: string): Promise<string | null> {
    try {
      const { exec } = require('child_process')
      const util = require('util')
      const execAsync = util.promisify(exec)

      // Buscar puertos USB que puedan ser de impresoras
      const { stdout } = await execAsync('wmic printer get name, portname /format:list')

      // Parsear la salida para encontrar el puerto
      const lines = stdout.split('\n')
      let currentName = ''

      for (const line of lines) {
        if (line.startsWith('Name=')) {
          currentName = line.split('=')[1].trim()
        } else if (line.startsWith('PortName=') && currentName.toLowerCase().includes(printerName.toLowerCase())) {
          const portName = line.split('=')[1].trim()
          if (portName && portName !== 'nul') {
            return portName
          }
        }
      }

      return null
    } catch (error) {
      console.warn('Could not detect printer port:', error.message)
      return null
    }
  }
}

// Export singleton
export const brotherLabelPrinter = new BrotherLabelPrinterModule()