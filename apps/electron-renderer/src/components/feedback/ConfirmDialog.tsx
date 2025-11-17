import React, { useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

// Icons
import { AlertTriangle, Info, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export type DialogType = 'warning' | 'info' | 'success' | 'error' | 'destructive'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  type?: DialogType
  loading?: boolean
  disabled?: boolean
  showIcon?: boolean
  className?: string
  children?: React.ReactNode
}

/**
 * Componente de diálogo de confirmación accesible
 * Cumple con WCAG 2.1 AA para diálogos modales
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'warning',
  loading = false,
  disabled = false,
  showIcon = true,
  className,
  children,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Focus management
  useEffect(() => {
    if (open && cancelButtonRef.current) {
      // Pequeño delay para asegurar que el diálogo esté renderizado
      const timer = setTimeout(() => {
        cancelButtonRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onOpenChange(false)
      onCancel?.()
    }
  }

  const getTypeConfig = (type: DialogType) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconClass: 'text-green-600',
          bgClass: 'bg-green-50 border-green-200',
          confirmVariant: 'default' as const,
          confirmClass: 'bg-green-600 hover:bg-green-700',
        }
      case 'info':
        return {
          icon: Info,
          iconClass: 'text-blue-600',
          bgClass: 'bg-blue-50 border-blue-200',
          confirmVariant: 'default' as const,
          confirmClass: 'bg-blue-600 hover:bg-blue-700',
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          iconClass: 'text-yellow-600',
          bgClass: 'bg-yellow-50 border-yellow-200',
          confirmVariant: 'default' as const,
          confirmClass: 'bg-yellow-600 hover:bg-yellow-700',
        }
      case 'error':
        return {
          icon: XCircle,
          iconClass: 'text-red-600',
          bgClass: 'bg-red-50 border-red-200',
          confirmVariant: 'default' as const,
          confirmClass: 'bg-red-600 hover:bg-red-700',
        }
      case 'destructive':
      default:
        return {
          icon: AlertTriangle,
          iconClass: 'text-red-600',
          bgClass: 'bg-red-50 border-red-200',
          confirmVariant: 'destructive' as const,
          confirmClass: '',
        }
    }
  }

  const config = getTypeConfig(type)
  const Icon = config.icon

  const handleConfirm = async () => {
    if (loading || disabled) return

    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      // Error handling is managed by the parent component
      console.error('Error in confirm dialog:', error)
    }
  }

  const handleCancel = () => {
    if (loading) return

    onOpenChange(false)
    onCancel?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('max-w-md', className)}
        onKeyDown={handleKeyDown}
        aria-describedby="dialog-description"
        role="dialog"
        aria-modal="true"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            {showIcon && (
              <Icon className={cn('h-5 w-5 flex-shrink-0', config.iconClass)} aria-hidden="true" />
            )}
            <DialogTitle className="text-left">{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {description && (
            <DialogDescription id="dialog-description" className="text-left">
              {description}
            </DialogDescription>
          )}

          {/* Contenido adicional */}
          {children && (
            <div className="text-sm text-gray-600">
              {children}
            </div>
          )}

          {/* Advertencia para acciones destructivas */}
          {type === 'destructive' && (
            <Alert className={cn(config.bgClass, 'border-2')}>
              <AlertTriangle className={cn('h-4 w-4', config.iconClass)} aria-hidden="true" />
              <AlertDescription className={config.textClass}>
                Esta acción es permanente y no se puede deshacer.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>

          <Button
            ref={confirmButtonRef}
            type="button"
            variant={config.confirmVariant}
            onClick={handleConfirm}
            disabled={loading || disabled}
            className={cn('w-full sm:w-auto', config.confirmClass)}
            aria-describedby={type === 'destructive' ? 'dialog-description' : undefined}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook simplificado para usar el diálogo de confirmación
 */
export const useConfirmDialog = () => {
  const [state, setState] = React.useState<{
    open: boolean
    title: string
    description?: string
    onConfirm?: () => void | Promise<void>
    type?: DialogType
    confirmText?: string
    cancelText?: string
  }>({
    open: false,
    title: '',
  })

  const showConfirm = (props: Omit<typeof state, 'open'>) => {
    setState({ ...props, open: true })
  }

  const hideConfirm = () => {
    setState(prev => ({ ...prev, open: false }))
  }

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      open={state.open}
      onOpenChange={hideConfirm}
      title={state.title}
      description={state.description}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      onConfirm={state.onConfirm || (() => {})}
      type={state.type}
    />
  )

  return {
    showConfirm,
    hideConfirm,
    ConfirmDialog: ConfirmDialogComponent,
  }
}

export default ConfirmDialog