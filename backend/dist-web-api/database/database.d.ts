import { Kysely } from 'kysely';
export interface Database {
    materia_prima: MateriaPrimaTable;
    proveedores: ProveedoresTable;
    stock_movements: StockMovementsTable;
}
export interface MateriaPrimaTable {
    id: number;
    uuid: string;
    codigo: string;
    nombre: string;
    descripcion: string | null;
    categoria: string | null;
    unidad_medida: string;
    stock_actual: number;
    stock_minimo: number;
    stock_maximo: number;
    costo_unitario: number;
    proveedor_id: string | null;
    fecha_creacion: Date;
    fecha_actualizacion: Date;
    activo: boolean;
    creado_por: string | null;
    actualizado_por: string | null;
}
export interface ProveedoresTable {
    id: number;
    uuid: string;
    codigo: string;
    nombre: string;
    contacto: string | null;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
    activo: boolean;
    fecha_creacion: Date;
    fecha_actualizacion: Date;
    creado_por: string | null;
    actualizado_por: string | null;
}
export interface StockMovementsTable {
    id: number;
    uuid: string;
    materia_prima_id: string;
    tipo_movimiento: 'entrada' | 'salida' | 'ajuste';
    cantidad: number;
    motivo: string;
    fecha_movimiento: Date;
    creado_por: string | null;
    referencia_id: string | null;
}
declare class DatabaseManager {
    private db;
    private pool;
    initialize(connectionConfig: any): Promise<void>;
    close(): Promise<void>;
    getDatabase(): Kysely<Database>;
    healthCheck(): Promise<boolean>;
    transaction<T>(callback: (trx: Kysely<Database>) => Promise<T>): Promise<T>;
}
export declare function initializeDatabaseManager(connectionConfig: any): DatabaseManager;
export declare function getDatabaseManager(): DatabaseManager;
export default DatabaseManager;
//# sourceMappingURL=database.d.ts.map