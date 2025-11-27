/**
 * Mock Proveedores Adapter para desarrollo y testing
 * Implementa una simulación del adapter de proveedores
 */

// Import types from shared types
import type {
  Proveedor,
  CreateProveedorRequest,
  UpdateProveedorRequest,
  ProveedorFilter,
  PaginationParams,
  ApiResponse,
  PaginatedResponse
} from '@shared-types';

export interface ProveedorAdapterResponse {
  success: boolean;
  data?: any;
  error?: string;
  total?: number;
}

export const mockProveedorAdapter = {
  /**
   * Listar proveedores con filtros y paginación
   */
  findAll: async (params: {
    filter?: ProveedorFilter;
    pagination?: PaginationParams;
  }): Promise<ApiResponse<PaginatedResponse<Proveedor>>> => {
    // Simulate database delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const mockData: Proveedor[] = [
      {
        id: "prov-001",
        nombre: "Proveedor de Materiales SA",
        rfc: "RFC123456789",
        direccion: "Calle Principal #123",
        telefono: "555-0101",
        email: "contacto@proveedor1.com",
        estatus: "ACTIVO",
        tipo: "NACIONAL",
        dias_credito: 30,
        limite_credito: 100000,
        contacto_principal: "Juan Pérez",
        telefono_contacto: "555-0102",
        email_contacto: "juan.perez@proveedor1.com",
        dias_entrega: 5,
        calificacion: 4.5,
        fecha_creacion: new Date("2024-01-01"),
        fecha_actualizacion: new Date("2024-01-15"),
        creado_por: "admin",
        institucion_id: "inst-001"
      },
      {
        id: "prov-002",
        nombre: "Distribuidora Internacional",
        rfc: "RFC987654321",
        direccion: "Avenida Secundaria #456",
        telefono: "555-0202",
        email: "info@distribuidora.com",
        estatus: "ACTIVO",
        tipo: "INTERNACIONAL",
        dias_credito: 60,
        limite_credito: 200000,
        contacto_principal: "María García",
        telefono_contacto: "555-0203",
        email_contacto: "maria.garcia@distribuidora.com",
        dias_entrega: 15,
        calificacion: 4.2,
        fecha_creacion: new Date("2024-01-02"),
        fecha_actualizacion: new Date("2024-01-16"),
        creado_por: "admin",
        institucion_id: "inst-001"
      },
      {
        id: "prov-003",
        nombre: "Proveedor Local",
        rfc: "RFC456789123",
        direccion: "Plaza Central #789",
        telefono: "555-0303",
        email: "ventas@localprov.com",
        estatus: "INACTIVO",
        tipo: "NACIONAL",
        dias_credito: 15,
        limite_credito: 50000,
        contacto_principal: "Carlos López",
        telefono_contacto: "555-0304",
        email_contacto: "carlos.lopez@localprov.com",
        dias_entrega: 2,
        calificacion: 3.8,
        fecha_creacion: new Date("2024-01-03"),
        fecha_actualizacion: new Date("2024-01-17"),
        creado_por: "admin",
        institucion_id: "inst-001"
      }
    ];

    let filteredData = [...mockData];

    // Apply filters
    if (params.filter) {
      const { search, estatus, tipo } = params.filter;

      if (search) {
        filteredData = filteredData.filter(item =>
          item.nombre.toLowerCase().includes(search.toLowerCase()) ||
          item.rfc.toLowerCase().includes(search.toLowerCase()) ||
          item.email.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (estatus) {
        filteredData = filteredData.filter(item => item.estatus === estatus);
      }

      if (tipo) {
        filteredData = filteredData.filter(item => item.tipo === tipo);
      }
    }

    const total = filteredData.length;

    // Apply pagination
    const { page = 1, limit = 10, sortBy = 'fecha_creacion', sortOrder = 'desc' } = params.pagination || {};

    // Sort data
    filteredData.sort((a, b) => {
      const aValue = a[sortBy as keyof Proveedor];
      const bValue = b[sortBy as keyof Proveedor];

      if (aValue === undefined || bValue === undefined) return 0;

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        items: paginatedData,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  },

  /**
   * Obtener proveedor por ID
   */
  findById: async (id: string): Promise<ApiResponse<Proveedor>> => {
    await new Promise(resolve => setTimeout(resolve, 50));

    const mockItem: Proveedor = {
      id,
      nombre: `Proveedor ${id}`,
      rfc: `RFC${id}`,
      direccion: `Dirección del proveedor ${id}`,
      telefono: `555-${id}`,
      email: `contacto@proveedor${id}.com`,
      estatus: "ACTIVO",
      tipo: "NACIONAL",
      dias_credito: 30,
      limite_credito: 100000,
      contacto_principal: "Contacto Principal",
      telefono_contacto: `555-${id}-contacto`,
      email_contacto: `contacto@proveedor${id}.com`,
      dias_entrega: 5,
      calificacion: 4.5,
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
      creado_por: "admin",
      institucion_id: "inst-001"
    };

    return {
      success: true,
      data: mockItem
    };
  },

  /**
   * Crear nuevo proveedor
   */
  create: async (data: CreateProveedorRequest): Promise<ApiResponse<Proveedor>> => {
    await new Promise(resolve => setTimeout(resolve, 150));

    const newItem: Proveedor = {
      id: `prov-${Date.now()}`,
      ...data,
      estatus: "ACTIVO",
      calificacion: 4.0,
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
      creado_por: "admin",
      institucion_id: "inst-001"
    };

    return {
      success: true,
      data: newItem
    };
  },

  /**
   * Actualizar proveedor existente
   */
  update: async (id: string, data: UpdateProveedorRequest): Promise<ApiResponse<Proveedor>> => {
    await new Promise(resolve => setTimeout(resolve, 100));

    const updatedItem: Proveedor = {
      id,
      nombre: data.nombre || `Proveedor ${id}`,
      rfc: data.rfc || `RFC${id}`,
      direccion: data.direccion,
      telefono: data.telefono,
      email: data.email,
      estatus: data.estatus,
      tipo: data.tipo,
      dias_credito: data.dias_credito,
      limite_credito: data.limite_credito,
      contacto_principal: data.contacto_principal,
      telefono_contacto: data.telefono_contacto,
      email_contacto: data.email_contacto,
      dias_entrega: data.dias_entrega,
      calificacion: data.calificacion,
      fecha_creacion: new Date("2024-01-01"),
      fecha_actualizacion: new Date(),
      creado_por: "admin",
      institucion_id: "inst-001"
    };

    return {
      success: true,
      data: updatedItem
    };
  },

  /**
   * Actualizar estatus de proveedor (habilitar/deshabilitar)
   */
  updateEstatus: async (id: string, estatus: 'ACTIVO' | 'INACTIVO'): Promise<ApiResponse<Proveedor>> => {
    await new Promise(resolve => setTimeout(resolve, 100));

    const updatedItem: Proveedor = {
      id,
      nombre: `Proveedor ${id}`,
      rfc: `RFC${id}`,
      direccion: `Dirección del proveedor ${id}`,
      telefono: `555-${id}`,
      email: `contacto@proveedor${id}.com`,
      estatus,
      tipo: "NACIONAL",
      dias_credito: 30,
      limite_credito: 100000,
      contacto_principal: "Contacto Principal",
      telefono_contacto: `555-${id}-contacto`,
      email_contacto: `contacto@proveedor${id}.com`,
      dias_entrega: 5,
      calificacion: 4.5,
      fecha_creacion: new Date("2024-01-01"),
      fecha_actualizacion: new Date(),
      creado_por: "admin",
      institucion_id: "inst-001"
    };

    return {
      success: true,
      data: updatedItem
    };
  },

  /**
   * Eliminar proveedor (soft delete)
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true
    };
  },

  /**
   * Obtener proveedores activos
   */
  getActive: async (params?: { limit?: number }): Promise<ApiResponse<Proveedor[]>> => {
    await new Promise(resolve => setTimeout(resolve, 100));

    const activeProviders: Proveedor[] = [
      {
        id: "active-001",
        nombre: "Proveedor Activo 1",
        rfc: "RFC-ACT-001",
        direccion: "Dirección Activa 1",
        telefono: "555-1001",
        email: "activo1@provider.com",
        estatus: "ACTIVO",
        tipo: "NACIONAL",
        dias_credito: 30,
        limite_credito: 100000,
        contacto_principal: "Contacto Activo 1",
        telefono_contacto: "555-1002",
        email_contacto: "contacto1@provider.com",
        dias_entrega: 5,
        calificacion: 4.5,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        creado_por: "admin",
        institucion_id: "inst-001"
      }
    ];

    return {
      success: true,
      data: activeProviders.slice(0, params?.limit || 10)
    };
  },

  /**
   * Buscar proveedores por nombre o RFC
   */
  search: async (query: string, params?: { limit?: number }): Promise<ApiResponse<Proveedor[]>> => {
    await new Promise(resolve => setTimeout(resolve, 100));

    const searchResults: Proveedor[] = [
      {
        id: "search-001",
        nombre: `Resultado para ${query}`,
        rfc: `RFC-SEARCH-001`,
        direccion: "Dirección de búsqueda",
        telefono: "555-2001",
        email: "search@provider.com",
        estatus: "ACTIVO",
        tipo: "NACIONAL",
        dias_credito: 30,
        limite_credito: 100000,
        contacto_principal: "Contacto Búsqueda",
        telefono_contacto: "555-2002",
        email_contacto: "search@provider.com",
        dias_entrega: 5,
        calificacion: 4.0,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        creado_por: "admin",
        institucion_id: "inst-001"
      }
    ];

    return {
      success: true,
      data: searchResults.slice(0, params?.limit || 10)
    };
  }
};

// Export types for compatibility
export type ProveedorAdapter = typeof mockProveedorAdapter;
export const proveedorAdapter = mockProveedorAdapter;