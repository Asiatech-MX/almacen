/**
 * Mock Database Connection para desarrollo y testing
 * Implementa una simulación de las operaciones de base de datos básicas
 */
export interface MockDB {
    selectFrom: (table: string) => MockQueryBuilder;
    insertInto: (table: string) => MockInsertBuilder;
    updateTable: (table: string) => MockUpdateBuilder;
    deleteFrom: (table: string) => MockDeleteBuilder;
}
export interface MockQueryBuilder {
    select: (columns?: string[]) => MockWhereBuilder;
    where: (condition: any) => MockExecuteBuilder;
    orderBy: (column: string, direction?: 'asc' | 'desc') => MockExecuteBuilder;
    limit: (limit: number) => MockExecuteBuilder;
    offset: (offset: number) => MockExecuteBuilder;
    execute: () => Promise<any[]>;
}
export interface MockWhereBuilder {
    where: (condition: any) => MockExecuteBuilder;
    orderBy: (column: string, direction?: 'asc' | 'desc') => MockExecuteBuilder;
    limit: (limit: number) => MockExecuteBuilder;
    offset: (offset: number) => MockExecuteBuilder;
    execute: () => Promise<any[]>;
}
export interface MockExecuteBuilder {
    execute: () => Promise<any[]>;
    executeTakeFirst: () => Promise<any>;
    executeTakeFirstOrThrow: () => Promise<any>;
}
export interface MockInsertBuilder {
    values: (data: any) => MockExecuteBuilder;
    returning: (columns?: string[]) => MockExecuteBuilder;
}
export interface MockUpdateBuilder {
    set: (data: any) => MockWhereBuilder;
    where: (condition: any) => MockExecuteBuilder;
    returning: (columns?: string[]) => MockExecuteBuilder;
}
export interface MockDeleteBuilder {
    where: (condition: any) => MockExecuteBuilder;
    returning: (columns?: string[]) => MockExecuteBuilder;
}
export declare const getDatabase: () => MockDB;
export declare const getMockDatabase: () => MockDB;
//# sourceMappingURL=database.mock.d.ts.map