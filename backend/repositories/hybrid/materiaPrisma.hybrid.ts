/**
 * Hybrid Repository for MateriaPrima
 * Phase 2.5: Feature Flags Implementation
 *
 * Este repositorio utiliza feature flags para cambiar dinámicamente entre
 * PGTyped y Kysely, con capacidad de ejecutar ambos en modo comparativo.
 */

import { Kysely } from 'kysely';
import type { DB } from '../../types/generated/database.types';
import type { MateriaPrimaUnificada } from '../../types/adapters/materiaPrima.adapter';
import { adaptKyselyMateriaPrisma, adaptToKyselyMateriaPrisma } from '../../types/adapters/materiaPrima.adapter';
import { MateriaPrimaComparativeRepository } from '../comparative/materiaPrisma.comparative';
import {
  isKyselyEnabled,
  isComparativeModeEnabled,
  isPerformanceMonitoringEnabled,
  isTypeValidationEnabled,
  featureFlagManager
} from '../../config/featureFlags';

// Importar tipos y funciones PGTyped
import type {
  FindAllMateriaPrimaResult,
  FindMateriaPrimaByIdResult,
  FindMateriaPrimaByCodigoBarrasResult,
  FindMateriaPrimaStockBajoResult
} from '../../types/generated/materiaPrima.types';

import {
  findAllMateriaPrima,
  findMateriaPrimaById,
  findMateriaPrimaByCodigoBarras,
  findMateriaPrimaStockBajo
} from '../../queries/materiaPrima';

export interface HybridQueryResult<T> {
  data: T;
  usedKysely: boolean;
  performanceMetrics: {
    executionTime: number;
    system: 'kysely' | 'pgtyped';
  };
  comparativeResult?: any;
  validationWarnings?: string[];
  metadata?: {
    featureFlagsUsed: string[];
    operationContext: any;
  };
}

export interface CreateMateriaPrimaInput {
  nombre: string;
  codigoBarras: string;
  presentacion: string;
  categoria?: string | null;
  costoUnitario?: number | null;
  descripcion?: string | null;
  fechaCaducidad?: Date | null;
  imagenUrl?: string | null;
  marca?: string | null;
  modelo?: string | null;
  proveedorId?: string | null;
  stockActual?: number;
  stockMinimo?: number;
  estatus?: 'ACTIVO' | 'INACTIVO';
}

export interface UpdateMateriaPrimaInput {
  nombre?: string;
  categoria?: string | null;
  costoUnitario?: number | null;
  descripcion?: string | null;
  fechaCaducidad?: Date | null;
  imagenUrl?: string | null;
  marca?: string | null;
  modelo?: string | null;
  proveedorId?: string | null;
  stockActual?: number;
  stockMinimo?: number;
  estatus?: 'ACTIVO' | 'INACTIVO';
}

export class MateriaPrismaHybridRepository {
  private comparativeRepository: MateriaPrimaComparativeRepository;

  constructor(
    private kyselyDb: Kysely<DB>,
    private pgTypedDb: any
  ) {
    this.comparativeRepository = new MateriaPrimaComparativeRepository(kyselyDb, pgTypedDb);
  }

