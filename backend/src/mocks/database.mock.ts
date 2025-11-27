/**
 * Mock Database Connection para desarrollo y testing
 * Implementa una simulación de las operaciones de base de datos básicas
 */

export interface MockDB {
  selectFrom: (table: string) => MockQueryBuilder
  insertInto: (table: string) => MockInsertBuilder
  updateTable: (table: string) => MockUpdateBuilder
  deleteFrom: (table: string) => MockDeleteBuilder
}

export interface MockQueryBuilder {
  select: (columns?: string[]) => MockWhereBuilder
  where: (condition: any) => MockExecuteBuilder
  orderBy: (column: string, direction?: 'asc' | 'desc') => MockExecuteBuilder
  limit: (limit: number) => MockExecuteBuilder
  offset: (offset: number) => MockExecuteBuilder
  execute: () => Promise<any[]>
}

export interface MockWhereBuilder {
  where: (condition: any) => MockExecuteBuilder
  orderBy: (column: string, direction?: 'asc' | 'desc') => MockExecuteBuilder
  limit: (limit: number) => MockExecuteBuilder
  offset: (offset: number) => MockExecuteBuilder
  execute: () => Promise<any[]>
}

export interface MockExecuteBuilder {
  execute: () => Promise<any[]>
  executeTakeFirst: () => Promise<any>
  executeTakeFirstOrThrow: () => Promise<any>
}

export interface MockInsertBuilder {
  values: (data: any) => MockExecuteBuilder
  returning: (columns?: string[]) => MockExecuteBuilder
}

export interface MockUpdateBuilder {
  set: (data: any) => MockWhereBuilder
  where: (condition: any) => MockExecuteBuilder
  returning: (columns?: string[]) => MockExecuteBuilder
}

export interface MockDeleteBuilder {
  where: (condition: any) => MockExecuteBuilder
  returning: (columns?: string[]) => MockExecuteBuilder
}

// Datos mock de ejemplo
const mockMateriaPrima = [
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    nombre: "Material de Prueba 1",
    stock_actual: 100,
    stock_minimo: 10,
    estatus: "ACTIVO",
    presentacion: "UNIDAD",
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date(),
    creado_por: "system",
    institucion_id: "inst-001"
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174001",
    nombre: "Material de Prueba 2",
    stock_actual: 50,
    stock_minimo: 5,
    estatus: "INACTIVO",
    presentacion: "CAJA",
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date(),
    creado_por: "system",
    institucion_id: "inst-001"
  }
];

const mockProveedores = [
  {
    id: "prov-001",
    nombre: "Proveedor de Prueba",
    rfc: "RFC123456789",
    estatus: "ACTIVO",
    fecha_creacion: new Date(),
    institucion_id: "inst-001"
  }
];

class MockQueryBuilderImpl implements MockQueryBuilder {
  private data: any[] = [];
  private conditions: any[] = [];
  private table: string = '';
  private selectedColumns: string[] = [];
  private orderByColumn: string = '';
  private orderByDirection: 'asc' | 'desc' = 'asc';
  private limitCount: number = 0;
  private offsetCount: number = 0;

  constructor(table: string) {
    this.table = table;

    // Cargar datos según la tabla
    switch (table) {
      case 'materia_prima':
        this.data = [...mockMateriaPrima];
        break;
      case 'proveedor':
        this.data = [...mockProveedores];
        break;
      default:
        this.data = [];
    }
  }

  select(columns?: string[]): MockWhereBuilder {
    this.selectedColumns = columns || ['*'];
    return this;
  }

  where(condition: any): MockExecuteBuilder {
    this.conditions.push(condition);
    return this;
  }

  orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): MockExecuteBuilder {
    this.orderByColumn = column;
    this.orderByDirection = direction;
    return this;
  }

  limit(limit: number): MockExecuteBuilder {
    this.limitCount = limit;
    return this;
  }

  offset(offset: number): MockExecuteBuilder {
    this.offsetCount = offset;
    return this;
  }

  private applyConditions(data: any[]): any[] {
    return data.filter(item => {
      return this.conditions.every(condition => {
        // Simple condition evaluator
        if (typeof condition === 'object' && condition !== null) {
          return Object.entries(condition).every(([key, value]) => item[key] === value);
        }
        return true;
      });
    });
  }

  private applySorting(data: any[]): any[] {
    if (this.orderByColumn) {
      return data.sort((a, b) => {
        const aVal = a[this.orderByColumn];
        const bVal = b[this.orderByColumn];

        if (this.orderByDirection === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    return data;
  }

  private applyPagination(data: any[]): any[] {
    let result = data;

    if (this.offsetCount > 0) {
      result = result.slice(this.offsetCount);
    }

    if (this.limitCount > 0) {
      result = result.slice(0, this.limitCount);
    }

    return result;
  }

  async execute(): Promise<any[]> {
    let result = this.applyConditions(this.data);
    result = this.applySorting(result);
    result = this.applyPagination(result);

    // Apply column selection
    if (this.selectedColumns.length > 0 && !this.selectedColumns.includes('*')) {
      result = result.map(item => {
        const selected: any = {};
        this.selectedColumns.forEach(col => {
          if (item[col] !== undefined) {
            selected[col] = item[col];
          }
        });
        return selected;
      });
    }

    return result;
  }

  async executeTakeFirst(): Promise<any> {
    const results = await this.execute();
    return results[0] || null;
  }

  async executeTakeFirstOrThrow(): Promise<any> {
    const results = await this.execute();
    if (results.length === 0) {
      throw new Error(`No results found for table ${this.table}`);
    }
    return results[0];
  }
}

class MockInsertBuilderImpl implements MockInsertBuilder {
  private table: string = '';
  private insertData: any = {};
  private returningColumns: string[] = [];

  constructor(table: string) {
    this.table = table;
  }

  values(data: any): MockExecuteBuilder {
    this.insertData = data;
    return this;
  }

  returning(columns?: string[]): MockExecuteBuilder {
    this.returningColumns = columns || ['*'];
    return this;
  }

  async execute(): Promise<any[]> {
    const newItem = {
      id: this.generateId(),
      ...this.insertData,
      fecha_creacion: new Date(),
      estatus: 'ACTIVO'
    };

    switch (this.table) {
      case 'materia_prima':
        mockMateriaPrima.push(newItem);
        break;
      case 'proveedor':
        mockProveedores.push(newItem);
        break;
    }

    return [newItem];
  }

  async executeTakeFirst(): Promise<any> {
    const results = await this.execute();
    return results[0] || null;
  }

  async executeTakeFirstOrThrow(): Promise<any> {
    const results = await this.execute();
    if (results.length === 0) {
      throw new Error(`No results found for table ${this.table}`);
    }
    return results[0];
  }

  private generateId(): string {
    return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

class MockUpdateBuilderImpl implements MockUpdateBuilder {
  private table: string = '';
  private updateData: any = {};
  private conditions: any[] = [];
  private returningColumns: string[] = [];

  constructor(table: string) {
    this.table = table;
  }

  set(data: any): MockWhereBuilder {
    this.updateData = data;
    return this;
  }

  where(condition: any): MockExecuteBuilder {
    this.conditions.push(condition);
    return this;
  }

  returning(columns?: string[]): MockExecuteBuilder {
    this.returningColumns = columns || ['*'];
    return this;
  }

  async execute(): Promise<any[]> {
    let targetData: any[] = [];

    switch (this.table) {
      case 'materia_prima':
        targetData = mockMateriaPrima;
        break;
      case 'proveedor':
        targetData = mockProveedores;
        break;
    }

    const updatedItems = targetData.map(item => {
      const shouldUpdate = this.conditions.every(condition => {
        if (typeof condition === 'object' && condition !== null) {
          return Object.entries(condition).every(([key, value]) => item[key] === value);
        }
        return true;
      });

      if (shouldUpdate) {
        return {
          ...item,
          ...this.updateData,
          fecha_actualizacion: new Date()
        };
      }

      return item;
    });

    return updatedItems.filter(item => {
      return this.conditions.every(condition => {
        if (typeof condition === 'object' && condition !== null) {
          return Object.entries(condition).every(([key, value]) => item[key] === value);
        }
        return true;
      });
    });
  }
}

class MockDeleteBuilderImpl implements MockDeleteBuilder {
  private table: string = '';
  private conditions: any[] = [];
  private returningColumns: string[] = [];

  constructor(table: string) {
    this.table = table;
  }

  where(condition: any): MockExecuteBuilder {
    this.conditions.push(condition);
    return this;
  }

  returning(columns?: string[]): MockExecuteBuilder {
    this.returningColumns = columns || ['*'];
    return this;
  }

  async execute(): Promise<any[]> {
    let targetData: any[] = [];

    switch (this.table) {
      case 'materia_prima':
        targetData = mockMateriaPrima;
        break;
      case 'proveedor':
        targetData = mockProveedores;
        break;
    }

    const deletedItems = targetData.filter(item => {
      return this.conditions.every(condition => {
        if (typeof condition === 'object' && condition !== null) {
          return Object.entries(condition).every(([key, value]) => item[key] === value);
        }
        return true;
      });
    });

    // Remove items from arrays (in real implementation)
    // For mock, we just return what would be deleted

    return deletedItems;
  }
}

export const getDatabase = (): MockDB => ({
  selectFrom: (table: string) => new MockQueryBuilderImpl(table),
  insertInto: (table: string) => new MockInsertBuilderImpl(table),
  updateTable: (table: string) => new MockUpdateBuilderImpl(table),
  deleteFrom: (table: string) => new MockDeleteBuilderImpl(table)
});

// Para compatibilidad con código existente
export const getMockDatabase = getDatabase;