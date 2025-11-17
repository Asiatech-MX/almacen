import { toast } from 'sonner'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  duration?: number
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
}

/**
 * Servicio centralizado para manejar notificaciones toast
 * Cumple con WCAG 2.1 AA para notificaciones accesibles
 */
class ToastService {
  /**
   * Muestra una notificación de éxito
   */
  success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  }

  /**
   * Muestra una notificación de error
   */
  error(message: string, options?: ToastOptions) {
    return toast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 6000, // Más tiempo para errores
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  }

  /**
   * Muestra una notificación de advertencia
   */
  warning(message: string, options?: ToastOptions) {
    return toast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  }

  /**
   * Muestra una notificación informativa
   */
  info(message: string, options?: ToastOptions) {
    return toast.info(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  }

  /**
   * Muestra una notificación de carga
   */
  loading(message: string, options?: { id?: string }) {
    return toast.loading(message, {
      id: options?.id,
    })
  }

  /**
   * Actualiza una notificación existente
   */
  update(id: string | number, options: {
    message?: string
    type?: ToastType
    description?: string
    duration?: number
  }) {
    const toastOptions: any = {
      id,
    }

    if (options.description) {
      toastOptions.description = options.description
    }

    if (options.duration !== undefined) {
      toastOptions.duration = options.duration
    }

    switch (options.type) {
      case 'success':
        toast.success(options.message || 'Operación completada', toastOptions)
        break
      case 'error':
        toast.error(options.message || 'Error en la operación', toastOptions)
        break
      case 'warning':
        toast.warning(options.message || 'Advertencia', toastOptions)
        break
      case 'info':
        toast.info(options.message || 'Información', toastOptions)
        break
      default:
        toast.message(options.message || '', toastOptions)
    }
  }

  /**
   * Descarta una notificación específica
   */
  dismiss(id: string | number) {
    toast.dismiss(id)
  }

  /**
   * Descarta todas las notificaciones
   */
  dismissAll() {
    toast.dismiss()
  }

  /**
   * Utilidad para mostrar notificaciones basadas en el resultado de una operación
   */
  async handleOperation<T>(
    operation: () => Promise<T>,
    options: {
      loading?: string
      success?: string | ((result: T) => string)
      error?: string | ((error: Error) => string)
      onSuccess?: (result: T) => void
      onError?: (error: Error) => void
    } = {}
  ): Promise<T | null> {
    const {
      loading = 'Procesando...',
      success = 'Operación completada con éxito',
      error = 'Ocurrió un error en la operación',
      onSuccess,
      onError,
    } = options

    const toastId = this.loading(loading)

    try {
      const result = await operation()

      const successMessage = typeof success === 'function' ? success(result) : success
      this.update(toastId, {
        message: successMessage,
        type: 'success',
        duration: 4000,
      })

      onSuccess?.(result)
      return result

    } catch (err) {
      const errorMessage = typeof error === 'function' ? error(err as Error) : error

      this.update(toastId, {
        message: errorMessage,
        type: 'error',
        duration: 6000,
      })

      onError?.(err as Error)
      return null
    }
  }

  /**
   * Utilidad específica para operaciones CRUD
   */
  crud = {
    create: (entityName: string, result?: any) => {
      this.success(`${entityName} creado${result ? `: ${result.nombre || result.id}` : ''} exitosamente`, {
        description: `El ${entityName.toLowerCase()} ha sido registrado en el sistema.`,
      })
    },

    update: (entityName: string, result?: any) => {
      this.success(`${entityName} actualizado${result ? `: ${result.nombre || result.id}` : ''} exitosamente`, {
        description: `Los cambios en el ${entityName.toLowerCase()} han sido guardados.`,
      })
    },

    delete: (entityName: string, result?: any) => {
      this.success(`${entityName} eliminado${result ? `: ${result.nombre || result.id}` : ''} exitosamente`, {
        description: `El ${entityName.toLowerCase()} ha sido eliminado del sistema.`,
      })
    },

    error: (entityName: string, operation: string, error?: Error) => {
      this.error(`Error al ${operation} ${entityName.toLowerCase()}`, {
        description: error?.message || 'No se pudo completar la operación. Por favor, inténtalo de nuevo.',
        action: {
          label: 'Reintentar',
          onClick: () => {
            // Lógica de reintento si es necesario
            window.location.reload()
          },
        },
      })
    },

    networkError: () => {
      this.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        duration: 8000,
      })
    },

    validationError: (errors: Record<string, string>) => {
      const errorCount = Object.keys(errors).length
      this.warning(`Hay ${errorCount} error${errorCount > 1 ? 'es' : ''} en el formulario`, {
        description: 'Por favor, revisa los campos marcados y corrige los errores.',
        duration: 5000,
      })
    },
  }
}

// Exportar una instancia única del servicio
export const toastService = new ToastService()

// Exportar el servicio por defecto para compatibilidad
export default toastService