import { createTestDB, cleanupTestData, createTestInstitution, createTestMaterial, createTestProvider } from '../contract/helpers';

interface PerformanceMetric {
  queryName: string;
  executionTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  timestamp: Date;
  recordCount: number;
}

interface QueryPerformanceBaseline {
  materiaPrima: {
    findAll: PerformanceMetric[];
    findById: PerformanceMetric[];
    search: PerformanceMetric[];
    lowStock: PerformanceMetric[];
  };
  proveedores: {
    findAll: PerformanceMetric[];
    findById: PerformanceMetric[];
    search: PerformanceMetric[];
  };
}

export class PerformanceBaseline {
  private db: ReturnType<typeof createTestDB>;
  private metrics: QueryPerformanceBaseline = {
    materiaPrima: {
      findAll: [],
      findById: [],
      search: [],
      lowStock: [],
    },
    proveedores: {
      findAll: [],
      findById: [],
      search: [],
    },
  };

  constructor() {
    this.db = createTestDB();
  }

  async setupTestData(count: number = 100): Promise<void> {
    await cleanupTestData(this.db);
    const institutionId = await createTestInstitution(this.db);

    // Create test materials
    for (let i = 0; i < count; i++) {
      await createTestMaterial(this.db, institutionId, `TEST_MATERIAL_${i}`);
      await createTestProvider(this.db, institutionId, `TEST_PROVIDER_${i}`);
    }
  }

  private async measureQuery<T>(
    queryName: string,
    query: () => Promise<T[]>
  ): Promise<{ result: T[]; metric: PerformanceMetric }> {
    const startTime = process.hrtime.bigint();
    const memoryBefore = process.memoryUsage();

    const result = await query();

    const endTime = process.hrtime.bigint();
    const memoryAfter = process.memoryUsage();

    const executionTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

    const metric: PerformanceMetric = {
      queryName,
      executionTime,
      memoryUsage: {
        rss: memoryAfter.rss - memoryBefore.rss,
        heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
        heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
        external: memoryAfter.external - memoryBefore.external,
        arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers,
      },
      timestamp: new Date(),
      recordCount: result.length,
    };

    return { result, metric };
  }

  async measureMateriaPrimaQueries(): Promise<void> {
    // FindAll query
    const findAllQuery = () =>
      this.db
        .selectFrom('materia_prima as mp')
        .leftJoin('proveedor as p', '1=1')
        .select([
          'mp.id',
          'mp.codigo_barras',
          'mp.nombre',
          'mp.marca',
          'mp.modelo',
          'mp.presentacion',
          'mp.stock',
          'mp.stock_minimo',
          'mp.fecha_registro as creado_en',
          'mp.fecha_registro as actualizado_en',
          'mp.estatus',
          'p.nombre as proveedor_nombre',
          'p.rfc as proveedor_rfc',
        ])
        .orderBy('mp.nombre')
        .execute();

    const { metric: findAllMetric } = await this.measureQuery('materiaPrima.findAll', findAllQuery);
    this.metrics.materiaPrima.findAll.push(findAllMetric);

    // FindById query
    const findByIdQuery = () =>
      this.db
        .selectFrom('materia_prima as mp')
        .selectAll('mp')
        .leftJoin('proveedor as p', '1=1')
        .select([
          'p.nombre as proveedor_nombre',
          'p.rfc as proveedor_rfc',
          'p.telefono as proveedor_telefono',
          'p.email as proveedor_email',
        ])
        .where('mp.id', '=', 1)
        .where('mp.estatus', '=', 'ACTIVO')
        .execute();

    const { metric: findByIdMetric } = await this.measureQuery('materiaPrima.findById', findByIdQuery);
    this.metrics.materiaPrima.findById.push(findByIdMetric);

    // Search query
    const searchQuery = () =>
      this.db
        .selectFrom('materia_prima')
        .select([
          'id',
          'codigo_barras',
          'nombre',
          'marca',
          'presentacion',
          'stock',
          'stock_minimo',
          'imagen_url',
        ])
        .where('estatus', '=', 'ACTIVO')
        .where('nombre', 'ilike', '%TEST_MATERIAL_1%')
        .orderBy('nombre')
        .limit(10)
        .execute();

    const { metric: searchMetric } = await this.measureQuery('materiaPrima.search', searchQuery);
    this.metrics.materiaPrima.search.push(searchMetric);

    // Low stock query
    const lowStockQuery = () =>
      this.db
        .selectFrom('materia_prima')
        .select([
          'id',
          'codigo_barras',
          'nombre',
          'marca',
          'presentacion',
          'stock',
          'stock_minimo',
        ])
        .where('estatus', '=', 'ACTIVO')
        .where('stock', '<=', 0) // Will return results for our test data
        .orderBy('stock')
        .execute();

    const { metric: lowStockMetric } = await this.measureQuery('materiaPrima.lowStock', lowStockQuery);
    this.metrics.materiaPrima.lowStock.push(lowStockMetric);
  }

