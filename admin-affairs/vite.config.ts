import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Vite 8 uses Oxc for TS/TSX transforms. Let the React plugin handle App.tsx
// instead of forcing a second pre-transform on the same file.
export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:8787' },
  },
})
