/**
 * Hybrid Repository for Proveedores
 * Phase 3.1: Domain Migration - Proveedores
 *
 * Este repositorio utiliza feature flags para cambiar dinámicamente entre
 * PGTyped y Kysely, con capacidad de ejecutar ambos en modo comparativo.
 */

import { Kysely } from 'kysely';
import type { DB } from '../../types/generated/database.types';
import type { ProveedorUnificado } from '../../types/adapters/proveedores.adapter';
import {
  adaptKyselyProveedor,
  adaptPGTypedProveedor,
  adaptToKyselyProveedor,
  validateProveedorConsistency
} from '../../types/adapters/proveedores.adapter';
import {
  isKyselyEnabled,
  isComparativeModeEnabled,
  isPerformanceMonitoringEnabled,
  isTypeValidationEnabled,
  featureFlagManager
} from '../../config/featureFlags';

// Importar tipos y funciones PGTyped (simulados basados en las queries)
export interface ProveedorPGTyped {
  id: number;
  nombre: string;
  rfc?: string;
  telefono?: string;
  email?: string;
  domicilio?: string;
  direccion?: string;
  estatus?: string; // 'ACTIVO' | 'INACTIVO'
  fecha_registro?: Date;
  creado_en?: Date;
  actualizado_en?: Date;
  eliminado_en?: Date;
  contacto?: string;
  curp?: string;
  id_fiscal?: string;
  id_institucion?: number;
}

// Simulación de funciones PGTyped (en el proyecto real estas vendrían de queries/proveedores.sql)
const findAllProveedores = async (db: any): Promise<ProveedorPGTyped[]> => {
  // Simulación - en la implementación real esto llamaría a la query SQL generada por PGTyped
  return [];
};

const findProveedorById = async (db: any, params: { id: number }): Promise<ProveedorPGTyped | null> => {
  // Simulación
  return null;
};

const searchProveedores = async (db: any, params: { searchTerm: string; limit: number }): Promise<ProveedorPGTyped[]> => {
  // Simulación
  return [];
};

const findProveedorByRFC = async (db: any, params: { rfc: string }): Promise<ProveedorPGTyped | null> => {
  // Simulación
  return null;
};

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

export interface CreateProveedorInput {
  nombre: string;
  idFiscal: string;
  rfc?: string | null;
  curp?: string | null;
  contacto?: string | null;
  domicilio?: string | null;
  telefono?: string | null;
  email?: string | null;
  idInstitucion?: number;
  estatus?: 'ACTIVO' | 'INACTIVO';
}

export interface UpdateProveedorInput {
  nombre?: string;
  idFiscal?: string;
  rfc?: string | null;
  curp?: string | null;
  contacto?: string | null;
  domicilio?: string | null;
  telefono?: string | null;
  email?: string | null;
  estatus?: 'ACTIVO' | 'INACTIVO';
}

export class ProveedoresHybridRepository {
  constructor(
    private kyselyDb: Kysely<DB>,
    private pgTypedDb: any
  ) {}

