import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import NotificacionesPanel from '../notificaciones/NotificacionesPanel'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebarContent } from './AppSidebar'
import { MobileSidebar, useMobileSidebar } from './MobileSidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

type MobileSidebarControls = ReturnType<typeof useMobileSidebar>

// Header responsive que integra el trigger del sidebar
const ResponsiveHeader = ({ mobileSidebar }: { mobileSidebar: MobileSidebarControls }) => {
  const isMobile = useIsMobile()

  return (
    <header className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b">
        <div className="flex items-center gap-4">
          {/* Boton hamburguesa - Sheet en movil, SidebarTrigger en desktop */}
          {isMobile ? (
            <MobileSidebar
              isOpen={mobileSidebar.isOpen}
              onOpenChange={(open) => (open ? mobileSidebar.openSidebar() : mobileSidebar.closeSidebar())}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:bg-muted md:hidden"
                  aria-label="Abrir menu de navegacion"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <SidebarTrigger className="text-foreground hover:bg-muted" />
              <Separator orientation="vertical" className="h-6" />
            </div>
          )}

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
  const isMobile = useIsMobile()
  const mobileSidebar = useMobileSidebar()

  return (
    <SidebarProvider className="flex h-screen w-full bg-background">
      <AccessibilityEnhancer />

      {/* Sidebar fijo en desktop */}
      {!isMobile && <AppSidebarContent />}

      <SidebarInset className="flex min-h-screen flex-1 flex-col bg-card">
        <ResponsiveHeader mobileSidebar={mobileSidebar} />

        {/* Mensaje informativo para móvil */}
        <div className="block md:hidden px-4 pt-3">
          <nav
            className="bg-muted/30 border rounded-lg p-4"
            role="navigation"
            aria-label="Informacion de navegacion movil"
          >
            <div className="text-sm text-muted-foreground mb-2">
              Usa el boton de menu para acceder al menu completo
            </div>
            <div className="text-xs text-muted-foreground">
              Atajos: Ctrl+B para menu (desktop) | Alt+M para focus en menu
            </div>
          </nav>
        </div>

        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-3 pb-6 md:px-6 md:pb-8">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
