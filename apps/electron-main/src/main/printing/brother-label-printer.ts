import { printPngFile } from 'node-brother-label-printer/lib/labelPrinter'
import { PrintJob, PrintResult, PrinterConfig } from '@shared-types/barcode'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Try to import USB for raw commands (optional)
let usb: any = null
try {
  usb = require('usb')
} catch (e) {
  console.warn('⚠️ [Brother] USB library not installed. Raw commands disabled.')
}

export interface ExtendedPrintJob extends PrintJob {
  printerConfig?: {
    vendorId?: number
    productId?: number
  }
}

export class BrotherLabelPrinterModule {

  /**
   * Procesa imágenes para etiquetas negro/rojo (DK-2251)
   * NOTA: Implementación básica - el soporte completo requiere comandos ESC/P específicos de Brother
   */
  private async processBlackRedLabel(imageData: Buffer): Promise<Buffer> {
    // The Brother QL-810W supports black/red printing with special raster commands
    // You'll need to:
    // 1. Detect red areas in the image (typically pixels with specific RGB values)
    // 2. Separate black and red layers
    // 3. Send color switch commands in the raster data

    // Color switch command: 0x1b 0x69 0x63 [color] where color=0 for black, 1 for red

    // For now, return original data - full implementation requires deep knowledge of Brother ESC/P commands
    console.log('🎨 [Brother] Black/Red label processing - basic implementation (no color separation yet)')
    return imageData
  }

  /**
 * Get label width for different DK label types (in pixels)
 */
private getLabelWidth(templateId: string): number {
  const widthMap: Record<string, number> = {
    'dk-11201': 696,    // 62mm @ 300 DPI (but 90mm wide)
    'dk-11202': 732,    // 62mm @ 300 DPI
    'dk-22205': 1181,   // 100mm @ 300 DPI
    'continuous-62mm': 732,  // 62mm @ 300 DPI
    'continuous-29mm': 342,  // 29mm @ 300 DPI
    'continuous-12mm': 142   // 12mm @ 300 DPI
  }
  return widthMap[templateId] || 732
}

/**
 * Get maximum width in pixels for a template based on its dimensions and DPI
 */
private getMaxWidthForTemplate(templateId: string): number {
  // node-brother-label-printer has a HARD LIMIT of 720px width
  const HARD_LIMIT = 720

  // Template dimensions in mm
  const templateDimensions: Record<string, { width: number; dpi: number }> = {
    'dk-11201': { width: 90, dpi: 300 },   // 90mm would be 1063px, but limited to 720
    'dk-11202': { width: 62, dpi: 300 },   // 62mm = 732px, but limited to 720
    'continuous-62mm': { width: 62, dpi: 300 },  // 62mm = 732px, but limited to 720
    'continuous-62mm-blackred': { width: 62, dpi: 300 }
  };

  const config = templateDimensions[templateId] || templateDimensions['dk-11201']

  // Calculate pixels: mm * DPI / 25.4, then enforce 720px limit
  const calculatedWidth = Math.round(config.width * config.dpi / 25.4)
  return Math.min(calculatedWidth, HARD_LIMIT)
}

