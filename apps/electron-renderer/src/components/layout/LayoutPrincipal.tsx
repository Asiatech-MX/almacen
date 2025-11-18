import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import NotificacionesPanel from '../notificaciones/NotificacionesPanel'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebarContent } from './AppSidebar'
import { Separator } from '@/components/ui/separator'

// Header responsive que integra el trigger del sidebar
const ResponsiveHeader = () => {
  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60 border-b">
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-4">
          {/* SidebarTrigger funciona tanto en mobile como desktop con shadcn */}
          <div className="flex items-center gap-2">
            <SidebarTrigger className="text-foreground hover:bg-muted" />
            <Separator orientation="vertical" className="h-6" />
          </div>

          <div>
            <h1 className="m-0 text-xl md:text-2xl lg:text-3xl font-light">Gestion de Almacen</h1>
            <p className="mt-1 md:mt-2 opacity-90 text-xs md:text-sm lg:text-lg">
              Sistema integral de control de inventario
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          <NotificacionesPanel />
        </div>
      </div>
    </header>
  )
}

// Componente para accesibilidad y atajos de teclado
const AccessibilityEnhancer = () => {
  useEffect(() => {
    // Atajo de teclado Ctrl/Cmd + B para toggle sidebar
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault()
        // El shadcn sidebar maneja este atajo automáticamente
      }

      // Atajo para accesibilidad: Alt + M para focus en el menú principal
      if (event.altKey && event.key === 'm') {
        event.preventDefault()
        const firstMenuItem = document.querySelector('[data-sidebar="menu-item"]') as HTMLElement
        firstMenuItem?.focus()
      }

      // Soporte para teclas de dirección en la navegación
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const menuItem = document.activeElement as HTMLElement

        if (menuItem?.getAttribute('role') === 'menuitem') {
          // Permitir navegación con flechas dentro del menú
          const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]')) as HTMLElement[]
          const currentIndex = menuItems.indexOf(menuItem)

          let nextIndex
          if (event.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % menuItems.length
          } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1
          }

          menuItems[nextIndex]?.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return null
}

export const LayoutPrincipal: React.FC = () => {
  return (
    <SidebarProvider>
      <AccessibilityEnhancer />
      <AppSidebarContent />
      <SidebarInset className="flex min-h-screen flex-1 flex-col bg-background">
        <ResponsiveHeader />

        <main className="flex-1 overflow-auto">
          <div className="px-3 pb-6 md:px-6 md:pb-8">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
