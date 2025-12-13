import { exec } from 'child_process'
import { promisify } from 'util'
import os from 'os'

const execAsync = promisify(exec)

export interface PrinterInfo {
  name: string
  status: string
  isDefault: boolean
  isOnline: boolean
  jobsCount?: number
}

export interface PrintResult {
  success: boolean
  message?: string
  error?: string
  method?: string
}

export class WindowsPrinter {
  /**
   * Obtiene la lista de impresoras instaladas en Windows
   */
  async getPrinters(): Promise<{ success: boolean; printers?: PrinterInfo[]; error?: string }> {
    try {
      console.log('🔍 Obteniendo lista de impresoras de Windows...')

      // Usar PowerShell para obtener información detallada
      const psCommand = `powershell.exe -Command "
        Get-WmiObject -Class Win32_Printer | ForEach-Object {
          $printer = $_
          $isDefault = $_.Name -eq (Get-WmiObject -Query \\"SELECT * FROM Win32_Printer WHERE Default=$true\\").Name
          $status = if ($printer.WorkOffline) { 'Offline' } else { 'Online' }

          [PSCustomObject]@{
            Name = $printer.Name
            Status = $status
            IsDefault = $isDefault
            IsOnline = -not $printer.WorkOffline
            JobsCount = (Get-WmiObject -Class Win32_PrintJob -ComputerName $printer.SystemName -Filter \\"DriverName='$printer.Name'\\" | Measure-Object).Count
          }
        } | ConvertTo-Json
      "`

      const { stdout, stderr } = await execAsync(psCommand)

      if (stderr) {
        console.error('⚠️ Warning en PowerShell:', stderr)
      }

      // Validar y parsear el JSON de salida
      let printersData
      try {
        // Validar que la salida no esté vacía
        if (!stdout || stdout.trim().length === 0) {
          throw new Error('PowerShell returned empty output')
        }

        // Validar que parezca JSON (empieza con [ o {)
        const trimmed = stdout.trim()
        if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
          throw new Error('PowerShell output is not valid JSON')
        }

        printersData = JSON.parse(stdout)
      } catch (jsonError) {
        console.warn('⚠️ JSON parse failed, using WMIC fallback:', jsonError.message)
        return this.getPrintersWMIC() // Fallback automático
      }

      const printers = Array.isArray(printersData) ? printersData : [printersData]

      console.log(`✅ Encontradas ${printers.length} impresoras`)

      return {
        success: true,
        printers: printers.map(p => ({
          name: p.Name,
          status: p.Status,
          isDefault: p.IsDefault,
          isOnline: p.IsOnline,
          jobsCount: p.JobsCount || 0
        }))
      }
      } catch (error) {
      console.error('❌ Error con PowerShell:', error)

      // Siempre usar WMIC como fallback principal
      console.log('🔄 Using WMIC as fallback...')
      return this.getPrintersWMIC()
    }
  }

  /**
   * Método alternativo usando WMIC (más compatible)
   */
  private async getPrintersWMIC(): Promise<{ success: boolean; printers?: PrinterInfo[]; error?: string }> {
    try {
      console.log('🔄 Using WMIC as fallback method...')

      const { stdout } = await execAsync('wmic printer get name, status /format:csv')
      const lines = stdout.split('\n').filter(line => line.trim())
      const printers: PrinterInfo[] = []

      for (const line of lines.slice(1)) { // Saltar el encabezado
        const parts = line.split(',')
        if (parts.length >= 2) {
          const name = parts[1].trim()
          const status = parts[2].trim()
          if (name) {
            printers.push({
              name,
              status: status || 'Unknown',
              isDefault: false, // WMIC no indica si es predeterminada
              isOnline: status && status.toLowerCase() !== 'offline'
            })
          }
        }
      }

      return {
        success: true,
        printers
      }
    } catch (wmicError) {
      return {
        success: false,
        error: `WMIC fallback failed: ${wmicError.message}`
      }
    }
  }

  /**
   * Verifica si una impresora específica existe y está disponible
   */
  async isPrinterAvailable(printerName: string): Promise<boolean> {
    try {
      const result = await this.getPrinters()
      if (!result.success || !result.printers) {
        return false
      }

      const printer = result.printers.find(p =>
        p.name.toLowerCase() === printerName.toLowerCase()
      )

      return printer ? printer.isOnline : false
    } catch (error) {
      console.error('❌ Error verificando disponibilidad:', error)
      return false
    }
  }

  /**
   * Imprime un archivo PDF en una impresora específica
   */
  async printPDF(pdfPath: string, printerName?: string): Promise<PrintResult> {
    const startTime = Date.now()

    try {
      console.log(`🖨️ [Windows] Iniciando impresión de: ${pdfPath}`)
      if (printerName) {
        console.log(`🖨️ [Windows] Impresora objetivo: ${printerName}`)
      }

      // Verificar que el archivo existe
      const fs = require('fs')
      if (!fs.existsSync(pdfPath)) {
        return {
          success: false,
          error: `Archivo no encontrado: ${pdfPath}`
        }
      }

      // Método 1: Usar PowerShell con impresora específica
      if (printerName) {
        const isAvailable = await this.isPrinterAvailable(printerName)
        if (isAvailable) {
          try {
            console.log('📋 [Windows] Intentando impresión con impresora específica...')

            // Usar Start-Process con /t para especificar impresora
            const psCommand = `powershell.exe -Command "
              try {
                Write-Host 'Enviando a impresora: ${printerName}'
                Start-Process -FilePath '${pdfPath}' -ArgumentList '/t', '${printerName}' -Wait -WindowStyle Hidden -PassThru
                Write-Host 'Impresión enviada exitosamente'
                exit 0
              } catch {
                Write-Error 'Error: ' + $_.Exception.Message
                exit 1
              }
            "`

            await execAsync(psCommand)
            const duration = Date.now() - startTime

            return {
              success: true,
              message: `PDF enviado a ${printerName}`,
              method: 'PowerShell-Specific',
              duration: `${duration}ms`
            }
          } catch (psError) {
            console.warn('⚠️ Error con impresora específica, intentando método alternativo...', psError.message)
          }
        } else {
          console.warn(`⚠️ Impresora ${printerName} no disponible o offline`)
        }
      }

      // Método 2: Usar el visor de PDF predeterminado (fallback)
      console.log('🔄 [Windows] Usando impresora predeterminada...')
      const defaultCommand = `powershell.exe -Command "
        try {
          Write-Host 'Enviando a impresora predeterminada'
          Start-Process -FilePath '${pdfPath}' -Verb Print -Wait -WindowStyle Hidden
          Write-Host 'Impresión enviada a impresora predeterminada'
          exit 0
        } catch {
          Write-Error 'Error: ' + $_.Exception.Message
          exit 1
        }
      "`

      await execAsync(defaultCommand)
      const duration = Date.now() - startTime

      return {
        success: true,
        message: printerName
          ? `PDF enviado a impresión (fallback - ${printerName} no estaba disponible)`
          : 'PDF enviado a impresora predeterminada',
        method: 'PowerShell-Default',
        duration: `${duration}ms`
      }

    } catch (error) {
      console.error('❌ [Windows] Error en impresión:', error)

      // Método 3: Último recurso con CMD simple
      try {
        console.log('🆘 [Windows] Intentando último recurso con CMD...')

        const cmdCommand = printerName
          ? `cmd /c "${pdfPath}" "${printerName}"`
          : `cmd /c "${pdfPath}"`

        await execAsync(cmdCommand, { timeout: 10000 })
        const duration = Date.now() - startTime

        return {
          success: true,
          message: 'PDF enviado con CMD (último recurso)',
          method: 'CMD',
          duration: `${duration}ms`
        }
      } catch (cmdError) {
        return {
          success: false,
          error: `Todos los métodos fallaron. PowerShell: ${error.message}. CMD: ${cmdError.message}`
        }
      }
    }
  }

  /**
   * Configura una impresora como predeterminada
   */
  async setDefaultPrinter(printerName: string): Promise<boolean> {
    try {
      const command = `powershell.exe -Command "(Get-WmiObject -Class Win32_Printer -Filter \\"Name='${printerName}'\\").SetDefaultPrinter()"`
      await execAsync(command)
      console.log(`✅ Impresora ${printerName} configurada como predeterminada`)
      return true
    } catch (error) {
      console.error(`❌ Error configurando impresora predeterminada:`, error)
      return false
    }
  }

  /**
   * Obtiene el nombre de la impresora predeterminada
   */
  async getDefaultPrinter(): Promise<string | null> {
    try {
      const command = 'powershell.exe -Command "(Get-WmiObject -Class Win32_Printer -Filter \\"Default=$true\\").Name"'
      const { stdout } = await execAsync(command)
      const printerName = stdout.trim()
      return printerName || null
    } catch (error) {
      console.error('❌ Error obteniendo impresora predeterminada:', error)
      return null
    }
  }
}

// Exportar instancia singleton
export const windowsPrinter = new WindowsPrinter()