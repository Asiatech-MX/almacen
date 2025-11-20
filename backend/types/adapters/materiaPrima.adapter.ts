/**
 * Adaptadores de tipos para Materia Prima
 * Resuelve inconsistencias entre PGTyped y Kysely types
 */

import type {
  MateriaPrima as KyselyMateriaPrima,
  MateriaPrimaLegacy20251114 as KyselyMateriaPrimaLegacy
} from '../generated/database.types';

// Interfaz unificada que resuelve las inconsistencias
export interface MateriaPrimaUnificada {
  id: string;
  nombre: string;
  codigoBarras: string;
  presentacion: string;
  // Resuelve inconsistencia: estatus vs activo
  estatus: string; // 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO'
  activo?: boolean; // Para compatibilidad con código existente
  // Campos de stock
  stockActual: number;
  stockMinimo: number;
  // Campos opcionales
  categoria?: string | null;
  costoUnitario?: number | null;
  descripcion?: string | null;
  fechaCaducidad?: Date | null;
  imagenUrl?: string | null;
  marca?: string | null;
  modelo?: string | null;
  proveedorId?: string | null;
  // Timestamps
  creadoEn?: Date | null;
  actualizadoEn?: Date | null;
  eliminadoEn?: Date | null;
}

// Adaptador de Kysely a interfaz unificada
export function adaptKyselyMateriaPrisma(
  kysely: KyselyMateriaPrima
): MateriaPrimaUnificada {
  return {
    id: kysely.id,
    nombre: kysely.nombre,
    codigoBarras: kysely.codigoBarras,
    presentacion: kysely.presentacion,
    // Convierte activo (boolean) a estatus (string)
    estatus: kysely.activo ? 'ACTIVO' : 'INACTIVO',
    activo: kysely.activo, // Mantiene compatibilidad
    stockActual: Number(kysely.stockActual),
    stockMinimo: Number(kysely.stockMinimo),
    categoria: kysely.categoria,
    costoUnitario: kysely.costoUnitario ? Number(kysely.costoUnitario) : null,
    descripcion: kysely.descripcion,
    fechaCaducidad: kysely.fechaCaducidad,
    imagenUrl: kysely.imagenUrl,
    marca: kysely.marca,
    modelo: kysely.modelo,
    proveedorId: kysely.proveedorId,
    creadoEn: kysely.creadoEn,
    actualizadoEn: kysely.actualizadoEn,
    eliminadoEn: kysely.eliminadoEn
  };
}

// Adaptador de Legacy a interfaz unificada
export function adaptLegacyMateriaPrisma(
  legacy: KyselyMateriaPrimaLegacy
): MateriaPrimaUnificada {
  return {
    id: String(legacy.id), // Convierte number a string para UUID consistency
    nombre: legacy.nombre,
    codigoBarras: legacy.codigoBarras,
    presentacion: legacy.presentacion,
    estatus: legacy.estatus, // Ya es string en el legacy
    activo: legacy.activo, // Mantiene compatibilidad
    stockActual: Number(legacy.stock),
    stockMinimo: legacy.stockMinimo ? Number(legacy.stockMinimo) : 0,
    categoria: legacy.categoria,
    costoUnitario: legacy.costoUnitario ? Number(legacy.costoUnitario) : null,
    descripcion: legacy.descripcion,
    fechaCaducidad: legacy.fechaCaducidad,
    imagenUrl: legacy.imagenUrl,
    marca: legacy.marca,
    modelo: legacy.modelo,
    proveedorId: legacy.proveedorId,
    creadoEn: legacy.fechaRegistro,
    actualizadoEn: legacy.actualizadoEn,
    eliminadoEn: legacy.eliminadoEn
  };
}

// Adaptador inverso: de interfaz unificada a Kysely para inserciones/actualizaciones
export function adaptToKyselyMateriaPrisma(
  unificada: Partial<MateriaPrimaUnificada>
): Partial<KyselyMateriaPrima> {
  const result: Partial<KyselyMateriaPrima> = {
    nombre: unificada.nombre,
    codigoBarras: unificada.codigoBarras,
    presentacion: unificada.presentacion,
    categoria: unificada.categoria,
    costoUnitario: unificada.costoUnitario,
    descripcion: unificada.descripcion,
    fechaCaducidad: unificada.fechaCaducidad,
    imagenUrl: unificada.imagenUrl,
    marca: unificada.marca,
    modelo: unificada.modelo,
    proveedorId: unificada.proveedorId,
    creadoEn: unificada.creadoEn,
    actualizadoEn: unificada.actualizadoEn,
    eliminadoEn: unificada.eliminadoEn
  };

  // Convierte estatus a activo si se proporciona
  if (unificada.estatus !== undefined) {
    result.activo = unificada.estatus === 'ACTIVO';
  }

  // Convierte stock a tipo numérico de Kysely
  if (unificada.stockActual !== undefined) {
    result.stockActual = unificada.stockActual.toString();
  }

  if (unificada.stockMinimo !== undefined) {
    result.stockMinimo = unificada.stockMinimo.toString();
  }

  return result;
}

// Helper function para validar consistencia de tipos
export function validateMateriaPrismaConsistency(
  materia: MateriaPrimaUnificada
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar que estatus y activo sean consistentes
  if (materia.activo !== undefined) {
    const expectedEstatus = materia.activo ? 'ACTIVO' : 'INACTIVO';
    if (materia.estatus && materia.estatus !== expectedEstatus) {
      errors.push(
        `Inconsistencia: activo=${materia.activo} pero estatus=${materia.estatus}. Se esperaba estatus=${expectedEstatus}`
      );
    }
  }

  // Validar que stock sea numérico
  if (isNaN(materia.stockActual) || materia.stockActual < 0) {
    errors.push('stockActual debe ser un número mayor o igual a 0');
  }

  if (isNaN(materia.stockMinimo) || materia.stockMinimo < 0) {
    errors.push('stockMinimo debe ser un número mayor o igual a 0');
  }

  // Validar código de barras
  if (!materia.codigoBarras || materia.codigoBarras.trim() === '') {
    errors.push('codigoBarras es requerido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}