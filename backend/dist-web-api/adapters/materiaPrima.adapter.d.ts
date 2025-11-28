export interface MateriaPrima {
    id?: number;
    uuid?: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    categoria?: string;
    unidad_medida: string;
    stock_actual: number;
    stock_minimo: number;
    stock_maximo: number;
    costo_unitario: number;
    proveedor_id?: string;
    activo?: boolean;
    creado_por?: string;
    actualizado_por?: string;
}
export interface CreateMateriaPrimaData {
    codigo: string;
    nombre: string;
    descripcion?: string;
    categoria?: string;
    unidad_medida: string;
    stock_actual?: number;
    stock_minimo?: number;
    stock_maximo?: number;
    costo_unitario?: number;
    proveedor_id?: string;
    creado_por?: string;
}
export interface UpdateMateriaPrimaData {
    nombre?: string;
    descripcion?: string;
    categoria?: string;
    unidad_medida?: string;
    stock_actual?: number;
    stock_minimo?: number;
    stock_maximo?: number;
    costo_unitario?: number;
    proveedor_id?: string;
    activo?: boolean;
    actualizado_por?: string;
}
export interface MateriaPrimaFilter {
    codigo?: string;
    nombre?: string;
    categoria?: string;
    proveedor_id?: string;
    activo?: boolean;
    stock_bajo?: boolean;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
}
export interface MateriaPrimaAdapter {
    create(data: CreateMateriaPrimaData): Promise<MateriaPrima>;
    findById(id: number): Promise<MateriaPrima | null>;
    findByUuid(uuid: string): Promise<MateriaPrima | null>;
    findByCodigo(codigo: string): Promise<MateriaPrima | null>;
    findAll(filter?: MateriaPrimaFilter): Promise<MateriaPrima[]>;
    update(id: number, data: UpdateMateriaPrimaData): Promise<MateriaPrima | null>;
    delete(id: number): Promise<boolean>;
    softDelete(id: number, actualizado_por?: string): Promise<boolean>;
    count(filter?: MateriaPrimaFilter): Promise<number>;
    checkLowStock(): Promise<MateriaPrima[]>;
    updateStock(id: number, newStock: number, actualizado_por?: string): Promise<boolean>;
}
declare class PostgresMateriaPrimaAdapter implements MateriaPrimaAdapter {
    create(data: CreateMateriaPrimaData): Promise<MateriaPrima>;
    findById(id: number): Promise<MateriaPrima | null>;
    findByUuid(uuid: string): Promise<MateriaPrima | null>;
    findByCodigo(codigo: string): Promise<MateriaPrima | null>;
    findAll(filter?: MateriaPrimaFilter): Promise<MateriaPrima[]>;
    update(id: number, data: UpdateMateriaPrimaData): Promise<MateriaPrima | null>;
    delete(id: number): Promise<boolean>;
    softDelete(id: number, actualizado_por?: string): Promise<boolean>;
    count(filter?: MateriaPrimaFilter): Promise<number>;
    checkLowStock(): Promise<MateriaPrima[]>;
    updateStock(id: number, newStock: number, actualizado_por?: string): Promise<boolean>;
}
export declare const materiaPrimaAdapter: PostgresMateriaPrimaAdapter;
export type { MateriaPrimaAdapter };
//# sourceMappingURL=materiaPrima.adapter.d.ts.map