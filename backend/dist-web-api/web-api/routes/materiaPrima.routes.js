"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.materiaPrimaRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const response_util_1 = require("../utils/response.util");
const validation_util_1 = require("../utils/validation.util");
const validation_1 = require("../middleware/validation");
const materiaPrima_adapter_1 = require("../../adapters/materiaPrima.adapter");
const stock_adapter_1 = require("../../adapters/stock.adapter");
const router = (0, express_1.Router)();
exports.materiaPrimaRoutes = router;
/**
 * Validation chains for materia prima endpoints
 */
const materiaPrimaValidations = {
    listar: [
        (0, express_validator_1.body)('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page debe ser un número entero positivo'),
        (0, express_validator_1.body)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit debe ser un número entre 1 y 100'),
        (0, express_validator_1.body)('search')
            .optional()
            .isString()
            .isLength({ max: 100 })
            .withMessage('Search debe ser un texto de máximo 100 caracteres'),
        (0, express_validator_1.body)('sortBy')
            .optional()
            .isIn(['id', 'nombre', 'fecha_creacion', 'stock_actual', 'estatus'])
            .withMessage('sortBy debe ser un campo válido'),
        (0, express_validator_1.body)('sortOrder')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('sortOrder debe ser asc o desc')
    ],
    create: [
        (0, express_validator_1.body)('nombre')
            .notEmpty()
            .withMessage('Nombre es requerido')
            .isLength({ min: 1, max: 100 })
            .withMessage('Nombre debe tener entre 1 y 100 caracteres'),
        (0, express_validator_1.body)('stock_actual')
            .notEmpty()
            .isInt({ min: 0 })
            .withMessage('Stock actual es requerido y debe ser un número positivo'),
        (0, express_validator_1.body)('stock_minimo')
            .notEmpty()
            .isInt({ min: 0 })
            .withMessage('Stock mínimo es requerido y debe ser un número positivo'),
        (0, express_validator_1.body)('codigo_barras')
            .optional()
            .isLength({ max: 50 })
            .withMessage('Código de barras no debe exceder 50 caracteres'),
        (0, express_validator_1.body)('presentacion')
            .notEmpty()
            .isIn(['CAJA', 'BOTE', 'PAQUETE', 'UNIDAD', 'LITRO', 'KILOGRAMO'])
            .withMessage('Presentación es requerida'),
        (0, express_validator_1.body)('id_presentacion')
            .notEmpty()
            .isInt({ min: 1 })
            .withMessage('ID de presentación es requerido'),
        (0, express_validator_1.body)('id_proveedor')
            .optional()
            .isUUID()
            .withMessage('ID de proveedor debe ser un UUID válido'),
        (0, express_validator_1.body)('costo_unitario')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Costo unitario debe ser un número positivo'),
        (0, express_validator_1.body)('precio_venta')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Precio de venta debe ser un número positivo'),
        (0, express_validator_1.body)('categoria')
            .optional()
            .isString()
            .isLength({ max: 50 })
            .withMessage('Categoría no debe exceder 50 caracteres'),
        (0, express_validator_1.body)('ubicacion')
            .optional()
            .isString()
            .isLength({ max: 200 })
            .withMessage('Ubicación no debe exceder 200 caracteres')
    ],
    update: [
        (0, express_validator_1.body)('nombre')
            .optional()
            .isLength({ min: 1, max: 100 })
            .withMessage('Nombre debe tener entre 1 y 100 caracteres'),
        (0, express_validator_1.body)('descripcion')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Descripción no debe exceder 500 caracteres'),
        (0, express_validator_1.body)('stock_actual')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Stock actual debe ser un número positivo'),
        (0, express_validator_1.body)('stock_minimo')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Stock mínimo debe ser un número positivo'),
        (0, express_validator_1.body)('codigo_barras')
            .optional()
            .isLength({ max: 50 })
            .withMessage('Código de barras no debe exceder 50 caracteres'),
        (0, express_validator_1.body)('presentacion')
            .optional()
            .isIn(['CAJA', 'BOTE', 'PAQUETE', 'UNIDAD', 'LITRO', 'KILOGRAMO'])
            .withMessage('Presentación es requerida'),
        (0, express_validator_1.body)('id_presentacion')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de presentación es requerido'),
        (0, express_validator_1.body)('id_proveedor')
            .optional()
            .isUUID()
            .withMessage('ID de proveedor debe ser un UUID válido'),
        (0, express_validator_1.body)('costo_unitario')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Costo unitario debe ser un número positivo'),
        (0, express_validator_1.body)('precio_venta')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Precio de venta debe ser un número positivo'),
        (0, express_validator_1.body)('categoria')
            .optional()
            .isString()
            .isLength({ max: 50 })
            .withMessage('Categoría no debe exceder 50 caracteres'),
        (0, express_validator_1.body)('ubicacion')
            .optional()
            .isString()
            .isLength({ max: 200 })
            .withMessage('Ubicación no debe exceder 200 caracteres'),
        (0, express_validator_1.body)('estatus')
            .optional()
            .isIn(['ACTIVO', 'INACTIVO'])
            .withMessage('Estatus debe ser ACTIVO o INACTIVO')
    ],
    search: [
        (0, express_validator_1.query)('termino')
            .notEmpty()
            .isLength({ min: 1, max: 100 })
            .withMessage('Término de búsqueda es requerido')
    ],
    stats: [],
    updateEstatus: [
        (0, express_validator_1.param)('id')
            .isUUID()
            .withMessage('ID de materia prima es requerido'),
        (0, express_validator_1.body)('estatus')
            .notEmpty()
            .withMessage('Estatus es requerido')
            .isIn(['ACTIVO', 'INACTIVO'])
            .withMessage('Estatus debe ser ACTIVO o INACTIVO')
    ],
    detalles: [
        (0, express_validator_1.param)('id')
            .isUUID()
            .withMessage('ID de materia prima es requerido')
    ],
    ajuste: [
        (0, express_validator_1.body)('materiaPrimaId')
            .notEmpty()
            .isUUID()
            .withMessage('ID de materia prima es requerido'),
        (0, express_validator_1.body)('tipo')
            .notEmpty()
            .isIn(['AJUSTE_MANUAL', 'AJUSTE_SISTEMA', 'AJUSTE_INVENTARIO'])
            .withMessage('Tipo de ajuste es requerido'),
        (0, express_validator_1.body)('cantidad')
            .notEmpty()
            .isInt()
            .withMessage('Cantidad es requerida y debe ser un número entero'),
        (0, express_validator_1.body)('motivo')
            .notEmpty()
            .isString()
            .isLength({ min: 1, max: 200 })
            .withMessage('Motivo es requerido'),
        (0, express_validator_1.body)('usuarioId')
            .notEmpty()
            .isUUID()
            .withMessage('ID de usuario es requerido')
    ],
    movimiento: [
        (0, express_validator_1.body)('materiaPrimaId')
            .notEmpty()
            .isUUID()
            .withMessage('ID de materia prima es requerido'),
        (0, express_validator_1.body)('tipo')
            .notEmpty()
            .isIn(['ENTRADA', 'SALIDA', 'AJUSTE'])
            .withMessage('Tipo de movimiento es requerido'),
        (0, express_validator_1.body)('cantidad')
            .notEmpty()
            .isInt({ min: 1 })
            .withMessage('Cantidad es requerida y debe ser un número positivo'),
        (0, express_validator_1.body)('motivo')
            .notEmpty()
            .isString()
            .isLength({ min: 1, max: 200 })
            .withMessage('Motivo es requerido'),
        (0, express_validator_1.body)('usuarioId')
            .notEmpty()
            .isUUID()
            .withMessage('ID de usuario es requerido')
    ]
};
/**
 * GET /api/materiaPrima/listar
 * Listar materia prima con paginación y búsqueda
 */
