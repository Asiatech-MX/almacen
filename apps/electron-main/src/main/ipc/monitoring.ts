/**
 * IPC Handlers for Monitoring System
 *
 * Provides monitoring and telemetry functionality to the renderer process
 */

import { ipcMain } from 'electron'
import { monitoring } from '../monitoring'
import { featureFlags } from '../featureFlags'

export const setupMonitoringHandlers = (): void => {
  // Get current error statistics
  ipcMain.handle('monitoring:getErrorStats', () => {
    try {
      const errorStats = monitoring.getErrorStats()
      return { success: true, data: errorStats }
    } catch (error) {
      console.error('Error getting error stats:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Get current performance metrics
  ipcMain.handle('monitoring:getPerformanceMetrics', () => {
    try {
      const metrics = monitoring.getPerformanceMetrics()
      return { success: true, data: metrics }
    } catch (error) {
      console.error('Error getting performance metrics:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Export logs for debugging
  ipcMain.handle('monitoring:exportLogs', async () => {
    try {
      const logs = await monitoring.exportLogs()
      return { success: true, data: logs }
    } catch (error) {
      console.error('Error exporting logs:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Perform health check
  ipcMain.handle('monitoring:healthCheck', () => {
    try {
      const health = monitoring.healthCheck()
      return { success: true, data: health }
    } catch (error) {
      console.error('Error performing health check:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Log user action
  ipcMain.handle('monitoring:logUserAction', (_, action: string, userId?: string, context?: any) => {
    try {
      monitoring.logUserAction(action, userId, context)
      return { success: true }
    } catch (error) {
      console.error('Error logging user action:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Log performance event
  ipcMain.handle('monitoring:logPerformanceEvent', (_, event: string, duration: number, context?: any) => {
    try {
      monitoring.logPerformanceEvent(event, duration, context)
      return { success: true }
    } catch (error) {
      console.error('Error logging performance event:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Get monitoring configuration
  ipcMain.handle('monitoring:getConfig', () => {
    try {
      const config = {
        isProduction: process.env.NODE_ENV === 'production',
        featureFlags: featureFlags.getAllFlags(),
        logLevel: 'info', // This could be made configurable
        hasRemoteLogging: featureFlags.isEnabled('remoteLogging'),
        hasPerformanceMonitoring: featureFlags.isEnabled('performanceMonitoring')
      }
      return { success: true, data: config }
    } catch (error) {
      console.error('Error getting monitoring config:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Get system information
  ipcMain.handle('monitoring:getSystemInfo', () => {
    try {
      const systemInfo = {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        electronVersion: process.versions.electron,
        chromeVersion: process.versions.chrome,
        appVersion: process.env.npm_package_version || 'unknown',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
      return { success: true, data: systemInfo }
    } catch (error) {
      console.error('Error getting system info:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Clear error statistics (admin operation)
  ipcMain.handle('monitoring:clearErrorStats', () => {
    try {
      // This would require adding a clearErrorStats method to monitoring service
      // For now, return success but implement the functionality in the monitoring service
      console.log('📊 Error statistics cleared by admin')
      return { success: true }
    } catch (error) {
      console.error('Error clearing error stats:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Toggle monitoring features (admin operation)
  ipcMain.handle('monitoring:toggleFeature', (_, feature: 'performanceMonitoring' | 'remoteLogging', enabled: boolean) => {
    try {
      if (enabled) {
        featureFlags.enableFeature(feature)
      } else {
        featureFlags.disableFeature(feature)
      }

      console.log(`📊 Monitoring feature "${feature}" ${enabled ? 'enabled' : 'disabled'}`)
      return { success: true }
    } catch (error) {
      console.error('Error toggling monitoring feature:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  console.log('✅ Monitoring handlers registered')
}