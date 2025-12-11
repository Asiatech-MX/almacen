/**
 * Mock Stock Adapter para desarrollo y testing
 * Implementa una simulación del adapter de stock
 */
import type { StockFilter, StockMovement, CreateStockMovementRequest, PaginationParams, ApiResponse, PaginatedResponse } from '@shared-types';
export interface StockAdapterResponse {
    success: boolean;
    data?: any;
    error?: string;
    total?: number;
}
export declare const mockStockAdapter: {
    /**
     * Listar movimientos de stock con filtros y paginación
     */
    findAll: (params: {
        filter?: StockFilter;
        pagination?: PaginationParams;
    }) => Promise<ApiResponse<PaginatedResponse<StockMovement>>>;
    /**
     * Obtener movimiento de stock por ID
     */
    findById: (id: string) => Promise<ApiResponse<StockMovement>>;
    /**
     * Crear nuevo movimiento de stock
     */
    create: (data: CreateStockMovementRequest) => Promise<ApiResponse<StockMovement>>;
    /**
     * Obtener resumen de stock por material
     */
    getStockSummary: (materia_prima_id?: string) => Promise<ApiResponse<any>>;
    /**
     * Obtener materiales con bajo stock
     */
    getLowStock: (params?: {
        limit?: number;
    }) => Promise<ApiResponse<any[]>>;
    /**
     * Obtener estadísticas de stock
     */
    getStockStats: (params?: {
        materia_prima_id?: string;
        periodo_dias?: number;
    }) => Promise<ApiResponse<any>>;
    /**
     * Obtener historial de movimientos por material
     */
    getMovementHistory: (materia_prima_id: string, params?: {
        limit?: number;
        periodo_dias?: number;
    }) => Promise<ApiResponse<StockMovement[]>>;
    /**
     * Realizar ajuste de inventario
     */
    adjustInventory: (data: {
        materia_prima_id: string;
        cantidad_ajuste: number;
        motivo: string;
        tipo_ajuste: "INCREMENTO" | "DECREMENTO" | "AJUSTE";
        referencia_id?: string;
    }) => Promise<ApiResponse<StockMovement>>;
};
export type StockAdapter = typeof mockStockAdapter;
export declare const stockAdapter: {
    /**
     * Listar movimientos de stock con filtros y paginación
     */
    findAll: (params: {
        filter?: StockFilter;
        pagination?: PaginationParams;
    }) => Promise<ApiResponse<PaginatedResponse<StockMovement>>>;
    /**
     * Obtener movimiento de stock por ID
     */
    findById: (id: string) => Promise<ApiResponse<StockMovement>>;
    /**
     * Crear nuevo movimiento de stock
     */
    create: (data: CreateStockMovementRequest) => Promise<ApiResponse<StockMovement>>;
    /**
     * Obtener resumen de stock por material
     */
    getStockSummary: (materia_prima_id?: string) => Promise<ApiResponse<any>>;
    /**
     * Obtener materiales con bajo stock
     */
    getLowStock: (params?: {
        limit?: number;
    }) => Promise<ApiResponse<any[]>>;
    /**
     * Obtener estadísticas de stock
     */
    getStockStats: (params?: {
        materia_prima_id?: string;
        periodo_dias?: number;
    }) => Promise<ApiResponse<any>>;
    /**
     * Obtener historial de movimientos por material
     */
    getMovementHistory: (materia_prima_id: string, params?: {
        limit?: number;
        periodo_dias?: number;
    }) => Promise<ApiResponse<StockMovement[]>>;
    /**
     * Realizar ajuste de inventario
     */
    adjustInventory: (data: {
        materia_prima_id: string;
        cantidad_ajuste: number;
        motivo: string;
        tipo_ajuste: "INCREMENTO" | "DECREMENTO" | "AJUSTE";
        referencia_id?: string;
    }) => Promise<ApiResponse<StockMovement>>;
};
//# sourceMappingURL=stock.adapter.mock.d.ts.map