router.post('/listar', (0, validation_1.runValidation)(materiaPrimaValidations.listar), async (req, res) => {
    try {
        const { page, limit, offset } = (0, validation_util_1.validatePagination)(req);
        const { search, sortBy, sortOrder } = (0, validation_util_1.validateSorting)(req, [
            'id', 'nombre', 'fecha_creacion', 'stock_actual', 'estatus'
        ]);
        const result = await materiaPrima_adapter_1.materiaPrimaAdapter.findAll({
            page,
            limit,
            offset,
            search,
            sortBy,
            sortOrder
        });
        if (!result.success) {
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al listar materiales');
        }
        const pagination = (0, response_util_1.createPaginationInfo)(page, limit, result.total);
        (0, response_util_1.sendPaginatedResponse)(res, result.data, pagination, 'Materiales listados exitosamente');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al listar materiales');
    }
});
/**
 * POST /api/materiaPrima/crear
 * Crear nuevo materia prima
 */
router.post('/crear', (0, validation_1.runValidation)(materiaPrimaValidations.create), async (req, res) => {
    try {
        const materiaPrimaData = req.body;
        const result = await materiaPrima_adapter_1.materiaPrimaAdapter.create(materiaPrimaData);
        if (!result.success) {
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al crear material');
        }
        (0, response_util_1.sendSuccessResponse)(res, result.data, 'Material creado exitosamente', 201);
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al crear material');
    }
});
/**
 * PUT /api/materiaPrima/actualizar/:id
 * Actualizar materia prima existente
 */
