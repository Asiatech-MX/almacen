/** Types generated for queries found in "backend/queries/proveedores.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type NumberOrString = number | string;

/** 'FindAllProveedores' parameters type */
export type IFindAllProveedoresParams = void;

/** 'FindAllProveedores' return type */
export interface IFindAllProveedoresResult {
  actualizadoEn: Date;
  creadoEn: Date;
  direccion: string | null;
  email: string | null;
  id: number;
  nombre: string;
  rfc: string | null;
  telefono: string | null;
}

/** 'FindAllProveedores' query type */
export interface IFindAllProveedoresQuery {
  params: IFindAllProveedoresParams;
  result: IFindAllProveedoresResult;
}

const findAllProveedoresIR: any = {"usedParamSet":{},"params":[],"statement":"-- Obtiene todos los proveedores activos\nSELECT\n  id,\n  nombre,\n  rfc,\n  telefono,\n  email,\n  domicilio as direccion,\n  fecha_registro as creado_en,\n  fecha_registro as actualizado_en\nFROM proveedor\nWHERE estatus = 'ACTIVO'\nORDER BY nombre"};

/**
 * Query generated from SQL:
 * ```
 * -- Obtiene todos los proveedores activos
 * SELECT
 *   id,
 *   nombre,
 *   rfc,
 *   telefono,
 *   email,
 *   domicilio as direccion,
 *   fecha_registro as creado_en,
 *   fecha_registro as actualizado_en
 * FROM proveedor
 * WHERE estatus = 'ACTIVO'
 * ORDER BY nombre
 * ```
 */
export const findAllProveedores = new PreparedQuery<IFindAllProveedoresParams,IFindAllProveedoresResult>(findAllProveedoresIR);


/** 'FindProveedorById' parameters type */
export interface IFindProveedorByIdParams {
  id?: number | null | void;
}

/** 'FindProveedorById' return type */
export interface IFindProveedorByIdResult {
  contacto: string | null;
  curp: string | null;
  domicilio: string | null;
  email: string | null;
  estatus: string;
  fechaRegistro: Date;
  id: number;
  idFiscal: string;
  idInstitucion: number;
  nombre: string;
  rfc: string | null;
  telefono: string | null;
}

/** 'FindProveedorById' query type */
export interface IFindProveedorByIdQuery {
  params: IFindProveedorByIdParams;
  result: IFindProveedorByIdResult;
}

const findProveedorByIdIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":66,"b":68}]}],"statement":"-- Obtiene un proveedor por ID\nSELECT *\nFROM proveedor\nWHERE id = :id AND estatus = 'ACTIVO'"};

/**
 * Query generated from SQL:
 * ```
 * -- Obtiene un proveedor por ID
 * SELECT *
 * FROM proveedor
 * WHERE id = :id AND estatus = 'ACTIVO'
 * ```
 */
export const findProveedorById = new PreparedQuery<IFindProveedorByIdParams,IFindProveedorByIdResult>(findProveedorByIdIR);


/** 'SearchProveedores' parameters type */
export interface ISearchProveedoresParams {
  limit?: NumberOrString | null | void;
  searchTerm?: string | null | void;
}

/** 'SearchProveedores' return type */
export interface ISearchProveedoresResult {
  email: string | null;
  id: number;
  nombre: string;
  rfc: string | null;
  telefono: string | null;
}

/** 'SearchProveedores' query type */
export interface ISearchProveedoresQuery {
  params: ISearchProveedoresParams;
  result: ISearchProveedoresResult;
}

const searchProveedoresIR: any = {"usedParamSet":{"searchTerm":true,"limit":true},"params":[{"name":"searchTerm","required":false,"transform":{"type":"scalar"},"locs":[{"a":147,"b":157},{"a":190,"b":200},{"a":235,"b":245}]},{"name":"limit","required":false,"transform":{"type":"scalar"},"locs":[{"a":280,"b":285}]}],"statement":"-- Busca proveedores por texto\nSELECT\n  id, nombre, rfc, telefono, email\nFROM proveedor\nWHERE\n  estatus = 'ACTIVO'\n  AND (\n    nombre ILIKE '%' || :searchTerm || '%' OR\n    rfc ILIKE '%' || :searchTerm || '%' OR\n    email ILIKE '%' || :searchTerm || '%'\n  )\nORDER BY nombre\nLIMIT :limit"};

/**
 * Query generated from SQL:
 * ```
 * -- Busca proveedores por texto
 * SELECT
 *   id, nombre, rfc, telefono, email
 * FROM proveedor
 * WHERE
 *   estatus = 'ACTIVO'
 *   AND (
 *     nombre ILIKE '%' || :searchTerm || '%' OR
 *     rfc ILIKE '%' || :searchTerm || '%' OR
 *     email ILIKE '%' || :searchTerm || '%'
 *   )
 * ORDER BY nombre
 * LIMIT :limit
 * ```
 */
export const searchProveedores = new PreparedQuery<ISearchProveedoresParams,ISearchProveedoresResult>(searchProveedoresIR);


/** 'FindProveedorByRfc' parameters type */
export interface IFindProveedorByRfcParams {
  rfc?: string | null | void;
}

/** 'FindProveedorByRfc' return type */
export interface IFindProveedorByRfcResult {
  contacto: string | null;
  curp: string | null;
  domicilio: string | null;
  email: string | null;
  estatus: string;
  fechaRegistro: Date;
  id: number;
  idFiscal: string;
  idInstitucion: number;
  nombre: string;
  rfc: string | null;
  telefono: string | null;
}

/** 'FindProveedorByRfc' query type */
export interface IFindProveedorByRfcQuery {
  params: IFindProveedorByRfcParams;
  result: IFindProveedorByRfcResult;
}

const findProveedorByRfcIR: any = {"usedParamSet":{"rfc":true},"params":[{"name":"rfc","required":false,"transform":{"type":"scalar"},"locs":[{"a":63,"b":66}]}],"statement":"-- Busca proveedor por RFC\nSELECT *\nFROM proveedor\nWHERE rfc = :rfc AND estatus = 'ACTIVO'"};

/**
 * Query generated from SQL:
 * ```
 * -- Busca proveedor por RFC
 * SELECT *
 * FROM proveedor
 * WHERE rfc = :rfc AND estatus = 'ACTIVO'
 * ```
 */
export const findProveedorByRfc = new PreparedQuery<IFindProveedorByRfcParams,IFindProveedorByRfcResult>(findProveedorByRfcIR);


