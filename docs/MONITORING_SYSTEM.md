# Monitoring System Documentation

This document describes the comprehensive monitoring and logging system implemented for the Electron application using electron-log and custom telemetry features.

## Overview

The monitoring system provides:

- **Error Tracking**: Automatic capture of unhandled errors and promise rejections
- **Performance Monitoring**: Application startup time, operation timing, and resource usage
- **User Action Logging**: Track user interactions for analytics and debugging
- **Health Monitoring**: System health checks with memory usage and error statistics
- **Remote Logging**: Optional remote logging for production environments
- **Feature Flags Integration**: Gradual rollout of monitoring features

## Architecture

### Main Process Components

#### 1. Monitoring Service (`apps/electron-main/src/main/monitoring.ts`)

Core monitoring service that handles:
- Error collection and categorization
- Performance metrics collection
- Log management with rotation
- Health status monitoring
- Feature flag integration

```typescript
import { monitoring } from './monitoring'

// Record startup metrics
monitoring.recordStartupMetric('dbConnectionTime', 150)

// Log user actions
monitoring.logUserAction('material_created', 'user123', { materialId: '123' })

// Track performance
monitoring.logPerformanceEvent('database_query', 45, { operation: 'SELECT' })
```

#### 2. IPC Handlers (`apps/electron-main/src/main/ipc/monitoring.ts`)

Provides IPC communication for monitoring functionality:
- Error statistics retrieval
- Performance metrics access
- Health check functionality
- Configuration management

### Renderer Process Components

#### 1. Monitoring Service (`apps/electron-renderer/src/services/monitoringService.ts`)

Client-side service for monitoring functionality:
- User action logging
- Performance timing
- Component render tracking
- API call monitoring

```typescript
import { useMonitoring } from '../services/monitoringService'

const { logUserAction, timeFunction, trackApiCall } = useMonitoring()

// Log user action
await logUserAction('button_clicked', { button: 'save' })

// Time a function
const result = await timeFunction('data_processing', async () => {
  return await processData(data)
})

// Track API call
const materials = await trackApiCall('get_materials', () =>
  window.electronAPI.materiaPrima.listar()
)
```

#### 2. Admin Dashboard (`apps/electron-renderer/src/modules/admin/MonitoringDashboard.tsx`)

Administrative interface for:
- System health monitoring
- Error statistics viewing
- Feature flag management
- Log export functionality

## Feature Flags Integration

The monitoring system integrates with the feature flags system for gradual rollout:

### Available Monitoring Features

1. **`remoteLogging`**
   - Sends logs to remote server for production monitoring
   - Default: Disabled (privacy-focused)
   - Production rollout: 0%

2. **`performanceMonitoring`**
   - Collects performance metrics and timing data
   - Default: Enabled in development, 30% rollout in production
   - Includes: startup times, operation timing, memory usage

3. **`advancedAnalytics`**
   - Future: Advanced user analytics and behavior tracking
   - Default: Disabled
   - Production rollout: 0%

4. **`experimentalUI`**
   - Future: Experimental UI monitoring features
   - Default: Disabled
   - Production rollout: 0%

### Configuration

Feature flags are configured in `feature-flags.json`:

```json
{
  "performanceMonitoring": {
    "enabled": true,
    "rolloutPercentage": 30,
    "allowAdminOverride": true
  },
  "remoteLogging": {
    "enabled": false,
    "rolloutPercentage": 0,
    "allowAdminOverride": true
  }
}
```

## Error Handling

### Automatic Error Capture

The system automatically captures:
- Unhandled exceptions in main and renderer processes
- Unhandled promise rejections
- Critical Electron events (process crashes, GPU errors)

### Error Categories

Errors are automatically categorized and tracked:
- Error name and message grouping
- Process type (main/renderer)
- Timestamp and frequency counting
- User context when available

### Error Reporting

In production environments, users can opt-in to report errors:
- Automatic error dialogs with stack traces
- Optional GitHub issue creation
- Context information (system specs, feature flags)

## Performance Monitoring

### Metrics Collected

1. **Startup Metrics**
   - Total application startup time
   - Database connection time
   - Window creation time
   - IPC setup time

2. **Runtime Metrics**
   - Memory usage (heap, external, RSS)
   - CPU usage
   - Operation timing
   - Component render times

3. **User Interaction Metrics**
   - Action timing and frequency
   - Feature usage statistics
   - Navigation patterns

### Performance Thresholds

Automatic alerts are triggered for:
- Memory usage > 500MB
- Operations taking > 5 seconds
- Repeated errors (every 5th occurrence)

## Health Monitoring

### Health Status Indicators

- **Healthy**: Normal operation
- **Warning**: High resource usage or moderate error count
- **Error**: Critical resource usage or high error frequency

