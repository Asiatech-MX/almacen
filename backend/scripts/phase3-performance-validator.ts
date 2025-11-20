/**
 * Phase 3 Performance Validator
 *
 * Script para validar que la migración a Kysely no degrada
 * el performance más allá de los umbrales aceptables definidos
 * en el Plan de Migración.
 */

import { performance } from 'perf_hooks';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { DB } from '../types/generated/database.types';
import { MateriaPrismaHybridRepository } from '../repositories/hybrid/materiaPrisma.hybrid';
import { ProveedoresHybridRepository } from '../repositories/hybrid/proveedores.hybrid';
import { featureFlagManager } from '../config/featureFlags';

export interface PerformanceThresholds {
  maxResponseTime: number; // ms
  maxMemoryUsage: number; // MB
  maxCpuUsage: number; // %
  maxDegradationPercentage: number; // vs baseline
}

export interface PerformanceTestResult {
  testName: string;
  domain: string;
  system: 'kysely' | 'pgtyped';
  iterations: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  memoryUsageBefore: number;
  memoryUsageAfter: number;
  memoryDelta: number;
  throughput: number; // requests/second
  errors: number;
  errorRate: number;
  passedThresholds: boolean;
  warnings: string[];
  timestamp: Date;
}

export interface BaselineMetrics {
  materiaPrima: {
    findAll: PerformanceTestResult;
    findById: PerformanceTestResult;
    stockBajo: PerformanceTestResult;
  };
  proveedores: {
    findAll: PerformanceTestResult;
    search: PerformanceTestResult;
    findByRFC: PerformanceTestResult;
  };
}

export class Phase3PerformanceValidator {
  private kyselyDb: Kysely<DB>;
  private pgTypedDb: any;
  private thresholds: PerformanceThresholds;
  private baseline: BaselineMetrics | null = null;

  constructor(
    dbConnection: {
      kysely: Kysely<DB>;
      pgTyped: any;
    },
    customThresholds?: Partial<PerformanceThresholds>
  ) {
    this.kyselyDb = dbConnection.kysely;
    this.pgTypedDb = dbConnection.pgTyped;

    // Umbrales por defecto según el plan de migración
    this.thresholds = {
      maxResponseTime: 1000, // 1 segundo para queries complejas
      maxMemoryUsage: 50, // 50MB increase
      maxCpuUsage: 80, // 80% CPU
      maxDegradationPercentage: 5, // 5% degradación máxima vs baseline
      ...customThresholds
    };
  }

