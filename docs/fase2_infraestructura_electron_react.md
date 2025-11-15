# Guía de Implementación - Fase 2: Infraestructura Electron + React

## 🎯 Objetivo de la Fase 2

Establecer la infraestructura base para la aplicación de escritorio utilizando **Electron + React 19**, creando una fundación sólida y moderna que soporte el desarrollo eficiente del sistema de gestión de almacén.

## 🚀 Stack Tecnológico 2025

### Tecnologías Seleccionadas

| Tecnología | Versión | Justificación |
|------------|---------|---------------|
| **Electron** | v32+ | Runtime de escritorio maduro y estable |
| **electron-vite** | v4+ | Build tool moderno que simplifica configuración |
| **React** | v19 | Última versión con nuevas features y mejor performance |
| **Vite** | v7 | HMR ultra-rápido y desarrollo optimizado |
| **TypeScript** | v5+ | Type safety y mejor experiencia de desarrollo |
| **pnpm** | v9+ | Package manager eficiente para workspaces |

### ¿Qué es electron-vite y por qué lo usamos?

**electron-vite** es la solución recomendada en 2025 para desarrollar aplicaciones Electron. Combina:

- ⚡ **Configuración centralizada** en un solo archivo
- 🔥 **Hot Module Replacement** para main y renderer processes
- 📦 **Externalización automática** de dependencias
- 🎯 **Configuración optimizada** out-of-the-box
- 🔧 **Integración perfecta** con Vite y React 19

## ✅ Checklist de Implementación

### 📋 Preparación del Entorno

- [ ] **Verificar Node.js 20+ o 22+**
  ```bash
  node --version  # Debe ser v20.19+ o v22.12+
  ```

- [ ] **Instalar pnpm globalmente**
  ```bash
  npm install -g pnpm
  ```

- [ ] **Verificar espacio en disco disponible** (2GB mínimo)

### 🏗️ Configuración del Monorepo

- [ ] **Inicializar workspace principal**
  ```bash
  # En la raíz del proyecto
  pnpm init

  # Configurar workspace
  echo "packages:\n  - 'apps/*'\n  - 'packages/*'" > pnpm-workspace.yaml
  ```

- [ ] **Crear estructura de carpetas base**
  ```bash
  mkdir -p apps/electron-main apps/electron-renderer packages/shared-types
  ```

- [ ] **Configurar package.json principal**
  ```json
  {
    "name": "almacen-electron",
    "private": true,
    "type": "module",
    "scripts": {
      "dev": "electron-vite dev",
      "build": "electron-vite build",
      "preview": "electron-vite preview",
      "pack": "electron-builder",
      "dist": "pnpm build && pnpm pack"
    },
    "devDependencies": {
      "electron": "^32.0.0",
      "electron-vite": "^4.0.0",
      "electron-builder": "^25.0.0",
      "typescript": "^5.0.0",
      "@types/node": "^22.0.0"
    }
  }
  ```

### ⚙️ Setup de Electron Main Process

- [ ] **Crear package.json para main process**
  ```bash
  cd apps/electron-main
  pnpm init
  ```

- [ ] **Configurar package.json del main process**
  ```json
  {
    "name": "electron-main",
    "private": true,
    "main": "./out/main/index.js",
    "scripts": {
      "build": "tsc"
    },
    "dependencies": {
      "electron-log": "^5.0.0"
    }
  }
  ```

- [ ] **Crear archivo main.ts**
  ```typescript
  // apps/electron-main/src/main/index.ts
  import { app, BrowserWindow } from 'electron'
  import { join } from 'path'

  const createWindow = (): void => {
    const mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false
      }
    })

    // HMR para desarrollo
    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }

  app.whenReady().then(createWindow)
  ```

### 🔒 Configuración de Preload Scripts

