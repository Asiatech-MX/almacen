import { readFileSync } from 'fs'
import { join } from 'path'
import * as edge from 'edge-js'

// Cargar el código C#
const csharpCode = readFileSync(join(__dirname, 'BrotherPrinter.cs'), 'utf8')

// Compilar el código C#
const createBrotherPrinter = edge.func({
  source: csharpCode,
  references: ['System.Drawing.dll', 'System.Printing.dll']
})

interface PrintOptions {
  pdfPath: string
  printerName?: string
  widthMm?: number
  heightMm?: number
}

interface PrinterInfo {
  name: string
  isValid: boolean
  canDuplex: boolean
  maxCopies: number
  isDefault: boolean
}

interface PrintResult {
  success: boolean
  message?: string
  error?: string
  printer?: string
  dimensions?: { width: number; height: number }
}

interface GetPrintersResult {
  success: boolean
  printers?: PrinterInfo[]
  error?: string
}

export class BrotherPrinterNative {
  private brotherPrinter: any

  constructor() {
    try {
      this.brotherPrinter = createBrotherPrinter()
      console.log('✅ Brother printer C# module loaded successfully')
    } catch (error) {
      console.error('❌ Failed to load Brother printer C# module:', error)
      throw error
    }
  }

  /**
   * Imprime una etiqueta usando el módulo C#
   */
  async printLabel(options: PrintOptions): Promise<PrintResult> {
    try {
      console.log('🖨️ [C#] Enviando a impresora:', options.printerName || 'default')
      console.log('📄 [C#] Archivo:', options.pdfPath)
      console.log('📏 [C#] Dimensiones:', `${options.widthMm}x${options.heightMm}mm`)

      const result = await this.brotherPrinter.PrintLabel(options)

      console.log('📋 [C#] Resultado:', result)

      return result as PrintResult
    } catch (error) {
      console.error('❌ [C#] Error en impresión:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  /**
   * Imprime PDF usando el comando de Windows
   */
  async printPDF(options: PrintOptions): Promise<PrintResult> {
    try {
      console.log('🖨️ [C# System] Enviando PDF a impresora:', options.printerName || 'default')

      const result = await this.brotherPrinter.PrintPDFWithSystem(options)

      console.log('📋 [C# System] Resultado:', result)

      return result as PrintResult
    } catch (error) {
      console.error('❌ [C# System] Error en impresión PDF:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  /**
   * Obtiene la lista de impresoras disponibles
   */
  async getPrinters(): Promise<GetPrintersResult> {
    try {
      console.log('🔍 [C#] Listando impresoras disponibles...')

      const result = await this.brotherPrinter.GetPrinters()

      console.log('📋 [C#] Impresoras encontradas:', result)

      return result as GetPrintersResult
    } catch (error) {
      console.error('❌ [C#] Error obteniendo impresoras:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  /**
   * Verifica si una impresora específica está disponible
   */
  async isPrinterAvailable(printerName: string): Promise<boolean> {
    try {
      const result = await this.getPrinters()

      if (result.success && result.printers) {
        return result.printers.some(p =>
          p.name.toLowerCase() === printerName.toLowerCase() && p.isValid
        )
      }

      return false
    } catch (error) {
      console.error('❌ Error verificando disponibilidad de impresora:', error)
      return false
    }
  }
}

// Exportar una instancia singleton
export const brotherPrinterNative = new BrotherPrinterNative()