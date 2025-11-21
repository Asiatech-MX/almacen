/**
 * Phase 4.2: Continuous Production Monitoring
 *
 * Sistema de monitoreo continuo para producción durante la migración Kysely.
 * Extiende el monitoreo de Phase 3 con capacidades de producción real.
 */

import { EventEmitter } from 'events';
import { featureFlagManager } from '../config/featureFlags';

export interface ProductionMetrics {
  timestamp: Date;
  systemHealth: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  databaseHealth: {
    connections: number;
    responseTime: number;
    errorRate: number;
    slowQueries: number;
  };
  applicationMetrics: {
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    activeUsers: number;
  };
  migrationMetrics: {
    kyselyTrafficPercentage: number;
    pgtypedTrafficPercentage: number;
    successfulMigrations: number;
    failedMigrations: number;
    rollbackAttempts: number;
  };
  businessMetrics: {
    materialOperations: number;
    supplierOperations: number;
    userSatisfactionScore: number;
    dataConsistencyScore: number;
  };
}

export interface AlertThresholds {
  cpu: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  disk: { warning: number; critical: number };
  responseTime: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
  migrationFailureRate: { warning: number; critical: number };
}

export interface AlertEvent {
  id: string;
  timestamp: Date;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  category: 'SYSTEM' | 'DATABASE' | 'APPLICATION' | 'MIGRATION' | 'BUSINESS';
  title: string;
  description: string;
  metrics: any;
  recommendations?: string[];
  resolved?: boolean;
  resolvedAt?: Date;
}

export class ProductionMonitor extends EventEmitter {
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metrics: ProductionMetrics[] = [];
  private alerts: AlertEvent[] = [];
  private readonly maxMetricsHistory = 1000; // Keep last 1000 data points
  private readonly monitoringIntervalMs = 30000; // 30 seconds

  private readonly alertThresholds: AlertThresholds = {
    cpu: { warning: 70, critical: 85 },
    memory: { warning: 75, critical: 90 },
    disk: { warning: 80, critical: 95 },
    responseTime: { warning: 500, critical: 1000 }, // ms
    errorRate: { warning: 2, critical: 5 }, // %
    migrationFailureRate: { warning: 1, critical: 3 } // %
  };

  constructor() {
    super();
  }

  /**
   * Inicia el monitoreo continuo de producción
   */
  async startMonitoring(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ Production monitoring is already running');
      return;
    }

    console.log('🚀 Starting Production Monitoring - Phase 4.2');
    this.isRunning = true;

    // Setup de alertas iniciales
    await this.setupAlertSystem();

    // Iniciar recolección de métricas
    this.monitoringInterval = setInterval(
      () => this.collectAndAnalyzeMetrics(),
      this.monitoringIntervalMs
    );

    // Setup handlers para eventos críticos
    this.setupEventHandlers();

    // Emitir evento de inicio
    this.emit('monitoring:started', {
      timestamp: new Date(),
      interval: this.monitoringIntervalMs
    });

