/**
 * Phase 3 Migration Monitor
 *
 * Este script monitorea el progreso de la migración gradual en la Fase 3,
 * proporciona métricas en tiempo real y permite ajustar dinámicamente
 * los feature flags para controlar el rollout.
 */

import { featureFlagManager, defaultFeatureFlags } from '../config/featureFlags';
import { MateriaPrismaHybridRepository } from '../repositories/hybrid/materiaPrisma.hybrid';
import { ProveedoresHybridRepository } from '../repositories/hybrid/proveedores.hybrid';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { DB } from '../types/generated/database.types';

export interface MigrationMetrics {
  timestamp: Date;
  phase: 'Phase3';
  domain: string;
  totalRequests: number;
  kyselyRequests: number;
  pgTypedRequests: number;
  kyselyPercentage: number;
  errorCount: number;
  fallbackCount: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  warnings: string[];
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface RolloutPlan {
  domain: string;
  currentPercentage: number;
  nextPercentage: number;
  triggerConditions: {
    minSuccessRate: number;
    maxErrorRate: number;
    minRequestCount: number;
    observationWindow: number; // minutes
  };
  schedule?: {
    percentage: number;
    at: Date;
  }[];
}

export class Phase3MigrationMonitor {
  private metrics: Map<string, MigrationMetrics[]> = new Map();
  private rolloutPlans: Map<string, RolloutPlan> = new Map();
  private kyselyDb: Kysely<DB>;
  private pgTypedDb: any; // Simulación - en producción sería la instancia real de PGTyped

  constructor(
    private dbConnection: {
      kysely: Kysely<DB>;
      pgTyped: any;
    }
  ) {
    this.kyselyDb = dbConnection.kysely;
    this.pgTypedDb = dbConnection.pgTyped;

    // Inicializar planes de rollout
    this.initializeRolloutPlans();

    // Configurar listeners de feature flags
    this.setupFeatureFlagListeners();

    // Iniciar monitoreo
    this.startMonitoring();
  }

  /**
   * Inicializa los planes de rollout para cada dominio
   */
  private initializeRolloutPlans(): void {
    // Plan para Materia Prima (dominio de mayor riesgo)
    this.rolloutPlans.set('materiaPrima', {
      domain: 'materiaPrima',
      currentPercentage: 5,
      nextPercentage: 10,
      triggerConditions: {
        minSuccessRate: 99.5,
        maxErrorRate: 0.5,
        minRequestCount: 100,
        observationWindow: 30 // 30 minutos
      },
      schedule: [
        { percentage: 10, at: new Date(Date.now() + 2 * 60 * 60 * 1000) }, // +2 horas
        { percentage: 25, at: new Date(Date.now() + 6 * 60 * 60 * 1000) }, // +6 horas
        { percentage: 50, at: new Date(Date.now() + 24 * 60 * 60 * 1000) }, // +24 horas
        { percentage: 75, at: new Date(Date.now() + 48 * 60 * 60 * 1000) }, // +48 horas
        { percentage: 100, at: new Date(Date.now() + 72 * 60 * 60 * 1000) } // +72 horas
      ]
    });

    // Plan para Proveedores (dominio de menor riesgo)
    this.rolloutPlans.set('proveedores', {
      domain: 'proveedores',
      currentPercentage: 3,
      nextPercentage: 10,
      triggerConditions: {
        minSuccessRate: 99.0,
        maxErrorRate: 1.0,
        minRequestCount: 50,
        observationWindow: 20 // 20 minutos
      },
      schedule: [
        { percentage: 10, at: new Date(Date.now() + 1 * 60 * 60 * 1000) }, // +1 hora
        { percentage: 25, at: new Date(Date.now() + 4 * 60 * 60 * 1000) }, // +4 horas
        { percentage: 50, at: new Date(Date.now() + 12 * 60 * 60 * 1000) }, // +12 horas
        { percentage: 100, at: new Date(Date.now() + 24 * 60 * 60 * 1000) } // +24 horas
      ]
    });
  }

  /**
   * Configura listeners para cambios en feature flags
   */
  private setupFeatureFlagListeners(): void {
    // Listener para cambios en materiaPrimaKysely
    featureFlagManager.subscribe('materiaPrimaKysely', (flag) => {
      console.log(`🔄 materiaPrimaKysely updated: ${flag.enabled ? flag.percentage + '%' : 'disabled'}`);
      this.logMetric('materiaPrima', {
        timestamp: new Date(),
        phase: 'Phase3',
        domain: 'materiaPrima',
        totalRequests: 0,
        kyselyRequests: 0,
        pgTypedRequests: 0,
        kyselyPercentage: flag.percentage || 0,
        errorCount: 0,
        fallbackCount: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        warnings: [`Feature flag updated to ${flag.percentage || 0}%`],
        status: 'HEALTHY'
      });
    });

    // Listener para cambios en proveedoresKysely
    featureFlagManager.subscribe('proveedoresKysely', (flag) => {
      console.log(`🔄 proveedoresKysely updated: ${flag.enabled ? flag.percentage + '%' : 'disabled'}`);
      this.logMetric('proveedores', {
        timestamp: new Date(),
        phase: 'Phase3',
        domain: 'proveedores',
        totalRequests: 0,
        kyselyRequests: 0,
        pgTypedRequests: 0,
        kyselyPercentage: flag.percentage || 0,
        errorCount: 0,
        fallbackCount: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        warnings: [`Feature flag updated to ${flag.percentage || 0}%`],
        status: 'HEALTHY'
      });
    });
  }

