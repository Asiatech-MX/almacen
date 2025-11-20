/**
 * Feature Flags Configuration
 * Phase 2.5: Feature Flags Implementation
 *
 * Este sistema permite activar/desactivar gradualmente las funcionalidades de Kysely
 * durante el proceso de migración, con capacidad de rollback instantáneo.
 */

export interface FeatureFlagConfig {
  enabled: boolean;
  percentage?: number; // Para rollout gradual (0-100)
  rolloutStrategy?: 'user-based' | 'request-based' | 'time-based';
  conditions?: Record<string, any>;
  metadata?: {
    description: string;
    owner: string;
    createdAt: Date;
    lastModified: Date;
  };
}

export interface FeatureFlags {
  // Feature flags principales para la migración
  kyselyEnabled: FeatureFlagConfig;

  // Flags por dominio
  materiaPrimaKysely: FeatureFlagConfig;
  proveedoresKysely: FeatureFlagConfig;
  solicitudesKysely: FeatureFlagConfig;
  movimientosKysely: FeatureFlagConfig;
  usuariosKysely: FeatureFlagConfig;

  // Flags por tipo de operación
  readOperationsKysely: FeatureFlagConfig;
  writeOperationsKysely: FeatureFlagConfig;

  // Flags específicos para validación
  comparativeModeEnabled: FeatureFlagConfig;
  performanceMonitoringEnabled: FeatureFlagConfig;
  typeValidationEnabled: FeatureFlagConfig;

  // Flags de seguridad
  rollbackModeEnabled: FeatureFlagConfig;
  auditModeEnabled: FeatureFlagConfig;
}

// Configuración inicial de feature flags
export const defaultFeatureFlags: FeatureFlags = {
  // 🔧 Estado actual: Fase 2 - Implementación Paralela
  kyselyEnabled: {
    enabled: true,
    percentage: 0, // Comenzar con 0% y aumentar gradualmente
    rolloutStrategy: 'request-based',
    metadata: {
      description: 'Habilita Kysely como motor de base de datos primario',
      owner: 'Migration Team',
      createdAt: new Date('2025-11-20'),
      lastModified: new Date('2025-11-20')
    }
  },

  materiaPrimaKysely: {
    enabled: true, // 🚀 Fase 3: Iniciar migración gradual
    percentage: 5, // Comenzar con 5% de tráfico
    rolloutStrategy: 'request-based',
    metadata: {
      description: 'Migración del dominio Materia Prima a Kysely - Fase 3 Iniciada',
      owner: 'Migration Team',
      createdAt: new Date('2025-11-20'),
      lastModified: new Date('2025-11-20')
    }
  },

  proveedoresKysely: {
    enabled: true, // 🚀 Fase 3: Iniciar migración del segundo dominio
    percentage: 3, // Comenzar con 3% de tráfico (más bajo que materiaPrima)
    rolloutStrategy: 'request-based',
    metadata: {
      description: 'Migración del dominio Proveedores a Kysely - Fase 3 Iniciada',
      owner: 'Migration Team',
      createdAt: new Date('2025-11-20'),
      lastModified: new Date('2025-11-20')
    }
  },

  solicitudesKysely: {
    enabled: false,
    percentage: 0,
    rolloutStrategy: 'request-based',
    metadata: {
      description: 'Migración del dominio Solicitudes a Kysely',
      owner: 'Migration Team',
      createdAt: new Date('2025-11-20'),
      lastModified: new Date('2025-11-20')
    }
  },

  movimientosKysely: {
    enabled: false,
    percentage: 0,
    rolloutStrategy: 'request-based',
    metadata: {
      description: 'Migración del dominio Movimientos a Kysely',
      owner: 'Migration Team',
      createdAt: new Date('2025-11-20'),
      lastModified: new Date('2025-11-20')
    }
  },

  usuariosKysely: {
    enabled: false,
    percentage: 0,
    rolloutStrategy: 'request-based',
    metadata: {
      description: 'Migración del dominio Usuarios a Kysely',
      owner: 'Migration Team',
      createdAt: new Date('2025-11-20'),
      lastModified: new Date('2025-11-20')
    }
  },

  // 🔄 Operaciones - Control fino sobre tipos de queries
  readOperationsKysely: {
    enabled: true, // 🚀 Fase 3: Activar operaciones de lectura
    percentage: 10, // 10% más alto que materiaPrima para pruebas
    rolloutStrategy: 'request-based',
    metadata: {
      description: 'Habilita operaciones de lectura con Kysely - Fase 3',
      owner: 'Migration Team',
      createdAt: new Date('2025-11-20'),
      lastModified: new Date('2025-11-20')
    }
  },

  writeOperationsKysely: {
    enabled: false, // Habilitar después de validar lecturas
    percentage: 0,
    rolloutStrategy: 'request-based',
    metadata: {
      description: 'Habilita operaciones de escritura con Kysely',
      owner: 'Migration Team',
      createdAt: new Date('2025-11-20'),
      lastModified: new Date('2025-11-20')
    }
  },

  // 🔍 Modos de validación
  comparativeModeEnabled: {
    enabled: true, // ✅ Activado durante Fase 2 para validación
    metadata: {
      description: 'Ejecuta ambas implementaciones y compara resultados',
      owner: 'Migration Team',
      createdAt: new Date('2025-11-20'),
      lastModified: new Date('2025-11-20')
    }
  },

  performanceMonitoringEnabled: {
    enabled: true, // ✅ Activado para monitoreo de rendimiento
    metadata: {
      description: 'Monitorea performance de Kysely vs PGTyped',
      owner: 'Migration Team',
      createdAt: new Date('2025-11-20'),
      lastModified: new Date('2025-11-20')
    }
  },

  typeValidationEnabled: {
    enabled: true, // ✅ Activado para validar consistencia de tipos
    metadata: {
      description: 'Valida consistencia de tipos entre PGTyped y Kysely',
      owner: 'Migration Team',
      createdAt: new Date('2025-11-20'),
      lastModified: new Date('2025-11-20')
    }
  },

  // 🛡️ Flags de seguridad
  rollbackModeEnabled: {
    enabled: true, // ✅ Siempre activado para seguridad
    metadata: {
      description: 'Permite rollback instantáneo a PGTyped',
      owner: 'Migration Team',
      createdAt: new Date('2025-11-20'),
      lastModified: new Date('2025-11-20')
    }
  },

  auditModeEnabled: {
    enabled: true, // ✅ Activado para auditoría de migración
    metadata: {
      description: 'Audita todas las operaciones durante migración',
      owner: 'Migration Team',
      createdAt: new Date('2025-11-20'),
      lastModified: new Date('2025-11-20')
    }
  }
};

