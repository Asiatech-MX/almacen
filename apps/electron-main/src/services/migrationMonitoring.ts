/**
 * Migration Monitoring and Automatic Rollback Service
 * Sistema integral de monitoreo y rollback automático para Fase 4
 */

import { MigrationFlagService, type MigrationFlags } from './migrationFlags'
import { MigrationRolloutService, type RolloutMetrics, type HealthCheckResult } from './migrationRollout'
import { EventEmitter } from 'events'

export interface MonitoringConfig {
    healthCheckInterval: number // milisegundos
    maxResponseTime: number // milisegundos
    maxErrorRate: number // porcentaje 0-100
    minDataConsistency: number // porcentaje 0-100
    monitoringWindow: number // minutos para mantener historial
}

export interface Alert {
    id: string
    type: 'warning' | 'critical' | 'info'
    message: string
    timestamp: Date
    resolved: boolean
    resolvedAt?: Date
    metrics?: RolloutMetrics
}

export interface SystemHealthStatus {
    status: 'healthy' | 'degraded' | 'critical'
    lastCheck: Date
    metrics: RolloutMetrics
    activeAlerts: Alert[]
    uptime: number // porcentaje
    averageResponseTime: number
    dataConsistencyScore: number
}

export class MigrationMonitoringService extends EventEmitter {
    private migrationFlags: MigrationFlagService
    private rolloutService: MigrationRolloutService
    private config: MonitoringConfig
    private isMonitoring: boolean = false
    private monitoringInterval: NodeJS.Timeout | null = null
    private metricsHistory: RolloutMetrics[] = []
    private alerts: Alert[] = []
    private lastHealthCheck: Date | null = null
    private consecutiveErrors: number = 0
    private startTime: Date = new Date()

    constructor(config: Partial<MonitoringConfig> = {}) {
        super()
        this.migrationFlags = MigrationFlagService.getInstance()
        this.rolloutService = new MigrationRolloutService()
        this.config = {
            healthCheckInterval: 60000, // 1 minuto
            maxResponseTime: 1000, // 1 segundo
            maxErrorRate: 5, // 5%
            minDataConsistency: 95, // 95%
            monitoringWindow: 60, // 60 minutos
            ...config
        }
    }

