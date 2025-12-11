/**
 * Mock Proveedores Adapter para desarrollo y testing
 * Implementa una simulación del adapter de proveedores
 */
import type { Proveedor, CreateProveedorRequest, UpdateProveedorRequest, ProveedorFilter, PaginationParams, ApiResponse, PaginatedResponse } from '@shared-types';
export interface ProveedorAdapterResponse {
    success: boolean;
    data?: any;
    error?: string;
    total?: number;
}
export declare const mockProveedorAdapter: {
    /**
     * Listar proveedores con filtros y paginación
     */
    findAll: (params: {
        filter?: ProveedorFilter;
        pagination?: PaginationParams;
    }) => Promise<ApiResponse<PaginatedResponse<Proveedor>>>;
    /**
     * Obtener proveedor por ID
     */
    findById: (id: string) => Promise<ApiResponse<Proveedor>>;
    /**
     * Crear nuevo proveedor
     */
    create: (data: CreateProveedorRequest) => Promise<ApiResponse<Proveedor>>;
    /**
     * Actualizar proveedor existente
     */
    update: (id: string, data: UpdateProveedorRequest) => Promise<ApiResponse<Proveedor>>;
    /**
     * Actualizar estatus de proveedor (habilitar/deshabilitar)
     */
    updateEstatus: (id: string, estatus: "ACTIVO" | "INACTIVO") => Promise<ApiResponse<Proveedor>>;
    /**
     * Eliminar proveedor (soft delete)
     */
    delete: (id: string) => Promise<ApiResponse<void>>;
    /**
     * Obtener proveedores activos
     */
    getActive: (params?: {
        limit?: number;
    }) => Promise<ApiResponse<Proveedor[]>>;
    /**
     * Buscar proveedores por nombre o RFC
     */
    search: (query: string, params?: {
        limit?: number;
    }) => Promise<ApiResponse<Proveedor[]>>;
};
export type ProveedorAdapter = typeof mockProveedorAdapter;
export declare const proveedorAdapter: {
    /**
     * Listar proveedores con filtros y paginación
     */
    findAll: (params: {
        filter?: ProveedorFilter;
        pagination?: PaginationParams;
    }) => Promise<ApiResponse<PaginatedResponse<Proveedor>>>;
    /**
     * Obtener proveedor por ID
     */
    findById: (id: string) => Promise<ApiResponse<Proveedor>>;
    /**
     * Crear nuevo proveedor
     */
    create: (data: CreateProveedorRequest) => Promise<ApiResponse<Proveedor>>;
    /**
     * Actualizar proveedor existente
     */
    update: (id: string, data: UpdateProveedorRequest) => Promise<ApiResponse<Proveedor>>;
    /**
     * Actualizar estatus de proveedor (habilitar/deshabilitar)
     */
    updateEstatus: (id: string, estatus: "ACTIVO" | "INACTIVO") => Promise<ApiResponse<Proveedor>>;
    /**
     * Eliminar proveedor (soft delete)
     */
    delete: (id: string) => Promise<ApiResponse<void>>;
    /**
     * Obtener proveedores activos
     */
    getActive: (params?: {
        limit?: number;
    }) => Promise<ApiResponse<Proveedor[]>>;
    /**
     * Buscar proveedores por nombre o RFC
     */
    search: (query: string, params?: {
        limit?: number;
    }) => Promise<ApiResponse<Proveedor[]>>;
};
//# sourceMappingURL=proveedores.adapter.mock.d.ts.map