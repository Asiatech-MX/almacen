import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'shared/types'),
      },
    },
  },
  preload: {
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'shared/types'),
      },
    },
  },
  renderer: {
    plugins: [react(), tailwindcss()],
    css: {
      postcss: false,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'apps/electron-renderer/src'),
        '@shared': path.resolve(__dirname, 'shared/types'),
        '@components': path.resolve(__dirname, 'apps/electron-renderer/src/components'),
        '@lib': path.resolve(__dirname, 'apps/electron-renderer/src/lib'),
        '@hooks': path.resolve(__dirname, 'apps/electron-renderer/src/hooks'),
        '@services': path.resolve(__dirname, 'apps/electron-renderer/src/services'),
        '@modules': path.resolve(__dirname, 'apps/electron-renderer/src/modules'),
        '@providers': path.resolve(__dirname, 'apps/electron-renderer/src/providers'),
        '@types': path.resolve(__dirname, 'apps/electron-renderer/src/types'),
        '@styles': path.resolve(__dirname, 'apps/electron-renderer/src/styles'),
        '@ui': path.resolve(__dirname, 'apps/electron-renderer/src/components/ui'),
        '@layout': path.resolve(__dirname, 'apps/electron-renderer/src/components/layout'),
        '@dashboard': path.resolve(__dirname, 'apps/electron-renderer/src/components/dashboard'),
        '@feedback': path.resolve(__dirname, 'apps/electron-renderer/src/components/feedback'),
        '@forms': path.resolve(__dirname, 'apps/electron-renderer/src/components/forms'),
        '@tables': path.resolve(__dirname, 'apps/electron-renderer/src/components/tables'),
        '@notificaciones': path.resolve(__dirname, 'apps/electron-renderer/src/components/notificaciones')
      },
    },
    server: {
      port: 5173,
      host: true
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets'
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        '@tanstack/react-query-devtools',
        'lucide-react',
        'styled-components',
        '@radix-ui/react-toast',
        'class-variance-authority',
        '@radix-ui/react-slot',
        '@radix-ui/react-tabs',
        'sonner',
        'date-fns',
        'date-fns/locale'
      ]
    }
  }
})