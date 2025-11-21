import { PerformanceBaseline } from './baseline';
import { writeFileSync } from 'fs';
import { join } from 'path';

describe('Performance Baseline Tests', () => {
  let baseline: PerformanceBaseline;

  beforeAll(async () => {
    baseline = new PerformanceBaseline();
  });

  it('should establish performance baseline for PGTyped queries', async () => {
    console.log('🏁 Running Performance Baseline Tests...');

    // Run baseline with different record counts
    const metrics = await baseline.runBaseline([10, 50]);

    // Verify we have metrics for all query types
    expect(metrics.materiaPrima.findAll.length).toBeGreaterThan(0);
    expect(metrics.materiaPrima.findById.length).toBeGreaterThan(0);
    expect(metrics.materiaPrima.search.length).toBeGreaterThan(0);
    expect(metrics.materiaPrima.lowStock.length).toBeGreaterThan(0);

    expect(metrics.proveedores.findAll.length).toBeGreaterThan(0);
    expect(metrics.proveedores.findById.length).toBeGreaterThan(0);
    expect(metrics.proveedores.search.length).toBeGreaterThan(0);

    // Verify performance is within acceptable ranges
    const findAllAvg = metrics.materiaPrima.findAll.reduce((sum, m) => sum + m.executionTime, 0) / metrics.materiaPrima.findAll.length;
    const findByIdAvg = metrics.materiaPrima.findById.reduce((sum, m) => sum + m.executionTime, 0) / metrics.materiaPrima.findById.length;

    console.log(`📈 FindAll Average: ${findAllAvg.toFixed(2)}ms`);
    console.log(`📈 FindById Average: ${findByIdAvg.toFixed(2)}ms`);

    // Performance budgets (these can be adjusted based on requirements)
    expect(findAllAvg).toBeLessThan(1000); // 1 second for 100 records
    expect(findByIdAvg).toBeLessThan(100); // 100ms for single record

    // Generate and save report
    const report = baseline.generateReport();
    const reportPath = join(__dirname, '../../docs/PHASE1_PERFORMANCE_BASELINE.md');
    writeFileSync(reportPath, report);

    console.log(`📄 Performance report saved to: ${reportPath}`);
  }, 120000); // 2 minute timeout for performance tests

  it('should identify slow queries that need optimization', async () => {
    // Create a larger dataset to test performance under load
    await baseline.cleanup();
    const loadTestBaseline = new PerformanceBaseline();

    try {
      await loadTestBaseline.setupTestData(500); // 500 records
      await loadTestBaseline.measureMateriaPrimaQueries();
      await loadTestBaseline.measureProveedoresQueries();

      const metrics = loadTestBaseline.getMetrics();

      // Identify slow queries (>500ms)
      const slowQueries: string[] = [];

      Object.entries(metrics.materiaPrima).forEach(([queryName, queryMetrics]) => {
        const avgTime = queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) / queryMetrics.length;
        if (avgTime > 500) {
          slowQueries.push(`materiaPrima.${queryName}: ${avgTime.toFixed(2)}ms`);
        }
      });

      Object.entries(metrics.proveedores).forEach(([queryName, queryMetrics]) => {
        const avgTime = queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) / queryMetrics.length;
        if (avgTime > 500) {
          slowQueries.push(`proveedores.${queryName}: ${avgTime.toFixed(2)}ms`);
        }
      });

      if (slowQueries.length > 0) {
        console.log('⚠️  Slow queries identified:', slowQueries);
      } else {
        console.log('✅ All queries within performance targets');
      }

      // Log performance characteristics for migration planning
      console.log('📊 Performance Characteristics:');
      console.log(`- Materia Prima FindAll: ${metrics.materiaPrima.findAll[0]?.executionTime?.toFixed(2) || 'N/A'}ms`);
      console.log(`- Materia Prima FindById: ${metrics.materiaPrima.findById[0]?.executionTime?.toFixed(2) || 'N/A'}ms`);
      console.log(`- Proveedores FindAll: ${metrics.proveedores.findAll[0]?.executionTime?.toFixed(2) || 'N/A'}ms`);
      console.log(`- Proveedores FindById: ${metrics.proveedores.findById[0]?.executionTime?.toFixed(2) || 'N/A'}ms`);

    } finally {
      await loadTestBaseline.cleanup();
    }
  }, 120000);

  it('should measure memory usage patterns', async () => {
    await baseline.cleanup();
    baseline = new PerformanceBaseline();

    await baseline.setupTestData(100);
    await baseline.measureMateriaPrimaQueries();
    await baseline.measureProveedoresQueries();

    const metrics = baseline.getMetrics();

    // Analyze memory usage patterns
    const findAllMemory = metrics.materiaPrima.findAll.map(m => m.memoryUsage.heapUsed);
    const findByIdMemory = metrics.materiaPrima.findById.map(m => m.memoryUsage.heapUsed);

    console.log('💾 Memory Usage Analysis:');
    console.log(`- FindAll Memory: ${Math.max(...findAllMemory)} bytes peak`);
    console.log(`- FindById Memory: ${Math.max(...findByIdMemory)} bytes peak`);

    // Memory should be reasonable (less than 10MB for query execution)
    expect(Math.max(...findAllMemory)).toBeLessThan(10 * 1024 * 1024); // 10MB
    expect(Math.max(...findByIdMemory)).toBeLessThan(5 * 1024 * 1024); // 5MB
  });

  it('should document performance regression thresholds', async () => {
    // This test documents the performance regression thresholds
    // that will be used to validate the Kysely migration

    const thresholds = {
      findAllMateriaPrima: 1000, // ms
      findByIdMateriaPrima: 100,  // ms
      searchMateriaPrima: 500,   // ms
      findAllProveedores: 500,    // ms
      findByIdProveedores: 50,    // ms
      searchProveedores: 200,     // ms
    };

    console.log('🎯 Performance Regression Thresholds:');
    Object.entries(thresholds).forEach(([query, threshold]) => {
      console.log(`- ${query}: ${threshold}ms`);
    });

    // Save thresholds for migration validation
    const thresholdsData = {
      generated: new Date().toISOString(),
      thresholds,
      description: 'Maximum acceptable query execution times for migration validation',
      budget: '<5% degradation from these baseline values',
    };

    const thresholdsPath = join(__dirname, '../../docs/PHASE1_PERFORMANCE_THRESHOLDS.json');
    writeFileSync(thresholdsPath, JSON.stringify(thresholdsData, null, 2));

    console.log(`📄 Performance thresholds saved to: ${thresholdsPath}`);

    // Validate thresholds are reasonable
    expect(thresholds.findAllMateriaPrima).toBeGreaterThan(0);
    expect(thresholds.findByIdMateriaPrima).toBeLessThan(thresholds.findAllMateriaPrima);
    expect(thresholds.searchMateriaPrima).toBeLessThan(thresholds.findAllMateriaPrima);
  });
});