router.put('/actualizar/:id', (0, validation_1.runValidation)(materiaPrimaValidations.update), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const result = await materiaPrima_adapter_1.materiaPrimaAdapter.update(id, updateData);
        if (!result.success) {
            if (result.message?.includes('not found')) {
                return (0, response_util_1.sendErrorResponse)(res, 'Material no encontrado', 404);
            }
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al actualizar material');
        }
        (0, response_util_1.sendSuccessResponse)(res, result.data, 'Material actualizado exitosamente');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al actualizar material');
    }
});
/**
 * PATCH /api/materiaPrima/:id/estatus
 * Actualizar específicamente el estatus de materia prima
 */
router.patch('/:id/estatus', (0, validation_1.runValidation)(materiaPrimaValidations.updateEstatus), async (req, res) => {
    try {
        const { id } = req.params;
        const { estatus } = req.body;
        console.log(`🔄 PATCH /api/materiaPrima/${id}/estatus - body:`, req.body);
        const result = await materiaPrima_adapter_1.materiaPrimaAdapter.update(id, { estatus });
        if (!result.success) {
            if (result.message?.includes('not found')) {
                return (0, response_util_1.sendErrorResponse)(res, 'Material no encontrado', 404);
            }
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al actualizar estatus del material');
        }
        (0, response_util_1.sendSuccessResponse)(res, result.data, 'Estatus del material actualizado exitosamente');
    }
    catch (error) {
        console.error('❌ Error en PATCH /api/materiaPrima/:id/estatus:', error);
        (0, response_util_1.sendErrorResponse)(res, 'Error al actualizar estatus del material');
    }
});
/**
 * DELETE /api/materiaPrima/eliminar/:id
 * Eliminar materia prima (soft delete)
 */
router.delete('/eliminar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await materiaPrima_adapter_1.materiaPrimaAdapter.delete(id);
        if (!result.success) {
            if (result.message?.includes('not found')) {
                return (0, response_util_1.sendErrorResponse)(res, 'Material no encontrado', 404);
            }
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al eliminar material');
        }
        (0, response_util_1.sendSuccessResponse)(res, { id }, 'Material eliminado exitosamente');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al eliminar material');
    }
});
/**
 * GET /api/materiaPrima/detalles/:id
 * Obtener detalles de materia prima específica
 */
