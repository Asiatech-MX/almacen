import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const checks = [
  { path: 'apps/electron-main/src/main/index.ts', desc: 'Main process entry' },
  { path: 'apps/electron-main/src/preload/index.ts', desc: 'Preload script' },
  { path: 'apps/electron-main/src/main/ipc/materiaPrima.ts', desc: 'IPC handlers' },
  { path: 'apps/electron-renderer/src/App.tsx', desc: 'React App component' },
  { path: 'apps/electron-renderer/src/main.tsx', desc: 'React main entry' },
  { path: 'apps/electron-renderer/index.html', desc: 'React HTML template' },
  { path: 'apps/electron-renderer/vite.config.ts', desc: 'Vite configuration' },
  { path: 'electron.vite.config.ts', desc: 'electron-vite configuration' },
  { path: 'pnpm-workspace.yaml', desc: 'Workspace configuration' },
  { path: 'packages/shared-types/src/index.ts', desc: 'Shared types' },
  { path: '.vscode/launch.json', desc: 'VSCode debugging config' }
]

console.log('🔍 Validando setup del proyecto Electron + React...\n')

let allPassed = true

checks.forEach(check => {
  if (existsSync(check.path)) {
    console.log(`✅ ${check.desc}: OK`)
  } else {
    console.log(`❌ ${check.desc}: MISSING - ${check.path}`)
    allPassed = false
  }
})

// Validar configuración de package.json
console.log('\n📦 Validando configuración de package.json...')
try {
  const mainPackage = JSON.parse(readFileSync('package.json', 'utf-8'))
  const hasElectronVite = mainPackage.devDependencies?.['electron-vite']
  const hasElectron = mainPackage.devDependencies?.['electron']

  if (hasElectronVite && hasElectron) {
    console.log('✅ Dependencias principales configuradas correctamente')
  } else {
    console.log('❌ Faltan dependencias principales')
    allPassed = false
  }
} catch (error) {
  console.log('❌ Error leyendo package.json principal')
  allPassed = false
}

// Validar configuración del renderer
try {
  const rendererPackage = JSON.parse(readFileSync('apps/electron-renderer/package.json', 'utf-8'))
  const hasReact = rendererPackage.dependencies?.['react']
  const hasReactDom = rendererPackage.dependencies?.['react-dom']
  const hasStyledComponents = rendererPackage.dependencies?.['styled-components']

  if (hasReact && hasReactDom && hasStyledComponents) {
    console.log('✅ Dependencias de React configuradas correctamente')
  } else {
    console.log('❌ Faltan dependencias de React')
    allPassed = false
  }
} catch (error) {
  console.log('❌ Error leyendo package.json del renderer')
  allPassed = false
}

console.log('\n' + '='.repeat(50))

if (allPassed) {
  console.log('🎉 ¡Validación completada exitosamente!')
  console.log('\n📋 Siguientes pasos:')
  console.log('1. Ejecutar: pnpm install')
  console.log('2. Ejecutar: pnpm dev')
  console.log('3. Probar la aplicación')
} else {
  console.log('❌ Hay errores en la configuración que deben ser corregidos')
  process.exit(1)
}