- [ ] **Crear preload script seguro**
  ```typescript
  // apps/electron-main/src/preload/index.ts
  import { contextBridge, ipcRenderer } from 'electron'

  // API segura para el renderer process
  contextBridge.exposeInMainWorld('electronAPI', {
    // Gestión de materia prima
    materiaPrima: {
      listar: () => ipcRenderer.invoke('materiaPrima:listar'),
      crear: (data: any) => ipcRenderer.invoke('materiaPrima:crear', data),
      actualizar: (id: string, data: any) => ipcRenderer.invoke('materiaPrima:actualizar', id, data),
      eliminar: (id: string) => ipcRenderer.invoke('materiaPrima:eliminar', id)
    },

    // Sistema de archivos
    sistema: {
      leerArchivo: (ruta: string) => ipcRenderer.invoke('fs:leer', ruta),
      guardarArchivo: (ruta: string, contenido: string) => ipcRenderer.invoke('fs:guardar', ruta, contenido)
    },

    // Event listeners
    onActualizacionInventario: (callback: (data: any) => void) => {
      ipcRenderer.on('inventario:actualizado', (_, data) => callback(data))
    }
  })
  ```

### ⚛️ Setup de React Renderer con Vite

- [ ] **Inicializar React app con Vite**
  ```bash
  cd apps/electron-renderer
  pnpm create vite . --template react-ts
  ```

- [ ] **Instalar dependencias específicas para Electron**
  ```bash
  cd apps/electron-renderer
  pnpm add react-router-dom
  pnpm add -D @types/react-router-dom
  ```

- [ ] **Configurar index.html para Electron**
  ```html
  <!-- apps/electron-renderer/index.html -->
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Sistema de Almacén</title>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/src/main.tsx"></script>
    </body>
  </html>
  ```

- [ ] **Configurar App.tsx con HashRouter**
  ```tsx
  // apps/electron-renderer/src/App.tsx
  import React from 'react'
  import { HashRouter as Router, Routes, Route } from 'react-router-dom'
  import { LayoutPrincipal } from './components/LayoutPrincipal'
  import { MateriaPrimaLista } from './modules/materiaPrima/Lista'
  import { MateriaPrimaFormulario } from './modules/materiaPrima/Formulario'

  function App() {
    return (
      <Router>
        <LayoutPrincipal>
          <Routes>
            <Route path="/" element={<MateriaPrimaLista />} />
            <Route path="/materia-prima/nueva" element={<MateriaPrimaFormulario />} />
            <Route path="/materia-prima/editar/:id" element={<MateriaPrimaFormulario />} />
          </Routes>
        </LayoutPrincipal>
      </Router>
    )
  }

  export default App
  ```

### 🔌 Comunicación IPC Básica

- [ ] **Implementar IPC handlers en main process**
  ```typescript
  // apps/electron-main/src/main/ipc/materiaPrima.ts
  import { ipcMain } from 'electron'
  import { MateriaPrimaService } from '../services/MateriaPrimaService'

  const materiaPrimaService = new MateriaPrimaService()

  export function setupMateriaPrimaHandlers(): void {
    ipcMain.handle('materiaPrima:listar', async () => {
      try {
        return await materiaPrimaService.listar()
      } catch (error) {
        throw new Error(`Error listando materia prima: ${error.message}`)
      }
    })

    ipcMain.handle('materiaPrima:crear', async (_, data) => {
      try {
        return await materiaPrimaService.crear(data)
      } catch (error) {
        throw new Error(`Error creando materia prima: ${error.message}`)
      }
    })
  }
  ```

- [ ] **Crear servicio de React para comunicarse con Electron**
  ```typescript
  // apps/electron-renderer/src/services/materiaPrimaService.ts
  export interface MateriaPrima {
    id: string
    nombre: string
    marca?: string
    modelo?: string
    presentacion: string
    stockActual: number
    codigoBarras?: string
    fechaCaducidad?: string
  }

  export class MateriaPrimaService {
    private api = (window as any).electronAPI.materiaPrima

    async listar(): Promise<MateriaPrima[]> {
      return await this.api.listar()
    }

    async crear(data: Omit<MateriaPrima, 'id'>): Promise<MateriaPrima> {
      return await this.api.crear(data)
    }

    async actualizar(id: string, data: Partial<MateriaPrima>): Promise<MateriaPrima> {
      return await this.api.actualizar(id, data)
    }

    async eliminar(id: string): Promise<boolean> {
      return await this.api.eliminar(id)
    }
  }
  ```

