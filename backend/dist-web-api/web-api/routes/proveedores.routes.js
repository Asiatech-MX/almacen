"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proveedoresRoutes = void 0;
const express_1 = require("express");
const response_util_1 = require("../utils/response.util");
const validation_util_1 = require("../utils/validation.util");
const validation_util_2 = require("../utils/validation.util");
const proveedores_adapter_1 = require("../../adapters/proveedores.adapter");
const router = (0, express_1.Router)();
/**
 * Validation chains for proveedor endpoints
 */
const proveedorValidations = {
    create: [
        body('nombre')
            .notEmpty()
            .withMessage('Nombre es requerido')
            .isLength({ min: 1, max: 100 })
            .withMessage('Nombre debe tener entre 1 y 100 caracteres'),
        body('rfc')
            .notEmpty()
            .matches(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/)
            .withMessage('RFC debe tener formato válido'),
        body('contacto')
            .optional()
            .isString()
            .isLength({ max: 100 })
            .withMessage('Contacto no debe exceder 100 caracteres'),
        body('email')
            .optional()
            .isEmail()
            .withMessage('Email debe ser válido'),
        body('telefono')
            .optional()
            .isString()
            .matches(/^\d{10}$/)
            .withMessage('Teléfono debe tener 10 dígitos'),
        body('domicilio')
            .optional()
            .isString()
            .isLength({ max: 200 })
            .withMessage('Domicilio no debe exceder 200 caracteres'),
        body('ciudad')
            .optional()
            .isString()
            .isLength({ max: 100 })
            .withMessage('Ciudad no debe exceder 100 caracteres'),
        body('estado')
            .optional()
            .isString()
            .isIn(['ACTIVO', 'INACTIVO'])
            .withMessage('Estatus debe ser ACTIVO o INACTIVO'),
        body('codigo_postal')
            .optional()
            .isString()
            .matches(/^\d{5}$/)
            .withMessage('Código postal debe tener 5 dígitos'),
        body('pais')
            .optional()
            .isString()
            .isLength({ max: 50 })
            .withMessage('País debe tener máximo 50 caracteres')
    ],
    update: [
        body('nombre')
            .optional()
            .isString()
            .isLength({ min: 1, max: 100 })
            .withMessage('Nombre debe tener entre 1 y 100 caracteres'),
        body('rfc')
            .optional()
            .matches(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/)
            .withMessage('RFC debe tener formato válido'),
        body('contacto')
            .optional()
            .isString()
            .isLength({ max: 100 })
            .withMessage('Contacto no debe exceder 100 caracteres'),
        body('email')
            .optional()
            .isEmail()
            .withMessage('Email debe ser válido'),
        body('telefono')
            .optional()
            .matches(/^\d{10}$/)
            .withMessage('Teléfono debe tener 10 dígitos'),
        body('domicilio')
            .optional()
            .isString()
            .isLength({ max: 200 })
            .withMessage('Domicilio no debe exceder 200 caracteres'),
        body('ciudad')
            .optional()
            .isString()
            .isLength({ max: 100 })
            .withMessage('Ciudad no debe exceder 100 caracteres'),
        body('estado')
            .optional()
            .isString()
            .isIn(['ACTIVO', 'INACTIVO'])
            .withMessage('Estatus debe ser ACTIVO o INACTIVO'),
        body('codigo_postal')
            .optional()
            .matches(/^\d{5}$/)
            .withMessage('Código postal debe tener 5 dígitos'),
        body('pais')
            .optional()
            .isString()
            .isLength({ max: 50 })
            .withMessage('País debe tener máximo 50 caracteres')
    ]
};
/**
 * GET /api/proveedores/listar
 * Listar proveedores con paginación y búsqueda
 */
router.post('/listar', validation_util_1.validatePagination, validation_util_1.validateSorting, async (req, res) => {
    try {
        const { page, limit, search, sortBy, sortOrder } = (0, validation_util_1.validatePagination)(req, res);
        const { offset } = calculateOffset(page, limit);
        const result = await proveedores_adapter_1.proveedorAdapter.findAll({
            page,
            limit,
            offset,
            search,
            sortBy,
            sortOrder
        });
        if (!result.success) {
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al listar proveedores');
        }
        const pagination = createPaginationInfo(page, limit, result.total);
        (0, response_util_1.sendPaginatedResponse)(res, result.data, pagination, 'Proveedores listados exitosamente');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al listar proveedores');
    }
});
/**
 * POST /api/proveedores/crear
 * Crear nuevo proveedor
 */
