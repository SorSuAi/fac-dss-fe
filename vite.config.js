import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/fac-dss-fe/', // Important for GitHub Pages subfolders
  plugins: [react()],
})
