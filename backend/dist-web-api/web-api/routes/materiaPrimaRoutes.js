"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const materiaPrimaAdapter_js_1 = __importDefault(require("../adapters/materiaPrimaAdapter.js"));
const validation_js_1 = require("../middleware/validation.js");
const router = (0, express_1.Router)();
const adapter = new materiaPrimaAdapter_js_1.default();
/**
 * Routes para gestión de Materia Prima
 * Base path: /api/materiaPrima
 */
// GET /api/materiaPrima - Listar todos los materiales (incluyendo INACTIVOS por defecto)
router.get('/', async (req, res) => {
    try {
        // Obtener query parameters para filtros
        const { page = 1, limit = 50, search, categoria, includeInactive = 'false' // Por defecto incluir inactivos para soft delete
        , // Por defecto incluir inactivos para soft delete
        sortBy = 'nombre', sortOrder = 'ASC' } = req.query;
        // Convertir strings a números
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const includeInactiveFlag = includeInactive === 'true';
        if (pageNum < 1 || limitNum < 1 || limitNum > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros de paginación inválidos'
            });
        }
        // Simular un request body para el método listar
        const mockReq = {
            body: {
                page: pageNum,
                limit: limitNum,
                search,
                categoria,
                // Por defecto incluir ambos activos e inactivos para soft delete
                activo: undefined,
                sortBy,
                sortOrder
            }
        };
        // Llamar al método listar del adaptador
        await adapter.listar(mockReq, res, () => { });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error al listar materiales'
        });
    }
});
// POST /api/materiaPrima/listar - Listar materiales con filtros y paginación
router.post('/listar', validation_js_1.validatePagination, adapter.listar.bind(adapter));
// POST /api/materiaPrima/crear - Crear nuevo material
router.post('/crear', validation_js_1.validateMateriaPrima, adapter.crear.bind(adapter));
// PUT /api/materiaPrima/actualizar/:id - Actualizar material existente
router.put('/actualizar/:id', (0, validation_js_1.validateId)('id'), adapter.actualizar.bind(adapter));
// DELETE /api/materiaPrima/eliminar/:id - Eliminar material
router.delete('/eliminar/:id', (0, validation_js_1.validateId)('id'), adapter.eliminar.bind(adapter));
// GET /api/materiaPrima/detalles/:id - Obtener detalles de material
router.get('/detalles/:id', (0, validation_js_1.validateId)('id'), adapter.detalles.bind(adapter));
// GET /api/materiaPrima/stock-bajo - Obtener materiales con stock bajo
router.get('/stock-bajo', adapter.stockBajo.bind(adapter));
// POST /api/materiaPrima/buscar - Buscar materiales por término
router.post('/buscar', adapter.buscar.bind(adapter));
// GET /api/materiaPrima/stats - Obtener estadísticas
router.get('/stats', adapter.stats.bind(adapter));
// POST /api/materiaPrima/verificar-stock - Verificar disponibilidad de stock
router.post('/verificar-stock', adapter.verificarStock.bind(adapter));
// POST /api/materiaPrima/actualizar-stock - Actualizar stock
router.post('/actualizar-stock', adapter.actualizarStock.bind(adapter));
exports.default = router;
//# sourceMappingURL=materiaPrimaRoutes.js.map