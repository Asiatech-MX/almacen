/**
 * Type Adapters for Proveedores Domain
 * Phase 3.1: Domain Migration - Proveedores
 *
 * Este archivo contiene los adaptadores para convertir entre los tipos
 * de PGTyped y Kysely, manejando las inconsistencias identificadas
 * y facilitando la migración gradual del dominio.
 */

import type {
  Proveedor as KyselyProveedor,
  EmpresaProveedora
} from '../generated/database.types';

// Tipos PGTyped existentes (basados en las queries SQL)
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

// Interfaz unificada que resuelve las inconsistencias
export interface ProveedorUnificado {
  id: string; // Usar string para consistencia con MateriaPrima
  nombre: string;
  idFiscal: string;
  rfc?: string | null;
  curp?: string | null;
  // Resuelve inconsistencia: estatus vs activo
  estatus: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
  activo: boolean; // Para compatibilidad con código existente
  // Campos de contacto
  contacto?: string | null;
  domicilio?: string | null;
  telefono?: string | null;
  email?: string | null;
  // Multi-tenant
  idInstitucion: number;
  // Timestamps
  fechaRegistro: Date;
  creadoEn?: Date;
  actualizadoEn?: Date;
  eliminadoEn?: Date | null;
}

export interface EmpresaProveedoraUnificada {
  id: number;
  idFiscal: string;
  nombre?: string | null;
  domicilio: string;
  ciudad?: string | null;
  codigoPostal?: number | null;
  colonia?: string | null;
  condicionEntrega?: string | null;
  condicionPago?: string | null;
  contacto?: string | null;
  email?: string | null;
  telefono?: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
}

// Adaptador: Convierte tipos Kysely a interfaz unificada
export function adaptKyselyProveedor(kysely: KyselyProveedor): ProveedorUnificado {
  return {
    id: `prov-${kysely.id}`,
    nombre: kysely.nombre,
    idFiscal: kysely.idFiscal,
    rfc: kysely.idFiscal, // En Kysely se llama idFiscal, pero en la app es rfc
    curp: kysely.curp,
    estatus: kysely.estatus as 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO',
    activo: kysely.estatus === 'ACTIVO',
    contacto: kysely.contacto,
    domicilio: kysely.domicilio,
    telefono: kysely.contacto, // Kysely usa contacto para teléfono
    email: kysely.email,
    idInstitucion: kysely.idInstitucion,
    fechaRegistro: new Date(kysely.fechaRegistro),
    creadoEn: new Date(kysely.fechaRegistro),
    actualizadoEn: new Date(kysely.fechaRegistro), // Ambos campos mapean a fechaRegistro
    eliminadoEn: null // No hay campo de eliminación en Kysely
  };
}

/**
 * Adaptador: Convierte tipos PGTyped a interfaz unificada
 */
export function adaptPGTypedProveedor(pgTyped: ProveedorPGTyped): ProveedorUnificado {
  return {
    id: `prov-${pgTyped.id}`,
    nombre: pgTyped.nombre,
    idFiscal: pgTyped.rfc || pgTyped.id_fiscal || '',
    rfc: pgTyped.rfc || pgTyped.id_fiscal,
    curp: pgTyped.curp,
    estatus: pgTyped.estatus || 'ACTIVO',
    activo: (pgTyped.estatus || 'ACTIVO') === 'ACTIVO',
    contacto: pgTyped.contacto,
    domicilio: pgTyped.domicilio || pgTyped.direccion || null,
    telefono: pgTyped.telefono,
    email: pgTyped.email,
    idInstitucion: pgTyped.id_institucion || 1,
    fechaRegistro: pgTyped.fecha_registro ? new Date(pgTyped.fecha_registro) : new Date(),
    creadoEn: pgTyped.fecha_registro ? new Date(pgTyped.fecha_registro) : (pgTyped.creado_en ? new Date(pgTyped.creado_en) : new Date()),
    actualizadoEn: pgTyped.actualizado_en ? new Date(pgTyped.actualizado_en) : new Date(),
    eliminadoEn: pgTyped.eliminado_en ? new Date(pgTyped.eliminado_en) : null
  };
}

/**
 * Adaptador: Convierte interfaz unificada a formato Kysely para inserción/actualización
 */
export function adaptToKyselyProveedor(unificada: Partial<ProveedorUnificado>): Partial<KyselyProveedor> {
  return {
    nombre: unificada.nombre,
    idFiscal: unificada.rfc || unificada.idFiscal,
    curp: unificada.curp,
    contacto: unificada.telefono || unificada.contacto,
    domicilio: unificada.domicilio,
    email: unificada.email,
    idInstitucion: unificada.idInstitucion,
    estatus: unificada.estatus || (unificada.activo ? 'ACTIVO' : 'INACTIVO')
  };
}