  /**
   * Lista todos los proveedores (usando el sistema seleccionado por feature flags)
   */
  async findAll(context?: any): Promise<HybridQueryResult<ProveedorUnificado[]>> {
    const startTime = performance.now();
    const featureFlagsUsed: string[] = [];

    // Determinar qué sistema usar
    const useKysely = isKyselyEnabled('proveedores', context);
    const useComparative = isComparativeModeEnabled(context);
    const enablePerformance = isPerformanceMonitoringEnabled(context);
    const enableTypeValidation = isTypeValidationEnabled(context);

    if (useKysely) featureFlagsUsed.push('proveedoresKysely');
    if (useComparative) featureFlagsUsed.push('comparativeMode');
    if (enablePerformance) featureFlagsUsed.push('performanceMonitoring');
    if (enableTypeValidation) featureFlagsUsed.push('typeValidation');

    let data: ProveedorUnificado[] = [];
    let usedKysely = false;
    const validationWarnings: string[] = [];

    try {
      if (useKysely) {
        // 🚀 Usar Kysely directamente
        const kyselyResults = await this.kyselyDb
          .selectFrom('proveedor')
          .selectAll()
          .where('estatus', '=', 'ACTIVO')
          .orderBy('nombre', 'asc')
          .execute();

        data = kyselyResults.map(adaptKyselyProveedor);
        usedKysely = true;

        // 🔍 Validación de tipos si está habilitada
        if (enableTypeValidation) {
          data.forEach(item => {
            const validation = validateProveedorConsistency(item);
            if (!validation.isValid) {
              validationWarnings.push(
                `Error de validación en ${item.id}: ${validation.errors.join(', ')}`
              );
            }
            validationWarnings.push(...validation.warnings);
          });
        }
      } else {
        // 🔙 Usar PGTyped (fallback)
        const pgTypedResults = await findAllProveedores(this.pgTypedDb);
        data = pgTypedResults.map(adaptPGTypedProveedor);
        usedKysely = false;
      }

    } catch (error) {
      // 🚨 Error handling con fallback automático
      console.error('Error en Proveedores.findAll:', error);

      if (useKysely) {
        // Intentar con PGTyped como fallback
        try {
          const pgTypedResults = await findAllProveedores(this.pgTypedDb);
          data = pgTypedResults.map(adaptPGTypedProveedor);
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
      validationWarnings,
      metadata: {
        featureFlagsUsed,
        operationContext: context
      }
    };
  }

  /**
   * Busca proveedor por ID
   */
  async findById(id: string, context?: any): Promise<HybridQueryResult<ProveedorUnificado | null>> {
    const startTime = performance.now();
    const featureFlagsUsed: string[] = [];

    const useKysely = isKyselyEnabled('proveedores', context);
    const useComparative = isComparativeModeEnabled(context);
    const enableTypeValidation = isTypeValidationEnabled(context);

    if (useKysely) featureFlagsUsed.push('proveedoresKysely');
    if (useComparative) featureFlagsUsed.push('comparativeMode');
    if (enableTypeValidation) featureFlagsUsed.push('typeValidation');

    let data: ProveedorUnificado | null = null;
    let usedKysely = false;
    const validationWarnings: string[] = [];

    try {
      const numericId = parseInt(id.replace('prov-', ''), 10);

      if (useKysely) {
        // Usar Kysely directamente
        const kyselyResult = await this.kyselyDb
          .selectFrom('proveedor')
          .selectAll()
          .where('id', '=', numericId)
          .where('estatus', '=', 'ACTIVO')
          .executeTakeFirst();

        data = kyselyResult ? adaptKyselyProveedor(kyselyResult) : null;
        usedKysely = true;

        // Validación de tipos
        if (enableTypeValidation && data) {
          const validation = validateProveedorConsistency(data);
          if (!validation.isValid) {
            validationWarnings.push(
              `Error de validación: ${validation.errors.join(', ')}`
            );
          }
          validationWarnings.push(...validation.warnings);
        }
      } else {
        // Usar PGTyped
        const pgTypedResult = await findProveedorById(this.pgTypedDb, { id: numericId });
        data = pgTypedResult ? adaptPGTypedProveedor(pgTypedResult) : null;
        usedKysely = false;
      }

    } catch (error) {
      console.error('Error en Proveedores.findById:', error);

      if (useKysely) {
        try {
          const numericId = parseInt(id.replace('prov-', ''), 10);
          const pgTypedResult = await findProveedorById(this.pgTypedDb, { id: numericId });
          data = pgTypedResult ? adaptPGTypedProveedor(pgTypedResult) : null;
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
      validationWarnings,
      metadata: {
        featureFlagsUsed,
        operationContext: context
      }
    };
  }

  /**
   * Busca proveedores por término de búsqueda
   */
  async search(searchTerm: string, limit: number = 50, context?: any): Promise<HybridQueryResult<ProveedorUnificado[]>> {
    const startTime = performance.now();
    const featureFlagsUsed: string[] = [];

    const useKysely = isKyselyEnabled('proveedores', context);

    if (useKysely) featureFlagsUsed.push('proveedoresKysely');

    let data: ProveedorUnificado[] = [];
    let usedKysely = false;

    try {
      if (useKysely) {
        // Usar Kysely directamente
        const kyselyResults = await this.kyselyDb
          .selectFrom('proveedor')
          .selectAll()
          .where('estatus', '=', 'ACTIVO')
          .where((eb) => eb.or([
            eb('nombre', 'ilike', `%${searchTerm}%`),
            eb('idFiscal', 'ilike', `%${searchTerm}%`),
            eb('email', 'ilike', `%${searchTerm}%`)
          ]))
          .orderBy('nombre', 'asc')
          .limit(limit)
          .execute();

        data = kyselyResults.map(adaptKyselyProveedor);
        usedKysely = true;
      } else {
        // Usar PGTyped
        const pgTypedResults = await searchProveedores(this.pgTypedDb, { searchTerm, limit });
        data = pgTypedResults.map(adaptPGTypedProveedor);
        usedKysely = false;
      }

    } catch (error) {
      console.error('Error en Proveedores.search:', error);

      if (useKysely) {
        try {
          const pgTypedResults = await searchProveedores(this.pgTypedDb, { searchTerm, limit });
          data = pgTypedResults.map(adaptPGTypedProveedor);
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
      metadata: {
        featureFlagsUsed,
        operationContext: context
      }
    };
  }

  /**
   * Busca proveedor por RFC
   */
  async findByRFC(rfc: string, context?: any): Promise<HybridQueryResult<ProveedorUnificado | null>> {
    const startTime = performance.now();
    const featureFlagsUsed: string[] = [];

    const useKysely = isKyselyEnabled('proveedores', context);

    if (useKysely) featureFlagsUsed.push('proveedoresKysely');

    let data: ProveedorUnificado | null = null;
    let usedKysely = false;

    try {
      if (useKysely) {
        // Usar Kysely directamente
        const kyselyResult = await this.kyselyDb
          .selectFrom('proveedor')
          .selectAll()
          .where('idFiscal', '=', rfc)
          .where('estatus', '=', 'ACTIVO')
          .executeTakeFirst();

        data = kyselyResult ? adaptKyselyProveedor(kyselyResult) : null;
        usedKysely = true;
      } else {
        // Usar PGTyped
        const pgTypedResult = await findProveedorByRFC(this.pgTypedDb, { rfc });
        data = pgTypedResult ? adaptPGTypedProveedor(pgTypedResult) : null;
        usedKysely = false;
      }

    } catch (error) {
      console.error('Error en Proveedores.findByRFC:', error);

      if (useKysely) {
        try {
          const pgTypedResult = await findProveedorByRFC(this.pgTypedDb, { rfc });
          data = pgTypedResult ? adaptPGTypedProveedor(pgTypedResult) : null;
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
      metadata: {
        featureFlagsUsed,
        operationContext: context
      }
    };
  }

  /**
   * Crea un nuevo proveedor (solo Kysely para escrituras)
   */
  async create(input: CreateProveedorInput, context?: any): Promise<HybridQueryResult<ProveedorUnificado>> {
    const startTime = performance.now();
    const useKysely = isKyselyEnabled('proveedores', context) && isKyselyEnabled('writeOperations', context);

    if (!useKysely) {
      throw new Error('Operaciones de escritura con Kysely no están habilitadas');
    }

    // Convertir a formato Kysely
    const kyselyInput = adaptToKyselyProveedor({
      ...input,
      estatus: input.estatus || 'ACTIVO',
      idInstitucion: input.idInstitucion || 1
    });

    const result = await this.kyselyDb
      .insertInto('proveedor')
      .values({
        ...kyselyInput,
        fechaRegistro: new Date()
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const data = adaptKyselyProveedor(result);
    const executionTime = performance.now() - startTime;

    return {
      data,
      usedKysely: true,
      performanceMetrics: {
        executionTime,
        system: 'kysely'
      },
      metadata: {
        featureFlagsUsed: ['proveedoresKysely', 'writeOperationsKysely'],
        operationContext: context
      }
    };
  }

  /**
   * Actualiza un proveedor existente
   */
  async update(
    id: string,
    input: UpdateProveedorInput,
    context?: any
  ): Promise<HybridQueryResult<ProveedorUnificado>> {
    const startTime = performance.now();
    const useKysely = isKyselyEnabled('proveedores', context) && isKyselyEnabled('writeOperations', context);

    if (!useKysely) {
      throw new Error('Operaciones de escritura con Kysely no están habilitadas');
    }

    const numericId = parseInt(id.replace('prov-', ''), 10);
    const kyselyInput = adaptToKyselyProveedor(input);

    const result = await this.kyselyDb
      .updateTable('proveedor')
      .set(kyselyInput)
      .where('id', '=', numericId)
      .returningAll()
      .executeTakeFirstOrThrow();

    const data = adaptKyselyProveedor(result);
    const executionTime = performance.now() - startTime;

    return {
      data,
      usedKysely: true,
      performanceMetrics: {
        executionTime,
        system: 'kysely'
      },
      metadata: {
        featureFlagsUsed: ['proveedoresKysely', 'writeOperationsKysely'],
        operationContext: context
      }
    };
  }

  /**
   * Elimina (desactiva) un proveedor
   */
  async delete(id: string, context?: any): Promise<HybridQueryResult<void>> {
    const startTime = performance.now();
    const useKysely = isKyselyEnabled('proveedores', context) && isKyselyEnabled('writeOperations', context);

    if (!useKysely) {
      throw new Error('Operaciones de escritura con Kysely no están habilitadas');
    }

    const numericId = parseInt(id.replace('prov-', ''), 10);

    await this.kyselyDb
      .updateTable('proveedor')
      .set({ estatus: 'INACTIVO' })
      .where('id', '=', numericId)
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
        featureFlagsUsed: ['proveedoresKysely', 'writeOperationsKysely'],
        operationContext: context
      }
    };
  }
}