### 🗂️ Sistema de Routing Frontend

- [ ] **Configurar estructura de módulos**
  ```bash
  mkdir -p apps/electron-renderer/src/modules/{materiaPrima,proveedor,movimientos,auth}
  mkdir -p apps/electron-renderer/src/components/{common,layout}
  ```

- [ ] **Crear layout principal**
  ```tsx
  // apps/electron-renderer/src/components/LayoutPrincipal.tsx
  import React from 'react'
  import { Outlet, Link } from 'react-router-dom'
  import styled from 'styled-components'

  const Container = styled.div`
    display: flex;
    height: 100vh;
  `

  const Sidebar = styled.nav`
    width: 250px;
    background-color: #2c3e50;
    color: white;
    padding: 20px;
  `

  const MainContent = styled.main`
    flex: 1;
    padding: 20px;
    background-color: #f5f5f5;
  `

  export function LayoutPrincipal(): React.ReactElement {
    return (
      <Container>
        <Sidebar>
          <h2>Sistema de Almacén</h2>
          <ul>
            <li><Link to="/">Materia Prima</Link></li>
            <li><Link to="/proveedores">Proveedores</Link></li>
            <li><Link to="/movimientos">Movimientos</Link></li>
            <li><Link to="/solicitudes">Solicitudes</Link></li>
          </ul>
        </Sidebar>
        <MainContent>
          <Outlet />
        </MainContent>
      </Container>
    )
  }
  ```

### 📄 Configuración Centralizada electron-vite

- [ ] **Crear electron.vite.config.ts principal**
  ```typescript
  // electron.vite.config.ts
  import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
  import { resolve } from 'path'

  export default defineConfig({
    main: {
      build: {
        outDir: 'dist/main'
      },
      plugins: [
        externalizeDepsPlugin({
          exclude: ['electron-log'] // No externalizar módulos ESM-only
        })
      ]
    },
    preload: {
      build: {
        outDir: 'dist/preload'
      },
      plugins: [externalizeDepsPlugin()]
    },
    renderer: {
      build: {
        outDir: 'dist/renderer'
      },
      root: resolve('./apps/electron-renderer'),
      resolve: {
        alias: {
          '@renderer': resolve('./apps/electron-renderer/src'),
          '@shared': resolve('./packages/shared-types/src')
        }
      }
    }
  })
  ```

### 🧪 Testing y Validación

- [ ] **Crear script de validación**
  ```typescript
  // scripts/validate-setup.ts
  import { existsSync, readFileSync } from 'fs'
  import { join } from 'path'

  const checks = [
    { path: 'apps/electron-main/src/main/index.ts', desc: 'Main process entry' },
    { path: 'apps/electron-main/src/preload/index.ts', desc: 'Preload script' },
    { path: 'apps/electron-renderer/src/App.tsx', desc: 'React App component' },
    { path: 'electron.vite.config.ts', desc: 'electron-vite configuration' },
    { path: 'pnpm-workspace.yaml', desc: 'Workspace configuration' }
  ]

  checks.forEach(check => {
    if (existsSync(check.path)) {
      console.log(`✅ ${check.desc}: OK`)
    } else {
      console.log(`❌ ${check.desc}: MISSING - ${check.path}`)
    }
  })
  ```

- [ ] **Probar funcionamiento básico**
  ```bash
  # Instalar todas las dependencias
  pnpm install

  # Iniciar modo desarrollo
  pnpm dev

  # Probar build
  pnpm build

  # Validar configuración
  node scripts/validate-setup.ts
  ```