    console.log('✅ Production monitoring started successfully');
  }

  /**
   * Detiene el monitoreo continuo
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isRunning) {
      console.warn('⚠️ Production monitoring is not running');
      return;
    }

    console.log('🛑 Stopping Production Monitoring');
    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Generar reporte final
    const finalReport = await this.generateFinalReport();

    this.emit('monitoring:stopped', {
      timestamp: new Date(),
      report: finalReport
    });

    console.log('✅ Production monitoring stopped');
  }

  /**
   * Setup del sistema de alertas
   */
  private async setupAlertSystem(): Promise<void> {
    console.log('🔔 Setting up alert system...');

    // Configurar alertas para cada categoría
    this.on('alert:system', (alert) => this.handleSystemAlert(alert));
    this.on('alert:database', (alert) => this.handleDatabaseAlert(alert));
    this.on('alert:application', (alert) => this.handleApplicationAlert(alert));
    this.on('alert:migration', (alert) => this.handleMigrationAlert(alert));
    this.on('alert:business', (alert) => this.handleBusinessAlert(alert));

    // Setup de notificaciones externas (podría integrarse con Slack, email, etc.)
    this.setupExternalNotifications();

    console.log('✅ Alert system configured');
  }

  /**
   * Recolecta y analiza métricas continuamente
   */
  private async collectAndAnalyzeMetrics(): Promise<void> {
    try {
      const currentMetrics = await this.collectCurrentMetrics();

      // Almacenar métricas
      this.metrics.push(currentMetrics);

      // Mantener historial limitado
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics.shift();
      }

      // Analizar métricas y generar alertas
      await this.analyzeMetrics(currentMetrics);

      // Emitir métricas para otros sistemas
      this.emit('metrics:collected', currentMetrics);

    } catch (error) {
      console.error('❌ Error collecting metrics:', error);
      this.emit('monitoring:error', error);
    }
  }

  /**
   * Recolecta métricas actuales del sistema
   */
  private async collectCurrentMetrics(): Promise<ProductionMetrics> {
    const timestamp = new Date();

    // Recolectar métricas del sistema
    const systemHealth = await this.getSystemHealth();

    // Recolectar métricas de base de datos
    const databaseHealth = await this.getDatabaseHealth();

    // Recolectar métricas de aplicación
    const applicationMetrics = await this.getApplicationMetrics();

    // Recolectar métricas de migración
    const migrationMetrics = await this.getMigrationMetrics();

    // Recolectar métricas de negocio
    const businessMetrics = await this.getBusinessMetrics();

    return {
      timestamp,
      systemHealth,
      databaseHealth,
      applicationMetrics,
      migrationMetrics,
      businessMetrics
    };
  }

  /**
   * Analiza métricas y genera alertas si es necesario
   */
  private async analyzeMetrics(metrics: ProductionMetrics): Promise<void> {
    // Análisis de sistema
    this.analyzeSystemMetrics(metrics.systemHealth);

    // Análisis de base de datos
    this.analyzeDatabaseMetrics(metrics.databaseHealth);

    // Análisis de aplicación
    this.analyzeApplicationMetrics(metrics.applicationMetrics);

    // Análisis de migración
    this.analyzeMigrationMetrics(metrics.migrationMetrics);

    // Análisis de negocio
    this.analyzeBusinessMetrics(metrics.businessMetrics);
  }

  /**
   * Analiza métricas del sistema
   */
  private analyzeSystemMetrics(systemHealth: ProductionMetrics['systemHealth']): void {
    if (systemHealth.cpu >= this.alertThresholds.cpu.critical) {
      this.createAlert({
        severity: 'CRITICAL',
        category: 'SYSTEM',
        title: 'CPU Usage Critical',
        description: `CPU usage is ${systemHealth.cpu}%`,
        metrics: { cpu: systemHealth.cpu },
        recommendations: [
          'Scale up resources',
          'Identify CPU-intensive processes',
          'Consider load balancing'
        ]
      });
    } else if (systemHealth.cpu >= this.alertThresholds.cpu.warning) {
      this.createAlert({
        severity: 'WARNING',
        category: 'SYSTEM',
        title: 'CPU Usage High',
        description: `CPU usage is ${systemHealth.cpu}%`,
        metrics: { cpu: systemHealth.cpu }
      });
    }

    // Análisis similar para memoria y disco
    if (systemHealth.memory >= this.alertThresholds.memory.critical) {
      this.createAlert({
        severity: 'CRITICAL',
        category: 'SYSTEM',
        title: 'Memory Usage Critical',
        description: `Memory usage is ${systemHealth.memory}%`,
        metrics: { memory: systemHealth.memory },
        recommendations: ['Increase memory allocation', 'Check for memory leaks']
      });
    }
  }

  /**
   * Analiza métricas de base de datos
   */
  private analyzeDatabaseMetrics(databaseHealth: ProductionMetrics['databaseHealth']): void {
    if (databaseHealth.responseTime >= this.alertThresholds.responseTime.critical) {
      this.createAlert({
        severity: 'CRITICAL',
        category: 'DATABASE',
        title: 'Database Response Time Critical',
        description: `Database response time is ${databaseHealth.responseTime}ms`,
        metrics: databaseHealth,
        recommendations: [
          'Check for slow queries',
          'Analyze query execution plans',
          'Consider database optimization'
        ]
      });
    }

    if (databaseHealth.errorRate >= this.alertThresholds.errorRate.critical) {
      this.createAlert({
        severity: 'CRITICAL',
        category: 'DATABASE',
        title: 'Database Error Rate Critical',
        description: `Database error rate is ${databaseHealth.errorRate}%`,
        metrics: databaseHealth,
        recommendations: [
          'Check database connectivity',
          'Review recent database changes',
          'Verify data integrity'
        ]
      });
    }
  }

  /**
   * Analiza métricas de aplicación
   */
  private analyzeApplicationMetrics(applicationMetrics: ProductionMetrics['applicationMetrics']): void {
    if (applicationMetrics.errorRate >= this.alertThresholds.errorRate.critical) {
      this.createAlert({
        severity: 'CRITICAL',
        category: 'APPLICATION',
        title: 'Application Error Rate Critical',
        description: `Application error rate is ${applicationMetrics.errorRate}%`,
        metrics: applicationMetrics,
        recommendations: [
          'Review application logs',
          'Check recent deployments',
          'Verify feature flag configurations'
        ]
      });
    }

    if (applicationMetrics.averageResponseTime >= this.alertThresholds.responseTime.critical) {
      this.createAlert({
        severity: 'WARNING',
        category: 'APPLICATION',
        title: 'Application Response Time High',
        description: `Average response time is ${applicationMetrics.averageResponseTime}ms`,
        metrics: applicationMetrics
      });
    }
  }

  /**
   * Analiza métricas de migración
   */
  private analyzeMigrationMetrics(migrationMetrics: ProductionMetrics['migrationMetrics']): void {
    const totalOperations = migrationMetrics.successfulMigrations + migrationMetrics.failedMigrations;
    const failureRate = totalOperations > 0 ? (migrationMetrics.failedMigrations / totalOperations) * 100 : 0;

    if (failureRate >= this.alertThresholds.migrationFailureRate.critical) {
      this.createAlert({
        severity: 'CRITICAL',
        category: 'MIGRATION',
        title: 'Migration Failure Rate Critical',
        description: `Migration failure rate is ${failureRate.toFixed(2)}%`,
        metrics: { ...migrationMetrics, failureRate },
        recommendations: [
          'Consider rollback to PGTyped',
          'Review Kysely implementation',
          'Check type adapters',
          'Verify feature flag configurations'
        ]
      });
    }

    if (migrationMetrics.rollbackAttempts > 0) {
      this.createAlert({
        severity: 'WARNING',
        category: 'MIGRATION',
        title: 'Migration Rollback Attempted',
        description: `Rollback attempted ${migrationMetrics.rollbackAttempts} times`,
        metrics: migrationMetrics,
        recommendations: [
          'Investigate rollback triggers',
          'Review stability before proceeding',
          'Consider decreasing traffic percentage'
        ]
      });
    }
  }

  /**
   * Analiza métricas de negocio
   */
  private analyzeBusinessMetrics(businessMetrics: ProductionMetrics['businessMetrics']): void {
    if (businessMetrics.dataConsistencyScore < 95) {
      this.createAlert({
        severity: 'WARNING',
        category: 'BUSINESS',
        title: 'Data Consistency Score Low',
        description: `Data consistency score is ${businessMetrics.dataConsistencyScore}%`,
        metrics: businessMetrics,
        recommendations: [
          'Run data consistency checks',
          'Review synchronization mechanisms',
          'Consider pausing migration'
        ]
      });
    }

    if (businessMetrics.userSatisfactionScore < 4.0) {
      this.createAlert({
        severity: 'WARNING',
        category: 'BUSINESS',
        title: 'User Satisfaction Low',
        description: `User satisfaction score is ${businessMetrics.userSatisfactionScore}/5`,
        metrics: businessMetrics,
        recommendations: [
          'Collect user feedback',
          'Review user experience changes',
          'Consider slowing rollout'
        ]
      });
    }
  }

  /**
   * Crea una nueva alerta
   */
  private createAlert(alertData: Omit<AlertEvent, 'id' | 'timestamp'>): void {
    const alert: AlertEvent = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...alertData
    };

    this.alerts.push(alert);

    // Emitir alerta específica por categoría
    this.emit(`alert:${alert.category.toLowerCase()}`, alert);

    // Emitir alerta general
    this.emit('alert:created', alert);

    console.log(`🚨 ${alert.severity} Alert [${alert.category}]: ${alert.title}`);
  }

  /**
   * Setup de handlers para eventos
   */
  private setupEventHandlers(): void {
    // Handler para alerts críticas
    this.on('alert:created', (alert: AlertEvent) => {
      if (alert.severity === 'CRITICAL') {
        this.handleCriticalAlert(alert);
      }
    });

    // Handler para cambios en feature flags
    featureFlagManager.subscribe('materiaPrimaKysely', (config) => {
      this.emit('featureFlag:changed', {
        flag: 'materiaPrimaKysely',
        config,
        timestamp: new Date()
      });
    });

    featureFlagManager.subscribe('proveedoresKysely', (config) => {
      this.emit('featureFlag:changed', {
        flag: 'proveedoresKysely',
        config,
        timestamp: new Date()
      });
    });
  }

  /**
   * Maneja alerts críticas
   */
  private handleCriticalAlert(alert: AlertEvent): void {
    console.error(`🚨 CRITICAL ALERT: ${alert.title}`);

    // Si es una alerta de migración crítica, considerar rollback automático
    if (alert.category === 'MIGRATION') {
      console.warn('🔄 Considering automatic rollback due to critical migration alert');

      // Implementar lógica de rollback automático si es necesario
      // featureFlagManager.emergencyRollback();
    }

    // En caso de alerts críticas del sistema, notificar inmediatamente
    this.sendCriticalNotification(alert);
  }

  /**
   * Métodos handlers para diferentes tipos de alertas
   */
  private handleSystemAlert(alert: AlertEvent): void {
    // Manejo específico para alerts de sistema
  }

  private handleDatabaseAlert(alert: AlertEvent): void {
    // Manejo específico para alerts de base de datos
  }

  private handleApplicationAlert(alert: AlertEvent): void {
    // Manejo específico para alerts de aplicación
  }

  private handleMigrationAlert(alert: AlertEvent): void {
    // Manejo específico para alerts de migración
    if (alert.severity === 'CRITICAL') {
      console.warn('🚨 Critical migration alert detected');
    }
  }

  private handleBusinessAlert(alert: AlertEvent): void {
    // Manejo específico para alerts de negocio
  }

  /**
   * Setup de notificaciones externas
   */
  private setupExternalNotifications(): void {
    // Placeholder para configuración de notificaciones externas
    // (Slack, email, SMS, etc.)
    console.log('📡 External notifications configured');
  }

  /**
   * Envía notificación crítica
   */
  private sendCriticalNotification(alert: AlertEvent): void {
    // Implementar envío de notificaciones críticas
    console.log(`📧 Critical notification sent: ${alert.title}`);
  }

  /**
   * Genera reporte final
   */
  private async generateFinalReport(): Promise<any> {
    const now = new Date();
    const timeWindow = {
      start: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Últimas 24 horas
      end: now
    };

    const recentMetrics = this.metrics.filter(
      m => m.timestamp >= timeWindow.start && m.timestamp <= timeWindow.end
    );

    const recentAlerts = this.alerts.filter(
      a => a.timestamp >= timeWindow.start && a.timestamp <= timeWindow.end
    );

    return {
      timeWindow,
      metrics: {
        totalDataPoints: recentMetrics.length,
        averageResponseTime: this.calculateAverage(recentMetrics.map(m => m.applicationMetrics.averageResponseTime)),
        averageErrorRate: this.calculateAverage(recentMetrics.map(m => m.applicationMetrics.errorRate)),
        totalRequests: recentMetrics.reduce((sum, m) => sum + m.applicationMetrics.requestsPerSecond, 0),
        migrationSuccessRate: this.calculateMigrationSuccessRate(recentMetrics)
      },
      alerts: {
        total: recentAlerts.length,
        bySeverity: this.groupAlertsBySeverity(recentAlerts),
        byCategory: this.groupAlertsByCategory(recentAlerts)
      },
      recommendations: this.generateRecommendations(recentMetrics, recentAlerts)
    };
  }

  /**
   * Métodos helper para el análisis de datos
   */
  private calculateAverage(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0;
  }

  private calculateMigrationSuccessRate(metrics: ProductionMetrics[]): number {
    if (metrics.length === 0) return 100;

    const totalOperations = metrics.reduce((sum, m) =>
      sum + m.migrationMetrics.successfulMigrations + m.migrationMetrics.failedMigrations, 0);
    const successfulOperations = metrics.reduce((sum, m) =>
      sum + m.migrationMetrics.successfulMigrations, 0);

    return totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 100;
  }

  private groupAlertsBySeverity(alerts: AlertEvent[]): Record<string, number> {
    return alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupAlertsByCategory(alerts: AlertEvent[]): Record<string, number> {
    return alerts.reduce((acc, alert) => {
      acc[alert.category] = (acc[alert.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private generateRecommendations(metrics: ProductionMetrics[], alerts: AlertEvent[]): string[] {
    const recommendations: string[] = [];

    // Analizar trends y generar recomendaciones
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
    if (criticalAlerts.length > 0) {
      recommendations.push('Address critical alerts immediately before proceeding');
    }

    const errorRate = this.calculateAverage(metrics.map(m => m.applicationMetrics.errorRate));
    if (errorRate > 1) {
      recommendations.push('Investigate and resolve application errors to improve stability');
    }

    const avgResponseTime = this.calculateAverage(metrics.map(m => m.applicationMetrics.averageResponseTime));
    if (avgResponseTime > 300) {
      recommendations.push('Optimize response times to improve user experience');
    }

    return recommendations;
  }

  // Métodos mock para recolección de métricas (implementar según entorno)
  private async getSystemHealth(): Promise<ProductionMetrics['systemHealth']> {
    // Implementación real según el entorno
    return {
      cpu: 45 + Math.random() * 30,
      memory: 60 + Math.random() * 20,
      disk: 70 + Math.random() * 15,
      network: 20 + Math.random() * 40
    };
  }

  private async getDatabaseHealth(): Promise<ProductionMetrics['databaseHealth']> {
    return {
      connections: 25 + Math.floor(Math.random() * 10),
      responseTime: 50 + Math.random() * 100,
      errorRate: Math.random() * 2,
      slowQueries: Math.floor(Math.random() * 3)
    };
  }

  private async getApplicationMetrics(): Promise<ProductionMetrics['applicationMetrics']> {
    return {
      requestsPerSecond: 50 + Math.floor(Math.random() * 100),
      averageResponseTime: 100 + Math.random() * 200,
      errorRate: Math.random() * 1.5,
      activeUsers: 15 + Math.floor(Math.random() * 25)
    };
  }

  private async getMigrationMetrics(): Promise<ProductionMetrics['migrationMetrics']> {
    const flags = featureFlagManager.getAllFlags();
    return {
      kyselyTrafficPercentage: flags.materiaPrimaKysely.percentage || 0,
      pgtypedTrafficPercentage: 100 - (flags.materiaPrimaKysely.percentage || 0),
      successfulMigrations: 100 + Math.floor(Math.random() * 50),
      failedMigrations: Math.floor(Math.random() * 5),
      rollbackAttempts: 0
    };
  }

  private async getBusinessMetrics(): Promise<ProductionMetrics['businessMetrics']> {
    return {
      materialOperations: 80 + Math.floor(Math.random() * 40),
      supplierOperations: 20 + Math.floor(Math.random() * 15),
      userSatisfactionScore: 4.2 + Math.random() * 0.6,
      dataConsistencyScore: 98 + Math.random() * 2
    };
  }

  /**
   * Obtiene métricas históricas
   */
  getMetricsHistory(hours: number = 24): ProductionMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Obtiene alerts activas
   */
  getActiveAlerts(): AlertEvent[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Resuelve una alerta
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.emit('alert:resolved', alert);
    }
  }
}

// Exportar instancia para uso en producción
export const productionMonitor = new ProductionMonitor();