  /**
   * Inicia el monitoreo activo
   */
  private startMonitoring(): void {
    console.log('🚀 Phase 3 Migration Monitor Started');

    // Monitoreo cada 30 segundos
    setInterval(() => {
      this.collectMetrics();
      this.checkRolloutConditions();
      this.generateHealthReport();
    }, 30000);

    // Monitoreo de scheduled rollouts cada 5 minutos
    setInterval(() => {
      this.checkScheduledRollouts();
    }, 300000);
  }

  /**
   * Recolecta métricas de los repositorios híbridos
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Métricas de Materia Prima
      await this.collectDomainMetrics('materiaPrima');

      // Métricas de Proveedores
      await this.collectDomainMetrics('proveedores');

    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  /**
   * Recolecta métricas para un dominio específico
   */
  private async collectDomainMetrics(domain: string): Promise<void> {
    const startTime = performance.now();

    try {
      let repository: any;
      let testContext = {
        requestId: `monitor-${Date.now()}`,
        monitoring: true
      };

      switch (domain) {
        case 'materiaPrima':
          repository = new MateriaPrismaHybridRepository(this.kyselyDb, this.pgTypedDb);
          break;
        case 'proveedores':
          repository = new ProveedoresHybridRepository(this.kyselyDb, this.pgTypedDb);
          break;
        default:
          return;
      }

      // Ejecutar operaciones de prueba para recolectar métricas
      const operations = [];

      if (domain === 'materiaPrima') {
        operations.push(
          repository.findAll(testContext),
          repository.findById('test-id', testContext)
        );
      } else if (domain === 'proveedores') {
        operations.push(
          repository.findAll(testContext),
          repository.search('test', 5, testContext)
        );
      }

      const results = await Promise.allSettled(operations);

      let kyselyCount = 0;
      let errorCount = 0;
      let fallbackCount = 0;
      let totalTime = 0;
      const warnings: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const res = result.value;
          if (res.usedKysely) kyselyCount++;
          totalTime += res.performanceMetrics.executionTime;

          if (res.validationWarnings) {
            warnings.push(...res.validationWarnings);
          }
        } else {
          errorCount++;
          console.warn(`Operation ${index} failed for ${domain}:`, result.reason);
        }
      });

      const executionTime = performance.now() - startTime;
      const kyselyPercentage = operations.length > 0 ? (kyselyCount / operations.length) * 100 : 0;

