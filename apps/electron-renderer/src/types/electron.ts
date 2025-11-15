export interface MateriaPrima {
  id: string
  nombre: string
  marca?: string
  modelo?: string
  presentacion: string
  stockActual: number
  codigoBarras?: string
  fechaCaducidad?: string
}

export interface ElectronAPI {
  materiaPrima: {
    listar: () => Promise<MateriaPrima[]>
    crear: (data: Omit<MateriaPrima, 'id'>) => Promise<MateriaPrima>
    actualizar: (id: string, data: Partial<MateriaPrima>) => Promise<MateriaPrima>
    eliminar: (id: string) => Promise<boolean>
  }

  sistema: {
    leerArchivo: (ruta: string) => Promise<string>
    guardarArchivo: (ruta: string, contenido: string) => Promise<void>
  }

  onActualizacionInventario: (callback: (data: any) => void) => void

  // Métodos genéricos
  invoke: (channel: string, ...args: any[]) => Promise<any>
  on: (channel: string, callback: (...args: any[]) => void) => void
  off: (channel: string, callback: (...args: any[]) => void) => void
  send: (channel: string, ...args: any[]) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}