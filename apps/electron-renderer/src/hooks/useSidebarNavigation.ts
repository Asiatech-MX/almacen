import { useState, useEffect, useCallback } from 'react';

interface UseSidebarNavigationReturn {
  isSidebarOpen: boolean;
  isMobile: boolean;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  toggleCollapse: () => void;
}

/**
 * Hook personalizado para manejar la navegación del sidebar con soporte responsive
 * Cumple con los principios ISO 9241-110 de controlabilidad y adecuación para la tarea
 */
export function useSidebarNavigation(): UseSidebarNavigationReturn {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Detectar viewport size para comportamiento responsive
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Auto-collapse en desktop si la pantalla es pequeña
      if (!mobile && window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle del sidebar (para móvil)
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(prev => !prev);
    }
  }, [isMobile]);

  // Cerrar sidebar (para móvil y desktop)
  const closeSidebar = useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  // Abrir sidebar (solo móvil)
  const openSidebar = useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  // Toggle de colapso (solo desktop)
  const toggleCollapse = useCallback(() => {
    if (!isMobile) {
      setIsCollapsed(prev => !prev);
    }
  }, [isMobile]);

  // Auto-cerrar sidebar en móvil cuando se cambia a desktop
  useEffect(() => {
    if (!isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [isMobile, isSidebarOpen]);

  // Soporte para atajo de teclado (Ctrl/Cmd + B)
  useEffect(() => {
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

  return {
    isSidebarOpen,
    isMobile,
    isCollapsed,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    toggleCollapse,
  };
}