import React from 'react'
import { Outlet, Link, NavLink } from 'react-router-dom'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
`

const Sidebar = styled.nav`
  width: 250px;
  background-color: #2c3e50;
  color: white;
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
`

const Logo = styled.h2`
  margin: 0 0 30px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #ecf0f1;
  border-bottom: 2px solid #34495e;
  padding-bottom: 15px;
`

const SidebarList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`

const SidebarItem = styled.li`
  margin-bottom: 8px;
`

const SidebarLink = styled(NavLink)`
  display: block;
  padding: 12px 16px;
  color: #bdc3c7;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #34495e;
    color: #ecf0f1;
    transform: translateX(4px);
  }

  &.active {
    background-color: #3498db;
    color: white;
  }
`

const MainContent = styled.main`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #ffffff;
`

const Header = styled.header`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 2rem;
  font-weight: 300;
`

const HeaderSubtitle = styled.p`
  margin: 8px 0 0 0;
  opacity: 0.9;
  font-size: 1.1rem;
`

export const LayoutPrincipal: React.FC = () => {
  return (
    <Container>
      <Sidebar>
        <Logo>Sistema de Almacén</Logo>
        <SidebarList>
          {/* Módulo de Materia Prima con submenús */}
          <SidebarItem>
            <SidebarLink
              to="/materia-prima/gestion"
              className={({ isActive }: { isActive: boolean }) => isActive ? 'active' : ''}
            >
              📦 Materia Prima
            </SidebarLink>
          </SidebarItem>

          {/* Submenús de Materia Prima */}
          <SidebarItem style={{ marginLeft: '20px' }}>
            <SidebarLink
              to="/materia-prima/gestion"
              className={({ isActive }: { isActive: boolean }) => isActive ? 'active' : ''}
            >
              🗂️ Gestión
            </SidebarLink>
          </SidebarItem>
          <SidebarItem style={{ marginLeft: '20px' }}>
            <SidebarLink
              to="/materia-prima/consultas"
              className={({ isActive }: { isActive: boolean }) => isActive ? 'active' : ''}
            >
              🔍 Consultas
            </SidebarLink>
          </SidebarItem>

          <SidebarItem style={{ marginLeft: '20px' }}>
            <SidebarLink
              to="/materia-prima/nueva"
              className={({ isActive }: { isActive: boolean }) => isActive ? 'active' : ''}
            >
              ➕ Altas
            </SidebarLink>
          </SidebarItem>

          <SidebarItem>
            <SidebarLink
              to="/proveedores"
              className={({ isActive }: { isActive: boolean }) => isActive ? 'active' : ''}
            >
              🏢 Proveedores
            </SidebarLink>
          </SidebarItem>
          <SidebarItem>
            <SidebarLink
              to="/movimientos"
              className={({ isActive }: { isActive: boolean }) => isActive ? 'active' : ''}
            >
              📊 Movimientos
            </SidebarLink>
          </SidebarItem>
          <SidebarItem>
            <SidebarLink
              to="/solicitudes"
              className={({ isActive }: { isActive: boolean }) => isActive ? 'active' : ''}
            >
              📝 Solicitudes
            </SidebarLink>
          </SidebarItem>
        </SidebarList>
      </Sidebar>
      <MainContent>
        <Header>
          <HeaderTitle>Gestión de Almacén</HeaderTitle>
          <HeaderSubtitle>Sistema integral de control de inventario</HeaderSubtitle>
        </Header>
        <Outlet />
      </MainContent>
    </Container>
  )
}