router.post('/crear', proveedorValidations.create, async (req, res) => {
    try {
        const proveedorData = req.body;
        // Validar campos requeridos
        const { isValid, missingFields } = (0, validation_util_2.validateRequiredFields)(proveedorData, ['nombre', 'rfc']);
        if (!isValid) {
            return (0, response_util_1.sendErrorResponse)(res, `Campos requeridos: ${missingFields.join(', ')}`, 400);
        }
        const result = await proveedores_adapter_1.proveedorAdapter.create(proveedorData);
        if (!result.success) {
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al crear proveedor');
        }
        (0, response_util_1.sendSuccessResponse)(res, result.data, 'Proveedor creado exitosamente', 201);
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al crear proveedor');
    }
});
/**
 * PUT /api/proveedores/actualizar/:id
 * Actualizar proveedor existente
 */
router.put('/actualizar/:id', proveedorValidations.update, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Validar que el ID sea un UUID válido
        if (!isValidUUID(id)) {
            return (0, response_util_1.sendErrorResponse)(res, 'ID de proveedor inválido', 400);
        }
        const result = await proveedores_adapter_1.proveedorAdapter.update(id, updateData);
        if (!result.success) {
            if (result.message?.includes('not found')) {
                return (0, response_util_1.sendErrorResponse)(res, 'Proveedor no encontrado', 404);
            }
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al actualizar proveedor');
        }
        (0, response_util_1.sendSuccessResponse)(res, result.data, 'Proveedor actualizado exitosamente');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al actualizar proveedor');
    }
});
/**
 * DELETE /api/proveedores/eliminar/:id
 * Eliminar proveedor (soft delete)
 */
router.delete('/eliminar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Validar que el ID sea un UUID válido
        if (!isValidUUID(id)) {
            return (0, response_util_1.sendErrorResponse)(res, 'ID de proveedor inválido', 400);
        }
        const result = await proveedores_adapter_1.proveedorAdapter.delete(id);
        if (!result.success) {
            if (result.message?.includes('not found')) {
                return (0, response_util_1.sendErrorResponse)(res, 'Proveedor no encontrado', 404);
            }
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al eliminar proveedor');
        }
        (0, response_util_1.sendSuccessResponse)(res, { id }, 'Proveedor eliminado exitosamente');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al eliminar proveedor');
    }
});
/**
 * POST /api/proveedores/buscar
 * Buscar proveedores por término
 */
router.post('/buscar', proveedorValidations.buscar, async (req, res) => {
    try {
        const { termino } = req.body;
        // Validar que el término no esté vacío
        if (!termino || termino.trim().length === 0) {
            return (0, response_util_1.sendErrorResponse)(res, 'Término de búsqueda es requerido', 400);
        }
        const result = await proveedores_adapter_1.proveedorAdapter.buscar(termino);
        if (!result.success) {
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al buscar proveedores');
        }
        (0, response_util_1.sendSuccessResponse)(res, result.data, 'Proveedores encontrados');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al buscar proveedores');
    }
});
/**
 * POST /api/proveedores/buscar-rfc
 * Buscar proveedor por RFC
 */
router.post('/buscar-rfc', proveedorValidations.buscarRFC, async (req, res) => {
    try {
        const { rfc } = req.body;
        // Validar que el RFC no esté vacío
        if (!rfc || rfc.trim().length === 0) {
            return (0, response_util_1.sendErrorResponse)(res, 'RFC es requerido', 400);
        }
        const result = await proveedores_adapter_1.proveedorAdapter.buscarPorRFC(rfc);
        if (!result.success) {
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al buscar por RFC');
        }
        (0, response_util_1.sendSuccessResponse)(res, result.data, 'Proveedor encontrado por RFC');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al buscar por RFC');
    }
});
/**
 * GET /api/proveedores/stats
 * Obtener estadísticas de proveedores
 */
router.get('/stats', async (req, res) => {
    try {
        const result = await proveedores_adapter_1.proveedorAdapter.getStats();
        if (!result.success) {
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al obtener estadísticas');
        }
        (0, response_util_1.sendSuccessResponse)(res, result.data, 'Estadísticas de proveedores');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al obtener estadísticas');
    }
});
/**
 * GET /api/proveedores/detalles/:id
 * Obtener detalles de proveedor específico
 */
router.get('/detalles/:id', proveedorValidations.detalles, async (req, res) => {
    try {
        const { id } = req.params;
        // Validar que el ID sea un UUID válido
        if (!isValidUUID(id)) {
            return (0, response_util_1.sendErrorResponse)(res, 'ID de proveedor inválido', 400);
        }
        const result = await proveedores_adapter_1.proveedorAdapter.findById(id);
        if (!result.success) {
            if (result.message?.includes('not found')) {
                return (0, response_util_1.sendErrorResponse)(res, 'Proveedor no encontrado', 404);
            }
            return (0, response_util_1.sendErrorResponse)(res, result.message || 'Error al obtener detalles');
        }
        (0, response_util_1.sendSuccessResponse)(res, result.data, 'Detalles del proveedor');
    }
    catch (error) {
        (0, response_util_1.sendErrorResponse)(res, 'Error al obtener detalles');
    }
});
//# sourceMappingURL=proveedores.routes.js.map