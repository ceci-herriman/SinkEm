import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // All requests starting with /api will be sent to the Express server
      '/api': {
        target: 'http://localhost:3000', // Express server port
        changeOrigin: true,
      },
    },
  },
})
