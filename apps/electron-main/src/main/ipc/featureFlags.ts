import { ipcMain } from 'electron'
import { featureFlags } from '../featureFlags'

export const setupFeatureFlagsHandlers = () => {
  // Check if a feature is enabled for a user
  ipcMain.handle('featureFlags:isEnabled', (_, feature: string, userId?: string) => {
    try {
      const isEnabled = featureFlags.isEnabled(feature as any, userId)
      return { success: true, data: isEnabled }
    } catch (error) {
      console.error('Error checking feature flag:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get specific feature flag configuration
  ipcMain.handle('featureFlags:getFlag', (_, feature: string) => {
    try {
      const flag = featureFlags.getFeatureFlag(feature as any)
      return { success: true, data: flag }
    } catch (error) {
      console.error('Error getting feature flag:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get all feature flags
  ipcMain.handle('featureFlags:getAllFlags', () => {
    try {
      const allFlags = featureFlags.getAllFlags()
      return { success: true, data: allFlags }
    } catch (error) {
      console.error('Error getting all feature flags:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Enable a feature (admin operation)
  ipcMain.handle('featureFlags:enableFeature', (_, feature: string) => {
    try {
      featureFlags.enableFeature(feature as any)
      return { success: true, data: true }
    } catch (error) {
      console.error('Error enabling feature:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Disable a feature (admin operation)
  ipcMain.handle('featureFlags:disableFeature', (_, feature: string) => {
    try {
      featureFlags.disableFeature(feature as any)
      return { success: true, data: true }
    } catch (error) {
      console.error('Error disabling feature:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Set rollout percentage for a feature
  ipcMain.handle('featureFlags:setRolloutPercentage', (_, feature: string, percentage: number) => {
    try {
      featureFlags.setRolloutPercentage(feature as any, percentage)
      return { success: true, data: true }
    } catch (error) {
      console.error('Error setting rollout percentage:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Mark migration as completed for a feature
  ipcMain.handle('featureFlags:completeMigration', (_, feature: string) => {
    try {
      featureFlags.completeMigration(feature as any)
      return { success: true, data: true }
    } catch (error) {
      console.error('Error completing migration:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Load remote configuration
  ipcMain.handle('featureFlags:loadRemoteConfig', async (_, configUrl?: string) => {
    try {
      await featureFlags.loadRemoteConfig(configUrl)
      return { success: true, data: true }
    } catch (error) {
      console.error('Error loading remote configuration:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Log feature flag usage for analytics
  ipcMain.handle('featureFlags:logUsage', (_, feature: string, userId?: string, context?: any) => {
    try {
      const timestamp = new Date().toISOString()
      console.log(`Feature Flag Usage - ${feature}:`, {
        userId,
        context,
        timestamp,
        enabled: featureFlags.isEnabled(feature as any, userId)
      })
      return { success: true, data: true }
    } catch (error) {
      console.error('Error logging feature flag usage:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get rollout statistics for a feature
  ipcMain.handle('featureFlags:getRolloutStats', (_, feature: string) => {
    try {
      const flag = featureFlags.getFeatureFlag(feature as any)
      if (flag && typeof flag === 'object' && 'rolloutPercentage' in flag) {
        return {
          success: true,
          data: {
            rolloutPercentage: flag.rolloutPercentage,
            enabled: flag.enabled,
            migrationCompleted: flag.migrationCompleted,
            allowAdminOverride: flag.allowAdminOverride
          }
        }
      }
      return { success: false, error: 'Feature flag not found or invalid' }
    } catch (error) {
      console.error('Error getting rollout stats:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  console.log('✅ Feature flags handlers registered')
}