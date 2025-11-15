/**
 * Migration Rollout Service - Fase 4
 * Controla la progresión gradual de la migración con feature flags
 */

import { MigrationFlagService, type MigrationFlags } from './migrationFlags'
import { getDatabase } from '../../backend/db/pool'
import Kysely from 'kysely'
import type { Database } from '../../backend/types/database'

export interface RolloutPhase {
    percentage: number
    description: string
    enableReads: boolean
    enableWrites: boolean
    estimatedDuration: number // minutos
}

export interface RolloutMetrics {
    timestamp: Date
    phase: number
    percentage: number
    errorsCount: number
    avgResponseTime: number
    systemAvailability: number
    dataConsistency: number
    status: 'healthy' | 'warning' | 'critical'
}

export interface HealthCheckResult {
    success: boolean
    responseTime: number
    error?: string
    dataConsistency?: number
}

export class MigrationRolloutService {
    private migrationFlags: MigrationFlagService
    private isMonitoring: boolean = false
    private monitoringInterval: NodeJS.Timeout | null = null
    private errorCount: number = 0
    private lastHealthCheck: Date | null = null

    private readonly phases: RolloutPhase[] = [
        {
            percentage: 0,
            description: "Solo lectura tabla legacy",
            enableReads: false,
            enableWrites: false,
            estimatedDuration: 0
        },
        {
            percentage: 10,
            description: "10% lecturas desde tabla migrada",
            enableReads: true,
            enableWrites: false,
            estimatedDuration: 30
        },
        {
            percentage: 25,
            description: "25% lecturas desde tabla migrada",
            enableReads: true,
            enableWrites: false,
            estimatedDuration: 60
        },
        {
            percentage: 50,
            description: "50% lecturas y escrituras desde tabla migrada",
            enableReads: true,
            enableWrites: true,
            estimatedDuration: 120
        },
        {
            percentage: 75,
            description: "75% operaciones en tabla migrada",
            enableReads: true,
            enableWrites: true,
            estimatedDuration: 180
        },
        {
            percentage: 100,
            description: "100% operaciones en tabla migrada",
            enableReads: true,
            enableWrites: true,
            estimatedDuration: 240
        }
    ]

    constructor() {
        this.migrationFlags = MigrationFlagService.getInstance()
    }

    /**
     * Inicia el proceso de rollout progresivo
     */
    async startRollout(): Promise<void> {
        try {
            console.log('🚀 Iniciando proceso de rollout progresivo...')

            const currentPhase = await this.getCurrentPhase()
            console.log(`📍 Fase actual: ${currentPhase.percentage}% - ${currentPhase.description}`)

            // Iniciar monitoreo
            this.startMonitoring()

            console.log('✅ Rollout iniciado exitosamente')
        } catch (error) {
            console.error('❌ Error iniciando rollout:', error)
            await this.emergencyRollback('Error al iniciar rollout')
            throw error
        }
    }

    /**
     * Avanza a la siguiente fase del rollout
     */
    async advanceToNextPhase(): Promise<void> {
        try {
            const currentConfig = await this.migrationFlags.getFlags()
            const currentPhase = this.getPhaseByPercentage(currentConfig.MIGRATION_PERCENTAGE)

            const nextPhaseIndex = this.phases.findIndex(p => p.percentage === currentPhase.percentage) + 1

            if (nextPhaseIndex >= this.phases.length) {
                console.log('🎉 Ya estamos en la fase final de migración')
                return
            }

            const nextPhase = this.phases[nextPhaseIndex]

            console.log(`🚀 Avanzando a fase: ${nextPhase.description}`)
            console.log(`📊 Porcentaje: ${currentPhase.percentage}% → ${nextPhase.percentage}%`)

            // Actualizar feature flags
            await this.migrationFlags.updateFlags({
                USE_MIGRATED_TABLE_READS: nextPhase.enableReads,
                USE_MIGRATED_TABLE_WRITES: nextPhase.enableWrites,
                MIGRATION_PERCENTAGE: nextPhase.percentage
            }, 'rollout_service')

            // Monitorear la transición
            await this.monitorPhaseTransition(nextPhase.percentage)

            console.log(`✅ Fase ${nextPhase.percentage}% completada exitosamente`)

        } catch (error) {
            console.error('❌ Error avanzando a siguiente fase:', error)
            await this.emergencyRollback('Error durante transición de fase')
            throw error
        }
    }

