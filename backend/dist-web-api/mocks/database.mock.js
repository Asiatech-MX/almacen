"use strict";
/**
 * Mock Database Connection para desarrollo y testing
 * Implementa una simulación de las operaciones de base de datos básicas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockDatabase = exports.getDatabase = void 0;
// Datos mock de ejemplo
const mockMateriaPrima = [
    {
        id: "123e4567-e89b-12d3-a456-426614174000",
        nombre: "Material de Prueba 1",
        stock_actual: 100,
        stock_minimo: 10,
        estatus: "ACTIVO",
        presentacion: "UNIDAD",
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        creado_por: "system",
        institucion_id: "inst-001"
    },
    {
        id: "123e4567-e89b-12d3-a456-426614174001",
        nombre: "Material de Prueba 2",
        stock_actual: 50,
        stock_minimo: 5,
        estatus: "INACTIVO",
        presentacion: "CAJA",
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        creado_por: "system",
        institucion_id: "inst-001"
    }
];
const mockProveedores = [
    {
        id: "prov-001",
        nombre: "Proveedor de Prueba",
        rfc: "RFC123456789",
        estatus: "ACTIVO",
        fecha_creacion: new Date(),
        institucion_id: "inst-001"
    }
];
class MockQueryBuilderImpl {
    constructor(table) {
        this.data = [];
        this.conditions = [];
        this.table = '';
        this.selectedColumns = [];
        this.orderByColumn = '';
        this.orderByDirection = 'asc';
        this.limitCount = 0;
        this.offsetCount = 0;
        this.table = table;
        // Cargar datos según la tabla
        switch (table) {
            case 'materia_prima':
                this.data = [...mockMateriaPrima];
                break;
            case 'proveedor':
                this.data = [...mockProveedores];
                break;
            default:
                this.data = [];
        }
    }
    select(columns) {
        this.selectedColumns = columns || ['*'];
        return this;
    }
    where(condition) {
        this.conditions.push(condition);
        return this;
    }
    orderBy(column, direction = 'asc') {
        this.orderByColumn = column;
        this.orderByDirection = direction;
        return this;
    }
    limit(limit) {
        this.limitCount = limit;
        return this;
    }
    offset(offset) {
        this.offsetCount = offset;
        return this;
    }
    applyConditions(data) {
        return data.filter(item => {
            return this.conditions.every(condition => {
                // Simple condition evaluator
                if (typeof condition === 'object' && condition !== null) {
                    return Object.entries(condition).every(([key, value]) => item[key] === value);
                }
                return true;
            });
        });
    }
    applySorting(data) {
        if (this.orderByColumn) {
            return data.sort((a, b) => {
                const aVal = a[this.orderByColumn];
                const bVal = b[this.orderByColumn];
                if (this.orderByDirection === 'asc') {
                    return aVal > bVal ? 1 : -1;
                }
                else {
                    return aVal < bVal ? 1 : -1;
                }
            });
        }
        return data;
    }
    applyPagination(data) {
        let result = data;
        if (this.offsetCount > 0) {
            result = result.slice(this.offsetCount);
        }
        if (this.limitCount > 0) {
            result = result.slice(0, this.limitCount);
        }
        return result;
    }
    async execute() {
        let result = this.applyConditions(this.data);
        result = this.applySorting(result);
        result = this.applyPagination(result);
        // Apply column selection
        if (this.selectedColumns.length > 0 && !this.selectedColumns.includes('*')) {
            result = result.map(item => {
                const selected = {};
                this.selectedColumns.forEach(col => {
                    if (item[col] !== undefined) {
                        selected[col] = item[col];
                    }
                });
                return selected;
            });
        }
        return result;
    }
    async executeTakeFirst() {
        const results = await this.execute();
        return results[0] || null;
    }
    async executeTakeFirstOrThrow() {
        const results = await this.execute();
        if (results.length === 0) {
            throw new Error(`No results found for table ${this.table}`);
        }
        return results[0];
    }
}
class MockInsertBuilderImpl {
    constructor(table) {
        this.table = '';
        this.insertData = {};
        this.returningColumns = [];
        this.table = table;
    }
    values(data) {
        this.insertData = data;
        return this;
    }
    returning(columns) {
        this.returningColumns = columns || ['*'];
        return this;
    }
    async execute() {
        const newItem = {
            id: this.generateId(),
            ...this.insertData,
            fecha_creacion: new Date(),
            estatus: 'ACTIVO'
        };
        switch (this.table) {
            case 'materia_prima':
                mockMateriaPrima.push(newItem);
                break;
            case 'proveedor':
                mockProveedores.push(newItem);
                break;
        }
        return [newItem];
    }
    async executeTakeFirst() {
        const results = await this.execute();
        return results[0] || null;
    }
    async executeTakeFirstOrThrow() {
        const results = await this.execute();
        if (results.length === 0) {
            throw new Error(`No results found for table ${this.table}`);
        }
        return results[0];
    }
    generateId() {
        return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
class MockUpdateBuilderImpl {
    constructor(table) {
        this.table = '';
        this.updateData = {};
        this.conditions = [];
        this.returningColumns = [];
        this.table = table;
    }
    set(data) {
        this.updateData = data;
        return this;
    }
    where(condition) {
        this.conditions.push(condition);
        return this;
    }
    returning(columns) {
        this.returningColumns = columns || ['*'];
        return this;
    }
    async execute() {
        let targetData = [];
        switch (this.table) {
            case 'materia_prima':
                targetData = mockMateriaPrima;
                break;
            case 'proveedor':
                targetData = mockProveedores;
                break;
        }
        const updatedItems = targetData.map(item => {
            const shouldUpdate = this.conditions.every(condition => {
                if (typeof condition === 'object' && condition !== null) {
                    return Object.entries(condition).every(([key, value]) => item[key] === value);
                }
                return true;
            });
            if (shouldUpdate) {
                return {
                    ...item,
                    ...this.updateData,
                    fecha_actualizacion: new Date()
                };
            }
            return item;
        });
        return updatedItems.filter(item => {
            return this.conditions.every(condition => {
                if (typeof condition === 'object' && condition !== null) {
                    return Object.entries(condition).every(([key, value]) => item[key] === value);
                }
                return true;
            });
        });
    }
}
class MockDeleteBuilderImpl {
    constructor(table) {
        this.table = '';
        this.conditions = [];
        this.returningColumns = [];
        this.table = table;
    }
    where(condition) {
        this.conditions.push(condition);
        return this;
    }
    returning(columns) {
        this.returningColumns = columns || ['*'];
        return this;
    }
    async execute() {
        let targetData = [];
        switch (this.table) {
            case 'materia_prima':
                targetData = mockMateriaPrima;
                break;
            case 'proveedor':
                targetData = mockProveedores;
                break;
        }
        const deletedItems = targetData.filter(item => {
            return this.conditions.every(condition => {
                if (typeof condition === 'object' && condition !== null) {
                    return Object.entries(condition).every(([key, value]) => item[key] === value);
                }
                return true;
            });
        });
        // Remove items from arrays (in real implementation)
        // For mock, we just return what would be deleted
        return deletedItems;
    }
}
const getDatabase = () => ({
    selectFrom: (table) => new MockQueryBuilderImpl(table),
    insertInto: (table) => new MockInsertBuilderImpl(table),
    updateTable: (table) => new MockUpdateBuilderImpl(table),
    deleteFrom: (table) => new MockDeleteBuilderImpl(table)
});
exports.getDatabase = getDatabase;
// Para compatibilidad con código existente
exports.getMockDatabase = exports.getDatabase;
//# sourceMappingURL=database.mock.js.map