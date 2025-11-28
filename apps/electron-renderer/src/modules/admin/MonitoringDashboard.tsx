/**
 * Monitoring Dashboard Component
 *
 * Provides administrative interface for monitoring system management,
 * including error tracking, performance metrics, and feature flag control
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert, AlertDescription } from '../../components/ui/Alert'

interface MonitoringConfig {
  isProduction: boolean
  featureFlags: Record<string, any>
  logLevel: string
  hasRemoteLogging: boolean
  hasPerformanceMonitoring: boolean
}

interface SystemInfo {
  platform: string
  arch: string
  nodeVersion: string
  electronVersion: string
  chromeVersion: string
  appVersion: string
  uptime: number
  memoryUsage: any
  cpuUsage: any
}

interface HealthStatus {
  status: 'healthy' | 'warning' | 'error'
  details: {
    memory: { heapUsed: number; heapTotal: number }
    errorCount: number
    uptime: number
  }
}

export const MonitoringDashboard: React.FC = () => {
  const [config, setConfig] = useState<MonitoringConfig | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [errorStats, setErrorStats] = useState<Record<string, number>>({})
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load monitoring data
  const loadMonitoringData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [configData, systemData, healthData, errorData, performanceData] = await Promise.all([
        window.electronAPI.monitoring.getConfig(),
        window.electronAPI.monitoring.getSystemInfo(),
        window.electronAPI.monitoring.healthCheck(),
        window.electronAPI.monitoring.getErrorStats(),
        window.electronAPI.monitoring.getPerformanceMetrics()
      ])

      setConfig(configData.data)
      setSystemInfo(systemData.data)
      setHealthStatus(healthData.data)
      setErrorStats(errorData.data)
      setPerformanceMetrics(performanceData.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading monitoring data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMonitoringData()

    // Refresh data every 30 seconds
    const interval = setInterval(loadMonitoringData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Toggle monitoring feature
  const toggleMonitoringFeature = async (feature: 'performanceMonitoring' | 'remoteLogging', enabled: boolean) => {
    try {
      await window.electronAPI.monitoring.toggleFeature(feature, enabled)
      await loadMonitoringData() // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error toggling feature')
    }
  }

  // Export logs
  const exportLogs = async () => {
    try {
      const logs = await window.electronAPI.monitoring.exportLogs()

      // Create a blob and download the logs
      const blob = new Blob([logs.data], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `app-logs-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error exporting logs')
    }
  }

  // Clear error statistics
  const clearErrorStats = async () => {
    try {
      await window.electronAPI.monitoring.clearErrorStats()
      await loadMonitoringData() // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error clearing error stats')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading monitoring data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!config || !systemInfo || !healthStatus) {
    return (
      <Alert>
        <AlertDescription>No monitoring data available</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
        <div className="space-x-2">
          <Button onClick={loadMonitoringData} variant="outline">
            Refresh
          </Button>
          <Button onClick={exportLogs} variant="outline">
            Export Logs
          </Button>
        </div>
      </div>

      {/* Health Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            System Health
            <Badge variant={
              healthStatus.status === 'healthy' ? 'default' :
              healthStatus.status === 'warning' ? 'secondary' : 'destructive'
            }>
              {healthStatus.status.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Overall system health status based on memory usage and error count
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Memory Usage</div>
              <div className="text-lg font-semibold">
                {healthStatus.details.memory.heapUsed}MB / {healthStatus.details.memory.heapTotal}MB
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Error Count</div>
              <div className="text-lg font-semibold">{healthStatus.details.errorCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Uptime</div>
              <div className="text-lg font-semibold">{Math.floor(healthStatus.details.uptime / 60)}m</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Configuration</CardTitle>
          <CardDescription>
            Current monitoring settings and feature flags
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Remote Logging</div>
                <div className="text-sm text-gray-500">Send logs to remote server</div>
              </div>
              <Button
                variant={config.hasRemoteLogging ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMonitoringFeature('remoteLogging', !config.hasRemoteLogging)}
              >
                {config.hasRemoteLogging ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Performance Monitoring</div>
                <div className="text-sm text-gray-500">Track performance metrics</div>
              </div>
              <Button
                variant={config.hasPerformanceMonitoring ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMonitoringFeature('performanceMonitoring', !config.hasPerformanceMonitoring)}
              >
                {config.hasPerformanceMonitoring ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Technical details about the application environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Platform</div>
              <div className="font-medium">{systemInfo.platform} ({systemInfo.arch})</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">App Version</div>
              <div className="font-medium">{systemInfo.appVersion}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Electron Version</div>
              <div className="font-medium">{systemInfo.electronVersion}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Node Version</div>
              <div className="font-medium">{systemInfo.nodeVersion}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Error Statistics
            <Button onClick={clearErrorStats} variant="outline" size="sm">
              Clear Stats
            </Button>
          </CardTitle>
          <CardDescription>
            Application error tracking and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(errorStats).length === 0 ? (
            <div className="text-center text-gray-500 py-4">No errors recorded</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(errorStats).map(([error, count]) => (
                <div key={error} className="flex justify-between items-center">
                  <div className="text-sm font-mono truncate flex-1 mr-2">{error}</div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics Card */}
      {performanceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Application startup and performance data
          </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Total Startup Time</div>
                <div className="text-lg font-semibold">{performanceMetrics.startupTime}ms</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Database Connection</div>
                  <div className="font-semibold">{performanceMetrics.dbConnectionTime}ms</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Window Creation</div>
                  <div className="font-semibold">{performanceMetrics.windowCreationTime}ms</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}