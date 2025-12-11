"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proveedorAdapter = void 0;
const logger_simple_util_1 = __importDefault(require("../web-api/utils/logger-simple.util"));
class PostgresProveedorAdapter {
    async create(data) {
        logger_simple_util_1.default.info('Creating proveedor', { codigo: data.codigo, nombre: data.nombre });
        // Mock implementation - replace with actual database call
        const newProveedor = {
            id: Math.floor(Math.random() * 1000000),
            uuid: crypto.randomUUID(),
            ...data,
            activo: true,
        };
        logger_simple_util_1.default.info('Proveedor created successfully', { id: newProveedor.id, uuid: newProveedor.uuid });
        return newProveedor;
    }
    async findById(id) {
        logger_simple_util_1.default.debug('Finding proveedor by id', { id });
        // Mock implementation
        if (id <= 0)
            return null;
        return {
            id,
            uuid: crypto.randomUUID(),
            codigo: `PROV-${id.toString().padStart(6, '0')}`,
            nombre: `Proveedor ${id}`,
            contacto: `Contacto ${id}`,
            telefono: `555-000${id.toString().padStart(4, '0')}`,
            email: `proveedor${id}@example.com`,
            direccion: `Dirección del proveedor ${id}`,
            activo: true,
        };
    }
    async findByUuid(uuid) {
        logger_simple_util_1.default.debug('Finding proveedor by uuid', { uuid });
        // Mock implementation
        if (!uuid)
            return null;
        return {
            id: 1,
            uuid,
            codigo: 'PROV-000001',
            nombre: 'Proveedor Test',
            contacto: 'Contacto Test',
            telefono: '555-0001',
            email: 'test@proveedor.com',
            direccion: 'Dirección de prueba',
            activo: true,
        };
    }
    async findByCodigo(codigo) {
        logger_simple_util_1.default.debug('Finding proveedor by codigo', { codigo });
        // Mock implementation
        if (!codigo)
            return null;
        return {
            id: 1,
            uuid: crypto.randomUUID(),
            codigo,
            nombre: 'Proveedor por Código',
            contacto: 'Contacto encontrado por código',
            telefono: '555-9999',
            email: 'codigo@proveedor.com',
            direccion: 'Dirección encontrada por código',
            activo: true,
        };
    }
    async findAll(filter = {}) {
        logger_simple_util_1.default.debug('Finding all proveedores', { filter });
        // Mock implementation
        const results = [];
        const limit = filter.limit || 50;
        const offset = filter.offset || 0;
        for (let i = 1; i <= limit; i++) {
            results.push({
                id: offset + i,
                uuid: crypto.randomUUID(),
                codigo: `PROV-${(offset + i).toString().padStart(6, '0')}`,
                nombre: `Proveedor ${offset + i}`,
                contacto: `Contacto ${offset + i}`,
                telefono: `555-${(offset + i).toString().padStart(4, '0')}`,
                email: `proveedor${offset + i}@example.com`,
                direccion: `Dirección del proveedor ${offset + i}`,
                activo: filter.activo !== undefined ? filter.activo : true,
            });
        }
        return results;
    }
    async update(id, data) {
        logger_simple_util_1.default.info('Updating proveedor', { id, data });
        // Mock implementation
        const existing = await this.findById(id);
        if (!existing)
            return null;
        const updated = { ...existing, ...data, actualizado_por: data.actualizado_por };
        return updated;
    }
    async delete(id) {
        logger_simple_util_1.default.info('Deleting proveedor', { id });
        // Mock implementation
        return id > 0;
    }
    async softDelete(id, actualizado_por) {
        logger_simple_util_1.default.info('Soft deleting proveedor', { id, actualizado_por });
        // Mock implementation
        return await this.update(id, { activo: false, actualizado_por }) !== null;
    }
    async count(filter = {}) {
        logger_simple_util_1.default.debug('Counting proveedores', { filter });
        // Mock implementation
        return filter.limit || 100;
    }
}
// Export singleton instance
exports.proveedorAdapter = new PostgresProveedorAdapter();
//# sourceMappingURL=proveedores.adapter.js.map