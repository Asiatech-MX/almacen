/**
 * Production Monitoring System
 *
 * Provides comprehensive error handling, performance monitoring, and logging
 * for the Electron application using electron-log
 */

import { app, dialog } from 'electron'
import log from 'electron-log/main'
import { featureFlags } from './featureFlags'

export interface PerformanceMetrics {
  startupTime: number
  dbConnectionTime: number
  windowCreationTime: number
  memoryUsage: NodeJS.MemoryUsage
  cpuUsage: NodeJS.CpuUsage
}

export interface ErrorReport {
  error: Error
  processType: 'browser' | 'renderer'
  timestamp: Date
  userAgent?: string
  url?: string
  userId?: string
  featureFlags?: Record<string, any>
}

class MonitoringService {
  private static instance: MonitoringService
  private performanceMetrics: PerformanceMetrics
  private errorCounts: Map<string, number> = new Map()
  private isProduction: boolean

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production'
    this.performanceMetrics = {
      startupTime: 0,
      dbConnectionTime: 0,
      windowCreationTime: 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    }
    this.initializeLogging()
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService()
    }
    return MonitoringService.instance
  }

  private initializeLogging(): void {
    // Configure logging based on environment
    if (this.isProduction) {
      this.configureProductionLogging()
    } else {
      this.configureDevelopmentLogging()
    }

    // Initialize electron-log for renderer processes
    log.initialize({ spyRendererConsole: true })

    // Set up error handling
    this.setupErrorHandling()

    // Set up performance monitoring
    this.setupPerformanceMonitoring()

    // Override console methods to use electron-log
    this.overrideConsoleMethods()

    log.info('📊 Monitoring system initialized', {
      environment: this.isProduction ? 'production' : 'development',
      logLevel: log.transports.file.level
    })
  }

  private configureProductionLogging(): void {
    // Production logging configuration
    log.transports.file.level = 'warn'
    log.transports.console.level = false // Disable console in production

    // Custom log file path for production
    log.transports.file.resolvePathFn = (variables) => {
      const userDataPath = app.getPath('userData')
      return `${userDataPath}/logs/app.log`
    }

    // Log rotation for production (10MB max)
    log.transports.file.maxSize = 10 * 1024 * 1024

    // Production formatting
    log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [{processType}] {text}'

    // Set up remote logging for critical errors if feature flag is enabled
    if (featureFlags.isEnabled('remoteLogging')) {
      this.configureRemoteLogging()
    }
  }

  private configureDevelopmentLogging(): void {
    // Development logging configuration
    log.transports.file.level = 'debug'
    log.transports.console.level = 'debug'
    log.transports.console.format = '{h}:{i}:{s}.{ms} [{level}] {text}'

    // Development log file path
    log.transports.file.resolvePathFn = (variables) => {
      return `${variables.electronDefaultDir}/logs/app-dev.log`
    }

    // Enable IPC transport for development (shows renderer logs in main console)
    log.transports.ipc.level = 'debug'
  }

  private configureRemoteLogging(): void {
    // Configure remote transport for error reporting
    log.transports.remote.level = 'error'
    log.transports.remote.url = process.env.REMOTE_LOG_URL || 'https://api.example.com/logs'

    // Add client information to remote logs
    log.transports.remote.client = {
      name: app.getName(),
      version: app.getVersion(),
      platform: process.platform
    }

    // Custom error processing for remote transport
    log.transports.remote.processErrorFn = ({ error }) => {
      log.error('Failed to send remote log:', error)
    }
  }

  private setupErrorHandling(): void {
    // Start catching unhandled errors and rejected promises
    log.errorHandler.startCatching({
      showDialog: false, // We'll handle dialogs ourselves

      onError: ({ createIssue, error, processType, versions }) => {
        this.trackError(error, processType)

        // Only show dialogs in production for main process errors
        if (this.isProduction && processType === 'browser') {
          this.showErrorDialog(error, createIssue, versions)
        }

        // Log detailed error information
        log.error('💥 Uncaught error occurred:', {
          message: error.message,
          stack: error.stack,
          processType,
          versions,
          timestamp: new Date().toISOString(),
          memoryUsage: process.memoryUsage(),
          featureFlags: featureFlags.getAllFlags()
        })

        // Return false to prevent electron-log from showing its own dialog
        return false
      }
    })
  }

  private showErrorDialog(
    error: Error,
    createIssue: (url: string, params: Record<string, string>) => void,
    versions: { app: string; electron: string; os: string }
  ): void {
    dialog.showMessageBox({
      type: 'error',
      title: 'Error de Aplicación',
      message: 'Ocurrió un error inesperado',
      detail: `${error.message}\n\n¿Desea reportar este error?`,
      buttons: ['Ignorar', 'Reportar Error', 'Cerrar Aplicación'],
      defaultId: 0,
      cancelId: 2
    }).then((result) => {
      switch (result.response) {
        case 1: // Report Error
          createIssue('https://github.com/your-repo/your-app/issues/new', {
            title: `Error Report: ${versions.app}`,
            body: `**Error:**\n\`\`\`\n${error.stack}\n\`\`\`\n\n**Environment:**\n- App: ${versions.app}\n- Electron: ${versions.electron}\n- OS: ${versions.os}\n- Timestamp: ${new Date().toISOString()}\n\n**Feature Flags:**\n\`\`\`json\n${JSON.stringify(featureFlags.getAllFlags(), null, 2)}\n\`\`\``,
            labels: 'bug,auto-reported'
          })
          break
        case 2: // Close Application
          app.quit()
          break
        case 0: // Ignore - do nothing
        default:
          break
      }
    })
  }

  private setupPerformanceMonitoring(): void {
    // Monitor critical Electron events
    log.eventLogger.startLogging({
      level: 'warn',
      scope: 'app-events'
    })

    // Custom event formatting
    log.eventLogger.format = ({ eventSource, eventName, args }) => {
      return [`${eventSource}#${eventName}:`, JSON.stringify(args)]
    }

    // Set up performance metrics collection
    setInterval(() => {
      this.collectPerformanceMetrics()
    }, 30000) // Collect metrics every 30 seconds
  }

  private collectPerformanceMetrics(): void {
    const currentMemory = process.memoryUsage()
    const currentCpu = process.cpuUsage()

    const metrics = {
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(currentMemory.heapTotal / 1024 / 1024),
        external: Math.round(currentMemory.external / 1024 / 1024),
        rss: Math.round(currentMemory.rss / 1024 / 1024)
      },
      cpu: currentCpu
    }

    // Log performance metrics in development or when performance monitoring feature is enabled
    if (!this.isProduction || featureFlags.isEnabled('performanceMonitoring')) {
      log.verbose('📈 Performance metrics:', metrics)
    }

    // Alert on high memory usage
    if (metrics.memory.heapUsed > 500) { // 500MB threshold
      log.warn('⚠️ High memory usage detected:', metrics.memory)
    }
  }

  private overrideConsoleMethods(): void {
    // Override console methods for centralized logging
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    }

    console.log = (...args) => {
      log.info(...args)
      originalConsole.log(...args)
    }

    console.error = (...args) => {
      log.error(...args)
      originalConsole.error(...args)
    }

    console.warn = (...args) => {
      log.warn(...args)
      originalConsole.warn(...args)
    }

    console.info = (...args) => {
      log.info(...args)
      originalConsole.info(...args)
    }
  }

  // Public API methods

  recordStartupMetric(metric: keyof PerformanceMetrics, value: number): void {
    this.performanceMetrics[metric] = value
    log.info(`⏱️ Startup metric recorded: ${metric} = ${value}ms`)
  }

  trackError(error: Error, processType: 'browser' | 'renderer', context?: any): void {
    const errorKey = `${error.name}:${error.message}`
    const currentCount = this.errorCounts.get(errorKey) || 0
    this.errorCounts.set(errorKey, currentCount + 1)

    const errorReport: ErrorReport = {
      error,
      processType,
      timestamp: new Date(),
      ...context
    }

    log.error('🐛 Error tracked:', errorReport)

    // Alert on repeated errors
    if (currentCount > 0 && currentCount % 5 === 0) {
      log.warn(`🚨 Error "${errorKey}" has occurred ${currentCount + 1} times`)
    }
  }

  logFeatureFlagUsage(feature: string, userId?: string, context?: any): void {
    log.info('🚩 Feature flag usage:', {
      feature,
      userId,
      context,
      timestamp: new Date().toISOString(),
      enabled: featureFlags.isEnabled(feature, userId)
    })
  }

  logUserAction(action: string, userId?: string, context?: any): void {
    log.info('👤 User action:', {
      action,
      userId,
      context,
      timestamp: new Date().toISOString()
    })
  }

  logPerformanceEvent(event: string, duration: number, context?: any): void {
    log.info('⚡ Performance event:', {
      event,
      duration,
      context,
      timestamp: new Date().toISOString()
    })

    // Alert on slow operations
    if (duration > 5000) { // 5 seconds threshold
      log.warn(`🐌 Slow operation detected: ${event} took ${duration}ms`)
    }
  }

  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts)
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  async exportLogs(): Promise<string> {
    try {
      const allLogs = log.transports.file.readAllLogs()
      const logContent = allLogs.map(log =>
        `=== ${log.path} ===\n${log.lines.join('\n')}`
      ).join('\n\n')

      return logContent
    } catch (error) {
      log.error('Failed to export logs:', error)
      throw error
    }
  }

  // Health check method
  healthCheck(): { status: 'healthy' | 'warning' | 'error'; details: any } {
    const memoryUsage = process.memoryUsage()
    const errorCount = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0)

    let status: 'healthy' | 'warning' | 'error' = 'healthy'
    const details = {
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024)
      },
      errorCount,
      uptime: process.uptime()
    }

    // Determine health status
    if (details.memory.heapUsed > 500 || errorCount > 50) {
      status = 'error'
    } else if (details.memory.heapUsed > 300 || errorCount > 20) {
      status = 'warning'
    }

    return { status, details }
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance()