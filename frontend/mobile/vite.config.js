import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    target: 'es2015',
    sourcemap: false
  },
  css: {
    postcss: {
      plugins: [
        require('postcss-pxtorem')({
          rootValue: 50,
          propList: ['*'],
          selectorBlackList: ['.norem'],
          minPixelValue: 2
        })
      ]
    }
  }
})