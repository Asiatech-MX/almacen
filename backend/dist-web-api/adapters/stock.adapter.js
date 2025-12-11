"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockAdapter = void 0;
const logger_simple_util_1 = __importDefault(require("../web-api/utils/logger-simple.util"));
class PostgresStockAdapter {
    async createMovement(data) {
        logger_simple_util_1.default.info('Creating stock movement', {
            materia_prima_id: data.materia_prima_id,
            tipo_movimiento: data.tipo_movimiento,
            cantidad: data.cantidad
        });
        // Mock implementation - replace with actual database call
        const newMovement = {
            id: Math.floor(Math.random() * 1000000),
            uuid: crypto.randomUUID(),
            ...data,
        };
        logger_simple_util_1.default.info('Stock movement created successfully', { id: newMovement.id, uuid: newMovement.uuid });
        return newMovement;
    }
    async findMovements(filter = {}) {
        logger_simple_util_1.default.debug('Finding stock movements', { filter });
        // Mock implementation
        const results = [];
        const limit = filter.limit || 50;
        const offset = filter.offset || 0;
        for (let i = 1; i <= limit; i++) {
            results.push({
                id: offset + i,
                uuid: crypto.randomUUID(),
                materia_prima_id: filter.materia_prima_id || crypto.randomUUID(),
                tipo_movimiento: filter.tipo_movimiento || 'entrada',
                cantidad: Math.floor(Math.random() * 100) + 1,
                motivo: `Movimiento ${offset + i}`,
                creado_por: filter.creado_por || 'usuario1',
                referencia_id: filter.referencia_id || `REF-${(offset + i).toString().padStart(6, '0')}`,
            });
        }
        return results;
    }
    async getStockSummary(filter = {}) {
        logger_simple_util_1.default.debug('Getting stock summary', { filter });
        // Mock implementation
        const results = [];
        const limit = 20;
        for (let i = 1; i <= limit; i++) {
            const stockActual = Math.floor(Math.random() * 200);
            const stockMinimo = Math.floor(Math.random() * 50) + 10;
            const stockMaximo = Math.floor(Math.random() * 500) + 200;
            let estado = 'normal';
            if (stockActual === 0)
                estado = 'agotado';
            else if (stockActual < stockMinimo)
                estado = 'bajo';
            else if (stockActual > stockMaximo)
                estado = 'excesivo';
            results.push({
                materia_prima_id: filter.materia_prima_id || crypto.randomUUID(),
                materia_prima_nombre: `Material ${i}`,
                materia_prima_codigo: `MAT-${i.toString().padStart(6, '0')}`,
                stock_actual: stockActual,
                stock_minimo: stockMinimo,
                stock_maximo: stockMaximo,
                estado,
                valor_total: stockActual * (Math.random() * 100 + 10),
                ultimo_movimiento: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
            });
        }
        return results;
    }
    async getLowStockItems() {
        logger_simple_util_1.default.debug('Getting low stock items');
        // Mock implementation
        return [
            {
                materia_prima_id: crypto.randomUUID(),
                materia_prima_nombre: 'Material Stock Bajo 1',
                materia_prima_codigo: 'MAT-000001',
                stock_actual: 5,
                stock_minimo: 10,
                stock_maximo: 1000,
                estado: 'bajo',
                valor_total: 5 * 50.5,
                ultimo_movimiento: new Date(),
            },
            {
                materia_prima_id: crypto.randomUUID(),
                materia_prima_nombre: 'Material Stock Bajo 2',
                materia_prima_codigo: 'MAT-000002',
                stock_actual: 0,
                stock_minimo: 8,
                stock_maximo: 500,
                estado: 'agotado',
                valor_total: 0,
                ultimo_movimiento: new Date(),
            },
        ];
    }
    async getStockByMateriaPrima(materia_prima_id) {
        logger_simple_util_1.default.debug('Getting stock by materia prima', { materia_prima_id });
        // Mock implementation
        return Math.floor(Math.random() * 200);
    }
    async updateStock(materia_prima_id, cantidad, tipo, motivo, creado_por) {
        logger_simple_util_1.default.info('Updating stock', {
            materia_prima_id,
            cantidad,
            tipo,
            motivo,
            creado_por
        });
        // Mock implementation - create movement and update stock
        try {
            await this.createMovement({
                materia_prima_id,
                tipo_movimiento: tipo,
                cantidad,
                motivo,
                creado_por,
            });
            // In real implementation, this would update the materia_prima table
            logger_simple_util_1.default.info('Stock updated successfully', { materia_prima_id, cantidad, tipo });
            return true;
        }
        catch (error) {
            logger_simple_util_1.default.error('Failed to update stock', { materia_prima_id, cantidad, tipo, error });
            return false;
        }
    }
    async getStockHistory(materia_prima_id, days = 30) {
        logger_simple_util_1.default.debug('Getting stock history', { materia_prima_id, days });
        // Mock implementation
        const results = [];
        const limit = Math.min(days * 2, 100); // Assume max 2 movements per day
        for (let i = 1; i <= limit; i++) {
            results.push({
                id: i,
                uuid: crypto.randomUUID(),
                materia_prima_id,
                tipo_movimiento: Math.random() > 0.5 ? 'entrada' : 'salida',
                cantidad: Math.floor(Math.random() * 100) + 1,
                motivo: `Movimiento histórico ${i}`,
                creado_por: 'usuario1',
                referencia_id: `HIST-${i.toString().padStart(6, '0')}`,
            });
        }
        return results;
    }
}
// Export singleton instance
exports.stockAdapter = new PostgresStockAdapter();
//# sourceMappingURL=stock.adapter.js.map