  async measureProveedoresQueries(): Promise<void> {
    // FindAll query
    const findAllQuery = () =>
      this.db
        .selectFrom('proveedor')
        .select([
          'id',
          'nombre',
          'rfc',
          'telefono',
          'email',
          'domicilio as direccion',
          'fecha_registro as creado_en',
          'fecha_registro as actualizado_en',
        ])
        .where('estatus', '=', 'ACTIVO')
        .orderBy('nombre')
        .execute();

    const { metric: findAllMetric } = await this.measureQuery('proveedores.findAll', findAllQuery);
    this.metrics.proveedores.findAll.push(findAllMetric);

    // FindById query
    const findByIdQuery = () =>
      this.db
        .selectFrom('proveedor')
        .selectAll()
        .where('id', '=', 1)
        .where('estatus', '=', 'ACTIVO')
        .execute();

    const { metric: findByIdMetric } = await this.measureQuery('proveedores.findById', findByIdQuery);
    this.metrics.proveedores.findById.push(findByIdMetric);

    // Search query
    const searchQuery = () =>
      this.db
        .selectFrom('proveedor')
        .select(['id', 'nombre', 'rfc', 'telefono', 'email'])
        .where('estatus', '=', 'ACTIVO')
        .where('nombre', 'ilike', '%TEST_PROVIDER_1%')
        .orderBy('nombre')
        .limit(10)
        .execute();

    const { metric: searchMetric } = await this.measureQuery('proveedores.search', searchQuery);
    this.metrics.proveedores.search.push(searchMetric);
  }

  async runBaseline(recordCounts: number[] = [10, 50, 100, 500]): Promise<QueryPerformanceBaseline> {
    console.log('🚀 Starting Performance Baseline Measurement...');

    for (const count of recordCounts) {
      console.log(`📊 Measuring with ${count} records...`);

      await this.setupTestData(count);

      // Run each query multiple times for average
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        await this.measureMateriaPrimaQueries();
        await this.measureProveedoresQueries();
      }

      console.log(`✅ Completed ${count} records measurement`);
    }

    await this.cleanup();
    return this.metrics;
  }

  async cleanup(): Promise<void> {
    await cleanupTestData(this.db);
    await this.db.destroy();
  }

  getMetrics(): QueryPerformanceBaseline {
    return this.metrics;
  }

  generateReport(): string {
    const report: string[] = [];
    report.push('# Performance Baseline Report');
    report.push(`Generated: ${new Date().toISOString()}`);
    report.push('');

    // Materia Prima Performance
    report.push('## Materia Prima Queries');
    Object.entries(this.metrics.materiaPrima).forEach(([queryName, metrics]) => {
      if (metrics.length === 0) return;

      const avgTime = metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length;
      const minTime = Math.min(...metrics.map(m => m.executionTime));
      const maxTime = Math.max(...metrics.map(m => m.executionTime));
      const avgRecords = metrics.reduce((sum, m) => sum + m.recordCount, 0) / metrics.length;

      report.push(`### ${queryName}`);
      report.push(`- Average Execution Time: ${avgTime.toFixed(2)}ms`);
      report.push(`- Min Execution Time: ${minTime.toFixed(2)}ms`);
      report.push(`- Max Execution Time: ${maxTime.toFixed(2)}ms`);
      report.push(`- Average Records Returned: ${avgRecords.toFixed(0)}`);
      report.push(`- Sample Count: ${metrics.length}`);
      report.push('');
    });

    // Proveedores Performance
    report.push('## Proveedores Queries');
    Object.entries(this.metrics.proveedores).forEach(([queryName, metrics]) => {
      if (metrics.length === 0) return;

      const avgTime = metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length;
      const minTime = Math.min(...metrics.map(m => m.executionTime));
      const maxTime = Math.max(...metrics.map(m => m.executionTime));
      const avgRecords = metrics.reduce((sum, m) => sum + m.recordCount, 0) / metrics.length;

      report.push(`### ${queryName}`);
      report.push(`- Average Execution Time: ${avgTime.toFixed(2)}ms`);
      report.push(`- Min Execution Time: ${minTime.toFixed(2)}ms`);
      report.push(`- Max Execution Time: ${maxTime.toFixed(2)}ms`);
      report.push(`- Average Records Returned: ${avgRecords.toFixed(0)}`);
      report.push(`- Sample Count: ${metrics.length}`);
      report.push('');
    });

    return report.join('\n');
  }
}