  /**
   * Lista todos los materiales (usando el sistema seleccionado por feature flags)
   */
  async findAll(context?: any): Promise<HybridQueryResult<MateriaPrimaUnificada[]>> {
    const startTime = performance.now();
    const featureFlagsUsed: string[] = [];

    // Determinar qué sistema usar
    const useKysely = isKyselyEnabled('materiaPrima', context);
    const useComparative = isComparativeModeEnabled(context);
    const enablePerformance = isPerformanceMonitoringEnabled(context);
    const enableTypeValidation = isTypeValidationEnabled(context);

    if (useKysely) featureFlagsUsed.push('materiaPrimaKysely');
    if (useComparative) featureFlagsUsed.push('comparativeMode');
    if (enablePerformance) featureFlagsUsed.push('performanceMonitoring');
    if (enableTypeValidation) featureFlagsUsed.push('typeValidation');

    let data: MateriaPrimaUnificada[] = [];
    let usedKysely = false;
    let comparativeResult: any;
    const validationWarnings: string[] = [];

    try {
      if (useComparative) {
        // 🔍 Modo comparativo: ejecutar ambos y comparar
        const comparison = await this.comparativeRepository.compareFindAll();
        comparativeResult = comparison;

        if (!comparison.isEquivalent) {
          validationWarnings.push(
            `Diferencias detectadas: ${comparison.differences.join(', ')}`
          );
        }

        // Usar resultado de Kysely si está habilitado, sino PGTyped
        if (useKysely) {
          data = comparison.kyselyResult ? [comparison.kyselyResult] : [];
          usedKysely = true;
        } else {
          data = comparison.pgTypedResult.map(item => this.adaptPGTypedToUnified(item));
          usedKysely = false;
        }

        if (comparison.warnings.length > 0) {
          validationWarnings.push(...comparison.warnings);
        }
      } else if (useKysely) {
        // 🚀 Usar Kysely directamente
        const kyselyResults = await this.kyselyDb
          .selectFrom('materiaPrima')
          .selectAll()
          .execute();

        data = kyselyResults.map(adaptKyselyMateriaPrima);
        usedKysely = true;
      } else {
        // 🔙 Usar PGTyped (fallback)
        const pgTypedResults = await findAllMateriaPrima(this.pgTypedDb);
        data = pgTypedResults.map(item => this.adaptPGTypedToUnified(item));
        usedKysely = false;
      }

      // 🔍 Validación de tipos si está habilitada
      if (enableTypeValidation) {
        data.forEach(item => {
          const validation = this.validateMateriaPrima(item);
          if (!validation.isValid) {
            validationWarnings.push(
              `Error de validación en ${item.id}: ${validation.errors.join(', ')}`
            );
          }
        });
      }

    } catch (error) {
      // 🚨 Error handling con fallback automático
      console.error('Error en MateriaPrima.findAll:', error);

      if (useKysely) {
        // Intentar con PGTyped como fallback
        try {
          const pgTypedResults = await findAllMateriaPrima(this.pgTypedDb);
          data = pgTypedResults.map(item => this.adaptPGTypedToUnified(item));
          usedKysely = false;
          validationWarnings.push('Fallback a PGTyped debido a error en Kysely');
        } catch (fallbackError) {
          throw new Error(`Error en ambos sistemas: Kysely (${error}) y PGTyped (${fallbackError})`);
        }
      } else {
        throw error;
      }
    }

    const executionTime = performance.now() - startTime;

    return {
      data,
      usedKysely,
      performanceMetrics: {
        executionTime,
        system: usedKysely ? 'kysely' : 'pgtyped'
      },
      comparativeResult,
      validationWarnings,
      metadata: {
        featureFlagsUsed,
        operationContext: context
      }
    };
  }

