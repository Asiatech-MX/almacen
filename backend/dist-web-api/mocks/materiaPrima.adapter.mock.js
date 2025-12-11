"use strict";
/**
 * Mock Materia Prima Adapter para desarrollo y testing
 * Implementa una simulación del adapter de materia prima
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.materiaPrimaAdapter = exports.mockMateriaPrimaAdapter = void 0;
exports.mockMateriaPrimaAdapter = {
    /**
     * Listar materia prima con filtros y paginación
     */
    findAll: async (params) => {
        // Simulate database delay
        await new Promise(resolve => setTimeout(resolve, 100));
        const mockData = [
            {
                id: "123e4567-e89b-12d3-a456-426614174000",
                nombre: "Material de Prueba 1",
                descripcion: "Descripción del material de prueba 1",
                stock_actual: 100,
                stock_minimo: 10,
                stock_maximo: 500,
                costo_unitario: 25.50,
                presentacion: "UNIDAD",
                categoria: "MATERIA_PRIMA",
                estatus: "ACTIVO",
                proveedor_id: "prov-001",
                codigo: "MAT-001",
                fecha_creacion: new Date("2024-01-01"),
                fecha_actualizacion: new Date("2024-01-15"),
                creado_por: "admin",
                institucion_id: "inst-001"
            },
            {
                id: "123e4567-e89b-12d3-a456-426614174001",
                nombre: "Material de Prueba 2",
                descripcion: "Descripción del material de prueba 2",
                stock_actual: 50,
                stock_minimo: 5,
                stock_maximo: 200,
                costo_unitario: 15.75,
                presentacion: "CAJA",
                categoria: "INSUMO",
                estatus: "INACTIVO",
                proveedor_id: "prov-002",
                codigo: "MAT-002",
                fecha_creacion: new Date("2024-01-02"),
                fecha_actualizacion: new Date("2024-01-16"),
                creado_por: "admin",
                institucion_id: "inst-001"
            },
            {
                id: "123e4567-e89b-12d3-a456-426614174002",
                nombre: "Material de Prueba 3",
                descripcion: "Descripción del material de prueba 3",
                stock_actual: 200,
                stock_minimo: 20,
                stock_maximo: 1000,
                costo_unitario: 50.00,
                presentacion: "KILO",
                categoria: "MATERIA_PRIMA",
                estatus: "ACTIVO",
                proveedor_id: "prov-001",
                codigo: "MAT-003",
                fecha_creacion: new Date("2024-01-03"),
                fecha_actualizacion: new Date("2024-01-17"),
                creado_por: "admin",
                institucion_id: "inst-001"
            }
        ];
        let filteredData = [...mockData];
        // Apply filters
        if (params.filter) {
            const { search, estatus, categoria, proveedor_id } = params.filter;
            if (search) {
                filteredData = filteredData.filter(item => item.nombre.toLowerCase().includes(search.toLowerCase()) ||
                    item.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
                    item.codigo.toLowerCase().includes(search.toLowerCase()));
            }
            if (estatus) {
                filteredData = filteredData.filter(item => item.estatus === estatus);
            }
            if (categoria) {
                filteredData = filteredData.filter(item => item.categoria === categoria);
            }
            if (proveedor_id) {
                filteredData = filteredData.filter(item => item.proveedor_id === proveedor_id);
            }
        }
        const total = filteredData.length;
        // Apply pagination
        const { page = 1, limit = 10, sortBy = 'fecha_creacion', sortOrder = 'desc' } = params.pagination || {};
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
     * Obtener materia prima por ID
     */
    findById: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        const mockItem = {
            id,
            nombre: `Material ${id}`,
            descripcion: `Descripción del material ${id}`,
            stock_actual: 100,
            stock_minimo: 10,
            stock_maximo: 500,
            costo_unitario: 25.50,
            presentacion: "UNIDAD",
            categoria: "MATERIA_PRIMA",
            estatus: "ACTIVO",
            proveedor_id: "prov-001",
            codigo: `MAT-${id}`,
            fecha_creacion: new Date(),
            fecha_actualizacion: new Date(),
            creado_por: "admin",
            institucion_id: "inst-001"
        };
        return {
            success: true,
            data: mockItem
        };
    },
    /**
     * Crear nueva materia prima
     */
    create: async (data) => {
        await new Promise(resolve => setTimeout(resolve, 150));
        const newItem = {
            id: `new-${Date.now()}`,
            ...data,
            estatus: "ACTIVO",
            fecha_creacion: new Date(),
            fecha_actualizacion: new Date(),
            creado_por: "admin",
            institucion_id: "inst-001"
        };
        return {
            success: true,
            data: newItem
        };
    },
    /**
     * Actualizar materia prima existente
     */
    update: async (id, data) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const updatedItem = {
            id,
            nombre: data.nombre || "Material Actualizado",
            descripcion: data.descripcion,
            stock_actual: data.stock_actual,
            stock_minimo: data.stock_minimo,
            stock_maximo: data.stock_maximo,
            costo_unitario: data.costo_unitario,
            presentacion: data.presentacion,
            categoria: data.categoria,
            estatus: data.estatus,
            proveedor_id: data.proveedor_id,
            codigo: data.codigo,
            fecha_creacion: new Date("2024-01-01"),
            fecha_actualizacion: new Date(),
            creado_por: "admin",
            institucion_id: "inst-001"
        };
        return {
            success: true,
            data: updatedItem
        };
    },
    /**
     * Actualizar estatus de materia prima (habilitar/deshabilitar)
     */
    updateEstatus: async (id, estatus) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const updatedItem = {
            id,
            nombre: `Material ${id}`,
            descripcion: `Descripción del material ${id}`,
            stock_actual: 100,
            stock_minimo: 10,
            stock_maximo: 500,
            costo_unitario: 25.50,
            presentacion: "UNIDAD",
            categoria: "MATERIA_PRIMA",
            estatus,
            proveedor_id: "prov-001",
            codigo: `MAT-${id}`,
            fecha_creacion: new Date("2024-01-01"),
            fecha_actualizacion: new Date(),
            creado_por: "admin",
            institucion_id: "inst-001"
        };
        return {
            success: true,
            data: updatedItem
        };
    },
    /**
     * Eliminar materia prima (soft delete)
     */
    delete: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
            success: true
        };
    },
    /**
     * Obtener materia prima con bajo stock
     */
    getLowStock: async (params) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const lowStockItems = [
            {
                id: "low-stock-001",
                nombre: "Material con Bajo Stock",
                descripcion: "Material que necesita reabastecimiento",
                stock_actual: 5,
                stock_minimo: 10,
                stock_maximo: 100,
                costo_unitario: 30.00,
                presentacion: "UNIDAD",
                categoria: "MATERIA_PRIMA",
                estatus: "ACTIVO",
                proveedor_id: "prov-001",
                codigo: "LOW-001",
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date(),
                creado_por: "admin",
                institucion_id: "inst-001"
            }
        ];
        return {
            success: true,
            data: lowStockItems.slice(0, params?.limit || 10)
        };
    },
    /**
     * Ajustar stock
     */
    adjustStock: async (id, adjustment) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        // Mock stock adjustment
        const currentStock = 100;
        const newStock = adjustment.tipo === 'ENTRADA'
            ? currentStock + adjustment.cantidad
            : Math.max(0, currentStock - adjustment.cantidad);
        const updatedItem = {
            id,
            nombre: `Material ${id}`,
            descripcion: `Descripción del material ${id}`,
            stock_actual: newStock,
            stock_minimo: 10,
            stock_maximo: 500,
            costo_unitario: 25.50,
            presentacion: "UNIDAD",
            categoria: "MATERIA_PRIMA",
            estatus: "ACTIVO",
            proveedor_id: "prov-001",
            codigo: `MAT-${id}`,
            fecha_creacion: new Date("2024-01-01"),
            fecha_actualizacion: new Date(),
            creado_por: "admin",
            institucion_id: "inst-001"
        };
        return {
            success: true,
            data: updatedItem
        };
    }
};
exports.materiaPrimaAdapter = exports.mockMateriaPrimaAdapter;
//# sourceMappingURL=materiaPrima.adapter.mock.js.map