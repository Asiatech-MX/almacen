/**
 * Tests for Monitoring IPC Handlers
 */

import { ipcMain } from 'electron'
import { setupMonitoringHandlers } from '../monitoring'

// Mock dependencies
jest.mock('../../monitoring', () => ({
  monitoring: {
    getErrorStats: jest.fn(),
    getPerformanceMetrics: jest.fn(),
    exportLogs: jest.fn(),
    healthCheck: jest.fn(),
    logUserAction: jest.fn(),
    logPerformanceEvent: jest.fn()
  }
}))

jest.mock('../../featureFlags', () => ({
  featureFlags: {
    getAllFlags: jest.fn(),
    isEnabled: jest.fn(),
    enableFeature: jest.fn(),
    disableFeature: jest.fn()
  }
}))

describe('Monitoring IPC Handlers', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  describe('setupMonitoringHandlers', () => {
    it('should register all monitoring handlers', () => {
      setupMonitoringHandlers()

      // Verify that handlers are registered by checking if they exist
      expect(ipcMain.listenerCount('monitoring:getErrorStats')).toBe(1)
      expect(ipcMain.listenerCount('monitoring:getPerformanceMetrics')).toBe(1)
      expect(ipcMain.listenerCount('monitoring:exportLogs')).toBe(1)
      expect(ipcMain.listenerCount('monitoring:healthCheck')).toBe(1)
      expect(ipcMain.listenerCount('monitoring:logUserAction')).toBe(1)
      expect(ipcMain.listenerCount('monitoring:logPerformanceEvent')).toBe(1)
      expect(ipcMain.listenerCount('monitoring:getConfig')).toBe(1)
      expect(ipcMain.listenerCount('monitoring:getSystemInfo')).toBe(1)
      expect(ipcMain.listenerCount('monitoring:clearErrorStats')).toBe(1)
      expect(ipcMain.listenerCount('monitoring:toggleFeature')).toBe(1)
    })
  })

  describe('monitoring:getErrorStats handler', () => {
    beforeEach(() => {
      setupMonitoringHandlers()
    })

    it('should return error statistics successfully', async () => {
      const mockErrorStats = { 'Error:Test Error': 3, 'Error:Another Error': 1 }
      const { monitoring } = require('../../monitoring')
      monitoring.getErrorStats.mockResolvedValue(mockErrorStats)

      // Mock IPC call
      const handlers = (ipcMain as any)._events['monitoring:getErrorStats']
      const mockEvent = { sender: {} }
      const result = await handlers(mockEvent)

      expect(result).toEqual({
        success: true,
        data: mockErrorStats
      })
      expect(monitoring.getErrorStats).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      const { monitoring } = require('../../monitoring')
      monitoring.getErrorStats.mockRejectedValue(new Error('Test error'))

      const handlers = (ipcMain as any)._events['monitoring:getErrorStats']
      const mockEvent = { sender: {} }
      const result = await handlers(mockEvent)

      expect(result).toEqual({
        success: false,
        error: 'Test error'
      })
    })
  })

  describe('monitoring:healthCheck handler', () => {
    beforeEach(() => {
      setupMonitoringHandlers()
    })

    it('should return health status successfully', async () => {
      const mockHealth = {
        status: 'healthy' as const,
        details: {
          memory: { heapUsed: 150, heapTotal: 200 },
          errorCount: 0,
          uptime: 3600
        }
      }
      const { monitoring } = require('../../monitoring')
      monitoring.healthCheck.mockResolvedValue(mockHealth)

      const handlers = (ipcMain as any)._events['monitoring:healthCheck']
      const mockEvent = { sender: {} }
      const result = await handlers(mockEvent)

      expect(result).toEqual({
        success: true,
        data: mockHealth
      })
    })
  })

  describe('monitoring:logUserAction handler', () => {
    beforeEach(() => {
      setupMonitoringHandlers()
    })

    it('should log user action successfully', async () => {
      const { monitoring } = require('../../monitoring')
      monitoring.logUserAction.mockResolvedValue(undefined)

      const handlers = (ipcMain as any)._events['monitoring:logUserAction']
      const mockEvent = { sender: {} }
      const result = await handlers(mockEvent, 'test_action', 'user123', { context: 'test' })

      expect(result).toEqual({
        success: true
      })
      expect(monitoring.logUserAction).toHaveBeenCalledWith('test_action', 'user123', { context: 'test' })
    })
  })

  describe('monitoring:toggleFeature handler', () => {
    beforeEach(() => {
      setupMonitoringHandlers()
    })

    it('should enable monitoring feature successfully', async () => {
      const { featureFlags } = require('../../featureFlags')
      featureFlags.enableFeature.mockReturnValue(undefined)

      const handlers = (ipcMain as any)._events['monitoring:toggleFeature']
      const mockEvent = { sender: {} }
      const result = await handlers(mockEvent, 'performanceMonitoring', true)

      expect(result).toEqual({
        success: true
      })
      expect(featureFlags.enableFeature).toHaveBeenCalledWith('performanceMonitoring')
    })

    it('should disable monitoring feature successfully', async () => {
      const { featureFlags } = require('../../featureFlags')
      featureFlags.disableFeature.mockReturnValue(undefined)

      const handlers = (ipcMain as any)._events['monitoring:toggleFeature']
      const mockEvent = { sender: {} }
      const result = await handlers(mockEvent, 'remoteLogging', false)

      expect(result).toEqual({
        success: true
      })
      expect(featureFlags.disableFeature).toHaveBeenCalledWith('remoteLogging')
    })
  })
})