      this.logMetric(domain, {
        timestamp: new Date(),
        phase: 'Phase3',
        domain,
        totalRequests: operations.length,
        kyselyRequests: kyselyCount,
        pgTypedRequests: operations.length - kyselyCount,
        kyselyPercentage,
        errorCount,
        fallbackCount,
        averageResponseTime: totalTime / Math.max(operations.length, 1),
        p95ResponseTime: executionTime,
        warnings,
        status: errorCount > 0 ? 'WARNING' : 'HEALTHY'
      });

    } catch (error) {
      console.error(`Error collecting metrics for ${domain}:`, error);

      this.logMetric(domain, {
        timestamp: new Date(),
        phase: 'Phase3',
        domain,
        totalRequests: 0,
        kyselyRequests: 0,
        pgTypedRequests: 0,
        kyselyPercentage: 0,
        errorCount: 1,
        fallbackCount: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        warnings: [`Metric collection failed: ${error}`],
        status: 'CRITICAL'
      });
    }
  }

  /**
   * Verifica si se cumplen las condiciones para aumentar el rollout
   */
  private checkRolloutConditions(): void {
    const now = new Date();

    for (const [domain, plan] of this.rolloutPlans) {
      const domainMetrics = this.metrics.get(domain) || [];

      // Filtrar métricas de la ventana de observación
      const windowStart = new Date(now.getTime() - plan.triggerConditions.observationWindow * 60 * 1000);
      const recentMetrics = domainMetrics.filter(m => m.timestamp >= windowStart);

      if (recentMetrics.length < plan.triggerConditions.minRequestCount) {
        continue; // No hay suficientes requests para evaluar
      }

      // Calcular métricas agregadas
      const totalRequests = recentMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
      const totalErrors = recentMetrics.reduce((sum, m) => sum + m.errorCount, 0);
      const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
      const successRate = 100 - errorRate;

      // Verificar condiciones
      const conditionsMet =
        successRate >= plan.triggerConditions.minSuccessRate &&
        errorRate <= plan.triggerConditions.maxErrorRate;

      if (conditionsMet && plan.currentPercentage < plan.nextPercentage) {
        console.log(`✅ Rollup conditions met for ${domain}. Increasing from ${plan.currentPercentage}% to ${plan.nextPercentage}%`);

        // Aumentar feature flag
        const flagName = `${domain}Kysely` as any;
        featureFlagManager.setFlag(flagName, { percentage: plan.nextPercentage });

        // Actualizar plan
        plan.currentPercentage = plan.nextPercentage;
        plan.nextPercentage = Math.min(100, plan.nextPercentage + 25);
      }
    }
  }

  /**
   * Verifica rollouts programados por tiempo
   */
  private checkScheduledRollouts(): void {
    const now = new Date();

    for (const [domain, plan] of this.rolloutPlans) {
      if (!plan.schedule) continue;

      for (const scheduled of plan.schedule) {
        if (scheduled.at <= now && plan.currentPercentage < scheduled.percentage) {
          console.log(`⏰ Scheduled rollout for ${domain}. Increasing to ${scheduled.percentage}%`);

          const flagName = `${domain}Kysely` as any;
          featureFlagManager.setFlag(flagName, { percentage: scheduled.percentage });

          plan.currentPercentage = scheduled.percentage;
        }
      }
    }
  }

  /**
   * Genera reporte de salud general
   */
  private generateHealthReport(): void {
    const now = new Date();
    let overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';

    console.log('\n📊 Phase 3 Migration Health Report');
    console.log('=====================================');

    for (const [domain, plan] of this.rolloutPlans) {
      const domainMetrics = this.metrics.get(domain) || [];
      const latestMetric = domainMetrics[domainMetrics.length - 1];

      if (latestMetric) {
        const status = latestMetric.status;
        if (status === 'CRITICAL') overallStatus = 'CRITICAL';
        else if (status === 'WARNING' && overallStatus === 'HEALTHY') overallStatus = 'WARNING';

        console.log(`\n${domain.toUpperCase()}:`);
        console.log(`  Status: ${status}`);
        console.log(`  Rollout: ${plan.currentPercentage}%`);
        console.log(`  Success Rate: ${100 - latestMetric.errorCount}%`);
        console.log(`  Avg Response Time: ${latestMetric.averageResponseTime.toFixed(2)}ms`);

        if (latestMetric.warnings.length > 0) {
          console.log(`  Warnings: ${latestMetric.warnings.length}`);
        }
      }
    }

    console.log(`\nOverall Status: ${overallStatus}`);
    console.log(`Timestamp: ${now.toISOString()}`);
    console.log('=====================================\n');
  }

  /**
   * Registra una métrica
   */
  private logMetric(domain: string, metric: MigrationMetrics): void {
    const domainMetrics = this.metrics.get(domain) || [];
    domainMetrics.push(metric);

    // Mantener solo las últimas 100 métricas por dominio
    if (domainMetrics.length > 100) {
      domainMetrics.shift();
    }

    this.metrics.set(domain, domainMetrics);
  }

  /**
   * Obtiene métricas actuales de un dominio
   */
  public getDomainMetrics(domain: string): MigrationMetrics[] {
    return this.metrics.get(domain) || [];
  }

  /**
   * Obtiene el plan de rollout de un dominio
   */
  public getRolloutPlan(domain: string): RolloutPlan | undefined {
    return this.rolloutPlans.get(domain);
  }

  /**
   * Ejecuta rollback de emergencia
   */
  public emergencyRollback(): void {
    console.log('🚨 EMERGENCY ROLLBACK INITIATED');
    featureFlagManager.emergencyRollback();

    // Resetear planes de rollout
    for (const plan of this.rolloutPlans.values()) {
      plan.currentPercentage = 0;
      plan.nextPercentage = 0;
    }

    console.log('✅ Emergency rollback completed');
  }

  /**
   * Aumenta manualmente el porcentaje de rollout
   */
  public manualRolloutIncrease(domain: string, percentage: number): void {
    const flagName = `${domain}Kysely` as any;
    featureFlagManager.setFlag(flagName, { percentage });

    const plan = this.rolloutPlans.get(domain);
    if (plan) {
      plan.currentPercentage = percentage;
      plan.nextPercentage = Math.min(100, percentage + 25);
    }

    console.log(`🔧 Manual rollout: ${domain} increased to ${percentage}%`);
  }

  /**
   * Exporta métricas para análisis externo
   */
  public exportMetrics(): {
    timestamp: Date;
    domains: {
      [domain: string]: {
        metrics: MigrationMetrics[];
        rolloutPlan: RolloutPlan;
      };
    };
  } {
    const result: any = {
      timestamp: new Date(),
      domains: {}
    };

    for (const [domain, plan] of this.rolloutPlans) {
      result.domains[domain] = {
        metrics: this.metrics.get(domain) || [],
        rolloutPlan: plan
      };
    }

    return result;
  }
}

export default Phase3MigrationMonitor;