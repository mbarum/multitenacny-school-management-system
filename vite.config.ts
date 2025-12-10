import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    optimizeDeps: {
      include: ['socket.io-client'],
    },
    server: {
      proxy: {
        // Proxy API requests to the backend server
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          // We DO NOT rewrite the path here because the NestJS backend 
          // is configured with app.setGlobalPrefix('api'), so it EXPECTS the /api prefix.
        },
        // Proxy requests for public assets (like uploaded logos) to the backend
        '/public': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})