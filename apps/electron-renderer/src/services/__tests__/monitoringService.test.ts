/**
 * Tests for Monitoring Service (Renderer Process)
 */

import { monitoringService, useMonitoring } from '../monitoringService'

// Mock the electron API
const mockElectronAPI = {
  monitoring: {
    logUserAction: jest.fn(),
    logPerformanceEvent: jest.fn(),
    getConfig: jest.fn(),
    healthCheck: jest.fn(),
    getErrorStats: jest.fn(),
    getPerformanceMetrics: jest.fn(),
    exportLogs: jest.fn()
  }
}

// Setup global window object
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
})

describe('MonitoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = monitoringService
      const instance2 = MonitoringService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('setUser', () => {
    it('should set user ID for monitoring context', () => {
      monitoringService.setUser('test-user-123')
      // Since we can't directly access private properties, we test by logging an action
      monitoringService.logUserAction('test-action')
      expect(mockElectronAPI.monitoring.logUserAction).toHaveBeenCalledWith(
        'test-action',
        'test-user-123',
        expect.objectContaining({ sessionAge: expect.any(Number) })
      )
    })
  })

  describe('logUserAction', () => {
    it('should log user action without user context', async () => {
      mockElectronAPI.monitoring.logUserAction.mockResolvedValue(undefined)

      await monitoringService.logUserAction('test-action', { key: 'value' })

      expect(mockElectronAPI.monitoring.logUserAction).toHaveBeenCalledWith(
        'test-action',
        undefined,
        {
          key: 'value',
          sessionAge: expect.any(Number)
        }
      )
    })

    it('should log user action with user context', async () => {
      mockElectronAPI.monitoring.logUserAction.mockResolvedValue(undefined)
      monitoringService.setUser('user-456')

      await monitoringService.logUserAction('another-action', { data: 'test' })

      expect(mockElectronAPI.monitoring.logUserAction).toHaveBeenCalledWith(
        'another-action',
        'user-456',
        {
          data: 'test',
          sessionAge: expect.any(Number)
        }
      )
    })

    it('should log user action with duration', async () => {
      mockElectronAPI.monitoring.logUserAction.mockResolvedValue(undefined)
      const startTime = Date.now() - 1000

      await monitoringService.logUserAction('timed-action', {}, startTime)

      expect(mockElectronAPI.monitoring.logUserAction).toHaveBeenCalledWith(
        'timed-action',
        undefined,
        expect.objectContaining({
          duration: expect.any(Number),
          sessionAge: expect.any(Number)
        })
      )
    })

    it('should handle logging errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockElectronAPI.monitoring.logUserAction.mockRejectedValue(new Error('Logging failed'))

      await monitoringService.logUserAction('test-action')

      expect(consoleSpy).toHaveBeenCalledWith('Failed to log user action:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('logPerformanceEvent', () => {
    it('should log performance event', async () => {
      mockElectronAPI.monitoring.logPerformanceEvent.mockResolvedValue(undefined)

      await monitoringService.logPerformanceEvent('test-event', 250, { context: 'test' })

      expect(mockElectronAPI.monitoring.logPerformanceEvent).toHaveBeenCalledWith(
        'test-event',
        250,
        {
          context: 'test',
          userId: undefined,
          sessionAge: expect.any(Number)
        }
      )
    })

    it('should include user context when set', async () => {
      mockElectronAPI.monitoring.logPerformanceEvent.mockResolvedValue(undefined)
      monitoringService.setUser('user-789')

      await monitoringService.logPerformanceEvent('test-event', 150)

      expect(mockElectronAPI.monitoring.logPerformanceEvent).toHaveBeenCalledWith(
        'test-event',
        150,
        expect.objectContaining({
          userId: 'user-789'
        })
      )
    })
  })

  describe('timeFunction', () => {
    it('should time successful function execution', async () => {
      mockElectronAPI.monitoring.logPerformanceEvent.mockResolvedValue(undefined)
      const testFunction = jest.fn().mockResolvedValue('test-result')

      const result = await monitoringService.timeFunction('test-fn', testFunction, { param: 'value' })

      expect(result).toBe('test-result')
      expect(testFunction).toHaveBeenCalled()
      expect(mockElectronAPI.monitoring.logPerformanceEvent).toHaveBeenCalledWith(
        'test-fn',
        expect.any(Number),
        {
          param: 'value',
          success: true
        }
      )
    })

    it('should time failed function execution', async () => {
      mockElectronAPI.monitoring.logPerformanceEvent.mockResolvedValue(undefined)
      const testError = new Error('Test error')
      const testFunction = jest.fn().mockRejectedValue(testError)

      await expect(monitoringService.timeFunction('test-fn', testFunction)).rejects.toThrow('Test error')

      expect(mockElectronAPI.monitoring.logPerformanceEvent).toHaveBeenCalledWith(
        'test-fn',
        expect.any(Number),
        {
          success: false,
          error: 'Test error'
        }
      )
    })
  })

  describe('createTimer', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should create a timer that can be ended', async () => {
      mockElectronAPI.monitoring.logPerformanceEvent.mockResolvedValue(undefined)
      const timer = monitoringService.createTimer('test-timer', { context: 'test' })

      jest.advanceTimersByTime(1000)
      const duration = await timer.end()

      expect(duration).toBe(1000)
      expect(mockElectronAPI.monitoring.logPerformanceEvent).toHaveBeenCalledWith(
        'test-timer',
        1000,
        {
          context: 'test'
        }
      )
    })

    it('should create a timer that can record laps', async () => {
      mockElectronAPI.monitoring.logPerformanceEvent.mockResolvedValue(undefined)
      const timer = monitoringService.createTimer('test-timer')

      jest.advanceTimersByTime(500)
      const lapDuration = await timer.lap('first_lap')

      expect(lapDuration).toBe(500)
      expect(mockElectronAPI.monitoring.logPerformanceEvent).toHaveBeenCalledWith(
        'test-timer_first_lap',
        500,
        {
          type: 'lap'
        }
      )
    })
  })

  describe('trackApiCall', () => {
    it('should track API call performance', async () => {
      mockElectronAPI.monitoring.logPerformanceEvent.mockResolvedValue(undefined)
      const apiCall = jest.fn().mockResolvedValue('api-result')

      const result = await monitoringService.trackApiCall('test-api', apiCall, { endpoint: '/test' })

      expect(result).toBe('api-result')
      expect(apiCall).toHaveBeenCalled()
      expect(mockElectronAPI.monitoring.logPerformanceEvent).toHaveBeenCalledWith(
        'api_call_test-api',
        expect.any(Number),
        {
          type: 'api_call',
          apiName: 'test-api',
          endpoint: '/test'
        }
      )
    })
  })

  describe('trackDbOperation', () => {
    it('should track database operation performance', async () => {
      mockElectronAPI.monitoring.logPerformanceEvent.mockResolvedValue(undefined)
      const dbOperation = jest.fn().mockResolvedValue(['item1', 'item2'])

      const result = await monitoringService.trackDbOperation('select', dbOperation, { table: 'products' })

      expect(result).toEqual(['item1', 'item2'])
      expect(dbOperation).toHaveBeenCalled()
      expect(mockElectronAPI.monitoring.logPerformanceEvent).toHaveBeenCalledWith(
        'db_operation_select',
        expect.any(Number),
        {
          type: 'db_operation',
          operation: 'select',
          table: 'products'
        }
      )
    })
  })

  describe('logFeatureUsage', () => {
    it('should log feature usage', async () => {
      mockElectronAPI.monitoring.logUserAction.mockResolvedValue(undefined)

      await monitoringService.logFeatureUsage('search', { query: 'test' })

      expect(mockElectronAPI.monitoring.logUserAction).toHaveBeenCalledWith(
        'feature_usage_search',
        {
          type: 'feature_usage',
          feature: 'search',
          query: 'test',
          sessionAge: expect.any(Number)
        }
      )
    })
  })

  describe('getSessionStats', () => {
    it('should return session statistics', () => {
      const stats = monitoringService.getSessionStats()

      expect(stats).toEqual({
        sessionDuration: expect.any(Number),
        sessionAge: expect.any(Number)
      })
      expect(stats.sessionDuration).toBeGreaterThan(0)
    })
  })

  describe('useMonitoring hook', () => {
    it('should provide monitoring functions', () => {
      const hook = useMonitoring()

      expect(typeof hook.logUserAction).toBe('function')
      expect(typeof hook.logPerformanceEvent).toBe('function')
      expect(typeof hook.timeFunction).toBe('function')
      expect(typeof hook.createTimer).toBe('function')
      expect(typeof hook.trackApiCall).toBe('function')
      expect(typeof hook.trackDbOperation).toBe('function')
      expect(typeof hook.logFeatureUsage).toBe('function')
      expect(typeof hook.logError).toBe('function')
      expect(typeof hook.setUser).toBe('function')
      expect(typeof hook.getConfig).toBe('function')
      expect(typeof hook.getHealthStatus).toBe('function')
      expect(typeof hook.getErrorStats).toBe('function')
      expect(typeof hook.getPerformanceMetrics).toBe('function')
      expect(typeof hook.exportLogs).toBe('function')
      expect(typeof hook.getSessionStats).toBe('function')
    })
  })
})