import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    build: {
      outDir: 'dist/main',
      lib: {
        entry: resolve(__dirname, 'apps/electron-main/src/main/index.ts'),
        formats: ['cjs']
      }
    },
    resolve: {
      alias: {
        '@backend': resolve(__dirname, 'backend'),
        '@shared-types': resolve(__dirname, 'shared/types')
      }
    },
    plugins: [
      externalizeDepsPlugin({
        exclude: ['electron-log'], // No externalizar módulos ESM-only
        include: ['pg', 'postgres', 'kysely'] // Externalizar módulos de base de datos
      })
    ]
  },
  preload: {
    build: {
      outDir: 'dist/preload',
      lib: {
        entry: resolve(__dirname, 'apps/electron-main/src/preload/index.ts'),
        formats: ['cjs']
      }
    },
    resolve: {
      alias: {
        '@backend': resolve(__dirname, 'backend'),
        '@shared-types': resolve(__dirname, 'shared/types')
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    build: {
      outDir: 'dist/renderer',
      rollupOptions: {
        input: resolve(__dirname, 'apps/electron-renderer/index.html')
      }
    },
    root: resolve('./apps/electron-renderer'),
    resolve: {
      alias: {
        '@': resolve('./apps/electron-renderer/src'),
        '@renderer': resolve('./apps/electron-renderer/src'),
        '@shared': resolve('./packages/shared-types/src'),
        '@backend': resolve(__dirname, 'backend'),
        '@shared-types': resolve(__dirname, 'shared/types')
      }
    },
    plugins: [tailwindcss()],
    css: {
      postcss: false
    }
  }
})