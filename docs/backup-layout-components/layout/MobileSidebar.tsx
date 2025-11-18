import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Package,
  Search,
  Plus,
  Building,
  TrendingUp,
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronRight,
  X,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
    description: 'Vista principal del sistema'
  },
  {
    title: 'Materia Prima',
    url: '/materia-prima',
    icon: Package,
    description: 'Gestión de materiales',
    children: [
      {
        title: 'Gestión',
        url: '/materia-prima/gestion',
        icon: Settings,
        description: 'Administrar materiales'
      },
      {
        title: 'Consultas',
        url: '/materia-prima/consultas',
        icon: Search,
        description: 'Buscar y consultar'
      },
      {
        title: 'Altas',
        url: '/materia-prima/nueva',
        icon: Plus,
        description: 'Registrar nuevo material'
      }
    ]
  },
  {
    title: 'Proveedores',
    url: '/proveedores',
    icon: Building,
    description: 'Gestión de proveedores'
  },
  {
    title: 'Movimientos',
    url: '/movimientos',
    icon: TrendingUp,
    description: 'Control de movimientos'
  },
  {
    title: 'Aprobaciones',
    url: '/aprobaciones',
    icon: CheckCircle,
    description: 'Aprobaciones pendientes',
    badge: '3'
  },
  {
    title: 'Solicitudes',
    url: '/solicitudes',
    icon: FileText,
    description: 'Gestión de solicitudes'
  }
];

// Sub-componente para renderizar menús individuales en móvil
const MobileNavigationMenu = ({ items, onNavigate }: { items: NavigationItem[]; onNavigate?: () => void }) => {
  const location = useLocation();

  const renderMenuItem = (item: NavigationItem, level: number = 0) => {
    const isActive = location.pathname === item.url ||
                    (item.children && item.children.some(child => location.pathname === child.url));

    if (item.children && item.children.length > 0) {
      return (
        <Collapsible
          key={item.title}
          defaultOpen={isActive}
          className="group/collapsible"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start pl-4 h-12",
                level > 0 && "pl-8",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 mr-3" />
              <span className="flex-1 text-left">{item.title}</span>
              {item.badge && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full mr-2">
                  {item.badge}
                </span>
              )}
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {item.children.map((child) => (
              <Button
                key={child.title}
                variant="ghost"
                asChild
                className={cn(
                  "w-full justify-start pl-12 h-10",
                  location.pathname === child.url && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                onClick={onNavigate}
              >
                <NavLink to={child.url}>
                  <child.icon className="h-4 w-4 mr-3" />
                  <span>{child.title}</span>
                </NavLink>
              </Button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Button
        key={item.title}
        variant="ghost"
        asChild
        className={cn(
          "w-full justify-start pl-4 h-12",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
        )}
        onClick={onNavigate}
      >
        <NavLink to={item.url}>
          <item.icon className="h-4 w-4 mr-3" />
          <span className="flex-1 text-left">{item.title}</span>
          {item.badge && (
            <span className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </NavLink>
      </Button>
    );
  };

  return (
    <div className="space-y-2 py-2">
      {items.map((item) => renderMenuItem(item))}
    </div>
  );
};

// Componente del header del sidebar móvil
const MobileSidebarHeader = () => {
  return (
    <SheetHeader className="p-4 border-b">
      <div className="flex items-center space-x-3">
        <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Package className="h-5 w-5" />
        </div>
        <div className="flex-1 text-left">
          <SheetTitle className="text-lg font-semibold">Sistema Almacén</SheetTitle>
          <SheetDescription>Control de Inventario</SheetDescription>
        </div>
      </div>
    </SheetHeader>
  );
};

// Componente del footer del sidebar móvil
const MobileSidebarFooter = () => {
  return (
    <div className="p-4 border-t mt-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start h-12 pl-4">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground mr-3">
              <span className="text-sm font-medium">U</span>
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">Usuario</div>
              <div className="text-sm text-muted-foreground">admin@almacen.com</div>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Ayuda</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

interface MobileSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export const MobileSidebar = ({ isOpen, onOpenChange, trigger }: MobileSidebarProps) => {
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);

  const handleNavigate = () => {
    // Cerrar el sheet automáticamente al navegar
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {trigger && (
        <SheetTrigger asChild>
          {trigger}
        </SheetTrigger>
      )}
      <SheetContent
        side="left"
        className="w-[300px] sm:w-[350px] p-0 flex flex-col"
        aria-describedby="mobile-sidebar-description"
      >
        {/* Contenido principal con scroll */}
        <div className="flex-1 overflow-y-auto">
          <MobileSidebarHeader />

          {/* Contenido de navegación */}
          <div className="px-2 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="px-4 mb-2 text-sm font-medium text-muted-foreground">
                  Navegación Principal
                </h3>
                <MobileNavigationMenu
                  items={navigationItems}
                  onNavigate={handleNavigate}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer pegado al fondo */}
        <MobileSidebarFooter />

        {/* Elemento oculto para screen readers */}
        <div id="mobile-sidebar-description" className="sr-only">
          Menú de navegación principal del sistema de almacén. Use las flechas para navegar y Enter para seleccionar.
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Hook personalizado para manejar el estado del sidebar móvil
export const useMobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return {
    isOpen,
    openSidebar,
    closeSidebar,
    toggleSidebar,
  };
};

export default MobileSidebar;