    /**
     * Monitorea una transición de fase
     */
    private async monitorPhaseTransition(targetPercentage: number): Promise<void> {
        const monitoringDuration = 5 * 60 * 1000 // 5 minutos
        const startTime = Date.now()
        const maxErrors = 10
        this.errorCount = 0

        console.log(`🔍 Iniciando monitoreo de transición a ${targetPercentage}%...`)

        while (Date.now() - startTime < monitoringDuration) {
            try {
                // Realizar checks de salud
                const healthResults = await this.performHealthChecks()

                // Evaluar resultados
                const criticalErrors = healthResults.filter(r => !r.success).length

                if (criticalErrors > 3) {
                    throw new Error(`Demasiados errores críticos: ${criticalErrors}`)
                }

                // Verificar consistencia de datos
                const avgConsistency = this.calculateAverageConsistency(healthResults)
                if (avgConsistency < 95) {
                    console.warn(`⚠️ Baja consistencia de datos: ${avgConsistency.toFixed(2)}%`)
                }

                // Esperar siguiente check
                await new Promise(resolve => setTimeout(resolve, 30000)) // 30 segundos

            } catch (error) {
                this.errorCount++
                console.error(`❌ Error en monitoreo de fase ${targetPercentage}%:`, error)

                if (this.errorCount >= maxErrors) {
                    await this.emergencyRollback(`Demasiados errores en fase ${targetPercentage}%`)
                    throw new Error(`Demasiados errores en fase ${targetPercentage}%. Rollback ejecutado.`)
                }
            }
        }

        console.log(`✅ Fase ${targetPercentage}% estable. Continuando rollout...`)
    }