/**
 * Gestor de Feature Flags con runtime switching
 */
export class FeatureFlagManager {
  private flags: FeatureFlags;
  private listeners: Map<string, ((value: FeatureFlagConfig) => void)[]> = new Map();

  constructor(initialFlags: FeatureFlags = defaultFeatureFlags) {
    this.flags = { ...initialFlags };
  }

  /**
   * Verifica si un feature flag está activado
   */
  isEnabled(flagName: keyof FeatureFlags, context?: any): boolean {
    const flag = this.flags[flagName];

    if (!flag.enabled) {
      return false;
    }

    // Si hay porcentaje definido, aplicar rollout strategy
    if (flag.percentage !== undefined && flag.percentage < 100) {
      return this.shouldExecuteForPercentage(flag, context);
    }

    return true;
  }

  /**
   * Obtiene el valor actual de un feature flag
   */
  getFlag(flagName: keyof FeatureFlags): FeatureFlagConfig {
    return { ...this.flags[flagName] };
  }

  /**
   * Actualiza un feature flag
   */
  setFlag(flagName: keyof FeatureFlags, config: Partial<FeatureFlagConfig>): void {
    const currentFlag = this.flags[flagName];
    const updatedFlag = {
      ...currentFlag,
      ...config,
      metadata: {
        ...currentFlag.metadata,
        ...config.metadata,
        lastModified: new Date()
      }
    };

    this.flags[flagName] = updatedFlag;

    // Notificar listeners
    const listeners = this.listeners.get(flagName) || [];
    listeners.forEach(listener => listener(updatedFlag));
  }

  /**
   * Habilita un feature flag
   */
  enable(flagName: keyof FeatureFlags, percentage: number = 100): void {
    this.setFlag(flagName, { enabled: true, percentage });
  }

