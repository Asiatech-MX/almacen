"use strict";
/**
 * Mock Stock Adapter para desarrollo y testing
 * Implementa una simulación del adapter de stock
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockAdapter = exports.mockStockAdapter = void 0;
exports.mockStockAdapter = {
    /**
     * Listar movimientos de stock con filtros y paginación
     */
    findAll: async (params) => {
        // Simulate database delay
        await new Promise(resolve => setTimeout(resolve, 100));
        const mockData = [
            {
                id: "move-001",
                materia_prima_id: "123e4567-e89b-12d3-a456-426614174000",
                tipo: "ENTRADA",
                cantidad: 50,
                stock_anterior: 100,
                stock_nuevo: 150,
                motivo: "Compra de material",
                referencia_id: "comp-001",
                referencia_tipo: "COMPRA",
                fecha_movimiento: new Date("2024-01-15T10:30:00Z"),
                creado_por: "admin",
                institucion_id: "inst-001",
                proveedor_id: "prov-001",
                costo_unitario: 25.50,
                valor_total: 1275.00
            },
            {
                id: "move-002",
                materia_prima_id: "123e4567-e89b-12d3-a456-426614174001",
                tipo: "SALIDA",
                cantidad: 20,
                stock_anterior: 50,
                stock_nuevo: 30,
                motivo: "Producción",
                referencia_id: "prod-001",
                referencia_tipo: "PRODUCCION",
                fecha_movimiento: new Date("2024-01-16T14:15:00Z"),
                creado_por: "user1",
                institucion_id: "inst-001",
                proveedor_id: null,
                costo_unitario: 15.75,
                valor_total: 315.00
            },
            {
                id: "move-003",
                materia_prima_id: "123e4567-e89b-12d3-a456-426614174000",
                tipo: "AJUSTE",
                cantidad: -5,
                stock_anterior: 150,
                stock_nuevo: 145,
                motivo: "Ajuste por inventario",
                referencia_id: "ajuste-001",
                referencia_tipo: "AJUSTE",
                fecha_movimiento: new Date("2024-01-17T09:00:00Z"),
                creado_por: "admin",
                institucion_id: "inst-001",
                proveedor_id: null,
                costo_unitario: 25.50,
                valor_total: -127.50
            }
        ];
        let filteredData = [...mockData];
        // Apply filters
        if (params.filter) {
            const { tipo, materia_prima_id, fecha_desde, fecha_hasta, creado_por, referencia_id } = params.filter;
            if (tipo) {
                filteredData = filteredData.filter(item => item.tipo === tipo);
            }
            if (materia_prima_id) {
                filteredData = filteredData.filter(item => item.materia_prima_id === materia_prima_id);
            }
            if (referencia_id) {
                filteredData = filteredData.filter(item => item.referencia_id === referencia_id);
            }
            if (creado_por) {
                filteredData = filteredData.filter(item => item.creado_por === creado_por);
            }
            if (fecha_desde) {
                filteredData = filteredData.filter(item => new Date(item.fecha_movimiento) >= new Date(fecha_desde));
            }
            if (fecha_hasta) {
                filteredData = filteredData.filter(item => new Date(item.fecha_movimiento) <= new Date(fecha_hasta));
            }
        }
        const total = filteredData.length;
        // Apply pagination
        const { page = 1, limit = 10, sortBy = 'fecha_movimiento', sortOrder = 'desc' } = params.pagination || {};
        // Sort data
        filteredData.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            if (aValue === undefined || bValue === undefined)
                return 0;
            let comparison = 0;
            if (aValue < bValue)
                comparison = -1;
            if (aValue > bValue)
                comparison = 1;
            return sortOrder === 'asc' ? comparison : -comparison;
        });
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filteredData.slice(startIndex, endIndex);
        return {
            success: true,
            data: {
                items: paginatedData,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        };
    },
    /**
     * Obtener movimiento de stock por ID
     */
    findById: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        const mockItem = {
            id,
            materia_prima_id: "123e4567-e89b-12d3-a456-426614174000",
            tipo: "ENTRADA",
            cantidad: 10,
            stock_anterior: 100,
            stock_nuevo: 110,
            motivo: `Movimiento ${id}`,
            referencia_id: `ref-${id}`,
            referencia_tipo: "MANUAL",
            fecha_movimiento: new Date(),
            creado_por: "admin",
            institucion_id: "inst-001",
            proveedor_id: null,
            costo_unitario: 25.50,
            valor_total: 255.00
        };
        return {
            success: true,
            data: mockItem
        };
    },
    /**
     * Crear nuevo movimiento de stock
     */
    create: async (data) => {
        await new Promise(resolve => setTimeout(resolve, 150));
        const mockMateriaPrima = {
            id: data.materia_prima_id,
            nombre: `Material ${data.materia_prima_id}`,
            descripcion: "Descripción del material",
            stock_actual: 100,
            stock_minimo: 10,
            stock_maximo: 500,
            costo_unitario: 25.50,
            presentacion: "UNIDAD",
            categoria: "MATERIA_PRIMA",
            estatus: "ACTIVO",
            proveedor_id: "prov-001",
            codigo: `MAT-${data.materia_prima_id}`,
            fecha_creacion: new Date(),
            fecha_actualizacion: new Date(),
            creado_por: "admin",
            institucion_id: "inst-001"
        };
        const stock_anterior = mockMateriaPrima.stock_actual;
        const stock_nuevo = data.tipo === "ENTRADA"
            ? stock_anterior + data.cantidad
            : data.tipo === "SALIDA"
                ? Math.max(0, stock_anterior - data.cantidad)
                : stock_anterior + data.cantidad; // AJUSTE
        const newItem = {
            id: `move-${Date.now()}`,
            ...data,
            stock_anterior,
            stock_nuevo,
            fecha_movimiento: new Date(),
            creado_por: "admin",
            institucion_id: "inst-001",
            valor_total: data.cantidad * (mockMateriaPrima.costo_unitario || 0)
        };
        return {
            success: true,
            data: newItem
        };
    },
    /**
     * Obtener resumen de stock por material
     */
    getStockSummary: async (materia_prima_id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const summaryData = [
            {
                materia_prima_id: "123e4567-e89b-12d3-a456-426614174000",
                materia_prima_nombre: "Material de Prueba 1",
                stock_actual: 150,
                stock_minimo: 10,
                stock_maximo: 500,
                porcentaje_stock: 30,
                estatus: "NORMAL",
                valor_total: 3825.00,
                ultimo_movimiento: new Date(),
                total_entradas: 80,
                total_salidas: 30
            },
            {
                materia_prima_id: "123e4567-e89b-12d3-a456-426614174001",
                materia_prima_nombre: "Material de Prueba 2",
                stock_actual: 30,
                stock_minimo: 10,
                stock_maximo: 200,
                porcentaje_stock: 15,
                estatus: "BAJO",
                valor_total: 472.50,
                ultimo_movimiento: new Date(),
                total_entradas: 50,
                total_salidas: 70
            }
        ];
        let filteredData = [...summaryData];
        if (materia_prima_id) {
            filteredData = filteredData.filter(item => item.materia_prima_id === materia_prima_id);
        }
        return {
            success: true,
            data: filteredData
        };
    },
    /**
     * Obtener materiales con bajo stock
     */
    getLowStock: async (params) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const lowStockData = [
            {
                materia_prima_id: "123e4567-e89b-12d3-a456-426614174001",
                materia_prima_nombre: "Material con Stock Bajo",
                stock_actual: 5,
                stock_minimo: 20,
                stock_maximo: 100,
                porcentaje_stock: 5,
                estatus: "CRITICO",
                dias_reabastecimiento: 2,
                proveedor_nombre: "Proveedor Principal",
                ultima_compra: new Date("2024-01-10"),
                consumo_promedio_diario: 2.5
            }
        ];
        return {
            success: true,
            data: lowStockData.slice(0, params?.limit || 10)
        };
    },
    /**
     * Obtener estadísticas de stock
     */
    getStockStats: async (params) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const stats = {
            total_materiales: 45,
            materiales_activos: 42,
            materiales_bajo_stock: 3,
            materiales_sin_stock: 1,
            valor_total_inventario: 125750.50,
            valor_promedio_material: 2794.45,
            rotacion_inventario: 3.2,
            total_movimientos_periodo: 156,
            entradas_periodo: 89,
            salidas_periodo: 67,
            crecimiento_inventario: 5.2,
            materiales_criticos: 2,
            eficiencia_reabastecimiento: 94.5
        };
        return {
            success: true,
            data: stats
        };
    },
    /**
     * Obtener historial de movimientos por material
     */
    getMovementHistory: async (materia_prima_id, params) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const history = [
            {
                id: "hist-001",
                materia_prima_id,
                tipo: "ENTRADA",
                cantidad: 25,
                stock_anterior: 75,
                stock_nuevo: 100,
                motivo: "Reabastecimiento regular",
                referencia_id: "comp-001",
                referencia_tipo: "COMPRA",
                fecha_movimiento: new Date(Date.now() - 86400000), // 1 day ago
                creado_por: "admin",
                institucion_id: "inst-001",
                proveedor_id: "prov-001",
                costo_unitario: 25.50,
                valor_total: 637.50
            },
            {
                id: "hist-002",
                materia_prima_id,
                tipo: "SALIDA",
                cantidad: 15,
                stock_anterior: 100,
                stock_nuevo: 85,
                motivo: "Producción turno mañana",
                referencia_id: "prod-001",
                referencia_tipo: "PRODUCCION",
                fecha_movimiento: new Date(Date.now() - 43200000), // 12 hours ago
                creado_por: "user1",
                institucion_id: "inst-001",
                proveedor_id: null,
                costo_unitario: 25.50,
                valor_total: 382.50
            }
        ];
        return {
            success: true,
            data: history.slice(0, params?.limit || 20)
        };
    },
    /**
     * Realizar ajuste de inventario
     */
    adjustInventory: async (data) => {
        await new Promise(resolve => setTimeout(resolve, 150));
        const newItem = {
            id: `adj-${Date.now()}`,
            materia_prima_id: data.materia_prima_id,
            tipo: "AJUSTE",
            cantidad: data.cantidad_ajuste,
            stock_anterior: 100, // Mock previous stock
            stock_nuevo: 100 + data.cantidad_ajuste, // Mock new stock
            motivo: data.motivo,
            referencia_id: data.referencia_id,
            referencia_tipo: "AJUSTE",
            fecha_movimiento: new Date(),
            creado_por: "admin",
            institucion_id: "inst-001",
            proveedor_id: null,
            costo_unitario: 25.50,
            valor_total: data.cantidad_ajuste * 25.50
        };
        return {
            success: true,
            data: newItem
        };
    }
};
exports.stockAdapter = exports.mockStockAdapter;
//# sourceMappingURL=stock.adapter.mock.js.map