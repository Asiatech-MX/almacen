import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: './',
  css: {
    postcss: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../shared/types'),
      '@components': path.resolve(__dirname, './src/components'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@providers': path.resolve(__dirname, './src/providers'),
      '@types': path.resolve(__dirname, './src/types'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@ui': path.resolve(__dirname, './src/components/ui'),
      '@layout': path.resolve(__dirname, './src/components/layout'),
      '@dashboard': path.resolve(__dirname, './src/components/dashboard'),
      '@feedback': path.resolve(__dirname, './src/components/feedback'),
      '@forms': path.resolve(__dirname, './src/components/forms'),
      '@tables': path.resolve(__dirname, './src/components/tables'),
      '@notificaciones': path.resolve(__dirname, './src/components/notificaciones')
    }
  },
  server: {
    port: 5175,
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
})