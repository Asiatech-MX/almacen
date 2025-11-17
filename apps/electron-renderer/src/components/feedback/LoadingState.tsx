import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface LoadingStateProps {
  type?: 'skeleton' | 'spinner' | 'dots' | 'pulse'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  children?: React.ReactNode
}

/**
 * Componente de estado de carga accesible con diferentes variaciones
 * Cumple con WCAG 2.1 AA para estados de carga
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  size = 'md',
  text,
  className,
  children,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }

  const renderSpinner = () => (
    <div
      className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-blue-600', sizeClasses[size])}
      role="status"
      aria-label={text || 'Cargando...'}
    >
      <span className="sr-only">{text || 'Cargando...'}</span>
    </div>
  )

  const renderDots = () => (
    <div className="flex space-x-1" role="status" aria-label={text || 'Cargando...'}>
      <div className="animate-pulse">
        <div className={cn('bg-blue-600 rounded-full', sizeClasses[size])} />
      </div>
      <div className="animate-pulse delay-75">
        <div className={cn('bg-blue-600 rounded-full', sizeClasses[size])} />
      </div>
      <div className="animate-pulse delay-150">
        <div className={cn('bg-blue-600 rounded-full', sizeClasses[size])} />
      </div>
      <span className="sr-only">{text || 'Cargando...'}</span>
    </div>
  )

  const renderPulse = () => (
    <div
      className={cn('animate-pulse bg-blue-600 rounded-full opacity-75', sizeClasses[size])}
      role="status"
      aria-label={text || 'Cargando...'}
    >
      <span className="sr-only">{text || 'Cargando...'}</span>
    </div>
  )

  const renderSkeleton = () => (
    <div className="space-y-3" role="status" aria-label="Cargando contenido...">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[300px]" />
      {children}
    </div>
  )

  const renderContent = () => {
    switch (type) {
      case 'spinner':
        return renderSpinner()
      case 'dots':
        return renderDots()
      case 'pulse':
        return renderPulse()
      case 'skeleton':
        return renderSkeleton()
      default:
        return renderSpinner()
    }
  }

  if (type === 'skeleton') {
    return <div className={className}>{renderContent()}</div>
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center gap-2">
        {renderContent()}
        {text && (
          <span className={cn('text-gray-600 font-medium', textSizes[size])}>
            {text}
          </span>
        )}
      </div>
    </div>
  )
}

export default LoadingState