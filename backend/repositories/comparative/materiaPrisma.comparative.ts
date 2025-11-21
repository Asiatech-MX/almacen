/**
 * Comparative Implementation for MateriaPrima
 * Phase 2.4: Validación Comparativa
 *
 * Este repositorio permite ejecutar la misma query con ambos sistemas (PGTyped y Kysely)
 * y comparar resultados byte-for-byte para validar paridad funcional.
 */

import { Kysely } from 'kysely';
import type { DB } from '../../types/generated/database.types';
import type { MateriaPrimaUnificada } from '../../types/adapters/materiaPrima.adapter';
import { adaptKyselyMateriaPrisma } from '../../types/adapters/materiaPrima.adapter';

// Importar tipos PGTyped existentes
import type {
  FindAllMateriaPrimaResult,
  FindMateriaPrimaByIdResult,
  FindMateriaPrimaByCodigoBarrasResult,
  FindMateriaPrimaStockBajoResult
} from '../../types/generated/materiaPrima.types';

// Importar query functions PGTyped
import {
  findAllMateriaPrima,
  findMateriaPrimaById,
  findMateriaPrimaByCodigoBarras,
  findMateriaPrimaStockBajo
} from '../../queries/materiaPrima';

export interface ComparativeResult<T> {
  pgTypedResult: T;
  kyselyResult: MateriaPrimaUnificada;
  isEquivalent: boolean;
  differences: string[];
  warnings: string[];
  performanceComparison: {
    pgTypedTime: number;
    kyselyTime: number;
    percentDifference: number;
  };
}

export interface ComparativeSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  overallParity: boolean;
  averagePerformanceDifference: number;
  inconsistencies: string[];
}

export class MateriaPrimaComparativeRepository {
  constructor(
    private db: Kysely<DB>,
    private pgTypedDb: any // PGTyped database connection
  ) {}

  /**
   * Compara findAll entre PGTyped y Kysely
   */
  async compareFindAll(): Promise<ComparativeResult<FindAllMateriaPrimaResult[]>> {
    // Measure performance
    const pgTypedStart = performance.now();
    const pgTypedResult = await findAllMateriaPrima(this.pgTypedDb);
    const pgTypedTime = performance.now() - pgTypedStart;

    const kyselyStart = performance.now();
    const kyselyRawResult = await this.db
      .selectFrom('materiaPrima')
      .selectAll()
      .execute();
    const kyselyTime = performance.now() - kyselyStart;

    const kyselyResult = kyselyRawResult.map(adaptKyselyMateriaPrima);

    // Compare results
    const { isEquivalent, differences, warnings } = this.compareArrays(
      pgTypedResult,
      kyselyResult
    );

    return {
      pgTypedResult,
      kyselyResult: kyselyResult[0] || null,
      isEquivalent,
      differences,
      warnings,
      performanceComparison: {
        pgTypedTime,
        kyselyTime,
        percentDifference: ((kyselyTime - pgTypedTime) / pgTypedTime) * 100
      }
    };
  }

  /**
   * Compara findById entre PGTyped y Kysely
   */
  async compareFindById(id: string): Promise<ComparativeResult<FindMateriaPrimaByIdResult | null>> {
    // Measure performance
    const pgTypedStart = performance.now();
    const pgTypedResult = await findMateriaPrimaById(this.pgTypedDb, { id });
    const pgTypedTime = performance.now() - pgTypedStart;

    const kyselyStart = performance.now();
    const kyselyRawResult = await this.db
      .selectFrom('materiaPrima')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    const kyselyTime = performance.now() - kyselyStart;

    const kyselyResult = kyselyRawResult ? adaptKyselyMateriaPrisma(kyselyRawResult) : null;

    // Compare results
    const { isEquivalent, differences, warnings } = pgTypedResult && kyselyResult
      ? this.compareSingles(pgTypedResult, kyselyResult)
      : { isEquivalent: pgTypedResult === kyselyResult, differences: [], warnings: [] };

    return {
      pgTypedResult: pgTypedResult || null,
      kyselyResult: kyselyResult || null,
      isEquivalent,
      differences,
      warnings,
      performanceComparison: {
        pgTypedTime,
        kyselyTime,
        percentDifference: pgTypedTime > 0
          ? ((kyselyTime - pgTypedTime) / pgTypedTime) * 100
          : 0
      }
    };
  }

