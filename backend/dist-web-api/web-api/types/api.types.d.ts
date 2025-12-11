export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: ValidationError[];
    timestamp: string;
}
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
    pagination: PaginationInfo;
}
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}
export interface ApiError extends Error {
    status?: number;
    code?: string;
    details?: any;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface SearchQuery extends PaginationQuery {
    term: string;
    fields?: string[];
}
export interface HealthStatus {
    status: 'OK' | 'ERROR';
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    database?: DatabaseStatus;
    memory?: MemoryStatus;
}
export interface DatabaseStatus {
    status: 'connected' | 'disconnected' | 'error';
    responseTime?: number;
    error?: string;
}
export interface MemoryStatus {
    used: number;
    total: number;
    percentage: number;
}
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    permissions: string[];
    createdAt: string;
    updatedAt: string;
    lastLogin?: string;
    isActive: boolean;
}
export declare enum UserRole {
    ADMIN = "ADMIN",
    MANAGER = "MANAGER",
    OPERATOR = "OPERATOR",
    VIEWER = "VIEWER"
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
}
export interface RefreshTokenRequest {
    refreshToken: string;
}
export interface RefreshTokenResponse {
    token: string;
    refreshToken: string;
    expiresIn: number;
}
export interface MateriaPrima {
    id: string;
    nombre: string;
    descripcion?: string;
    stock_actual: number;
    stock_minimo: number;
    codigo_barras?: string;
    presentacion: string;
    id_presentacion: number;
    estatus: 'ACTIVO' | 'INACTIVO';
    id_proveedor?: string;
    proveedor?: Proveedor;
    costo_unitario?: number;
    precio_venta?: number;
    categoria?: string;
    ubicacion?: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
    creado_por?: string;
    actualizado_por?: string;
}
export interface CreateMateriaPrimaRequest {
    nombre: string;
    descripcion?: string;
    stock_actual: number;
    stock_minimo: number;
    codigo_barras?: string;
    presentacion: string;
    id_presentacion: number;
    id_proveedor?: string;
    costo_unitario?: number;
    precio_venta?: number;
    categoria?: string;
    ubicacion?: string;
}
export interface UpdateMateriaPrimaRequest extends Partial<CreateMateriaPrimaRequest> {
    estatus?: 'ACTIVO' | 'INACTIVO';
}
export interface MateriaPrimaStats {
    total: number;
    activos: number;
    inactivos: number;
    bajoStock: number;
    sinStock: number;
    valorTotal: number;
    porcentajeActivos: number;
    categorias: Record<string, number>;
}
export interface Proveedor {
    id: string;
    nombre: string;
    rfc: string;
    contacto?: string;
    email?: string;
    telefono?: string;
    domicilio?: string;
    ciudad?: string;
    estado?: string;
    codigo_postal?: string;
    pais?: string;
    estatus: 'ACTIVO' | 'INACTIVO';
    fecha_creacion: string;
    fecha_actualizacion: string;
    creado_por?: string;
    actualizado_por?: string;
}
export interface CreateProveedorRequest {
    nombre: string;
    rfc: string;
    contacto?: string;
    email?: string;
    telefono?: string;
    domicilio?: string;
    ciudad?: string;
    estado?: string;
    codigo_postal?: string;
    pais?: string;
}
export interface UpdateProveedorRequest extends Partial<CreateProveedorRequest> {
    estatus?: 'ACTIVO' | 'INACTIVO';
}
export interface ProveedorStats {
    total: number;
    activos: number;
    inactivos: number;
    bajoStock: number;
    sinStock: number;
    porcentajeActivos: number;
    porcentajeInactivos: number;
}
export interface StockMovimiento {
    id: string;
    materiaPrimaId: string;
    materiaPrima?: MateriaPrima;
    tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
    cantidad: number;
    stock_anterior: number;
    stock_nuevo: number;
    motivo: string;
    tipo_ajuste?: 'MANUAL' | 'SISTEMA' | 'CORRECCION';
    usuario_id: string;
    usuario?: User;
    fecha: string;
    referencia?: string;
    observaciones?: string;
}
export interface CreateMovimientoRequest {
    materiaPrimaId: string;
    tipo: 'ENTRADA' | 'SALIDA';
    cantidad: number;
    motivo: string;
    tipo_ajuste?: 'MANUAL' | 'SISTEMA' | 'CORRECCION';
    referencia?: string;
    observaciones?: string;
}
export interface StockActual {
    materiaPrimaId: string;
    materiaPrima?: MateriaPrima;
    stockActual: number;
    stockMinimo: number;
    stockMaximo?: number;
    estaBajo: boolean;
    estaSobre: boolean;
    porcentajeUtilizacion: number;
    ultimaActualizacion: string;
}
export interface StockAjuste {
    id: string;
    materiaPrimaId: string;
    materiaPrima?: MateriaPrima;
    cantidad: number;
    stockAnterior: number;
    stockNuevo: number;
    motivo: string;
    tipoAjuste: 'MANUAL' | 'SISTEMA' | 'CORRECCION';
    usuarioId: string;
    usuario?: User;
    fecha: string;
    autorizadoPor?: string;
    aprobadoPor?: string;
}
export interface CreateAjusteRequest {
    materiaPrimaId: string;
    cantidad: number;
    motivo: string;
    tipoAjuste: 'MANUAL' | 'SISTEMA' | 'CORRECCION';
    autorizadoPor?: string;
    aprobadoPor?: string;
}
export interface StockHistorial {
    materiaPrimaId: string;
    materiaPrima?: MateriaPrima;
    historial: StockMovimiento[];
    totalMovimientos: number;
    totalEntradas: number;
    totalSalidas: number;
    totalAjustes: number;
    stockActual: number;
}
export interface StockBajo {
    items: Array<{
        id: string;
        nombre: string;
        stock_actual: number;
        stock_minimo: number;
        deficit: number;
        porcentaje_deficit: number;
        dias_stock: number;
        ultima_entrada?: string;
        proveedor?: Proveedor;
    }>;
    totalItems: number;
    valorTotalDeficit: number;
}
export interface ReportRequest {
    tipo: 'INVENTARIO' | 'MOVIMIENTOS' | 'PROVEEDORES' | 'BAJO_STOCK';
    fechaInicio?: string;
    fechaFin?: string;
    formato?: 'PDF' | 'EXCEL' | 'CSV';
    filtros?: Record<string, any>;
}
export interface ReportResponse {
    id: string;
    tipo: string;
    estado: 'GENERANDO' | 'COMPLETADO' | 'ERROR';
    url?: string;
    fechaGeneracion?: string;
    error?: string;
}
export interface Notification {
    id: string;
    tipo: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
    titulo: string;
    mensaje: string;
    usuarioId?: string;
    leida: boolean;
    fechaCreacion: string;
    metadata?: Record<string, any>;
}
export interface AuditLog {
    id: string;
    accion: string;
    entidad: string;
    entidadId: string;
    usuarioId?: string;
    usuario?: User;
    datosAnteriores?: Record<string, any>;
    datosNuevos?: Record<string, any>;
    ip?: string;
    userAgent?: string;
    fecha: string;
}
export interface SystemConfig {
    id: string;
    clave: string;
    valor: string;
    descripcion?: string;
    tipo: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    categoria: string;
    editable: boolean;
    fechaActualizacion: string;
    actualizadoPor?: string;
}
export interface FileUpload {
    id: string;
    nombre: string;
    nombreOriginal: string;
    tipo: string;
    tamano: number;
    url: string;
    ruta: string;
    entidad: string;
    entidadId: string;
    usuarioId: string;
    fechaSubida: string;
}
export interface DashboardData {
    resumen: {
        totalMateriales: number;
        totalProveedores: number;
        valorInventario: number;
        movimientosHoy: number;
        alertasBajoStock: number;
    };
    graficos: {
        stockPorCategoria: Array<{
            categoria: string;
            valor: number;
        }>;
        movimientosPorMes: Array<{
            mes: string;
            entradas: number;
            salidas: number;
        }>;
        proveedoresActivos: Array<{
            nombre: string;
            materiales: number;
        }>;
    };
    actividades: Array<{
        id: string;
        tipo: string;
        descripcion: string;
        fecha: string;
        usuario?: string;
    }>;
}
export interface ApiEndpoint {
    path: string;
    method: string;
    description: string;
    parameters?: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
    }>;
    requestBody?: {
        description: string;
        required: boolean;
        content: Record<string, any>;
    };
    responses: Record<string, {
        description: string;
        content: Record<string, any>;
    }>;
}
export interface ApiDocumentation {
    title: string;
    version: string;
    description: string;
    baseUrl: string;
    endpoints: ApiEndpoint[];
    schemas: Record<string, any>;
}
export interface WebSocketMessage {
    type: string;
    data: any;
    timestamp: string;
    id?: string;
}
export interface StockUpdateMessage extends WebSocketMessage {
    type: 'STOCK_UPDATE';
    data: {
        materiaPrimaId: string;
        stockAnterior: number;
        stockNuevo: number;
        tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
    };
}
export type { ApiResponse, PaginatedResponse, PaginationInfo, ValidationError, ApiError, PaginationQuery, SearchQuery, HealthStatus, DatabaseStatus, MemoryStatus, User, UserRole, LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse, MateriaPrima, CreateMateriaPrimaRequest, UpdateMateriaPrimaRequest, MateriaPrimaStats, Proveedor, CreateProveedorRequest, UpdateProveedorRequest, ProveedorStats, StockMovimiento, CreateMovimientoRequest, StockActual, StockAjuste, CreateAjusteRequest, StockHistorial, StockBajo, ReportRequest, ReportResponse, Notification, AuditLog, SystemConfig, FileUpload, DashboardData, ApiEndpoint, ApiDocumentation, WebSocketMessage, StockUpdateMessage };
//# sourceMappingURL=api.types.d.ts.map