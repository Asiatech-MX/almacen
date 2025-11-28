"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.materiaPrimaAdapter = void 0;
const logger_simple_util_1 = __importDefault(require("../web-api/utils/logger-simple.util"));
class PostgresMateriaPrimaAdapter {
    async create(data) {
        logger_simple_util_1.default.info('Creating materia prima', { codigo: data.codigo, nombre: data.nombre });
        // Mock implementation - replace with actual database call
        const newMateriaPrima = {
            id: Math.floor(Math.random() * 1000000),
            uuid: crypto.randomUUID(),
            ...data,
            stock_actual: data.stock_actual || 0,
            stock_minimo: data.stock_minimo || 0,
            stock_maximo: data.stock_maximo || 0,
            costo_unitario: data.costo_unitario || 0,
            activo: true,
        };
        logger_simple_util_1.default.info('Materia prima created successfully', { id: newMateriaPrima.id, uuid: newMateriaPrima.uuid });
        return newMateriaPrima;
    }
    async findById(id) {
        logger_simple_util_1.default.debug('Finding materia prima by id', { id });
        // Mock implementation
        if (id <= 0)
            return null;
        return {
            id,
            uuid: crypto.randomUUID(),
            codigo: `MAT-${id.toString().padStart(6, '0')}`,
            nombre: `Material ${id}`,
            descripcion: `Descripción del material ${id}`,
            categoria: 'Categoría A',
            unidad_medida: 'KG',
            stock_actual: 100,
            stock_minimo: 10,
            stock_maximo: 1000,
            costo_unitario: 50.5,
            activo: true,
        };
    }
    async findByUuid(uuid) {
        logger_simple_util_1.default.debug('Finding materia prima by uuid', { uuid });
        // Mock implementation
        if (!uuid)
            return null;
        return {
            id: 1,
            uuid,
            codigo: 'MAT-000001',
            nombre: 'Material Test',
            descripcion: 'Descripción del material test',
            categoria: 'Categoría A',
            unidad_medida: 'KG',
            stock_actual: 100,
            stock_minimo: 10,
            stock_maximo: 1000,
            costo_unitario: 50.5,
            activo: true,
        };
    }
    async findByCodigo(codigo) {
        logger_simple_util_1.default.debug('Finding materia prima by codigo', { codigo });
        // Mock implementation
        if (!codigo)
            return null;
        return {
            id: 1,
            uuid: crypto.randomUUID(),
            codigo,
            nombre: 'Material por Código',
            descripcion: 'Material encontrado por código',
            categoria: 'Categoría B',
            unidad_medida: 'LTS',
            stock_actual: 50,
            stock_minimo: 5,
            stock_maximo: 500,
            costo_unitario: 25.0,
            activo: true,
        };
    }
    async findAll(filter = {}) {
        logger_simple_util_1.default.debug('Finding all materia prima', { filter });
        // Mock implementation
        const results = [];
        const limit = filter.limit || 50;
        const offset = filter.offset || 0;
        for (let i = 1; i <= limit; i++) {
            results.push({
                id: offset + i,
                uuid: crypto.randomUUID(),
                codigo: `MAT-${(offset + i).toString().padStart(6, '0')}`,
                nombre: `Material ${offset + i}`,
                descripcion: `Descripción del material ${offset + i}`,
                categoria: filter.categoria || 'Categoría A',
                unidad_medida: 'KG',
                stock_actual: filter.stock_bajo ? 5 : 100,
                stock_minimo: 10,
                stock_maximo: 1000,
                costo_unitario: 50.5,
                activo: filter.activo !== undefined ? filter.activo : true,
            });
        }
        return results;
    }
    async update(id, data) {
        logger_simple_util_1.default.info('Updating materia prima', { id, data });
        // Mock implementation
        const existing = await this.findById(id);
        if (!existing)
            return null;
        const updated = { ...existing, ...data, actualizado_por: data.actualizado_por };
        return updated;
    }
    async delete(id) {
        logger_simple_util_1.default.info('Deleting materia prima', { id });
        // Mock implementation
        return id > 0;
    }
    async softDelete(id, actualizado_por) {
        logger_simple_util_1.default.info('Soft deleting materia prima', { id, actualizado_por });
        // Mock implementation
        return await this.update(id, { activo: false, actualizado_por }) !== null;
    }
    async count(filter = {}) {
        logger_simple_util_1.default.debug('Counting materia prima', { filter });
        // Mock implementation
        return filter.limit || 100;
    }
    async checkLowStock() {
        logger_simple_util_1.default.debug('Checking low stock materia prima');
        // Mock implementation
        return [
            {
                id: 1,
                uuid: crypto.randomUUID(),
                codigo: 'MAT-000001',
                nombre: 'Material Stock Bajo 1',
                descripcion: 'Material con stock bajo',
                categoria: 'Categoría A',
                unidad_medida: 'KG',
                stock_actual: 5,
                stock_minimo: 10,
                stock_maximo: 1000,
                costo_unitario: 50.5,
                activo: true,
            },
            {
                id: 2,
                uuid: crypto.randomUUID(),
                codigo: 'MAT-000002',
                nombre: 'Material Stock Bajo 2',
                descripcion: 'Otro material con stock bajo',
                categoria: 'Categoría B',
                unidad_medida: 'LTS',
                stock_actual: 2,
                stock_minimo: 8,
                stock_maximo: 500,
                costo_unitario: 25.0,
                activo: true,
            },
        ];
    }
    async updateStock(id, newStock, actualizado_por) {
        logger_simple_util_1.default.info('Updating materia prima stock', { id, newStock, actualizado_por });
        // Mock implementation
        if (newStock < 0) {
            logger_simple_util_1.default.error('Stock cannot be negative', { id, newStock });
            return false;
        }
        return await this.update(id, { stock_actual: newStock, actualizado_por }) !== null;
    }
}
// Export singleton instance
exports.materiaPrimaAdapter = new PostgresMateriaPrimaAdapter();
//# sourceMappingURL=materiaPrima.adapter.js.map