  /**
   * Busca material por ID
   */
  async findById(id: string, context?: any): Promise<HybridQueryResult<MateriaPrimaUnificada | null>> {
    const startTime = performance.now();
    const featureFlagsUsed: string[] = [];

    const useKysely = isKyselyEnabled('materiaPrima', context);
    const useComparative = isComparativeModeEnabled(context);
    const enablePerformance = isPerformanceMonitoringEnabled(context);
    const enableTypeValidation = isTypeValidationEnabled(context);

    if (useKysely) featureFlagsUsed.push('materiaPrimaKysely');
    if (useComparative) featureFlagsUsed.push('comparativeMode');
    if (enablePerformance) featureFlagsUsed.push('performanceMonitoring');
    if (enableTypeValidation) featureFlagsUsed.push('typeValidation');

    let data: MateriaPrimaUnificada | null = null;
    let usedKysely = false;
    let comparativeResult: any;
    const validationWarnings: string[] = [];

    try {
      if (useComparative) {
        // Modo comparativo
        const comparison = await this.comparativeRepository.compareFindById(id);
        comparativeResult = comparison;

        if (!comparison.isEquivalent && comparison.pgTypedResult && comparison.kyselyResult) {
          validationWarnings.push(
            `Diferencias detectadas: ${comparison.differences.join(', ')}`
          );
        }

        data = useKysely ? comparison.kyselyResult : comparison.pgTypedResult
          ? this.adaptPGTypedToUnified(comparison.pgTypedResult)
          : null;
        usedKysely = useKysely;
      } else if (useKysely) {
        // Usar Kysely directamente
        const kyselyResult = await this.kyselyDb
          .selectFrom('materiaPrima')
          .selectAll()
          .where('id', '=', id)
          .executeTakeFirst();

        data = kyselyResult ? adaptKyselyMateriaPrisma(kyselyResult) : null;
        usedKysely = true;
      } else {
        // Usar PGTyped
        const pgTypedResult = await findMateriaPrimaById(this.pgTypedDb, { id });
        data = pgTypedResult ? this.adaptPGTypedToUnified(pgTypedResult) : null;
        usedKysely = false;
      }

      // Validación de tipos
      if (enableTypeValidation && data) {
        const validation = this.validateMateriaPrima(data);
        if (!validation.isValid) {
          validationWarnings.push(
            `Error de validación: ${validation.errors.join(', ')}`
          );
        }
      }

    } catch (error) {
      console.error('Error en MateriaPrima.findById:', error);

      if (useKysely) {
        try {
          const pgTypedResult = await findMateriaPrimaById(this.pgTypedDb, { id });
          data = pgTypedResult ? this.adaptPGTypedToUnified(pgTypedResult) : null;
          usedKysely = false;
          validationWarnings.push('Fallback a PGTyped debido a error en Kysely');
        } catch (fallbackError) {
          throw new Error(`Error en ambos sistemas: Kysely (${error}) y PGTyped (${fallbackError})`);
        }
      } else {
        throw error;
      }
    }

    const executionTime = performance.now() - startTime;

    return {
      data,
      usedKysely,
      performanceMetrics: {
        executionTime,
        system: usedKysely ? 'kysely' : 'pgtyped'
      },
      comparativeResult,
      validationWarnings,
      metadata: {
        featureFlagsUsed,
        operationContext: context
      }
    };
  }

  /**
   * Busca material por código de barras
   */
  async findByCodigoBarras(
    codigoBarras: string,
    context?: any
  ): Promise<HybridQueryResult<MateriaPrimaUnificada | null>> {
    const startTime = performance.now();
    const featureFlagsUsed: string[] = [];

    const useKysely = isKyselyEnabled('materiaPrima', context);
    const useComparative = isComparativeModeEnabled(context);

    if (useKysely) featureFlagsUsed.push('materiaPrimaKysely');
    if (useComparative) featureFlagsUsed.push('comparativeMode');

    let data: MateriaPrimaUnificada | null = null;
    let usedKysely = false;
    let comparativeResult: any;

    try {
      if (useComparative) {
        const comparison = await this.comparativeRepository.compareFindByCodigoBarras(codigoBarras);
        comparativeResult = comparison;
        data = useKysely ? comparison.kyselyResult : comparison.pgTypedResult
          ? this.adaptPGTypedToUnified(comparison.pgTypedResult)
          : null;
        usedKysely = useKysely;
      } else if (useKysely) {
        const kyselyResult = await this.kyselyDb
          .selectFrom('materiaPrima')
          .selectAll()
          .where('codigoBarras', '=', codigoBarras)
          .executeTakeFirst();

        data = kyselyResult ? adaptKyselyMateriaPrisma(kyselyResult) : null;
        usedKysely = true;
      } else {
        const pgTypedResult = await findMateriaPrimaByCodigoBarras(this.pgTypedDb, { codigo_barras: codigoBarras });
        data = pgTypedResult ? this.adaptPGTypedToUnified(pgTypedResult) : null;
        usedKysely = false;
      }
    } catch (error) {
      console.error('Error en MateriaPrima.findByCodigoBarras:', error);

      if (useKysely) {
        try {
          const pgTypedResult = await findMateriaPrimaByCodigoBarras(this.pgTypedDb, { codigo_barras: codigoBarras });
          data = pgTypedResult ? this.adaptPGTypedToUnified(pgTypedResult) : null;
          usedKysely = false;
        } catch (fallbackError) {
          throw new Error(`Error en ambos sistemas: Kysely (${error}) y PGTyped (${fallbackError})`);
        }
      } else {
        throw error;
      }
    }

    const executionTime = performance.now() - startTime;

    return {
      data,
      usedKysely,
      performanceMetrics: {
        executionTime,
        system: usedKysely ? 'kysely' : 'pgtyped'
      },
      comparativeResult,
      metadata: {
        featureFlagsUsed,
        operationContext: context
      }
    };
  }

