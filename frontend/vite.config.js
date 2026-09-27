import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL || 'http://localhost:8000';
  const wsTarget = backendTarget.replace(/^http/, 'ws');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api/cams': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false
        },
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false
        },
        '/ws': {
          target: wsTarget,
          ws: true,
          secure: false
        }
      }
    }
  };
});
