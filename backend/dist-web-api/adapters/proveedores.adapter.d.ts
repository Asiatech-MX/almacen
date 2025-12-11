export interface Proveedor {
    id?: number;
    uuid?: string;
    codigo: string;
    nombre: string;
    contacto?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    activo?: boolean;
    creado_por?: string;
    actualizado_por?: string;
}
export interface CreateProveedorData {
    codigo: string;
    nombre: string;
    contacto?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    creado_por?: string;
}
export interface UpdateProveedorData {
    nombre?: string;
    contacto?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    activo?: boolean;
    actualizado_por?: string;
}
export interface ProveedorFilter {
    codigo?: string;
    nombre?: string;
    contacto?: string;
    email?: string;
    activo?: boolean;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
}
export interface ProveedorAdapter {
    create(data: CreateProveedorData): Promise<Proveedor>;
    findById(id: number): Promise<Proveedor | null>;
    findByUuid(uuid: string): Promise<Proveedor | null>;
    findByCodigo(codigo: string): Promise<Proveedor | null>;
    findAll(filter?: ProveedorFilter): Promise<Proveedor[]>;
    update(id: number, data: UpdateProveedorData): Promise<Proveedor | null>;
    delete(id: number): Promise<boolean>;
    softDelete(id: number, actualizado_por?: string): Promise<boolean>;
    count(filter?: ProveedorFilter): Promise<number>;
}
declare class PostgresProveedorAdapter implements ProveedorAdapter {
    create(data: CreateProveedorData): Promise<Proveedor>;
    findById(id: number): Promise<Proveedor | null>;
    findByUuid(uuid: string): Promise<Proveedor | null>;
    findByCodigo(codigo: string): Promise<Proveedor | null>;
    findAll(filter?: ProveedorFilter): Promise<Proveedor[]>;
    update(id: number, data: UpdateProveedorData): Promise<Proveedor | null>;
    delete(id: number): Promise<boolean>;
    softDelete(id: number, actualizado_por?: string): Promise<boolean>;
    count(filter?: ProveedorFilter): Promise<number>;
}
export declare const proveedorAdapter: PostgresProveedorAdapter;
export type { ProveedorAdapter };
//# sourceMappingURL=proveedores.adapter.d.ts.map