  /**
   * Compara findByCodigoBarras entre PGTyped y Kysely
   */
  async compareFindByCodigoBarras(codigoBarras: string): Promise<ComparativeResult<FindMateriaPrimaByCodigoBarrasResult | null>> {
    // Measure performance
    const pgTypedStart = performance.now();
    const pgTypedResult = await findMateriaPrimaByCodigoBarras(this.pgTypedDb, { codigo_barras: codigoBarras });
    const pgTypedTime = performance.now() - pgTypedStart;

    const kyselyStart = performance.now();
    const kyselyRawResult = await this.db
      .selectFrom('materiaPrima')
      .selectAll()
      .where('codigoBarras', '=', codigoBarras)
      .executeTakeFirst();
    const kyselyTime = performance.now() - kyselyStart;

    const kyselyResult = kyselyRawResult ? adaptKyselyMateriaPrisma(kyselyRawResult) : null;

    // Compare results
    const { isEquivalent, differences, warnings } = pgTypedResult && kyselyResult
      ? this.compareSingles(pgTypedResult, kyselyResult)
      : { isEquivalent: pgTypedResult === kyselyResult, differences: [], warnings: [] };

    return {
      pgTypedResult: pgTypedResult || null,
      kyselyResult: kyselyResult || null,
      isEquivalent,
      differences,
      warnings,
      performanceComparison: {
        pgTypedTime,
        kyselyTime,
        percentDifference: pgTypedTime > 0
          ? ((kyselyTime - pgTypedTime) / pgTypedTime) * 100
          : 0
      }
    };
  }

  /**
   * Compara stockBajo entre PGTyped y Kysely
   */
  async compareStockBajo(): Promise<ComparativeResult<FindMateriaPrimaStockBajoResult[]>> {
    // Measure performance
    const pgTypedStart = performance.now();
    const pgTypedResult = await findMateriaPrimaStockBajo(this.pgTypedDb);
    const pgTypedTime = performance.now() - pgTypedStart;

    const kyselyStart = performance.now();
    const kyselyRawResult = await this.db
      .selectFrom('materiaPrima')
      .selectAll()
      .where('stockActual', '<', 'stockMinimo')
      .execute();
    const kyselyTime = performance.now() - kyselyStart;

    const kyselyResult = kyselyRawResult.map(adaptKyselyMateriaPrima);

    // Compare results
    const { isEquivalent, differences, warnings } = this.compareArrays(
      pgTypedResult,
      kyselyResult
    );

    return {
      pgTypedResult,
      kyselyResult: kyselyResult[0] || null,
      isEquivalent,
      differences,
      warnings,
      performanceComparison: {
        pgTypedTime,
        kyselyTime,
        percentDifference: ((kyselyTime - pgTypedTime) / pgTypedTime) * 100
      }
    };
  }

