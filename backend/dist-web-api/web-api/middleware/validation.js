"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customValidators = exports.commonValidations = exports.runValidation = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const response_util_1 = require("../utils/response.util");
/**
 * Validation middleware
 */
/**
 * Creates validation middleware for the given validation chains
 */
const validateRequest = (validations) => {
    return async (req, res, next) => {
        try {
            // Run all validations
            await Promise.all(validations.map(validation => validation.run(req)));
            // Check for validation errors
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                const formattedErrors = errors.array().map(error => ({
                    field: error.param,
                    message: error.msg,
                    value: error.value
                }));
                return (0, response_util_1.sendErrorResponse)(res, 'Validation failed', 400, formattedErrors);
            }
            next();
        }
        catch (error) {
            return (0, response_util_1.sendErrorResponse)(res, 'Validation error', 500);
        }
    };
};
exports.validateRequest = validateRequest;
/**
 * Alias for validateRequest - used for consistency with existing code
 */
exports.runValidation = exports.validateRequest;
/**
 * Common validation chains
 */
exports.commonValidations = {
    pagination: [
        (0, express_validator_1.query)('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 1000 })
            .withMessage('Limit must be between 1 and 1000'),
        (0, express_validator_1.query)('search')
            .optional()
            .isString()
            .isLength({ min: 1, max: 100 })
            .withMessage('Search term must be between 1 and 100 characters'),
        (0, express_validator_1.query)('sortBy')
            .optional()
            .isString()
            .isIn(['id', 'nombre', 'fecha_creacion', 'fecha_actualizacion'])
            .withMessage('Sort field must be a valid field'),
        (0, express_validator_1.query)('sortOrder')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('Sort order must be asc or desc')
    ],
    materiaPrima: {
        create: [
            (0, express_validator_1.body)('nombre')
                .notEmpty()
                .withMessage('Nombre es requerido')
                .isLength({ min: 1, max: 100 })
                .withMessage('Nombre debe tener entre 1 y 100 caracteres'),
            (0, express_validator_1.body)('descripcion')
                .optional()
                .isString()
                .isLength({ max: 500 })
                .withMessage('Descripción no debe exceder 500 caracteres'),
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
                .isString()
                .isLength({ max: 50 })
                .withMessage('Código de barras no debe exceder 50 caracteres'),
            (0, express_validator_1.body)('presentacion')
                .notEmpty()
                .isString()
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
                .isString()
                .isIn(['CAJA', 'BOTE', 'PAQUETE', 'UNIDAD', 'LITRO', 'KILOGRAMO'])
                .withMessage('Presentación debe ser válida'),
            (0, express_validator_1.body)('id_presentacion')
                .optional()
                .isInt({ min: 1 })
                .withMessage('ID de presentación debe ser un número positivo'),
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
        ]
    },
    proveedor: {
        create: [
            (0, express_validator_1.body)('nombre')
                .notEmpty()
                .withMessage('Nombre es requerido')
                .isLength({ min: 1, max: 100 })
                .withMessage('Nombre debe tener entre 1 y 100 caracteres'),
            (0, express_validator_1.body)('rfc')
                .notEmpty()
                .isLength({ min: 12, max: 13 })
                .matches(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/)
                .withMessage('RFC debe tener formato válido'),
            (0, express_validator_1.body)('contacto')
                .optional()
                .isString()
                .isLength({ max: 100 })
                .withMessage('Contacto no debe exceder 100 caracteres'),
            (0, express_validator_1.body)('email')
                .optional()
                .isEmail()
                .withMessage('Email debe ser válido'),
            (0, express_validator_1.body)('telefono')
                .optional()
                .isString()
                .matches(/^\d{10}$/)
                .withMessage('Teléfono debe tener 10 dígitos'),
            (0, express_validator_1.body)('domicilio')
                .optional()
                .isString()
                .isLength({ max: 200 })
                .withMessage('Domicilio no debe exceder 200 caracteres'),
            (0, express_validator_1.body)('ciudad')
                .optional()
                .isString()
                .isLength({ max: 100 })
                .withMessage('Ciudad no debe exceder 100 caracteres'),
            (0, express_validator_1.body)('estado')
                .optional()
                .isString()
                .isLength({ max: 100 })
                .withMessage('Estado no debe exceder 100 caracteres'),
            (0, express_validator_1.body)('codigo_postal')
                .optional()
                .isString()
                .matches(/^\d{5}$/)
                .withMessage('Código postal debe tener 5 dígitos'),
            (0, express_validator_1.body)('pais')
                .optional()
                .isString()
                .isLength({ max: 100 })
                .withMessage('País no debe exceder 100 caracteres')
        ],
        update: [
            (0, express_validator_1.body)('nombre')
                .optional()
                .isLength({ min: 1, max: 100 })
                .withMessage('Nombre debe tener entre 1 y 100 caracteres'),
            (0, express_validator_1.body)('rfc')
                .optional()
                .isLength({ min: 12, max: 13 })
                .matches(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/)
                .withMessage('RFC debe tener formato válido'),
            (0, express_validator_1.body)('contacto')
                .optional()
                .isString()
                .isLength({ max: 100 })
                .withMessage('Contacto no debe exceder 100 caracteres'),
            (0, express_validator_1.body)('email')
                .optional()
                .isEmail()
                .withMessage('Email debe ser válido'),
            (0, express_validator_1.body)('telefono')
                .optional()
                .isString()
                .matches(/^\d{10}$/)
                .withMessage('Teléfono debe tener 10 dígitos'),
            (0, express_validator_1.body)('domicilio')
                .optional()
                .isString()
                .isLength({ max: 200 })
                .withMessage('Domicilio no debe exceder 200 caracteres'),
            (0, express_validator_1.body)('ciudad')
                .optional()
                .isString()
                .isLength({ max: 100 })
                .withMessage('Ciudad no debe exceder 100 caracteres'),
            (0, express_validator_1.body)('estatus')
                .optional()
                .isIn(['ACTIVO', 'INACTIVO'])
                .withMessage('Estatus debe ser ACTIVO o INACTIVO')
        ]
    },
    stock: {
        movimiento: [
            (0, express_validator_1.body)('materiaPrimaId')
                .notEmpty()
                .isUUID()
                .withMessage('ID de materia prima es requerido'),
            (0, express_validator_1.body)('tipo')
                .notEmpty()
                .isIn(['ENTRADA', 'SALIDA', 'AJUSTE'])
                .withMessage('Tipo debe ser ENTRADA, SALIDA o AJUSTE'),
            (0, express_validator_1.body)('cantidad')
                .notEmpty()
                .isInt({ min: 1 })
                .withMessage('Cantidad es requerida y debe ser un número positivo'),
            (0, express_validator_1.body)('motivo')
                .notEmpty()
                .isString()
                .isLength({ min: 1, max: 200 })
                .withMessage('Motivo es requerido'),
            (0, express_validator_1.body)('tipo_ajuste')
                .optional()
                .isIn(['MANUAL', 'SISTEMA', 'CORRECCION'])
                .withMessage('Tipo de ajuste debe ser MANUAL, SISTEMA o CORRECCIÓN'),
            (0, express_validator_1.body)('referencia')
                .optional()
                .isString()
                .isLength({ max: 100 })
                .withMessage('Referencia no debe exceder 100 caracteres')
        ],
        ajuste: [
            (0, express_validator_1.body)('materiaPrimaId')
                .notEmpty()
                .isUUID()
                .withMessage('ID de materia prima es requerido'),
            (0, express_validator_1.body)('cantidad')
                .notEmpty()
                .isInt()
                .withMessage('Cantidad es requerida'),
            (0, express_validator_1.body)('motivo')
                .notEmpty()
                .isString()
                .isLength({ min: 1, max: 200 })
                .withMessage('Motivo es requerido'),
            (0, express_validator_1.body)('tipoAjuste')
                .notEmpty()
                .isIn(['MANUAL', 'SISTEMA', 'CORRECCION'])
                .withMessage('Tipo de ajuste es requerido'),
            (0, express_validator_1.body)('autorizadoPor')
                .optional()
                .isUUID()
                .withMessage('ID de usuario que autoriza es requerido'),
            (0, express_validator_1.body)('aprobadoPor')
                .optional()
                .isUUID()
                .withMessage('ID de usuario que aprueba es requerido')
        ],
        disponibilidad: [
            (0, express_validator_1.body)('materiaPrimaId')
                .notEmpty()
                .isUUID()
                .withMessage('ID de materia prima es requerido'),
            (0, express_validator_1.body)('cantidad')
                .notEmpty()
                .isInt({ min: 1 })
                .withMessage('Cantidad es requerida y debe ser un número positivo')
        ]
    },
    auth: {
        login: [
            (0, express_validator_1.body)('email')
                .notEmpty()
                .isEmail()
                .withMessage('Email es requerido'),
            (0, express_validator_1.body)('password')
                .notEmpty()
                .isLength({ min: 6 })
                .withMessage('Contraseña debe tener al menos 6 caracteres')
        ],
        register: [
            (0, express_validator_1.body)('nombre')
                .notEmpty()
                .isLength({ min: 1, max: 100 })
                .withMessage('Nombre es requerido'),
            (0, express_validator_1.body)('email')
                .notEmpty()
                .isEmail()
                .withMessage('Email es requerido'),
            (0, express_validator_1.body)('password')
                .notEmpty()
                .isLength({ min: 6 })
                .withMessage('Contraseña debe tener al menos 6 caracteres'),
            (0, express_validator_1.body)('confirmPassword')
                .notEmpty()
                .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Las contraseñas no coinciden');
                }
                return true;
            })
                .withMessage('Las contraseñas no coinciden')
        ]
    },
    file: {
        upload: [
            (0, express_validator_1.body)('file')
                .custom((value, { req }) => {
                if (!req.file) {
                    throw new Error('No file uploaded');
                }
                return true;
            })
                .withMessage('Archivo es requerido'),
            (0, express_validator_1.body)('entidad')
                .notEmpty()
                .isString()
                .withMessage('Entidad es requerido'),
            (0, express_validator_1.body)('entidadId')
                .notEmpty()
                .isString()
                .withMessage('ID de entidad es requerido')
        ]
    }
};
/**
 * Custom validators
 */