  /**
   * Deshabilita un feature flag
   */
  disable(flagName: keyof FeatureFlags): void {
    this.setFlag(flagName, { enabled: false, percentage: 0 });
  }

  /**
   * Incrementa gradualmente el porcentaje de un feature flag
   */
  incrementPercentage(flagName: keyof FeatureFlags, increment: number = 10): void {
    const currentFlag = this.flags[flagName];
    const newPercentage = Math.min(100, (currentFlag.percentage || 0) + increment);
    this.setFlag(flagName, { percentage: newPercentage });
  }

  /**
   * Registra un listener para cambios en un feature flag
   */
  subscribe(
    flagName: keyof FeatureFlags,
    listener: (value: FeatureFlagConfig) => void
  ): () => void {
    const listeners = this.listeners.get(flagName) || [];
    listeners.push(listener);
    this.listeners.set(flagName, listeners);

    // Retornar función de unsuscripción
    return () => {
      const currentListeners = this.listeners.get(flagName) || [];
      const index = currentListeners.indexOf(listener);
      if (index > -1) {
        currentListeners.splice(index, 1);
        this.listeners.set(flagName, currentListeners);
      }
    };
  }

  /**
   * Obtiene todos los flags para debugging
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Ejecuta rollback completo a PGTyped
   */
  emergencyRollback(): void {
    // Deshabilitar todos los flags de Kysely
    const kyselyFlags = [
      'kyselyEnabled',
      'materiaPrimaKysely',
      'proveedoresKysely',
      'solicitudesKysely',
      'movimientosKysely',
      'usuariosKysely',
      'readOperationsKysely',
      'writeOperationsKysely'
    ] as const;

    kyselyFlags.forEach(flagName => {
      this.disable(flagName);
    });

    console.warn('🚨 EMERGENCY ROLLBACK: All Kysely features disabled');
  }

  /**
   * Determina si una solicitud debe ejecutarse basado en porcentaje
   */
  private shouldExecuteForPercentage(
    flag: FeatureFlagConfig,
    context?: any
  ): boolean {
    if (!flag.percentage || flag.percentage >= 100) {
      return true;
    }

    if (flag.percentage <= 0) {
      return false;
    }

    switch (flag.rolloutStrategy) {
      case 'request-based':
        // Usar hash del request ID o timestamp para consistencia
        const requestId = context?.requestId || Date.now().toString();
        const hash = this.simpleHash(requestId);
        return (hash % 100) < flag.percentage;

      case 'user-based':
        // Usar ID de usuario para consistencia
        const userId = context?.userId || 'anonymous';
        const userHash = this.simpleHash(userId);
        return (userHash % 100) < flag.percentage;

      case 'time-based':
        // Basado en ventanas de tiempo
        const now = Date.now();
        const windowMs = 60000; // 1 minuto
        const timeHash = Math.floor(now / windowMs);
        return (timeHash % 100) < flag.percentage;

      default:
        return Math.random() * 100 < flag.percentage;
    }
  }

  /**
   * Simple hash function para consistencia
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Instancia global del gestor de feature flags
export const featureFlagManager = new FeatureFlagManager();

// Exportar funciones de conveniencia
export const isKyselyEnabled = (domain?: string, context?: any): boolean => {
  if (!featureFlagManager.isEnabled('kyselyEnabled', context)) {
    return false;
  }

  if (domain) {
    const domainFlag = `${domain}Kysely` as keyof FeatureFlags;
    return featureFlagManager.isEnabled(domainFlag, context);
  }

  return true;
};

export const isComparativeModeEnabled = (context?: any): boolean => {
  return featureFlagManager.isEnabled('comparativeModeEnabled', context);
};

export const isPerformanceMonitoringEnabled = (context?: any): boolean => {
  return featureFlagManager.isEnabled('performanceMonitoringEnabled', context);
};

export const isTypeValidationEnabled = (context?: any): boolean => {
  return featureFlagManager.isEnabled('typeValidationEnabled', context);
};

export const isRollbackModeEnabled = (context?: any): boolean => {
  return featureFlagManager.isEnabled('rollbackModeEnabled', context);
};