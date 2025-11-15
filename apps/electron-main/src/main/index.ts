import { config } from 'dotenv'
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { setupMateriaPrimaHandlers } from './ipc/materiaPrima'
import { setupFileSystemHandlers } from './ipc/fs'
import { validateDatabaseConnection } from '@backend/db/pool'

// Cargar variables de entorno desde .env
config()

// Métricas de startup
const startupMetrics = {
  startTime: Date.now(),
  dbConnectionTime: 0,
  windowCreationTime: 0,
  ipcSetupTime: 0
}

// Función de reintentos para conexión a base de datos
async function setupWithRetry(maxRetries = 3): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🔄 Database connection attempt ${i + 1}/${maxRetries}...`)
      const startTime = Date.now()

      const dbConnected = await validateDatabaseConnection()
      startupMetrics.dbConnectionTime = Date.now() - startTime

      if (dbConnected) {
        console.log(`✅ Database connection verified in ${startupMetrics.dbConnectionTime}ms`)
        return true
      }
    } catch (error) {
      console.error(`❌ Database setup attempt ${i + 1} failed:`, error)
      if (i === maxRetries - 1) {
        // Mostrar diálogo de error crítico en último intento
        dialog.showErrorBox(
          'Error de Conexión a Base de Datos',
          'No se pudo establecer conexión con la base de datos después de varios intentos. La aplicación puede no funcionar correctamente.'
        )
        throw error
      }
      console.log(`⏳ Waiting ${2000 * (i + 1)}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)))
    }
  }
  return false
}

const createWindow = (): void => {
  const startTime = Date.now()

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  startupMetrics.windowCreationTime = Date.now() - startTime
  console.log(`🪟 Window created in ${startupMetrics.windowCreationTime}ms`)

  // HMR para desarrollo
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // DevTools en desarrollo
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }
}

const setupIPC = (): void => {
  const startTime = Date.now()

  setupMateriaPrimaHandlers()
  setupFileSystemHandlers()

  // Ping para testing
  ipcMain.handle('ping', async () => {
    return 'pong'
  })

  startupMetrics.ipcSetupTime = Date.now() - startTime
  console.log(`📡 IPC handlers configured in ${startupMetrics.ipcSetupTime}ms`)
}

app.whenReady().then(async () => {
  try {
    console.log('🚀 Starting application...')

    // Validar conexión a base de datos con reintentos
    const dbConnected = await setupWithRetry()
    if (dbConnected) {
      console.log('✅ Database connection verified')
    } else {
      console.warn('⚠️ Database connection failed, continuing with limited functionality')
    }

    // Crear ventana principal
    createWindow()

    // Setup handlers después de validar DB
    setupIPC()

    // Log de métricas finales
    const totalStartupTime = Date.now() - startupMetrics.startTime
    console.log(`📊 Startup metrics:
  • Total time: ${totalStartupTime}ms
  • DB connection: ${startupMetrics.dbConnectionTime}ms
  • Window creation: ${startupMetrics.windowCreationTime}ms
  • IPC setup: ${startupMetrics.ipcSetupTime}ms
  • Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`)

  } catch (error) {
    console.error('❌ Critical startup error:', error)

    // Mostrar error al usuario pero permitir que la app continúe
    dialog.showErrorBox(
      'Error Crítico de Inicio',
      `La aplicación encontró un error crítico durante el inicio: ${error instanceof Error ? error.message : 'Error desconocido'}\n\nLa aplicación continuará ejecutándose pero algunas funcionalidades pueden no estar disponibles.`
    )

    // Continuar con el inicio aunque haya errores
    createWindow()
    setupIPC()
  }
})

// Salir cuando todas las ventanas estén cerradas (excepto en macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Error handling global para errores de base de datos y conexión
process.on('uncaughtException', (error) => {
  if (error.message.includes('database') ||
      error.message.includes('connection') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND')) {
    console.error('💥 Database connection error:', error)
    // No terminar el proceso, solo loggear el error
  } else {
    console.error('💥 Uncaught exception:', error)
    // Para errores no relacionados con BD, terminar el proceso
    process.exit(1)
  }
})

process.on('unhandledRejection', (reason, promise) => {
  if (reason instanceof Error &&
      (reason.message.includes('database') ||
       reason.message.includes('connection') ||
       reason.message.includes('ECONNREFUSED') ||
       reason.message.includes('ENOTFOUND'))) {
    console.error('💥 Database promise rejection:', reason)
  } else {
    console.error('💥 Unhandled promise rejection at:', promise, 'reason:', reason)
  }
})

// Manejo del evento 'render-process-gone' (reemplazo de renderer-process-crashed)
app.on('render-process-gone', (event, webContents, details) => {
  console.error('💥 Renderer process gone:', details)
  if (details.reason === 'crashed') {
    // Opcional: intentar recargar la página
    webContents.reload()
  }
})