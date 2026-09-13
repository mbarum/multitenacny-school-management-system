
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { viteApiPlugin } from './src/server/viteApiPlugin'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  const backendUrl = env.VITE_API_URL || env.BACKEND_URL || '';
  const useMockApi = env.VITE_USE_MOCK_API === 'true' || !backendUrl;

  return {
    plugins: [
      react(),
      viteApiPlugin({ disabled: !useMockApi }),
    ],
    optimizeDeps: {
      include: ['socket.io-client'],
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: backendUrl ? {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/public/uploads': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: backendUrl,
          changeOrigin: true,
          ws: true,
        },
      } : undefined,
    },
  }
})
