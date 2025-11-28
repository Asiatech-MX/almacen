import { config } from 'dotenv'
import { app, BrowserWindow, ipcMain, dialog, session, protocol } from 'electron'
import { join } from 'path'
import { promises as fs } from 'node:fs'
import { setupMateriaPrimaHandlers } from './ipc/materiaPrima'
import { setupFileSystemHandlers } from './ipc/fs'
import { registerProveedorHandlers } from './ipc/proveedor'
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

// Configuración de protocolo personalizado para imágenes
const setupImageProtocol = (): void => {
  const IMAGE_CONFIG = {
    uploadsDir: 'assets/images/materia-prima'
  }

  protocol.registerFileProtocol('almacen-img', (request, callback) => {
    try {
      // Extraer el nombre del archivo de la URL
      const url = request.url
      if (!url || !url.startsWith('almacen-img://')) {
        console.error('❌ Invalid protocol URL:', url)
        callback({ error: -3 }) // Access denied
        return
      }

      const filename = url.replace('almacen-img://', '').trim()

      // Validaciones de seguridad del nombre de archivo
      if (!filename ||
          filename.length === 0 ||
          filename.length > 255 || // Límite de nombre de archivo
          filename.includes('..') ||
          filename.includes('\\') ||
          filename.includes('/') ||
          filename.includes(':') ||
          filename.includes('*') ||
          filename.includes('?') ||
          filename.includes('"') ||
          filename.includes('<') ||
          filename.includes('>') ||
          filename.includes('|')) {
        console.error('❌ Invalid filename in image protocol request:', filename)
        callback({ error: -3 }) // Access denied
        return
      }

      // Validar que tenga una extensión de imagen permitida
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
      const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
      if (!allowedExtensions.includes(fileExtension)) {
        console.error('❌ Invalid file extension:', fileExtension)
        callback({ error: -3 }) // Access denied
        return
      }

      const userDataPath = app.getPath('userData')
      const imagePath = join(userDataPath, IMAGE_CONFIG.uploadsDir, filename)

      // Validar que el archivo exista y sea accesible
      fs.access(imagePath, fs.constants.F_OK | fs.constants.R_OK)
        .then(async () => {
          try {
            // Validación adicional: verificar el tipo de archivo (mágica)
            const stats = await fs.stat(imagePath)
            if (!stats.isFile()) {
              throw new Error('Path is not a file')
            }

            // Verificar que el archivo no sea demasiado grande (opcional)
            const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
            if (stats.size > MAX_FILE_SIZE) {
              throw new Error('File too large')
            }

            console.log(`📷 Serving image: ${filename} (${stats.size} bytes)`)
            callback({ path: imagePath })
          } catch (fileError) {
            console.error('❌ File validation error:', fileError)
            callback({ error: -2 }) // File not found or invalid
          }
        })
        .catch((err) => {
          console.error(`❌ Image not found or inaccessible: ${imagePath}`, err)
          callback({ error: -2 }) // File not found
        })
    } catch (error) {
      console.error('❌ Critical error in image protocol handler:', error)
      callback({ error: -3 }) // Access denied
    }
  })

  console.log('🖼️ Image protocol "almacen-img://" registered successfully')
}

// Configuración de seguridad de sesión
const setupSecurity = (): void => {
  // Configurar Content Security Policy para permitir nuestro protocolo personalizado
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self';" +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval';" +
          "style-src 'self' 'unsafe-inline';" +
          "img-src 'self' data: blob: almacen-img:;" +
          "font-src 'self' data:;" +
          "connect-src 'self' ws: wss:;" +
          "media-src 'self' blob:;" +
          "object-src 'none';" +
          "frame-src 'none';" +
          "child-src 'none';" +
          "worker-src 'self' blob:;" +
          "manifest-src 'self';" +
          "upgrade-insecure-requests"
        ]
      }
    })
  })

  // Configurar manejo de permisos de forma restrictiva
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    // Denegar permisos desconocidos
    const allowedPermissions = ['notifications', 'clipboard-read', 'clipboard-sanitized-write']

    if (allowedPermissions.includes(permission)) {
      // Permitir solo para orígenes seguros
      const url = webContents.getURL()
      if (url.startsWith('http://localhost:') || url.startsWith('file://')) {
        callback(true)
        return
      }
    }

    // Denegar por defecto
    callback(false)
  })

  // Configurar manejo de verificación de permisos
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    // Permitir solo orígenes locales y nuestro protocolo personalizado
    if (requestingOrigin && (
      requestingOrigin.startsWith('http://localhost:') ||
      requestingOrigin.startsWith('file://') ||
      requestingOrigin.startsWith('almacen-img://')
    )) {
      return permission === 'notifications' || permission === 'clipboard-read' || permission === 'clipboard-sanitized-write'
    }
    return false
  })

  console.log('🔒 Security configuration applied with CSP for almacen-img://')
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
      sandbox: false,  // Temporalmente para desarrollo
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      enableBlinkFeatures: undefined,
      spellcheck: true,
      // Configuración específica para soporte de protocolos personalizados
      additionalArguments: [
        '--disable-features=VizDisplayCompositor'
      ],
      // Permitir protocolos personalizados
      protocols: ['almacen-img']
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
  registerProveedorHandlers()

  // Ping para testing
  ipcMain.handle('ping', async () => {
    return 'pong'
  })

  startupMetrics.ipcSetupTime = Date.now() - startTime
  console.log(`📡 IPC handlers configured in ${startupMetrics.ipcSetupTime}ms`)
}

// Registrar protocolos privilegiados antes de app.whenReady()
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'almacen-img',
    privileges: {
      secure: true,
      allowServiceWorkers: false,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
])

app.whenReady().then(async () => {
  try {
    console.log('🚀 Starting application...')

    // Configurar seguridad primero
    setupSecurity()

    // Configurar protocolo de imágenes
    setupImageProtocol()

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