    /**
     * Realiza checks de salud del sistema
     */
    private async performHealthChecks(): Promise<HealthCheckResult[]> {
        const db = getDatabase()
        const checks: HealthCheckResult[] = []

        try {
            // Check 1: Lectura desde tabla legacy
            const legacyReadStart = Date.now()
            await db
                .selectFrom('materia_prima')
                .select('id')
                .limit(1)
                .execute()
            checks.push({
                success: true,
                responseTime: Date.now() - legacyReadStart
            })

            // Check 2: Lectura desde tabla migrada (si existe)
            const migratedReadStart = Date.now()
            try {
                await db
                    .selectFrom('materia_prima_migration')
                    .select('id')
                    .limit(1)
                    .execute()
                checks.push({
                    success: true,
                    responseTime: Date.now() - migratedReadStart
                })
            } catch (error) {
                checks.push({
                    success: false,
                    responseTime: Date.now() - migratedReadStart,
                    error: 'Tabla migrada no accesible'
                })
            }

            // Check 3: Consistencia de datos
            const consistencyCheck = await this.checkDataConsistency(db)
            checks.push(consistencyCheck)

            // Check 4: Performance general
            const performanceCheck = await this.checkOverallPerformance(db)
            checks.push(performanceCheck)

        } catch (error) {
            console.error('❌ Error realizando health checks:', error)
            checks.push({
                success: false,
                responseTime: 9999,
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        }

        this.lastHealthCheck = new Date()
        return checks
    }

    /**
     * Verifica consistencia de datos entre tablas
     */
    private async checkDataConsistency(db: Kysely<Database>): Promise<HealthCheckResult> {
        const startTime = Date.now()

        try {
            const [legacyCount, migratedCount] = await Promise.all([
                db
                    .selectFrom('materia_prima')
                    .select(db.fn.count('id').as('count'))
                    .where('activo', '=', true)
                    .executeTakeFirst(),

                db
                    .selectFrom('materia_prima_migration')
                    .select(db.fn.count('id').as('count'))
                    .where('activo', '=', true)
                    .executeTakeFirst()
            ])

            const legacyTotal = Number(legacyCount?.count) || 0
            const migratedTotal = Number(migratedCount?.count) || 0

            // Calcular consistencia basada en porcentaje de migración
            const flags = await this.migrationFlags.getFlags()
            const expectedMigrated = Math.floor(legacyTotal * (flags.MIGRATION_PERCENTAGE / 100))

            let consistency: number
            if (expectedMigrated === 0) {
                consistency = 100 // Consistencia perfecta si no hay migración esperada
            } else {
                consistency = Math.min((migratedTotal / expectedMigrated) * 100, 100)
            }

            return {
                success: consistency >= 90,
                responseTime: Date.now() - startTime,
                dataConsistency: consistency
            }

        } catch (error) {
            return {
                success: false,
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Error verificando consistencia'
            }
        }
    }

    /**
     * Verifica performance general del sistema
     */
    private async checkOverallPerformance(db: Kysely<Database>): Promise<HealthCheckResult> {
        const startTime = Date.now()

        try {
            // Query compleja para probar performance
            await db
                .selectFrom('materia_prima')
                .leftJoin('proveedores', 'materia_prima.proveedor_id', 'proveedores.id')
                .select([
                    'materia_prima.codigo_barras',
                    'materia_prima.nombre',
                    'proveedores.nombre as proveedor_nombre'
                ])
                .where('materia_prima.activo', '=', true)
                .limit(100)
                .execute()

            const responseTime = Date.now() - startTime

            return {
                success: responseTime < 1000, // Menos de 1 segundo
                responseTime
            }

        } catch (error) {
            return {
                success: false,
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Error de performance'
            }
        }
    }

    /**
     * Inicia monitoreo continuo
     */
    private startMonitoring(): void {
        if (this.isMonitoring) {
            console.log('⚠️ Monitoreo ya está activo')
            return
        }

        this.isMonitoring = true
        console.log('📊 Iniciando monitoreo continuo...')

        this.monitoringInterval = setInterval(async () => {
            try {
                await this.collectMetrics()
            } catch (error) {
                console.error('❌ Error en monitoreo continuo:', error)
            }
        }, 60000) // Cada minuto
    }

    /**
     * Detiene monitoreo continuo
     */
    stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval)
            this.monitoringInterval = null
        }
        this.isMonitoring = false
        console.log('⏹️ Monitoreo detenido')
    }

    /**
     * Colecta métricas del sistema
     */
    private async collectMetrics(): Promise<void> {
        const db = getDatabase()

        try {
            const healthResults = await this.performHealthChecks()
            const flags = await this.migrationFlags.getFlags()

            const metrics: RolloutMetrics = {
                timestamp: new Date(),
                phase: this.getCurrentPhaseIndex(),
                percentage: flags.MIGRATION_PERCENTAGE,
                errorsCount: this.errorCount,
                avgResponseTime: this.calculateAverageResponseTime(healthResults),
                systemAvailability: this.calculateAvailability(healthResults),
                dataConsistency: this.calculateAverageConsistency(healthResults),
                status: this.determineStatus(healthResults)
            }

            console.log('📊 Métricas recolectadas:', {
                phase: metrics.percentage,
                responseTime: `${metrics.avgResponseTime}ms`,
                consistency: `${metrics.dataConsistency.toFixed(2)}%`,
                status: metrics.status
            })

        } catch (error) {
            console.error('❌ Error colectando métricas:', error)
        }
    }

    /**
     * Ejecuta rollback de emergencia
     */
    async emergencyRollback(reason: string): Promise<void> {
        console.log(`🚨 EMERGENCY ROLLBACK - Razón: ${reason}`)

        try {
            await this.migrationFlags.emergencyRollback()
            this.stopMonitoring()

            console.log('✅ Rollback de emergencia completado')

        } catch (error) {
            console.error('❌ Error en rollback de emergencia:', error)
            throw error
        }
    }

    /**
     * Obtiene la fase actual de migración
     */
    private getCurrentPhase(): RolloutPhase {
        return this.getPhaseByPercentage(0) // Implementación básica
    }

    private getPhaseByPercentage(percentage: number): RolloutPhase {
        return this.phases.find(p => p.percentage >= percentage) || this.phases[0]
    }

    private getCurrentPhaseIndex(): number {
        return this.phases.findIndex(p => p.percentage === this.getCurrentPhase().percentage)
    }

    // Helper methods para cálculos
    private calculateAverageResponseTime(results: HealthCheckResult[]): number {
        const times = results.map(r => r.responseTime).filter(t => t > 0)
        return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
    }

    private calculateAvailability(results: HealthCheckResult[]): number {
        const successCount = results.filter(r => r.success).length
        return (successCount / results.length) * 100
    }

    private calculateAverageConsistency(results: HealthCheckResult[]): number {
        const consistencies = results
            .map(r => r.dataConsistency)
            .filter(c => c !== undefined) as number[]

        return consistencies.length > 0
            ? consistencies.reduce((a, b) => a + b, 0) / consistencies.length
            : 100
    }

    private determineStatus(results: HealthCheckResult[]): 'healthy' | 'warning' | 'critical' {
        const failureRate = (results.filter(r => !r.success).length / results.length) * 100

        if (failureRate > 50) return 'critical'
        if (failureRate > 20) return 'warning'
        return 'healthy'
    }
}

export default MigrationRolloutService