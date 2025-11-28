import cors from 'cors';
/**
 * CORS middleware configuration
 */
export declare const corsMiddleware: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
export default corsMiddleware;
//# sourceMappingURL=cors.d.ts.map