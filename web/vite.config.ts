import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The app. The router plugin reads tsr.config.json in this folder and
// keeps src/app/routeTree.gen.ts current while Vite runs; it must come
// before the React plugin.
export default defineConfig({
  root: import.meta.dirname,
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
})
