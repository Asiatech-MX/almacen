// Feature Flags System for Gradual Rollout
// This allows enabling/disabling features dynamically based on user settings, environment, or remote configuration

export interface FeatureFlags {
  // Dynamic Reference Data System (DRDS) - Issue #8
  dynamicReferenceData: {
    enabled: boolean;
    rolloutPercentage: number; // 0-100
    allowAdminOverride: boolean;
    migrationCompleted: boolean;
  };

  // Monitoring and Telemetry Features
  remoteLogging: {
    enabled: boolean;
    rolloutPercentage: number; // 0-100
    allowAdminOverride: boolean;
  };

  performanceMonitoring: {
    enabled: boolean;
    rolloutPercentage: number; // 0-100
    allowAdminOverride: boolean;
  };

  // Advanced Analytics (placeholder for future implementation)
  advancedAnalytics: {
    enabled: boolean;
    rolloutPercentage: number; // 0-100
    allowAdminOverride: boolean;
  };

  // Experimental UI Features (placeholder for future implementation)
  experimentalUI: {
    enabled: boolean;
    rolloutPercentage: number; // 0-100
    allowAdminOverride: boolean;
  };
}

export type FeatureFlagName = keyof FeatureFlags;

export class FeatureFlagsService {
  private static instance: FeatureFlagsService;
  private flags: FeatureFlags;
  private isProduction: boolean;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.flags = this.getDefaultFlags();
    this.loadFlags();
  }

  static getInstance(): FeatureFlagsService {
    if (!FeatureFlagsService.instance) {
      FeatureFlagsService.instance = new FeatureFlagsService();
    }
    return FeatureFlagsService.instance;
  }

  private getDefaultFlags(): FeatureFlags {
    return {
      dynamicReferenceData: {
        enabled: !this.isProduction, // Enable by default in development
        rolloutPercentage: this.isProduction ? 10 : 100, // 10% rollout in production
        allowAdminOverride: true,
        migrationCompleted: false
      },
      remoteLogging: {
        enabled: false, // Disable by default for privacy
        rolloutPercentage: this.isProduction ? 0 : 20, // Only in development initially
        allowAdminOverride: true
      },
      performanceMonitoring: {
        enabled: !this.isProduction, // Enable in development
        rolloutPercentage: this.isProduction ? 30 : 100, // 30% rollout in production
        allowAdminOverride: true
      },
      advancedAnalytics: {
        enabled: false, // Future feature
        rolloutPercentage: 0, // Not rolled out yet
        allowAdminOverride: true
      },
      experimentalUI: {
        enabled: false, // Future feature
        rolloutPercentage: 0, // Not rolled out yet
        allowAdminOverride: true
      }
    };
  }

  private loadFlags(): void {
    try {
      // Load from environment variables
      if (process.env.FEATURE_DYNAMIC_REFERENCE_DATA === 'true') {
        this.flags.dynamicReferenceData.enabled = true;
      } else if (process.env.FEATURE_DYNAMIC_REFERENCE_DATA === 'false') {
        this.flags.dynamicReferenceData.enabled = false;
      }

      if (process.env.FEATURE_DYNAMIC_REFERENCE_DATA_ROLLOUT) {
        const rollout = parseInt(process.env.FEATURE_DYNAMIC_REFERENCE_DATA_ROLLOUT, 10);
        if (!isNaN(rollout) && rollout >= 0 && rollout <= 100) {
          this.flags.dynamicReferenceData.rolloutPercentage = rollout;
        }
      }

      // Load from config file if it exists
      try {
        const fs = require('fs');
        const path = require('path');
        const configPath = path.join(process.cwd(), 'feature-flags.json');

        if (fs.existsSync(configPath)) {
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          this.flags = { ...this.flags, ...configData };
        }
      } catch (configError) {
        console.warn('Could not load feature flags config file:', configError);
      }

    } catch (error) {
      console.error('Error loading feature flags:', error);
      // Fall back to defaults
      this.flags = this.getDefaultFlags();
    }
  }

  public isEnabled(feature: FeatureFlagName, userId?: string): boolean {
    const flag = this.flags[feature];

    if (!flag || typeof flag !== 'object' || !('enabled' in flag)) {
      return false;
    }

    // Always enabled if admin override is allowed and we're in development
    if (flag.allowAdminOverride && !this.isProduction) {
      return true;
    }

    // Check if explicitly disabled
    if (flag.enabled === false) {
      return false;
    }

    // Check rollout percentage
    if ('rolloutPercentage' in flag && typeof flag.rolloutPercentage === 'number') {
      if (flag.rolloutPercentage >= 100) {
        return true;
      } else if (flag.rolloutPercentage <= 0) {
        return false;
      } else if (userId) {
        // Use consistent hash for user-based rollout
        const hash = this.hashUserId(userId);
        return (hash % 100) < flag.rolloutPercentage;
      }
    }

    // Default to enabled flag value
    return flag.enabled === true;
  }

  public getFeatureFlag<T extends FeatureFlagName>(feature: T): FeatureFlags[T] {
    return this.flags[feature];
  }

  public updateFlag(feature: FeatureFlagName, updates: Partial<FeatureFlags[FeatureFlagName]>): void {
    this.flags[feature] = { ...this.flags[feature], ...updates };
    this.saveFlags();
  }

  public setRolloutPercentage(feature: FeatureFlagName, percentage: number): void {
    const flag = this.flags[feature];
    if (flag && typeof flag === 'object' && 'rolloutPercentage' in flag) {
      this.updateFlag(feature, { rolloutPercentage: Math.max(0, Math.min(100, percentage)) } as any);
    }
  }

  public enableFeature(feature: FeatureFlagName): void {
    const flag = this.flags[feature];
    if (flag && typeof flag === 'object' && 'enabled' in flag) {
      this.updateFlag(feature, { enabled: true } as any);
    }
  }

  public disableFeature(feature: FeatureFlagName): void {
    const flag = this.flags[feature];
    if (flag && typeof flag === 'object' && 'enabled' in flag) {
      this.updateFlag(feature, { enabled: false } as any);
    }
  }

  public completeMigration(feature: FeatureFlagName): void {
    const flag = this.flags[feature];
    if (flag && typeof flag === 'object' && 'migrationCompleted' in flag) {
      this.updateFlag(feature, { migrationCompleted: true } as any);
    }
  }

  public getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private saveFlags(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(process.cwd(), 'feature-flags.json');

      fs.writeFileSync(configPath, JSON.stringify(this.flags, null, 2));
      console.log('Feature flags saved to:', configPath);
    } catch (error) {
      console.error('Error saving feature flags:', error);
    }
  }

  // Remote configuration support
  public async loadRemoteConfig(configUrl?: string): Promise<void> {
    try {
      // This could be extended to load from a remote API
      // For now, we'll simulate remote config loading
      if (this.isProduction && configUrl) {
        console.log('Loading remote feature flags configuration...');
        // In a real implementation, this would fetch from an API
        // const response = await fetch(configUrl);
        // const remoteFlags = await response.json();
        // this.flags = { ...this.flags, ...remoteFlags };
        // this.saveFlags();
      }
    } catch (error) {
      console.error('Error loading remote configuration:', error);
    }
  }
}

// Export singleton instance
export const featureFlags = FeatureFlagsService.getInstance();