/**
 * Adaptador: Convierte EmpresaProveedora de Kysely a unificada
 */
export function adaptKyselyEmpresaProveedora(kysely: EmpresaProveedora): EmpresaProveedoraUnificada {
  return {
    id: 0, // Kysely no tiene ID en la tabla, se generará
    idFiscal: kysely.idFiscal,
    nombre: null, // No hay campo nombre en Kysely
    domicilio: kysely.domicilio,
    ciudad: kysely.ciudad,
    codigoPostal: kysely.codigoPostal,
    colonia: kysely.colonia,
    condicionEntrega: kysely.condicionEntrega,
    condicionPago: kysely.condicionPago,
    contacto: kysely.contacto,
    email: kysely.email,
    telefono: null, // No hay campo teléfono en Kysely
    creadoEn: new Date(kysely.fechaRegistro),
    actualizadoEn: new Date(kysely.fechaRegistro)
  };
}

/**
 * Validación de RFC mexicano
 */
export function validarRFC(rfc: string): boolean {
  if (!rfc || rfc.trim() === '') return false;

  // Formato RFC: 4 letras, 6 números, 3 caracteres (homoclave)
  const rfcPattern = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
  const rfcPersonaMoralPattern = /^[A-Z&Ñ]{3}[0-9]{6}[A-Z0-9]{3}$/;
  const rfcPersonaFisicaPattern = /^[A-Z&Ñ]{4}[0-9]{6}[A-Z0-9]{3}$/;

  const normalizedRFC = rfc.toUpperCase().trim();

  return rfcPattern.test(normalizedRFC) ||
         rfcPersonaMoralPattern.test(normalizedRFC) ||
         rfcPersonaFisicaPattern.test(normalizedRFC);
}

/**
 * Validación de CURP mexicano
 */
export function validarCURP(curp: string): boolean {
  if (!curp || curp.trim() === '') return true; // CURP es opcional

  // Formato CURP: 4 letras, 6 números, 6 caracteres, 2 dígitos verificación
  const curpPattern = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9]{2}$/;

  const normalizedCURP = curp.toUpperCase().trim();
  return curpPattern.test(normalizedCURP);
}

/**
 * Validación de email
 */
export function validarEmail(email: string): boolean {
  if (!email || email.trim() === '') return true; // Email es opcional

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.trim());
}

/**
 * Validación completa de proveedor
 */
export function validateProveedorConsistency(proveedor: ProveedorUnificado): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validaciones requeridas
  if (!proveedor.nombre || proveedor.nombre.trim() === '') {
    errors.push('Nombre del proveedor es requerido');
  }

  if (!proveedor.idFiscal || proveedor.idFiscal.trim() === '') {
    errors.push('ID Fiscal del proveedor es requerido');
  } else if (!validarRFC(proveedor.idFiscal)) {
    errors.push('ID Fiscal (RFC) del proveedor no tiene formato válido');
  }

  // Validar consistencia entre estatus y activo
  const expectedEstatus = proveedor.activo ? 'ACTIVO' : 'INACTIVO';
  if (proveedor.estatus !== expectedEstatus) {
    warnings.push(
      `Inconsistencia: activo=${proveedor.activo} pero estatus=${proveedor.estatus}. Se esperaba estatus=${expectedEstatus}`
    );
  }

  // Validaciones opcionales con advertencias
  if (proveedor.curp && !validarCURP(proveedor.curp)) {
    warnings.push('CURP no tiene formato válido');
  }

  if (proveedor.email && !validarEmail(proveedor.email)) {
    warnings.push('Email no tiene formato válido');
  }

  if (!proveedor.idInstitucion || proveedor.idInstitucion <= 0) {
    warnings.push('ID de institución no especificado o inválido');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Maneja valores nulos/undefined de manera segura
 */
export function safeString(value: string | null | undefined): string {
  return value?.trim() || '';
}

/**
 * Convierte string a número de manera segura
 */
export function safeNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }

  if (!value) return 0;

  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Convierte string a Date de manera segura
 */
export function safeDate(value: string | Date | null | undefined): Date {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? new Date() : value;
  }

  if (!value) return new Date();

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Exportar todos los adaptadores y utilidades
 */
export const proveedoresAdapters = {
  adaptKyselyProveedor,
  adaptPGTypedProveedor,
  adaptToKyselyProveedor,
  adaptKyselyEmpresaProveedora,
  validateProveedorConsistency,
  validarRFC,
  validarCURP,
  validarEmail,
  safeString,
  safeNumber,
  safeDate
};

export default proveedoresAdapters;