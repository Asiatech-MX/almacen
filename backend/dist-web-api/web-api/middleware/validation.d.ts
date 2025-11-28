import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
/**
 * Validation middleware
 */
/**
 * Creates validation middleware for the given validation chains
 */
export declare const validateRequest: (validations: ValidationChain[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Alias for validateRequest - used for consistency with existing code
 */
export declare const runValidation: (validations: ValidationChain[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Common validation chains
 */
export declare const commonValidations: {
    pagination: any[];
    materiaPrima: {
        create: any[];
        update: any[];
    };
    proveedor: {
        create: any[];
        update: any[];
    };
    stock: {
        movimiento: any[];
        ajuste: any[];
        disponibilidad: any[];
    };
    auth: {
        login: any[];
        register: any[];
    };
    file: {
        upload: any[];
    };
};
/**
 * Custom validators
 */
export declare const customValidators: {
    isUUID: (value: string) => boolean;
    isRFC: (value: string) => boolean;
    isPhone: (value: string) => boolean;
    isCURP: (value: string) => boolean;
    isNSS: (value: string) => boolean;
    isCLABE: (value: string) => boolean;
    isCreditCard: (value: string) => boolean;
    isHexColor: (value: string) => boolean;
    isStrongPassword: (value: string) => boolean;
    isFutureDate: (value: string) => boolean;
    isPastDate: (value: string) => boolean;
    isDateInRange: (value: string, minDays?: number, maxDays?: number) => boolean;
    isPositiveNumber: (value: any) => boolean;
    isNonNegativeNumber: (value: any) => boolean;
    isInteger: (value: any) => boolean;
    isDecimal: (value: any) => boolean;
    isBoolean: (value: any) => boolean;
    isArray: (value: any) => boolean;
    isObject: (value: any) => boolean;
    isString: (value: any) => boolean;
    isEmail: (value: any) => boolean;
    isURL: (value: any) => boolean;
    isJSON: (value: any) => boolean;
    isDate: (value: any) => boolean;
    isValidDate: (value: any) => boolean;
};
declare const _default: {
    validateRequest: (validations: ValidationChain[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    commonValidations: {
        pagination: any[];
        materiaPrima: {
            create: any[];
            update: any[];
        };
        proveedor: {
            create: any[];
            update: any[];
        };
        stock: {
            movimiento: any[];
            ajuste: any[];
            disponibilidad: any[];
        };
        auth: {
            login: any[];
            register: any[];
        };
        file: {
            upload: any[];
        };
    };
    customValidators: {
        isUUID: (value: string) => boolean;
        isRFC: (value: string) => boolean;
        isPhone: (value: string) => boolean;
        isCURP: (value: string) => boolean;
        isNSS: (value: string) => boolean;
        isCLABE: (value: string) => boolean;
        isCreditCard: (value: string) => boolean;
        isHexColor: (value: string) => boolean;
        isStrongPassword: (value: string) => boolean;
        isFutureDate: (value: string) => boolean;
        isPastDate: (value: string) => boolean;
        isDateInRange: (value: string, minDays?: number, maxDays?: number) => boolean;
        isPositiveNumber: (value: any) => boolean;
        isNonNegativeNumber: (value: any) => boolean;
        isInteger: (value: any) => boolean;
        isDecimal: (value: any) => boolean;
        isBoolean: (value: any) => boolean;
        isArray: (value: any) => boolean;
        isObject: (value: any) => boolean;
        isString: (value: any) => boolean;
        isEmail: (value: any) => boolean;
        isURL: (value: any) => boolean;
        isJSON: (value: any) => boolean;
        isDate: (value: any) => boolean;
        isValidDate: (value: any) => boolean;
    };
};
export default _default;
//# sourceMappingURL=validation.d.ts.map