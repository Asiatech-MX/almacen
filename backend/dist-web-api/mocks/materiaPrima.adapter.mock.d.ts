/**
 * Mock Materia Prima Adapter para desarrollo y testing
 * Implementa una simulación del adapter de materia prima
 */
import type { MateriaPrima, CreateMateriaPrimaRequest, UpdateMateriaPrimaRequest, MateriaPrimaFilter, PaginationParams, ApiResponse, PaginatedResponse } from '@shared-types';
export interface MateriaPrimaAdapterResponse {
    success: boolean;
    data?: any;
    error?: string;
    total?: number;
}
export declare const mockMateriaPrimaAdapter: {
    /**
     * Listar materia prima con filtros y paginación
     */
    findAll: (params: {
        filter?: MateriaPrimaFilter;
        pagination?: PaginationParams;
    }) => Promise<ApiResponse<PaginatedResponse<MateriaPrima>>>;
    /**
     * Obtener materia prima por ID
     */
    findById: (id: string) => Promise<ApiResponse<MateriaPrima>>;
    /**
     * Crear nueva materia prima
     */
    create: (data: CreateMateriaPrimaRequest) => Promise<ApiResponse<MateriaPrima>>;
    /**
     * Actualizar materia prima existente
     */
    update: (id: string, data: UpdateMateriaPrimaRequest) => Promise<ApiResponse<MateriaPrima>>;
    /**
     * Actualizar estatus de materia prima (habilitar/deshabilitar)
     */
    updateEstatus: (id: string, estatus: "ACTIVO" | "INACTIVO") => Promise<ApiResponse<MateriaPrima>>;
    /**
     * Eliminar materia prima (soft delete)
     */
    delete: (id: string) => Promise<ApiResponse<void>>;
    /**
     * Obtener materia prima con bajo stock
     */
    getLowStock: (params?: {
        limit?: number;
    }) => Promise<ApiResponse<MateriaPrima[]>>;
    /**
     * Ajustar stock
     */
    adjustStock: (id: string, adjustment: {
        cantidad: number;
        tipo: "ENTRADA" | "SALIDA";
        motivo: string;
        referencia_id?: string;
    }) => Promise<ApiResponse<MateriaPrima>>;
};
export type MateriaPrimaAdapter = typeof mockMateriaPrimaAdapter;
export declare const materiaPrimaAdapter: {
    /**
     * Listar materia prima con filtros y paginación
     */
    findAll: (params: {
        filter?: MateriaPrimaFilter;
        pagination?: PaginationParams;
    }) => Promise<ApiResponse<PaginatedResponse<MateriaPrima>>>;
    /**
     * Obtener materia prima por ID
     */
    findById: (id: string) => Promise<ApiResponse<MateriaPrima>>;
    /**
     * Crear nueva materia prima
     */
    create: (data: CreateMateriaPrimaRequest) => Promise<ApiResponse<MateriaPrima>>;
    /**
     * Actualizar materia prima existente
     */
    update: (id: string, data: UpdateMateriaPrimaRequest) => Promise<ApiResponse<MateriaPrima>>;
    /**
     * Actualizar estatus de materia prima (habilitar/deshabilitar)
     */
    updateEstatus: (id: string, estatus: "ACTIVO" | "INACTIVO") => Promise<ApiResponse<MateriaPrima>>;
    /**
     * Eliminar materia prima (soft delete)
     */
    delete: (id: string) => Promise<ApiResponse<void>>;
    /**
     * Obtener materia prima con bajo stock
     */
    getLowStock: (params?: {
        limit?: number;
    }) => Promise<ApiResponse<MateriaPrima[]>>;
    /**
     * Ajustar stock
     */
    adjustStock: (id: string, adjustment: {
        cantidad: number;
        tipo: "ENTRADA" | "SALIDA";
        motivo: string;
        referencia_id?: string;
    }) => Promise<ApiResponse<MateriaPrima>>;
};
//# sourceMappingURL=materiaPrima.adapter.mock.d.ts.map