## 🔧 Configuración de VSCode para Debugging

### [ ] **Crear .vscode/launch.json**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceRoot}",
      "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/electron-vite",
      "windows": {
        "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/electron-vite.cmd"
      },
      "runtimeArgs": ["--sourcemap"],
      "env": {
        "REMOTE_DEBUGGING_PORT": "9222"
      }
    },
    {
      "name": "Debug Renderer Process",
      "port": 9222,
      "request": "attach",
      "type": "chrome",
      "webRoot": "${workspaceFolder}/apps/electron-renderer/src",
      "timeout": 60000
    }
  ],
  "compounds": [
    {
      "name": "Debug Electron App",
      "configurations": ["Debug Main Process", "Debug Renderer Process"]
    }
  ]
}
```

## 📁 Estructura Final del Proyecto

```
almacen-electron/
├── apps/
│   ├── electron-main/          # Proceso principal Electron
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── index.ts
│   │   │   │   ├── ipc/        # Handlers IPC
│   │   │   │   └── services/   # Lógica de negocio
│   │   │   └── preload/
│   │   │       └── index.ts
│   │   └── package.json
│   └── electron-renderer/      # Aplicación React
│       ├── src/
│       │   ├── components/
│       │   ├── modules/
│       │   ├── services/
│       │   └── App.tsx
│       ├── index.html
│       └── package.json
├── packages/
│   └── shared-types/           # Tipos TypeScript compartidos
│       └── src/
├── docs/
│   ├── plan_almacen_electron.md
│   └── fase2_infraestructura_electron_react.md  ← Este documento
├── scripts/
│   └── validate-setup.ts
├── .vscode/
│   └── launch.json
├── electron.vite.config.ts     # Configuración centralizada
├── pnpm-workspace.yaml         # Workspace configuration
└── package.json               # Package.json principal
```

## 📚 Referencias y Recursos

### Proyectos GitHub de Referencia

| Proyecto | Qué aprender | Link |
|----------|--------------|------|
| **lossless-cut** | Configuración electron.vite.config.ts real | [mifi/lossless-cut](https://github.com/mifi/lossless-cut/blob/master/electron.vite.config.ts) |
| **lobe-chat** | Estructura de monorepo moderna | [lobehub/lobe-chat](https://github.com/lobehub/lobe-chat/blob/next/apps/desktop/electron.vite.config.ts) |
| **electron-vite** | Documentación oficial y ejemplos | [alex8088/electron-vite](https://github.com/alex8088/electron-vite) |
| **privacy.sexy** | Configuración de producción | [undergroundwires/privacy.sexy](https://github.com/undergroundwires/privacy.sexy/blob/master/electron.vite.config.ts) |

### Documentación Oficial

- **electron-vite Guide**: https://electron-vite.org/
- **Electron Documentation**: https://www.electronjs.org/docs
- **React 19 Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/

### Tutoriales y Guías

- **electron-vite Quick Start**: `npm create @quick-start/electron`
- **React Router in Electron**: Usar siempre `HashRouter` para evitar problemas con protocolo file://
- **IPC Security**: Siempre usar `contextBridge` con `contextIsolation: true`

## 🎯 Siguiente Fase

Una vez completada esta fase 2, estarás listo para:

1. **Fase 3**: Implementar API interna para Materia Prima
2. **Fase 4**: API para Proveedores
3. **Fase 5**: Movimientos de Material
4. **Fase 6**: Solicitudes de Compra

## ✅ Validación Final

Antes de pasar a la siguiente fase, asegúrate de que:

- [ ] La aplicación arranca en modo desarrollo sin errores
- [ ] El proceso de build completa exitosamente
- [ ] La comunicación IPC básica funciona
- [ ] El routing de React navega correctamente
- [ ] Los devtools de Chrome funcionan en el renderer

---

**🎉 ¡Felicidades!** Al completar esta fase habrás establecido una base sólida y moderna para tu aplicación de escritorio de gestión de almacén.