exports.customValidators = {
    isUUID: (value) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{4}-[89ab][0-9a-f]{12}$/i;
        return uuidRegex.test(value);
    },
    isRFC: (value) => {
        const rfcRegex = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/;
        return rfcRegex.test(value.toUpperCase());
    },
    isPhone: (value) => {
        const phoneRegex = /^(\+?52)?\s?1?\s?(\d{3})\s?(\d{3})\s?(\d{4})$/;
        return phoneRegex.test(value);
    },
    isCURP: (value) => {
        const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z0-9]{5}[A-Z0-9]{2}$/i;
        return curpRegex.test(value);
    },
    isNSS: (value) => {
        const nssRegex = /^\d{10,11}$/;
        return nssRegex.test(value);
    },
    isCLABE: (value) => {
        const clabeRegex = /^\d{18}$/;
        return clabeRegex.test(value);
    },
    isCreditCard: (value) => {
        const cleaned = value.replace(/[\s-]/g, '');
        if (!/^\d+$/.test(cleaned))
            return false;
        let sum = 0;
        let isEven = false;
        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned[i], 10);
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
            isEven = !isEven;
        }
        return sum % 10 === 0;
    },
    isHexColor: (value) => {
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i;
        return hexRegex.test(value);
    },
    isStrongPassword: (value) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        return value.length >= minLength &&
            hasUpperCase &&
            hasLowerCase &&
            hasNumber &&
            hasSpecialChar;
    },
    isFutureDate: (value) => {
        const date = new Date(value);
        const now = new Date();
        return date > now;
    },
    isPastDate: (value) => {
        const date = new Date(value);
        const now = new Date();
        return date < now;
    },
    isDateInRange: (value, minDays, maxDays) => {
        const date = new Date(value);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.abs(diffTime) / (1000 * 60 * 60 * 24);
        if (minDays !== undefined && diffDays < minDays)
            return false;
        if (maxDays !== undefined && diffDays > maxDays)
            return false;
        return true;
    },
    isPositiveNumber: (value) => {
        const num = Number(value);
        return !isNaN(num) && num > 0;
    },
    isNonNegativeNumber: (value) => {
        const num = Number(value);
        return !isNaN(num) && num >= 0;
    },
    isInteger: (value) => {
        return Number.isInteger(Number(value));
    },
    isDecimal: (value) => {
        const num = Number(value);
        return !isNaN(num) && num % 1 !== 0;
    },
    isBoolean: (value) => {
        if (typeof value === 'boolean')
            return true;
        if (typeof value === 'string') {
            return ['true', 'false', '1', '0'].includes(value.toLowerCase());
        }
        return Boolean(value);
    },
    isArray: (value) => {
        return Array.isArray(value);
    },
    isObject: (value) => {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    },
    isString: (value) => {
        return typeof value === 'string';
    },
    isEmail: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    },
    isURL: (value) => {
        try {
            new URL(value);
            return true;
        }
        catch {
            return false;
        }
    },
    isJSON: (value) => {
        try {
            JSON.parse(value);
            return true;
        }
        catch {
            return false;
        }
    },
    isDate: (value) => {
        const date = new Date(value);
        return !isNaN(date.getTime()) && !isNaN(date.getTime());
    },
    isValidDate: (value) => {
        const date = new Date(value);
        return !isNaN(date.getTime()) && date.toISOString().startsWith(value);
    }
};
exports.default = {
    validateRequest: exports.validateRequest,
    commonValidations: exports.commonValidations,
    customValidators: exports.customValidators
};
//# sourceMappingURL=validation.js.map