router.get('/detalles/:id', (0, validation_1.runValidation)(materiaPrimaValidations.detalles), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await materiaPrima_adapter_1.materiaPrimaAdapter.detalles(id);
        if (!result.success) {
            if (result.message?.includes('not found')) {
                return (0, response_util_1.sendErrorResponse)(res, 'Material no encontrado', 404);
            }
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al obtener detalles del material');
        }
        (0, response_util_1.sendSuccessResponse)(res, result.data, 'Detalles del material obtenidos exitosamente');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al obtener detalles del material');
    }
});
/**
 * GET /api/materiaPrima/stats
 * Obtener estadísticas de materia prima
 */
router.get('/stats', async (req, res) => {
    try {
        const result = await materiaPrima_adapter_1.materiaPrimaAdapter.getStats();
        if (!result.success) {
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al obtener estadísticas');
        }
        (0, response_util_1.sendSuccessResponse)(res, result.data, 'Estadísticas obtenidas exitosamente');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al obtener estadísticas');
    }
});
/**
 * GET /api/materiaPrima/stock-bajo
 * Obtener materiales con stock bajo
 */
router.get('/stock-bajo', async (req, res) => {
    try {
        const result = await stock_adapter_1.stockAdapter.obtenerStockBajo();
        if (!result.success) {
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al obtener materiales con stock bajo');
        }
        (0, response_util_1.sendSuccessResponse)(res, result.data, 'Materiales con stock bajo obtenidos exitosamente');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al obtener materiales con stock bajo');
    }
});
/**
 * POST /api/materiaPrima/verificar-stock
 * Verificar disponibilidad de stock
 */
router.post('/verificar-stock', (0, validation_1.runValidation)([
    (0, express_validator_1.body)('materiaPrimaId')
        .notEmpty()
        .isUUID()
        .withMessage('ID de materia prima es requerido'),
    (0, express_validator_1.body)('cantidad')
        .notEmpty()
        .isInt({ min: 1 })
        .withMessage('Cantidad es requerida y debe ser un número positivo')
]), async (req, res) => {
    try {
        const { materiaPrimaId, cantidad } = req.body;
        const result = await stock_adapter_1.stockAdapter.verifyStock(materiaPrimaId, cantidad);
        if (!result.success) {
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al verificar stock');
        }
        const stockData = result.data;
        if (!stockData.disponible) {
            return (0, response_util_1.sendErrorResponse)(res, 'Stock insuficiente', 400);
        }
        (0, response_util_1.sendSuccessResponse)(res, {
            disponible: stockData.disponible,
            stockActual: stockData.stockActual,
            stockMinimo: stockData.stockMinimo,
            cantidadSolicitada: cantidad
        }, 'Stock verificado exitosamente');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al verificar stock');
    }
});
/**
 * POST /api/materiaPrima/actualizar-stock
 * Actualizar stock de materia prima
 */
router.post('/actualizar-stock', (0, validation_1.runValidation)([
    (0, express_validator_1.body)('materiaPrimaId')
        .notEmpty()
        .isUUID()
        .withMessage('ID de materia prima es requerido'),
    (0, express_validator_1.body)('nuevaCantidad')
        .notEmpty()
        .isInt({ min: 0 })
        .withMessage('Nueva cantidad es requerida y debe ser un número positivo')
]), async (req, res) => {
    try {
        const { materiaPrimaId, nuevaCantidad } = req.body;
        const result = await stock_adapter_1.stockAdapter.actualizarStock(materiaPrimaId, nuevaCantidad);
        if (!result.success) {
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al actualizar stock');
        }
        (0, response_util_1.sendSuccessResponse)(res, {
            stockAnterior: result.data.stockAnterior,
            stockNuevo: result.data.stockNuevo
        }, 'Stock actualizado exitosamente');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al actualizar stock');
    }
});
/**
 * POST /api/materiaPrima/ajuste-stock
 * Realizar ajuste de stock
 */
