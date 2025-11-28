export interface StockMovement {
    id?: number;
    uuid?: string;
    materia_prima_id: string;
    tipo_movimiento: 'entrada' | 'salida' | 'ajuste';
    cantidad: number;
    motivo: string;
    creado_por?: string;
    referencia_id?: string;
}
export interface CreateStockMovementData {
    materia_prima_id: string;
    tipo_movimiento: 'entrada' | 'salida' | 'ajuste';
    cantidad: number;
    motivo: string;
    creado_por?: string;
    referencia_id?: string;
}
export interface StockFilter {
    materia_prima_id?: string;
    tipo_movimiento?: 'entrada' | 'salida' | 'ajuste';
    fecha_desde?: Date;
    fecha_hasta?: Date;
    creado_por?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
}
export interface StockSummary {
    materia_prima_id: string;
    materia_prima_nombre: string;
    materia_prima_codigo: string;
    stock_actual: number;
    stock_minimo: number;
    stock_maximo: number;
    estado: 'normal' | 'bajo' | 'excesivo' | 'agotado';
    valor_total: number;
    ultimo_movimiento?: Date;
}
export interface StockAdapter {
    createMovement(data: CreateStockMovementData): Promise<StockMovement>;
    findMovements(filter?: StockFilter): Promise<StockMovement[]>;
    getStockSummary(filter?: {
        materia_prima_id?: string;
        categoria?: string;
    }): Promise<StockSummary[]>;
    getLowStockItems(): Promise<StockSummary[]>;
    getStockByMateriaPrima(materia_prima_id: string): Promise<number>;
    updateStock(materia_prima_id: string, cantidad: number, tipo: 'entrada' | 'salida' | 'ajuste', motivo: string, creado_por?: string): Promise<boolean>;
    getStockHistory(materia_prima_id: string, days?: number): Promise<StockMovement[]>;
}
declare class PostgresStockAdapter implements StockAdapter {
    createMovement(data: CreateStockMovementData): Promise<StockMovement>;
    findMovements(filter?: StockFilter): Promise<StockMovement[]>;
    getStockSummary(filter?: {
        materia_prima_id?: string;
        categoria?: string;
    }): Promise<StockSummary[]>;
    getLowStockItems(): Promise<StockSummary[]>;
    getStockByMateriaPrima(materia_prima_id: string): Promise<number>;
    updateStock(materia_prima_id: string, cantidad: number, tipo: 'entrada' | 'salida' | 'ajuste', motivo: string, creado_por?: string): Promise<boolean>;
    getStockHistory(materia_prima_id: string, days?: number): Promise<StockMovement[]>;
}
export declare const stockAdapter: PostgresStockAdapter;
export type { StockAdapter };
//# sourceMappingURL=stock.adapter.d.ts.map