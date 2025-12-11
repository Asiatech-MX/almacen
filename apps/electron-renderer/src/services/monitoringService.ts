/**
 * Monitoring Service for Renderer Process
 *
 * Provides a convenient API for monitoring and logging functionality
 * in the renderer process
 */

export class MonitoringService {
  private static instance: MonitoringService
  private userId?: string
  private sessionStartTime: number

  private constructor() {
    this.sessionStartTime = Date.now()
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService()
    }
    return MonitoringService.instance
  }

  // Set user context for monitoring
  setUser(userId: string): void {
    this.userId = userId
  }

  // Log user action with timing
  async logUserAction(
    action: string,
    context?: Record<string, any>,
    startTime?: number
  ): Promise<void> {
    try {
      const duration = startTime ? Date.now() - startTime : undefined
      await window.electronAPI.monitoring.logUserAction(action, this.userId, {
        ...context,
        duration,
        sessionAge: Date.now() - this.sessionStartTime
      })
    } catch (error) {
      console.error('Failed to log user action:', error)
    }
  }

  // Log performance event
  async logPerformanceEvent(
    event: string,
    duration: number,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      await window.electronAPI.monitoring.logPerformanceEvent(event, duration, {
        ...context,
        userId: this.userId,
        sessionAge: Date.now() - this.sessionStartTime
      })
    } catch (error) {
      console.error('Failed to log performance event:', error)
    }
  }

  // Time a function execution
  async timeFunction<T>(
    eventName: string,
    fn: () => T | Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - startTime
      await this.logPerformanceEvent(eventName, duration, {
        ...context,
        success: true
      })
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      await this.logPerformanceEvent(eventName, duration, {
        ...context,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  // Get current monitoring configuration
  async getConfig(): Promise<any> {
    try {
      const response = await window.electronAPI.monitoring.getConfig()
      return response.data
    } catch (error) {
      console.error('Failed to get monitoring config:', error)
      throw error
    }
  }

  // Get system health status
  async getHealthStatus(): Promise<{ status: 'healthy' | 'warning' | 'error', details: any }> {
    try {
      const response = await window.electronAPI.monitoring.healthCheck()
      return response.data
    } catch (error) {
      console.error('Failed to get health status:', error)
      throw error
    }
  }

  // Get error statistics
  async getErrorStats(): Promise<Record<string, number>> {
    try {
      const response = await window.electronAPI.monitoring.getErrorStats()
      return response.data
    } catch (error) {
      console.error('Failed to get error stats:', error)
      throw error
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(): Promise<any> {
    try {
      const response = await window.electronAPI.monitoring.getPerformanceMetrics()
      return response.data
    } catch (error) {
      console.error('Failed to get performance metrics:', error)
      throw error
    }
  }

  // Export logs
  async exportLogs(): Promise<string> {
    try {
      const response = await window.electronAPI.monitoring.exportLogs()
      return response.data
    } catch (error) {
      console.error('Failed to export logs:', error)
      throw error
    }
  }

  // Create a performance timer
  createTimer(eventName: string, context?: Record<string, any>) {
    const startTime = Date.now()

    return {
      end: async (additionalContext?: Record<string, any>) => {
        const duration = Date.now() - startTime
        await this.logPerformanceEvent(eventName, duration, {
          ...context,
          ...additionalContext
        })
        return duration
      },

      lap: async (lapName: string) => {
        const duration = Date.now() - startTime
        await this.logPerformanceEvent(`${eventName}_${lapName}`, duration, {
          ...context,
          type: 'lap'
        })
        return duration
      }
    }
  }

  // Track React component render performance
  trackComponentRender(componentName: string) {
    const renderStartTime = Date.now()

    return {
      mount: async () => {
        const duration = Date.now() - renderStartTime
        await this.logPerformanceEvent(`component_mount_${componentName}`, duration, {
          component: componentName,
          phase: 'mount'
        })
      },

      update: async () => {
        const duration = Date.now() - renderStartTime
        await this.logPerformanceEvent(`component_update_${componentName}`, duration, {
          component: componentName,
          phase: 'update'
        })
      }
    }
  }

  // Track API call performance
  async trackApiCall<T>(
    apiName: string,
    apiCall: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    return this.timeFunction(`api_call_${apiName}`, apiCall, {
      type: 'api_call',
      apiName,
      ...context
    })
  }

  // Track database operation performance
  async trackDbOperation<T>(
    operation: string,
    dbCall: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    return this.timeFunction(`db_operation_${operation}`, dbCall, {
      type: 'db_operation',
      operation,
      ...context
    })
  }

  // Log feature usage
  async logFeatureUsage(feature: string, context?: Record<string, any>): Promise<void> {
    await this.logUserAction(`feature_usage_${feature}`, {
      type: 'feature_usage',
      feature,
      ...context
    })
  }

  // Log error with context
  async logError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.logUserAction('error_occurred', {
      type: 'error',
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      ...context
    })
  }

  // Get session statistics
  getSessionStats(): { sessionDuration: number; sessionAge: number } {
    const now = Date.now()
    return {
      sessionDuration: now - this.sessionStartTime,
      sessionAge: now - this.sessionStartTime
    }
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance()

// React hook for monitoring
export const useMonitoring = () => {
  return {
    logUserAction: (action: string, context?: Record<string, any>, startTime?: number) =>
      monitoringService.logUserAction(action, context, startTime),
    logPerformanceEvent: (event: string, duration: number, context?: Record<string, any>) =>
      monitoringService.logPerformanceEvent(event, duration, context),
    timeFunction: <T>(eventName: string, fn: () => T | Promise<T>, context?: Record<string, any>) =>
      monitoringService.timeFunction(eventName, fn, context),
    createTimer: (eventName: string, context?: Record<string, any>) =>
      monitoringService.createTimer(eventName, context),
    trackComponentRender: (componentName: string) =>
      monitoringService.trackComponentRender(componentName),
    trackApiCall: <T>(apiName: string, apiCall: () => Promise<T>, context?: Record<string, any>) =>
      monitoringService.trackApiCall(apiName, apiCall, context),
    trackDbOperation: <T>(operation: string, dbCall: () => Promise<T>, context?: Record<string, any>) =>
      monitoringService.trackDbOperation(operation, dbCall, context),
    logFeatureUsage: (feature: string, context?: Record<string, any>) =>
      monitoringService.logFeatureUsage(feature, context),
    logError: (error: Error, context?: Record<string, any>) =>
      monitoringService.logError(error, context),
    setUser: (userId: string) => monitoringService.setUser(userId),
    getConfig: () => monitoringService.getConfig(),
    getHealthStatus: () => monitoringService.getHealthStatus(),
    getErrorStats: () => monitoringService.getErrorStats(),
    getPerformanceMetrics: () => monitoringService.getPerformanceMetrics(),
    exportLogs: () => monitoringService.exportLogs(),
    getSessionStats: () => monitoringService.getSessionStats()
  }
}