router.post('/ajuste-stock', (0, validation_1.runValidation)(materiaPrimaValidations.ajuste), async (req, res) => {
    try {
        const ajusteData = req.body;
        const result = await stock_adapter_1.stockAdapter.realizarAjuste(ajusteData);
        if (!result.success) {
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al realizar ajuste de stock');
        }
        (0, response_util_1.sendSuccessResponse)(res, result.data, 'Ajuste de stock realizado exitosamente');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al realizar ajuste de stock');
    }
});
/**
 * POST /api/materiaPrima/movimientos
 * Registrar movimiento de stock
 */
router.post('/movimientos', (0, validation_1.runValidation)(materiaPrimaValidations.movimiento), async (req, res) => {
    try {
        const movimientoData = req.body;
        const result = await stock_adapter_1.stockAdapter.registrarMovimiento(movimientoData);
        if (!result.success) {
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al registrar movimiento');
        }
        (0, response_util_1.sendSuccessResponse)(res, result.data, 'Movimiento registrado exitosamente', 201);
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al registrar movimiento');
    }
});
/**
 * POST /api/materiaPrima/movimientos-multiples
 * Registrar múltiples movimientos de stock
 */
router.post('/movimientos-multiples', (0, validation_1.runValidation)([
    (0, express_validator_1.body)('movimientos')
        .isArray({ min: 1, max: 50 })
        .withMessage('Movimientos es requerido y debe ser un array'),
    (0, express_validator_1.body)('movimientos.*.materiaPrimaId')
        .notEmpty()
        .isUUID()
        .withMessage('ID de materia prima es requerido'),
    (0, express_validator_1.body)('movimientos.*.tipo')
        .notEmpty()
        .isIn(['ENTRADA', 'SALIDA', 'AJUSTE'])
        .withMessage('Tipo de movimiento es requerido'),
    (0, express_validator_1.body)('movimientos.*.cantidad')
        .notEmpty()
        .isInt({ min: 1 })
        .withMessage('Cantidad es requerida y debe ser un número positivo'),
    (0, express_validator_1.body)('movimientos.*.motivo')
        .notEmpty()
        .isString()
        .isLength({ min: 1, max: 200 })
        .withMessage('Motivo es requerido'),
    (0, express_validator_1.body)('movimientos.*.usuarioId')
        .notEmpty()
        .isUUID()
        .withMessage('ID de usuario es requerido')
]), async (req, res) => {
    try {
        const { movimientos } = req.body;
        const exitosos = [];
        const fallidos = [];
        // Procesar cada movimiento
        for (const movimiento of movimientos) {
            try {
                const result = await stock_adapter_1.stockAdapter.registrarMovimiento(movimiento);
                if (result.success) {
                    exitosos.push(result.data);
                }
                else {
                    fallidos.push({
                        movimiento,
                        error: result.message
                    });
                }
            }
            catch (error) {
                fallidos.push({
                    movimiento,
                    error: error.message
                });
            }
        }
        const response = {
            exitosos,
            fallidos
        };
        if (fallidos.length > 0) {
            return (0, response_util_1.sendErrorResponse)(res, 'Algunos movimientos fallaron', 207, // Multi-Status
            response);
        }
        (0, response_util_1.sendSuccessResponse)(res, response, 'Movimientos procesados exitosamente');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al procesar movimientos múltiples');
    }
});
/**
 * GET /api/materiaPrima/historial/:id
 * Obtener historial de movimientos
 */
router.get('/historial/:id', (0, validation_1.runValidation)(materiaPrimaValidations.detalles), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await stock_adapter_1.stockAdapter.obtenerHistorial(id);
        if (!result.success) {
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al obtener historial');
        }
        (0, response_util_1.sendSuccessResponse)(res, result.data, 'Historial obtenido exitosamente');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al obtener historial');
    }
});
//# sourceMappingURL=materiaPrima.routes.js.map