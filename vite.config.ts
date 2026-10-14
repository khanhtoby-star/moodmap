import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // During local development, API calls go to the FastAPI server on port 8000
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
})
