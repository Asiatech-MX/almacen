import { ipcMain } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'

export function setupFileSystemHandlers(): void {
  // Leer archivo
  ipcMain.handle('fs:leer', async (_, ruta: string) => {
    try {
      const contenido = await fs.readFile(ruta, 'utf-8')
      return contenido
    } catch (error) {
      console.error('Error leyendo archivo:', error)
      throw new Error(`Error leyendo archivo: ${(error as Error).message}`)
    }
  })

  // Guardar archivo
  ipcMain.handle('fs:guardar', async (_, ruta: string, contenido: string) => {
    try {
      // Asegurar que el directorio existe
      const directorio = path.dirname(ruta)
      await fs.mkdir(directorio, { recursive: true })

      await fs.writeFile(ruta, contenido, 'utf-8')
      return true
    } catch (error) {
      console.error('Error guardando archivo:', error)
      throw new Error(`Error guardando archivo: ${(error as Error).message}`)
    }
  })
}