  /**
   * Ejecuta validación completa de performance
   */
  async validatePerformance(): Promise<{
    passed: boolean;
    results: PerformanceTestResult[];
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      overallDegradation: number;
      criticalIssues: string[];
    };
  }> {
    console.log('🚀 Iniciando Phase 3 Performance Validation');
    console.log('=========================================');

    const results: PerformanceTestResult[] = [];
    const materiaPrimaRepo = new MateriaPrismaHybridRepository(this.kyselyDb, this.pgTypedDb);
    const proveedoresRepo = new ProveedoresHybridRepository(this.kyselyDb, this.pgTypedDb);

    // Forzar uso de Kysely
    featureFlagManager.setFlag('materiaPrimaKysely', { enabled: true, percentage: 100 });
    featureFlagManager.setFlag('proveedoresKysely', { enabled: true, percentage: 100 });

    try {
      // Tests de Materia Prima
      console.log('\n📦 Testing MateriaPrima Domain...');

      results.push(await this.runPerformanceTest(
        'MateriaPrima.findAll',
        'materiaPrima',
        () => materiaPrimaRepo.findAll({ performanceTest: true })
      ));

      results.push(await this.runPerformanceTest(
        'MateriaPrima.findById',
        'materiaPrima',
        () => materiaPrimaRepo.findById('test-id-123', { performanceTest: true })
      ));

      results.push(await this.runPerformanceTest(
        'MateriaPrima.stockBajo',
        'materiaPrima',
        () => materiaPrimaRepo.getStockBajo({ performanceTest: true })
      ));

      // Tests de Proveedores
      console.log('\n🏢 Testing Proveedores Domain...');

      results.push(await this.runPerformanceTest(
        'Proveedores.findAll',
        'proveedores',
        () => proveedoresRepo.findAll({ performanceTest: true })
      ));

      results.push(await this.runPerformanceTest(
        'Proveedores.search',
        'proveedores',
        () => proveedoresRepo.search('test', 10, { performanceTest: true })
      ));

      results.push(await this.runPerformanceTest(
        'Proveedores.findByRFC',
        'proveedores',
        () => proveedoresRepo.findByRFC('TEST123456ABC', { performanceTest: true })
      ));

    } catch (error) {
      console.error('❌ Error durante performance validation:', error);
    }

    // Análisis de resultados
    const analysis = this.analyzeResults(results);

    console.log('\n📊 Performance Validation Results');
    console.log('===================================');
    console.log(`Total Tests: ${analysis.summary.totalTests}`);
    console.log(`Passed: ${analysis.summary.passedTests}`);
    console.log(`Failed: ${analysis.summary.failedTests}`);
    console.log(`Overall Degradation: ${analysis.summary.overallDegradation.toFixed(2)}%`);

    if (analysis.summary.criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      analysis.summary.criticalIssues.forEach(issue => console.log(`  - ${issue}`));
    }

    console.log('\nDetailed Results:');
    results.forEach(result => {
      const status = result.passedThresholds ? '✅' : '❌';
      console.log(`${status} ${result.testName}: ${result.averageResponseTime.toFixed(2)}ms avg, ${result.errorRate.toFixed(2)}% errors`);

      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => console.log(`    ⚠️  ${warning}`));
      }
    });

    return {
      passed: analysis.summary.failedTests === 0,
      results,
      summary: analysis.summary
    };
  }

  /**
   * Ejecuta un test de performance individual
   */
  private async runPerformanceTest(
    testName: string,
    domain: string,
    operation: () => Promise<any>,
    iterations: number = 50
  ): Promise<PerformanceTestResult> {
    console.log(`  🔄 ${testName} (${iterations} iterations)...`);

    const responseTimes: number[] = [];
    let errors = 0;
    const memoryBefore = this.getMemoryUsage();

    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      try {
        const iterationStart = performance.now();
        await operation();
        const iterationEnd = performance.now();

        const responseTime = iterationEnd - iterationStart;
        responseTimes.push(responseTime);

      } catch (error) {
        errors++;
        console.warn(`    ❌ Iteration ${i} failed:`, error.message);
      }
    }

    const endTime = performance.now();
    const memoryAfter = this.getMemoryUsage();

    // Calcular métricas
    responseTimes.sort((a, b) => a - b);

    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)];
    const minResponseTime = responseTimes[0];
    const maxResponseTime = responseTimes[responseTimes.length - 1];

    const totalTime = endTime - startTime;
    const throughput = (iterations - errors) / (totalTime / 1000); // requests/second
    const errorRate = (errors / iterations) * 100;

    // Validar umbrales
    const warnings: string[] = [];
    let passedThresholds = true;

    if (averageResponseTime > this.thresholds.maxResponseTime) {
      warnings.push(`Average response time (${averageResponseTime.toFixed(2)}ms) exceeds threshold (${this.thresholds.maxResponseTime}ms)`);
      passedThresholds = false;
    }

    if (p95ResponseTime > this.thresholds.maxResponseTime * 2) {
      warnings.push(`P95 response time (${p95ResponseTime.toFixed(2)}ms) is too high`);
    }

    if (errorRate > 1) {
      warnings.push(`Error rate (${errorRate.toFixed(2)}%) is above acceptable limit (1%)`);
      passedThresholds = false;
    }

    const memoryDelta = memoryAfter - memoryBefore;
    if (memoryDelta > this.thresholds.maxMemoryUsage) {
      warnings.push(`Memory usage increased by ${memoryDelta.toFixed(2)}MB, exceeding threshold (${this.thresholds.maxMemoryUsage}MB)`);
      passedThresholds = false;
    }

    return {
      testName,
      domain,
      system: 'kysely',
      iterations,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      minResponseTime,
      maxResponseTime,
      memoryUsageBefore: memoryBefore,
      memoryUsageAfter: memoryAfter,
      memoryDelta,
      throughput,
      errors,
      errorRate,
      passedThresholds,
      warnings,
      timestamp: new Date()
    };
  }

  /**
   * Analiza los resultados y genera estadísticas
   */
  private analyzeResults(results: PerformanceTestResult[]): {
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      overallDegradation: number;
      criticalIssues: string[];
    };
  } {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passedThresholds).length;
    const failedTests = totalTests - passedTests;

    // Calcular degradación general comparando con baseline si existe
    let overallDegradation = 0;
    const criticalIssues: string[] = [];

    if (this.baseline) {
      const degradations: number[] = [];

      results.forEach(result => {
        const baselineResult = this.findBaselineResult(result.testName);
        if (baselineResult) {
          const degradation = this.calculateDegradation(baselineResult, result);
          degradations.push(degradation);

          if (degradation > this.thresholds.maxDegradationPercentage) {
            criticalIssues.push(
              `${result.testName}: ${degradation.toFixed(2)}% degradation exceeds threshold`
            );
          }
        }
      });

      if (degradations.length > 0) {
        overallDegradation = degradations.reduce((sum, deg) => sum + deg, 0) / degradations.length;
      }
    }

    // Identificar problemas críticos sin baseline
    results.forEach(result => {
      if (!result.passedThresholds) {
        if (result.averageResponseTime > this.thresholds.maxResponseTime * 2) {
          criticalIssues.push(`${result.testName}: Response time critically high`);
        }
        if (result.errorRate > 5) {
          criticalIssues.push(`${result.testName}: Error rate critically high`);
        }
      }
    });

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        overallDegradation,
        criticalIssues
      }
    };
  }

  /**
   * Establece baseline para comparación
   */
  public setBaseline(baseline: BaselineMetrics): void {
    this.baseline = baseline;
    console.log('📈 Performance baseline established');
  }

  /**
   * Encuentra resultado baseline por nombre de test
   */
  private findBaselineResult(testName: string): PerformanceTestResult | null {
    if (!this.baseline) return null;

    const [domain, operation] = testName.split('.');

    switch (domain) {
      case 'MateriaPrima':
        return (this.baseline.materiaPrima as any)[operation] || null;
      case 'Proveedores':
        return (this.baseline.proveedores as any)[operation] || null;
      default:
        return null;
    }
  }

  /**
   * Calcula porcentaje de degradación
   */
  private calculateDegradation(baseline: PerformanceTestResult, current: PerformanceTestResult): number {
    const degradation = ((current.averageResponseTime - baseline.averageResponseTime) / baseline.averageResponseTime) * 100;
    return Math.max(0, degradation); // No negativos (mejora)
  }

  /**
   * Obtiene uso de memoria actual (MB)
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return usage.heapUsed / 1024 / 1024; // Convert to MB
    }
    return 0;
  }

  /**
   * Genera reporte detallado en formato JSON
   */
  public generateReport(validationResult: any): string {
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        phase: 'Phase 3 - Domain Migration',
        thresholds: this.thresholds,
        baseline: this.baseline ? 'established' : 'not established'
      },
      summary: validationResult.summary,
      detailedResults: validationResult.results,
      recommendations: this.generateRecommendations(validationResult)
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Genera recomendaciones basadas en los resultados
   */
  private generateRecommendations(validationResult: any): string[] {
    const recommendations: string[] = [];

    if (validationResult.summary.overallDegradation > 3) {
      recommendations.push('Consider optimizing Kysely queries before full rollout');
    }

    validationResult.results.forEach((result: PerformanceTestResult) => {
      if (!result.passedThresholds) {
        if (result.averageResponseTime > this.thresholds.maxResponseTime) {
          recommendations.push(`${result.testName}: Consider adding database indexes or query optimization`);
        }
        if (result.errorRate > 1) {
          recommendations.push(`${result.testName}: Investigate error causes before production deployment`);
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable thresholds. Ready for production rollout.');
    }

    return recommendations;
  }

  /**
   * Compara rendimiento entre Kysely y PGTyped
   */
  async compareSystems(iterations: number = 100): Promise<{
    kyselyResults: PerformanceTestResult[];
    pgTypedResults: PerformanceTestResult[];
    comparison: {
      [testName: string]: {
        kyselyFaster: boolean;
        performanceDifference: number;
        recommendation: string;
      };
    };
  }> {
    console.log('🔄 Comparing Kysely vs PGTyped performance...');

    const materiaPrimaRepo = new MateriaPrismaHybridRepository(this.kyselyDb, this.pgTypedDb);
    const proveedoresRepo = new ProveedoresHybridRepository(this.kyselyDb, this.pgTypedDb);

    // Tests con Kysely
    featureFlagManager.setFlag('materiaPrimaKysely', { enabled: true, percentage: 100 });
    featureFlagManager.setFlag('proveedoresKysely', { enabled: true, percentage: 100 });

    const kyselyTests = [
      { name: 'MateriaPrima.findAll', operation: () => materiaPrimaRepo.findAll({ comparison: true }) },
      { name: 'Proveedores.findAll', operation: () => proveedoresRepo.findAll({ comparison: true }) }
    ];

    const kyselyResults = await Promise.all(
      kyselyTests.map(test =>
        this.runPerformanceTest(test.name, 'comparison', test.operation, iterations)
      )
    );

    // Tests con PGTyped
    featureFlagManager.setFlag('materiaPrimaKysely', { enabled: false });
    featureFlagManager.setFlag('proveedoresKysely', { enabled: false });

    const pgTypedResults = await Promise.all(
      kyselyTests.map(test =>
        this.runPerformanceTest(`${test.name} (PGTyped)`, 'comparison', test.operation, iterations)
      )
    );

    // Comparación
    const comparison: any = {};
    kyselyTests.forEach((test, index) => {
      const kyselyResult = kyselyResults[index];
      const pgTypedResult = pgTypedResults[index];

      const kyselyFaster = kyselyResult.averageResponseTime < pgTypedResult.averageResponseTime;
      const performanceDifference = Math.abs(
        ((kyselyResult.averageResponseTime - pgTypedResult.averageResponseTime) /
         pgTypedResult.averageResponseTime) * 100
      );

      let recommendation = '';
      if (performanceDifference < 5) {
        recommendation = 'Performance is comparable';
      } else if (kyselyFaster) {
        recommendation = `Kysely is ${performanceDifference.toFixed(1)}% faster - Good for migration`;
      } else {
        recommendation = `Kysely is ${performanceDifference.toFixed(1)}% slower - Investigate optimization`;
      }

      comparison[test.name] = {
        kyselyFaster,
        performanceDifference,
        recommendation
      };
    });

    return {
      kyselyResults,
      pgTypedResults,
      comparison
    };
  }
}

export default Phase3PerformanceValidator;