### Health Check API

```typescript
const health = await window.electronAPI.monitoring.healthCheck()
// Returns: { status: 'healthy' | 'warning' | 'error', details: {...} }
```

## Logging Configuration

### Environment-based Configuration

**Development:**
- Console logging enabled
- Debug level file logging
- IPC transport for renderer logs
- 1MB log file rotation

**Production:**
- Console logging disabled
- Warning level file logging
- 10MB log file rotation
- Optional remote logging

### Log Locations

- **Development**: `<electron-default-dir>/logs/app-dev.log`
- **Production**: `<user-data-dir>/logs/app.log`

### Log Format

```
[2024-01-15 14:30:45.123] [warn] [browser] Database connection failed
```

## Usage Examples

### React Component with Monitoring

```tsx
import React, { useEffect } from 'react'
import { useMonitoring } from '../services/monitoringService'

const MaterialList: React.FC = () => {
  const { trackComponentRender, logUserAction, trackApiCall } = useMonitoring()

  useEffect(() => {
    const timer = trackComponentRender('MaterialList')
    timer.mount()
    return () => timer.update()
  }, [])

  const handleMaterialClick = async (materialId: string) => {
    await logUserAction('material_selected', { materialId })

    const materials = await trackApiCall('get_material_details', () =>
      window.electronAPI.materiaPrima.obtener(materialId)
    )

    // Process materials...
  }

  return (
    // Component JSX
  )
}
```

### API Service with Monitoring

```typescript
import { monitoringService } from '../services/monitoringService'

export class MaterialService {
  async createMaterial(data: NewMaterial): Promise<Material> {
    return monitoringService.trackDbOperation('create_material', async () => {
      const result = await window.electronAPI.materiaPrima.crear(data)
      await monitoringService.logUserAction('material_created', undefined, {
        materialId: result.id,
        materialName: result.nombre
      })
      return result
    })
  }

  async searchMaterials(query: string): Promise<Material[]> {
    const timer = monitoringService.createTimer('material_search', { query })

    try {
      const results = await window.electronAPI.materiaPrima.buscar(query)
      await timer.end({ resultCount: results.length })
      return results
    } catch (error) {
      await timer.end({ error: error.message })
      throw error
    }
  }
}
```

## Admin Dashboard Usage

### Accessing the Dashboard

The monitoring dashboard can be accessed by importing the component:

```tsx
import { MonitoringDashboard } from '../modules/admin/MonitoringDashboard'

// In your admin route
<Route path="/admin/monitoring" component={MonitoringDashboard} />
```

### Dashboard Features

1. **System Health**: Real-time health status with memory and error metrics
2. **Configuration**: Enable/disable monitoring features
3. **Error Statistics**: View error frequency and patterns
4. **Performance Metrics**: Application startup and performance data
5. **System Information**: Environment and version details
6. **Log Export**: Download application logs for debugging

## Testing

### Main Process Tests

```bash
# Run monitoring IPC handler tests
npm test apps/electron-main/src/main/ipc/__tests__/monitoring.test.ts
```

### Renderer Process Tests

```bash
# Run monitoring service tests
npm test apps/electron-renderer/src/services/__tests__/monitoringService.test.ts
```

## Security and Privacy

### Data Collection

- No personal data is collected without explicit consent
- Remote logging is disabled by default
- User actions are logged anonymously
- Error reports can be opted out of

### Data Storage

- Logs are stored locally on user machines
- Log files are automatically rotated to prevent disk space issues
- Sensitive information is filtered from logs automatically

## Troubleshooting

### Common Issues

1. **Logs not appearing**
   - Check log levels and feature flag configuration
   - Verify IPC handlers are properly registered
   - Check file permissions for log directory

2. **High memory usage alerts**
   - Monitor for memory leaks in components
   - Check if large datasets are being retained
   - Verify cleanup in component unmounting

3. **Error reporting not working**
   - Verify GitHub repository configuration
   - Check network connectivity
   - Ensure user has granted permission for error reporting

### Debug Mode

Enable comprehensive logging for debugging:

```typescript
// Enable all monitoring features
await window.electronAPI.monitoring.toggleFeature('performanceMonitoring', true)
await window.electronAPI.monitoring.toggleFeature('remoteLogging', true)

// Export current logs
const logs = await window.electronAPI.monitoring.exportLogs()
```

## Future Enhancements

1. **Advanced Analytics**: User behavior tracking and funnel analysis
2. **Performance Profiling**: CPU and memory profiling integration
3. **Real-time Monitoring**: WebSocket-based real-time monitoring dashboard
4. **Integration with External Services**: Sentry, LogRocket, etc.
5. **Custom Metrics**: Application-specific metric collection
6. **Alerting System**: Automated alerts for critical issues