  /**
   * Obtiene materiales con stock bajo
   */
  async getStockBajo(context?: any): Promise<HybridQueryResult<MateriaPrimaUnificada[]>> {
    const startTime = performance.now();
    const featureFlagsUsed: string[] = [];

    const useKysely = isKyselyEnabled('materiaPrima', context);
    const useComparative = isComparativeModeEnabled(context);

    if (useKysely) featureFlagsUsed.push('materiaPrimaKysely');
    if (useComparative) featureFlagsUsed.push('comparativeMode');

    let data: MateriaPrimaUnificada[] = [];
    let usedKysely = false;
    let comparativeResult: any;

    try {
      if (useComparative) {
        const comparison = await this.comparativeRepository.compareStockBajo();
        comparativeResult = comparison;
        data = useKysely && comparison.kyselyResult ? [comparison.kyselyResult]
          : comparison.pgTypedResult.map(item => this.adaptPGTypedToUnified(item));
        usedKysely = useKysely;
      } else if (useKysely) {
        const kyselyResults = await this.kyselyDb
          .selectFrom('materiaPrima')
          .selectAll()
          .where('stockActual', '<', 'stockMinimo')
          .execute();

        data = kyselyResults.map(adaptKyselyMateriaPrima);
        usedKysely = true;
      } else {
        const pgTypedResults = await findMateriaPrimaStockBajo(this.pgTypedDb);
        data = pgTypedResults.map(item => this.adaptPGTypedToUnified(item));
        usedKysely = false;
      }
    } catch (error) {
      console.error('Error en MateriaPrima.getStockBajo:', error);

      if (useKysely) {
        try {
          const pgTypedResults = await findMateriaPrimaStockBajo(this.pgTypedDb);
          data = pgTypedResults.map(item => this.adaptPGTypedToUnified(item));
          usedKysely = false;
        } catch (fallbackError) {
          throw new Error(`Error en ambos sistemas: Kysely (${error}) y PGTyped (${fallbackError})`);
        }
      } else {
        throw error;
      }
    }

    const executionTime = performance.now() - startTime;

    return {
      data,
      usedKysely,
      performanceMetrics: {
        executionTime,
        system: usedKysely ? 'kysely' : 'pgtyped'
      },
      comparativeResult,
      metadata: {
        featureFlagsUsed,
        operationContext: context
      }
    };
  }