  /**
   * Send raw ESC/P commands to Brother printer for media type configuration
   */
  private async sendRawCommand(vendorId: number, productId: number, command: Buffer): Promise<void> {
    if (!usb) {
      console.warn('⚠️ [Brother] USB library not available, skipping raw command');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const device = usb.findByIds(vendorId, productId);
        if (!device) {
          console.warn('⚠️ [Brother] Device not found for raw command');
          resolve();
          return;
        }

        device.open();

        let interfaceUsed = false;
        for (const iface of device.interfaces) {
          iface.claim();
          interfaceUsed = true;

          for (const endpoint of iface.endpoints) {
            if (endpoint.direction === 'out') {
              endpoint.transfer(command, (error) => {
                if (error) {
                  console.error('❌ [Brother] Raw command failed:', error);
                  reject(error);
                } else {
                  console.log('✅ [Brother] Raw command sent successfully');
                  resolve();
                }
                iface.release(true);
              });
              return;
            }
          }

          if (!interfaceUsed) {
            iface.release(true);
          }
        }

        if (!interfaceUsed) {
          console.warn('⚠️ [Brother] No suitable endpoint found for raw command');
          resolve();
        }
      } catch (error) {
        console.error('❌ [Brother] Error sending raw command:', error);
        reject(error);
      }
    });
  }

  /**
   * Configure printer for black/red labels
   */
  private async configureBlackRedMode(vendorId: number, productId: number): Promise<void> {
    console.log('🟥⬛ [Brother] Configuring black/red mode...');

    try {
      // Brother QL-810W ESC/P commands for black/red mode

      // 1. Initialize printer
      const init = Buffer.from([0x1b, 0x40]);
      console.log('📤 Sending: Initialize printer');
      await this.sendRawCommand(vendorId, productId, init);

      // 2. Switch to raster mode
      const rasterMode = Buffer.from([0x1b, 0x69, 0x61, 0x01]);
      console.log('📤 Sending: Switch to raster mode');
      await this.sendRawCommand(vendorId, productId, rasterMode);

      // 3. Set media type (DK-2251 = black/red 62mm continuous)
      // According to Brother documentation, the media type command is: ESC i M <type>
      // DK-2251 should be type 0x4A
      const mediaType = Buffer.from([0x1b, 0x69, 0x4D, 0x4A]);
      console.log('📤 Sending: Set media type to DK-2251 (black/red)');
      await this.sendRawCommand(vendorId, productId, mediaType);

      // 4. Set label parameters
      // Command: ESC i a <exp> <m> <n>
      // exp: expansion (0x00 = none)
      // m: media type (0x00 = continuous, 0x01 = die-cut)
      // n: number of blocks (for continuous)
      const labelParams = Buffer.from([0x1b, 0x69, 0x61, 0x00, 0x00, 0x01]);
      console.log('📤 Sending: Set label parameters');
      await this.sendRawCommand(vendorId, productId, labelParams);

      // 5. Enable red/black mode
      // Command: ESC i c <mode>
      // Mode: 0x80 = enable red/black mode
      const redBlackMode = Buffer.from([0x1b, 0x69, 0x63, 0x80]);
      console.log('📤 Sending: Enable red/black mode');
      await this.sendRawCommand(vendorId, productId, redBlackMode);

      console.log('✅ [Brother] Black/red mode configured successfully');
    } catch (error) {
      console.warn('⚠️ [Brother] Failed to configure black/red mode:', error);
      console.warn('💡 [Brother] Will continue with standard printing');
      // Continue anyway - printPngFile might still work
    }
  }

  async printLabel(job: ExtendedPrintJob): Promise<PrintResult> {
    let tempFile: string | null = null

    console.log('🔄 [Brother] Using node-brother-label-printer for all label types...')

    // Use node-brother-label-printer for all labels (precut and continuous)
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

        // Determinar el ancho máximo permitido según la plantilla
        const maxWidth = this.getMaxWidthForTemplate(job.labelTemplate.id || 'dk-11201')

        if (metadata.width > maxWidth) {
          console.warn(`⚠️ [Brother] CRITICAL: Image width ${metadata.width}px > ${maxWidth}px, RESIZING...`)
          finalBuffer = await sharp(pngBuffer)
            .resize(maxWidth, null, {
              withoutEnlargement: true,
              fit: 'inside',
              kernel: 'nearest' // Changed from 'lanczos3' to preserve text
            })
            .png({
              compressionLevel: 3, // Reduced from 9 to preserve text
              force: true,
              quality: 95
            })
            .sharpen({ // Add sharpening to enhance text
              sigma: 1,
              flat: 1,
              jagged: 2
            })
            .normalize() // Enhance contrast
            .toBuffer()

          const resizedMetadata = await sharp(finalBuffer).metadata()
          console.log(`✅ [Brother] RESIZED to: ${resizedMetadata.width}x${resizedMetadata.height}`)
        } else {
          console.log(`✅ [Brother] Image size OK: ${metadata.width}px ≤ ${maxWidth}px`)
        }
      } catch (sharpError) {
        console.warn(`⚠️ [Brother] Sharp not available for final validation, using original`)
        // No hacer fallback automático - confiar en que el main process generó las dimensiones correctas
      }

      // Check for black/red labels
      if (job.labelTemplate.id?.includes('blackred')) {
        console.log('🎨 Processing black/red label...')
        finalBuffer = await this.processBlackRedLabel(finalBuffer)
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

      // Configure printer for black/red labels if needed
      const isBlackRed = job.labelTemplate.id?.includes('blackred')

      // Auto-detect black/red labels for continuous 62mm when using Direct USB
      // This helps users who have black/red rolls installed
      const shouldForceBlackRed = !isBlackRed &&
                                  (job.labelTemplate.id === 'continuous-62mm') &&
                                  (job.printerConfig?.name?.includes('Direct USB'))

      if (isBlackRed) {
        console.log('🟥⬛ [Brother] Black/Red label detected - enabling color mode')
        await this.configureBlackRedMode(config.vendorId || 0x04f9, config.productId || 0x209c)
      } else if (shouldForceBlackRed) {
        console.log('🟥⬛ [Brother] Auto-detecting black/red mode for Direct USB with 62mm continuous')
        console.log('💡 [Brother] If you have a black/red roll installed, this will enable color mode')
        await this.configureBlackRedMode(config.vendorId || 0x04f9, config.productId || 0x209c)
      }

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

      // Check for Media Mismatch error
      if (error.message && (error.message.includes('Media Mismatch') || error.message.includes('media mismatch'))) {
        console.error('🚫 Media Mismatch Error: This usually means the printer has a different label type than configured.')
        console.error('💡 Solution: Ensure you are using continuous 62mm labels, or switch to a library that supports precut labels.')
        console.error('📋 Current label type:', job.labelTemplate?.id || 'unknown')
      }

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
    // IMPORTANT: node-brother-label-printer only supports continuous labels
    // All label types must map to one of the supported widths
    const sizeMap: Record<string, string> = {
      'dk-11201': '62-mm-wide continuous', // 29mm - will be scaled by printer
      'dk-11202': '62-mm-wide continuous', // 62mm - native width
      'continuous-62mm': '62-mm-wide continuous',
      'continuous-62mm-blackred': '62-mm-wide continuous' // DK-2251 black/red
    }

    // Add warning for precut labels
    if (templateId.startsWith('dk-') && !templateId.includes('continuous')) {
      console.warn(`⚠️ [Brother] Precut label ${templateId} detected. node-brother-label-printer only supports continuous labels. May cause Media Mismatch error.`)
    }

    // Special handling for black/red labels
    if (templateId.includes('blackred')) {
      console.log('🟥⬛ [Brother] Black/Red label detected - enabling color mode')
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
          .png({ compressionLevel: 3, force: true })
          .sharpen({ sigma: 1, flat: 1, jagged: 2 })
          .normalize()
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