    /**
     * Inicia el monitoreo continuo
     */
    async startMonitoring(): Promise<void> {
        if (this.isMonitoring) {
            console.log('⚠️ Monitoreo ya está activo')
            return
        }

        console.log('🔍 Iniciando servicio de monitoreo avanzado...')
        this.isMonitoring = true
        this.startTime = new Date()

        // Realizar check inicial
        await this.performHealthCheck()

        // Iniciar monitoreo periódico
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.performHealthCheck()
            } catch (error) {
                console.error('❌ Error en monitoreo periódico:', error)
                this.handleMonitoringError(error)
            }
        }, this.config.healthCheckInterval)

        console.log(`✅ Monitoreo iniciado - Intervalo: ${this.config.healthCheckInterval}ms`)
        this.emit('monitoring:started')
    }

    /**
     * Detiene el monitoreo
     */
    stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval)
            this.monitoringInterval = null
        }
        this.isMonitoring = false
        console.log('⏹️ Monitoreo detenido')
        this.emit('monitoring:stopped')
    }

    /**
     * Realiza un check de salud completo
     */
    private async performHealthCheck(): Promise<SystemHealthStatus> {
        try {
            const flags = await this.migrationFlags.getFlags()
            const metrics = await this.collectMetrics()

            // Actualizar historial
            this.updateMetricsHistory(metrics)

            // Evaluar estado del sistema
            const status = this.evaluateSystemHealth(metrics)

            // Generar alerts si es necesario
            await this.generateAlerts(metrics, status)

            // Reset contador de errores si todo está bien
            if (status === 'healthy') {
                this.consecutiveErrors = 0
            }

            const healthStatus: SystemHealthStatus = {
                status,
                lastCheck: new Date(),
                metrics,
                activeAlerts: this.alerts.filter(a => !a.resolved),
                uptime: this.calculateUptime(),
                averageResponseTime: this.calculateAverageResponseTime(),
                dataConsistencyScore: metrics.dataConsistency
            }

            this.lastHealthCheck = new Date()

            // Emitir eventos
            this.emit('health:checked', healthStatus)

            // Log del estado
            this.logHealthStatus(healthStatus)

            return healthStatus

        } catch (error) {
            this.consecutiveErrors++
            console.error('❌ Error en health check:', error)

            // Activar rollback automático si hay demasiados errores consecutivos
            if (this.consecutiveErrors >= 3) {
                await this.triggerAutomaticRollback('Errores consecutivos en health check')
            }

            throw error
        }
    }

    /**
     * Colecta métricas completas del sistema
     */
    private async collectMetrics(): Promise<RolloutMetrics> {
        const startTime = Date.now()

        try {
            const flags = await this.migrationFlags.getFlags()

            // Health checks básicos
            const healthResults = await this.performComprehensiveHealthChecks()

            // Calcular métricas
            const metrics: RolloutMetrics = {
                timestamp: new Date(),
                phase: this.getCurrentPhase(),
                percentage: flags.MIGRATION_PERCENTAGE,
                errorsCount: this.countErrors(healthResults),
                avgResponseTime: this.calculateAverageResponseTime(healthResults),
                systemAvailability: this.calculateSystemAvailability(healthResults),
                dataConsistency: await this.checkDataConsistency(),
                status: this.determineOverallStatus(healthResults)
            }

            return metrics

        } catch (error) {
            return this.createErrorMetrics(error instanceof Error ? error.message : 'Error desconocido')
        }
    }

    /**
     * Realiza health checks comprehensivos
     */
    private async performComprehensiveHealthChecks(): Promise<HealthCheckResult[]> {
        const results: HealthCheckResult[] = []

        try {
            // 1. Check de conectividad a base de datos
            results.push(await this.checkDatabaseConnectivity())

            // 2. Check de performance de lecturas
            results.push(await this.checkReadPerformance())

            // 3. Check de performance de escrituras
            results.push(await this.checkWritePerformance())

            // 4. Check de consistencia de datos
            results.push(await this.checkDataIntegrity())

            // 5. Check de feature flags
            results.push(await this.checkFeatureFlags())

            // 6. Check de auditoría
            results.push(await this.checkAuditSystem())

        } catch (error) {
            console.error('❌ Error en health checks comprehensivos:', error)
            results.push({
                success: false,
                responseTime: 9999,
                error: error instanceof Error ? error.message : 'Error general'
            })
        }

        return results
    }

    /**
     * Checks individuales
     */
    private async checkDatabaseConnectivity(): Promise<HealthCheckResult> {
        const startTime = Date.now()
        try {
            const db = await import('../../backend/db/pool').then(m => m.getDatabase())
            await db.selectFrom('materia_prima').select('id').limit(1).execute()

            return { success: true, responseTime: Date.now() - startTime }
        } catch (error) {
            return {
                success: false,
                responseTime: Date.now() - startTime,
                error: 'Error de conexión a base de datos'
            }
        }
    }

    private async checkReadPerformance(): Promise<HealthCheckResult> {
        const startTime = Date.now()
        try {
            const db = await import('../../backend/db/pool').then(m => m.getDatabase())
            await db
                .selectFrom('materia_prima')
                .leftJoin('proveedores', 'materia_prima.proveedor_id', 'proveedores.id')
                .select(['materia_prima.codigo_barras', 'materia_prima.nombre'])
                .limit(50)
                .execute()

            const responseTime = Date.now() - startTime
            return {
                success: responseTime < this.config.maxResponseTime,
                responseTime
            }
        } catch (error) {
            return {
                success: false,
                responseTime: Date.now() - startTime,
                error: 'Error en performance de lecturas'
            }
        }
    }

    private async checkWritePerformance(): Promise<HealthCheckResult> {
        // Implementar check de escritura segura (sin modificar datos)
        const startTime = Date.now()
        try {
            // Simular check de transacción
            const db = await import('../../backend/db/pool').then(m => m.getDatabase())
            await db.connection().execute(async (connection) => {
                // BEGIN (simulado)
                await connection.selectFrom('materia_prima').select('id').limit(1).execute()
                // ROLLBACK (implícito al terminar el callback)
            })

            return { success: true, responseTime: Date.now() - startTime }
        } catch (error) {
            return {
                success: false,
                responseTime: Date.now() - startTime,
                error: 'Error en performance de escrituras'
            }
        }
    }

    private async checkDataIntegrity(): Promise<HealthCheckResult> {
        const startTime = Date.now()
        try {
            // Verificar que no haya datos corruptos
            const db = await import('../../backend/db/pool').then(m => m.getDatabase())

            const [legacyCount, migratedCount] = await Promise.all([
                db.selectFrom('materia_prima').where('activo', '=', true).select('id').execute(),
                db.selectFrom('materia_prima_migration').where('activo', '=', true).select('id').execute()
            ])

            // Verificar consistencia básica
            const consistency = this.calculateBasicConsistency(legacyCount.length, migratedCount.length)

            return {
                success: consistency >= 90,
                responseTime: Date.now() - startTime,
                dataConsistency: consistency
            }
        } catch (error) {
            return {
                success: false,
                responseTime: Date.now() - startTime,
                error: 'Error verificando integridad de datos'
            }
        }
    }

    private async checkFeatureFlags(): Promise<HealthCheckResult> {
        const startTime = Date.now()
        try {
            const flags = await this.migrationFlags.getFlags()

            // Validar configuración de flags
            const isValid = this.validateFeatureFlags(flags)

            return {
                success: isValid,
                responseTime: Date.now() - startTime
            }
        } catch (error) {
            return {
                success: false,
                responseTime: Date.now() - startTime,
                error: 'Error en feature flags'
            }
        }
    }

    private async checkAuditSystem(): Promise<HealthCheckResult> {
        const startTime = Date.now()
        try {
            const db = await import('../../backend/db/pool').then(m => m.getDatabase())

            // Verificar que la tabla de auditoría esté accesible
            await db.selectFrom('materia_prima_auditoria').select('fecha').limit(1).execute()

            return { success: true, responseTime: Date.now() - startTime }
        } catch (error) {
            return {
                success: false,
                responseTime: Date.now() - startTime,
                error: 'Error en sistema de auditoría'
            }
        }
    }

    /**
     * Métodos de evaluación y alertas
     */
    private evaluateSystemHealth(metrics: RolloutMetrics): 'healthy' | 'degraded' | 'critical' {
        if (
            metrics.systemAvailability < 90 ||
            metrics.avgResponseTime > this.config.maxResponseTime * 2 ||
            metrics.dataConsistency < this.config.minDataConsistency
        ) {
            return 'critical'
        }

        if (
            metrics.systemAvailability < 98 ||
            metrics.avgResponseTime > this.config.maxResponseTime ||
            metrics.dataConsistency < this.config.minDataConsistency + 2
        ) {
            return 'degraded'
        }

        return 'healthy'
    }

    private async generateAlerts(metrics: RolloutMetrics, status: string): Promise<void> {
        const alertsToCreate: Omit<Alert, 'id' | 'timestamp'>[] = []

        // Alertas de performance
        if (metrics.avgResponseTime > this.config.maxResponseTime) {
            alertsToCreate.push({
                type: 'warning',
                message: `Tiempo de respuesta elevado: ${metrics.avgResponseTime}ms (límite: ${this.config.maxResponseTime}ms)`,
                resolved: false,
                metrics
            })
        }

        // Alertas de disponibilidad
        if (metrics.systemAvailability < 95) {
            alertsToCreate.push({
                type: metrics.systemAvailability < 90 ? 'critical' : 'warning',
                message: `Disponibilidad del sistema: ${metrics.systemAvailability.toFixed(2)}%`,
                resolved: false,
                metrics
            })
        }

        // Alertas de consistencia
        if (metrics.dataConsistency < this.config.minDataConsistency) {
            alertsToCreate.push({
                type: 'critical',
                message: `Consistencia de datos baja: ${metrics.dataConsistency.toFixed(2)}% (mínimo: ${this.config.minDataConsistency}%)`,
                resolved: false,
                metrics
            })
        }

        // Alertas de errores
        if (metrics.errorsCount > 0) {
            alertsToCreate.push({
                type: 'warning',
                message: `Errores detectados: ${metrics.errorsCount}`,
                resolved: false,
                metrics
            })
        }

        // Crear alerts
        for (const alertData of alertsToCreate) {
            const alert: Alert = {
                id: crypto.randomUUID(),
                timestamp: new Date(),
                ...alertData
            }

            this.alerts.push(alert)
            this.emit('alert:created', alert)
        }

        // Cleanup de alerts antiguos
        this.cleanupOldAlerts()
    }

    /**
     * Rollback automático
     */
    private async triggerAutomaticRollback(reason: string): Promise<void> {
        console.log(`🚨 ACTIVANDO ROLLBACK AUTOMÁTICO - Razón: ${reason}`)

        try {
            await this.migrationFlags.emergencyRollback()
            this.stopMonitoring()

            const alert: Alert = {
                id: crypto.randomUUID(),
                type: 'critical',
                message: `ROLLBACK AUTOMÁTICO ACTIVADO: ${reason}`,
                timestamp: new Date(),
                resolved: false
            }

            this.alerts.push(alert)
            this.emit('rollback:automatic', { reason, alert })

            console.log('✅ Rollback automático completado')

        } catch (error) {
            console.error('❌ Error en rollback automático:', error)
            throw error
        }
    }

    /**
     * Métodos utilitarios
     */
    private updateMetricsHistory(metrics: RolloutMetrics): void {
        this.metricsHistory.push(metrics)

        // Mantener solo métricas dentro de la ventana de monitoreo
        const cutoffTime = new Date(Date.now() - this.config.monitoringWindow * 60 * 1000)
        this.metricsHistory = this.metricsHistory.filter(m => m.timestamp > cutoffTime)
    }

    private calculateBasicConsistency(legacyCount: number, migratedCount: number): number {
        if (legacyCount === 0) return 100
        return Math.min((migratedCount / legacyCount) * 100, 100)
    }

    private validateFeatureFlags(flags: MigrationFlags): boolean {
        // Validar que los flags sean consistentes
        if (flags.EMERGENCY_ROLLBACK && (flags.USE_MIGRATED_TABLE_READS || flags.USE_MIGRATED_TABLE_WRITES)) {
            return false // No puede haber rollback y usar tablas migradas
        }

        if (flags.USE_MIGRATED_TABLE_WRITES && !flags.USE_MIGRATED_TABLE_READS) {
            return false // No se puede escribir sin leer primero
        }

        return true
    }

    private countErrors(results: HealthCheckResult[]): number {
        return results.filter(r => !r.success).length
    }

    private calculateAverageResponseTime(results: HealthCheckResult[]): number {
        const times = results.map(r => r.responseTime).filter(t => t > 0)
        return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
    }

    private calculateSystemAvailability(results: HealthCheckResult[]): number {
        const successCount = results.filter(r => r.success).length
        return (successCount / results.length) * 100
    }

    private async checkDataConsistency(): Promise<number> {
        try {
            const db = await import('../../backend/db/pool').then(m => m.getDatabase())
            const [legacy, migrated] = await Promise.all([
                db.selectFrom('materia_prima').where('activo', '=', true).select('id').execute(),
                db.selectFrom('materia_prima_migration').where('activo', '=', true).select('id').execute()
            ])

            return this.calculateBasicConsistency(legacy.length, migrated.length)
        } catch (error) {
            return 0
        }
    }

    private determineOverallStatus(results: HealthCheckResult[]): 'healthy' | 'warning' | 'critical' {
        const failureRate = (this.countErrors(results) / results.length) * 100

        if (failureRate > 50) return 'critical'
        if (failureRate > 20) return 'warning'
        return 'healthy'
    }

    private createErrorMetrics(errorMsg: string): RolloutMetrics {
        return {
            timestamp: new Date(),
            phase: 0,
            percentage: 0,
            errorsCount: 999,
            avgResponseTime: 9999,
            systemAvailability: 0,
            dataConsistency: 0,
            status: 'critical'
        }
    }

    private getCurrentPhase(): number {
        return 0 // Implementación básica
    }

    private calculateUptime(): number {
        if (!this.isMonitoring) return 0

        const totalChecks = this.metricsHistory.length
        const successfulChecks = this.metricsHistory.filter(m => m.systemAvailability >= 95).length

        return totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0
    }

    private cleanupOldAlerts(): void {
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 horas
        this.alerts = this.alerts.filter(a => a.timestamp > cutoffTime)
    }

    private handleMonitoringError(error: any): void {
        this.consecutiveErrors++

        if (this.consecutiveErrors >= 3) {
            this.triggerAutomaticRollback(`Errores consecutivos en monitoreo: ${error?.message || 'Desconocido'}`)
        }
    }

    private logHealthStatus(status: SystemHealthStatus): void {
        const emoji = status.status === 'healthy' ? '✅' : status.status === 'degraded' ? '⚠️' : '🚨'
        console.log(`${emoji} Health Status: ${status.status.toUpperCase()}`)
        console.log(`📊 Uptime: ${status.uptime.toFixed(2)}%`)
        console.log(`⚡ Response Time: ${status.averageResponseTime}ms`)
        console.log(`🔍 Data Consistency: ${status.dataConsistencyScore.toFixed(2)}%`)
        console.log(`🚨 Active Alerts: ${status.activeAlerts.length}`)
    }

    /**
     * Métodos públicos
     */
    getSystemHealth(): SystemHealthStatus | null {
        if (!this.lastHealthCheck) return null

        const lastMetrics = this.metricsHistory[this.metricsHistory.length - 1]
        if (!lastMetrics) return null

        return {
            status: this.evaluateSystemHealth(lastMetrics),
            lastCheck: this.lastHealthCheck,
            metrics: lastMetrics,
            activeAlerts: this.alerts.filter(a => !a.resolved),
            uptime: this.calculateUptime(),
            averageResponseTime: this.calculateAverageResponseTime(),
            dataConsistencyScore: lastMetrics.dataConsistency
        }
    }

    getAlerts(type?: 'warning' | 'critical' | 'info'): Alert[] {
        return this.alerts.filter(a =>
            !a.resolved && (!type || a.type === type)
        )
    }

    getMetricsHistory(): RolloutMetrics[] {
        return [...this.metricsHistory]
    }
}

export default MigrationMonitoringService