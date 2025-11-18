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
  ChevronUp,
  ChevronRight,
  Menu,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
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

// Sub-componente para renderizar menús individuales
const NavigationMenu = ({ items }: { items: NavigationItem[] }) => {
  const location = useLocation();
  const { state, isMobile } = useSidebar();

  const renderMenuItem = (item: NavigationItem, level: number = 0) => {
    const isActive = location.pathname === item.url ||
                    (item.children && item.children.some(child => location.pathname === child.url));

    if (item.children && item.children.length > 0) {
      return (
        <Collapsible
          key={item.title}
          defaultOpen={isActive || level === 0}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isActive}
                className={level > 0 ? 'pl-6' : ''}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
                {item.badge && (
                  <span className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180 h-4 w-4" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.children.map((child) => (
                  <SidebarMenuSubItem key={child.title}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={location.pathname === child.url}
                    >
                      <NavLink to={child.url}>
                        <child.icon className="h-4 w-4" />
                        <span>{child.title}</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          tooltip={item.title}
          isActive={isActive}
          asChild
        >
          <NavLink to={item.url}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            {item.badge && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <SidebarMenu>
      {items.map((item) => renderMenuItem(item))}
    </SidebarMenu>
  );
};

// Componente del header del sidebar
const SidebarHeaderComponent = () => {
  const { state } = useSidebar();

  return (
    <SidebarHeader className="p-4">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Package className="h-4 w-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                Sistema Almacén
              </span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                Control de Inventario
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
};

// Componente del footer del sidebar
const SidebarFooterComponent = () => {
  const { state } = useSidebar();

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-sm font-medium">U</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Usuario</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">admin@almacen.com</span>
                </div>
                <ChevronUp className="ml-auto h-4 w-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              className="w-(--radix-popper-anchor-width)"
            >
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
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};

// Componente principal del Sidebar (sin SidebarProvider para usarlo externamente)
export const AppSidebarContent = () => {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeaderComponent />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavigationMenu items={navigationItems} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooterComponent />
      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebarContent;