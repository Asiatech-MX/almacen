import React, { createContext, useContext, ReactNode } from 'react';

interface SidebarContextType {
  isSidebarOpen: boolean;
  isMobile: boolean;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}

/**
 * Provider global para manejar el estado del sidebar en toda la aplicación
 * Implementa el patrón de diseño Strategy para diferentes comportamientos responsive
 * Cumple con ISO 9241-110: Principios de diálogo
 */
export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Detectar viewport size para comportamiento responsive
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Auto-collapse en desktop si la pantalla es pequeña (tablet)
      if (!mobile && window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else if (!mobile && window.innerWidth >= 1024) {
        setIsCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle del sidebar (para móvil)
  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(prev => !prev);
    }
  }, [isMobile]);

  // Cerrar sidebar (para móvil y desktop)
  const closeSidebar = React.useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  // Abrir sidebar (solo móvil)
  const openSidebar = React.useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  // Toggle de colapso (solo desktop)
  const toggleCollapse = React.useCallback(() => {
    if (!isMobile) {
      setIsCollapsed(prev => !prev);
    }
  }, [isMobile]);

  // Auto-cerrar sidebar en móvil cuando se cambia a desktop
  React.useEffect(() => {
    if (!isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [isMobile, isSidebarOpen]);

  // Soporte para atajo de teclado (Ctrl/Cmd + B) - Accesibilidad WCAG
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        if (isMobile) {
          toggleSidebar();
        } else {
          toggleCollapse();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, toggleSidebar, toggleCollapse]);

  const contextValue: SidebarContextType = {
    isSidebarOpen,
    isMobile,
    isCollapsed,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    toggleCollapse,
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Hook para consumir el contexto del sidebar
 * Lanza error si se usa fuera de un SidebarProvider (Pattern Safety)
 */
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}