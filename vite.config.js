import { defineConfig } from 'vite'

export default defineConfig({
  base: '/renato-ai/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'tfjs': ['@tensorflow/tfjs'],
          'use': ['@tensorflow-models/universal-sentence-encoder'],
          'chart': ['chart.js'],
          'lucide': ['lucide']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: ['@tensorflow/tfjs', '@tensorflow-models/universal-sentence-encoder']
  }
})