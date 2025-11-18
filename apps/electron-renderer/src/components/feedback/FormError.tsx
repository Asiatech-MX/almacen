import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Icons
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'success'

export interface FormErrorProps {
  errors?: Record<string, string> | string[]
  message?: string
  severity?: ErrorSeverity
  title?: string
  className?: string
  showIcon?: boolean
  dismissible?: boolean
  onDismiss?: () => void
  fieldMapping?: Record<string, string>
}

/**
 * Componente para mostrar errores de formulario de forma accesible
 * Cumple con WCAG 2.1 AA para notificaciones de error
 */
export const FormError: React.FC<FormErrorProps> = ({
  errors,
  message,
  severity = 'error',
  title,
  className,
  showIcon = true,
  dismissible = false,
  onDismiss,
  fieldMapping = {},
}) => {
  if (!errors && !message) return null

  const getSeverityConfig = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'success':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          iconClass: 'text-green-600',
          bgClass: 'bg-green-50 border-green-200',
          textClass: 'text-green-800',
        }
      case 'warning':
        return {
          variant: 'default' as const,
          icon: AlertTriangle,
          iconClass: 'text-yellow-600',
          bgClass: 'bg-yellow-50 border-yellow-200',
          textClass: 'text-yellow-800',
        }
      case 'info':
        return {
          variant: 'default' as const,
          icon: Info,
          iconClass: 'text-blue-600',
          bgClass: 'bg-blue-50 border-blue-200',
          textClass: 'text-blue-800',
        }
      case 'error':
      default:
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          iconClass: 'text-red-600',
          bgClass: 'bg-red-50 border-red-200',
          textClass: 'text-red-800',
        }
    }
  }

  const config = getSeverityConfig(severity)
  const Icon = config.icon

  const renderFieldErrors = () => {
    if (Array.isArray(errors)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {errors.map((error, index) => (
            <li key={index} className={cn('text-sm', config.textClass)}>
              {error}
            </li>
          ))}
        </ul>
      )
    }

    if (typeof errors === 'object' && errors !== null) {
      return (
        <ul className="space-y-2">
          {Object.entries(errors).map(([field, error]) => (
            <li key={field} className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">
                {fieldMapping[field] || field}
              </Badge>
              <span className={cn('text-sm flex-1', config.textClass)}>
                {error}
              </span>
            </li>
          ))}
        </ul>
      )
    }

    return null
  }

  const hasMultipleErrors = Array.isArray(errors)
    ? errors.length > 1
    : typeof errors === 'object'
    ? Object.keys(errors).length > 1
    : false

  return (
    <Alert
      className={cn(
        config.bgClass,
        'relative',
        dismissible && 'pr-12',
        className
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic={hasMultipleErrors}
    >
      {showIcon && (
        <Icon className={cn('h-4 w-4', config.iconClass)} aria-hidden="true" />
      )}

      <div className="flex-1">
        {title && (
          <h4 className={cn('font-medium mb-1', config.textClass)}>
            {title}
          </h4>
        )}

        {message && (
          <AlertDescription className={cn(config.textClass)}>
            {message}
          </AlertDescription>
        )}

        {errors && renderFieldErrors()}
      </div>

      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            'absolute top-3 right-3 p-1 rounded-full hover:bg-black/10 transition-colors',
            config.textClass
          )}
          aria-label="Cerrar notificación"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </Alert>
  )
}

export default FormError