  /**
   * Crea un nuevo material (solo Kysely para escrituras)
   */
  async create(input: CreateMateriaPrimaInput, context?: any): Promise<HybridQueryResult<MateriaPrimaUnificada>> {
    const startTime = performance.now();
    const useKysely = isKyselyEnabled('materiaPrima', context) && isKyselyEnabled('writeOperations', context);

    if (!useKysely) {
      throw new Error('Operaciones de escritura con Kysely no están habilitadas');
    }

    // Convertir a formato Kysely
    const kyselyInput = adaptToKyselyMateriaPrisma({
      ...input,
      estatus: input.estatus || 'ACTIVO',
      stockActual: input.stockActual || 0,
      stockMinimo: input.stockMinimo || 0
    });

    const result = await this.kyselyDb
      .insertInto('materiaPrima')
      .values({
        ...kyselyInput,
        id: `mp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generar UUID
        creadoEn: new Date(),
        actualizadoEn: new Date()
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const data = adaptKyselyMateriaPrisma(result);
    const executionTime = performance.now() - startTime;

    return {
      data,
      usedKysely: true,
      performanceMetrics: {
        executionTime,
        system: 'kysely'
      },
      metadata: {
        featureFlagsUsed: ['materiaPrimaKysely', 'writeOperationsKysely'],
        operationContext: context
      }
    };
  }

  /**
   * Actualiza un material existente
   */
  async update(
    id: string,
    input: UpdateMateriaPrimaInput,
    context?: any
  ): Promise<HybridQueryResult<MateriaPrimaUnificada>> {
    const startTime = performance.now();
    const useKysely = isKyselyEnabled('materiaPrima', context) && isKyselyEnabled('writeOperations', context);

    if (!useKysely) {
      throw new Error('Operaciones de escritura con Kysely no están habilitadas');
    }

    const kyselyInput = adaptToKyselyMateriaPrisma(input);
    kyselyInput.actualizadoEn = new Date();

    const result = await this.kyselyDb
      .updateTable('materiaPrima')
      .set(kyselyInput)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    const data = adaptKyselyMateriaPrisma(result);
    const executionTime = performance.now() - startTime;

    return {
      data,
      usedKysely: true,
      performanceMetrics: {
        executionTime,
        system: 'kysely'
      },
      metadata: {
        featureFlagsUsed: ['materiaPrimaKysely', 'writeOperationsKysely'],
        operationContext: context
      }
    };
  }

  /**
   * Elimina un material
   */
  async delete(id: string, context?: any): Promise<HybridQueryResult<void>> {
    const startTime = performance.now();
    const useKysely = isKyselyEnabled('materiaPrima', context) && isKyselyEnabled('writeOperations', context);

    if (!useKysely) {
      throw new Error('Operaciones de escritura con Kysely no están habilitadas');
    }

    await this.kyselyDb
      .deleteFrom('materiaPrima')
      .where('id', '=', id)
      .execute();

    const executionTime = performance.now() - startTime;

    return {
      data: undefined,
      usedKysely: true,
      performanceMetrics: {
        executionTime,
        system: 'kysely'
      },
      metadata: {
        featureFlagsUsed: ['materiaPrimaKysely', 'writeOperationsKysely'],
        operationContext: context
      }
    };
  }

  /**
   * Adaptador de PGTyped a interfaz unificada (implementación básica)
   */
  private adaptPGTypedToUnified(pgTyped: any): MateriaPrimaUnificada {
    return {
      id: pgTyped.id || String(pgTyped.id_materia_prima || ''),
      nombre: pgTyped.nombre || '',
      codigoBarras: pgTyped.codigo_barras || pgTyped.codigoBarras || '',
      presentacion: pgTyped.presentacion || '',
      estatus: pgTyped.estatus || (pgTyped.activo ? 'ACTIVO' : 'INACTIVO'),
      activo: pgTyped.activo,
      stockActual: Number(pgTyped.stock_actual || pgTyped.stock || pgTyped.stockActual || 0),
      stockMinimo: Number(pgTyped.stock_minimo || pgTyped.stockMinimo || 0),
      categoria: pgTyped.categoria || null,
      costoUnitario: pgTyped.costo_unitario ? Number(pgTyped.costo_unitario) : null,
      descripcion: pgTyped.descripcion || null,
      fechaCaducidad: pgTyped.fecha_caducidad ? new Date(pgTyped.fecha_caducidad) : null,
      imagenUrl: pgTyped.imagen_url || null,
      marca: pgTyped.marca || null,
      modelo: pgTyped.modelo || null,
      proveedorId: pgTyped.proveedor_id || null,
      creadoEn: pgTyped.creado_en ? new Date(pgTyped.creado_en) : null,
      actualizadoEn: pgTyped.actualizado_en ? new Date(pgTyped.actualizado_en) : null,
      eliminadoEn: pgTyped.eliminado_en ? new Date(pgTyped.eliminado_en) : null
    };
  }

  /**
   * Validación básica de MateriaPrima
   */
  private validateMateriaPrima(item: MateriaPrimaUnificada): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!item.id || item.id.trim() === '') {
      errors.push('ID es requerido');
    }

    if (!item.nombre || item.nombre.trim() === '') {
      errors.push('Nombre es requerido');
    }

    if (!item.codigoBarras || item.codigoBarras.trim() === '') {
      errors.push('Código de barras es requerido');
    }

    if (!item.presentacion || item.presentacion.trim() === '') {
      errors.push('Presentación es requerida');
    }

    if (isNaN(item.stockActual) || item.stockActual < 0) {
      errors.push('Stock actual debe ser un número mayor o igual a 0');
    }

    if (isNaN(item.stockMinimo) || item.stockMinimo < 0) {
      errors.push('Stock mínimo debe ser un número mayor o igual a 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}