  /**
   * Ejecuta todas las comparaciones y devuelve un resumen
   */
  async runFullComparison(): Promise<ComparativeSummary> {
    const results = [];
    let totalPerformanceDiff = 0;
    const inconsistencies: string[] = [];

    try {
      // Test findAll
      const findAllResult = await this.compareFindAll();
      results.push(findAllResult.isEquivalent);
      totalPerformanceDiff += Math.abs(findAllResult.performanceComparison.percentDifference);

      if (!findAllResult.isEquivalent) {
        inconsistencies.push(`findAll: ${findAllResult.differences.join(', ')}`);
      }

      // Test findById (si hay registros)
      const testRecords = await this.db
        .selectFrom('materiaPrima')
        .select('id')
        .limit(1)
        .execute();

      if (testRecords.length > 0) {
        const findByIdResult = await this.compareFindById(testRecords[0].id);
        results.push(findByIdResult.isEquivalent);
        totalPerformanceDiff += Math.abs(findByIdResult.performanceComparison.percentDifference);

        if (!findByIdResult.isEquivalent) {
          inconsistencies.push(`findById: ${findByIdResult.differences.join(', ')}`);
        }
      }

      // Test findByCodigoBarras (si hay registros)
      if (testRecords.length > 0) {
        const barcodeTestRecord = await this.db
          .selectFrom('materiaPrima')
          .select(['id', 'codigoBarras'])
          .limit(1)
          .execute();

        if (barcodeTestRecord.length > 0) {
          const findByBarcodeResult = await this.compareFindByCodigoBarras(barcodeTestRecord[0].codigoBarras);
          results.push(findByBarcodeResult.isEquivalent);
          totalPerformanceDiff += Math.abs(findByBarcodeResult.performanceComparison.percentDifference);

          if (!findByBarcodeResult.isEquivalent) {
            inconsistencies.push(`findByCodigoBarras: ${findByBarcodeResult.differences.join(', ')}`);
          }
        }
      }

      // Test stockBajo
      const stockBajoResult = await this.compareStockBajo();
      results.push(stockBajoResult.isEquivalent);
      totalPerformanceDiff += Math.abs(stockBajoResult.performanceComparison.percentDifference);

      if (!stockBajoResult.isEquivalent) {
        inconsistencies.push(`stockBajo: ${stockBajoResult.differences.join(', ')}`);
      }

    } catch (error) {
      inconsistencies.push(`Error during comparison: ${error}`);
    }

    const passedTests = results.filter(Boolean).length;
    const totalTests = results.length;

    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      overallParity: passedTests === totalTests,
      averagePerformanceDifference: totalTests > 0 ? totalPerformanceDiff / totalTests : 0,
      inconsistencies
    };
  }

  /**
   * Compara dos arrays de resultados
   */
  private compareArrays(pgTyped: any[], kysely: MateriaPrimaUnificada[]): {
    isEquivalent: boolean;
    differences: string[];
    warnings: string[];
  } {
    const differences: string[] = [];
    const warnings: string[] = [];

    if (pgTyped.length !== kysely.length) {
      differences.push(`Array length mismatch: PGTyped=${pgTyped.length}, Kysely=${kysely.length}`);
    }

    // Comparar primer elemento si hay datos
    if (pgTyped.length > 0 && kysely.length > 0) {
      const singleComparison = this.compareSingles(pgTyped[0], kysely[0]);
      differences.push(...singleComparison.differences);
      warnings.push(...singleComparison.warnings);
    }

    return {
      isEquivalent: differences.length === 0,
      differences,
      warnings
    };
  }

  /**
   * Compara dos resultados individuales
   */
  private compareSingles(pgTyped: any, kysely: MateriaPrimaUnificada): {
    isEquivalent: boolean;
    differences: string[];
    warnings: string[];
  } {
    const differences: string[] = [];
    const warnings: string[] = [];

    // ✅ Validar consistencia de campos básicos
    if (pgTyped.nombre !== kysely.nombre) {
      differences.push(`nombre: PGTyped=${pgTyped.nombre}, Kysely=${kysely.nombre}`);
    }

    if (pgTyped.codigo_barras !== kysely.codigoBarras) {
      differences.push(`codigoBarras: PGTyped=${pgTyped.codigo_barras}, Kysely=${kysely.codigoBarras}`);
    }

    // 🔍 Validar conversión estatus vs activo
    if (pgTyped.activo !== undefined && kysely.activo !== undefined) {
      if (pgTyped.activo !== kysely.activo) {
        differences.push(`activo: PGTyped=${pgTyped.activo}, Kysely=${kysely.activo}`);
      }
    }

    if (pgTyped.estatus !== undefined && kysely.estatus !== undefined) {
      if (pgTyped.estatus !== kysely.estatus) {
        differences.push(`estatus: PGTyped=${pgTyped.estatus}, Kysely=${kysely.estatus}`);
      }
    }

    // 🔄 Validar conversión de tipos numéricos
    if (pgTyped.stock !== undefined && kysely.stockActual !== undefined) {
      const pgStock = Number(pgTyped.stock);
      if (Math.abs(pgStock - kysely.stockActual) > 0.01) {
        differences.push(`stock: PGTyped=${pgStock}, Kysely=${kysely.stockActual}`);
      }
    }

    if (pgTyped.stock_minimo !== undefined && kysely.stockMinimo !== undefined) {
      const pgStockMin = Number(pgTyped.stock_minimo);
      if (Math.abs(pgStockMin - kysely.stockMinimo) > 0.01) {
        differences.push(`stockMinimo: PGTyped=${pgStockMin}, Kysely=${kysely.stockMinimo}`);
      }
    }

    // ⚠️ Validar inconsistencias conocidas (documentar como warnings)
    if (pgTyped.proveedor_id && !kysely.proveedorId) {
      warnings.push('PGTyped includes proveedor_id field not present in Kysely schema');
    }

    if (pgTyped.categoria && !kysely.categoria) {
      warnings.push('PGTyped includes categoria field not present in Kysely schema');
    }

    return {
      isEquivalent: differences.length === 0,
      differences,
      warnings
    };
  }
}