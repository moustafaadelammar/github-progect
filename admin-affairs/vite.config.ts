import react from '@vitejs/plugin-react'
import { defineConfig, transformWithOxc } from 'vite'

const forceTsxTransform = () => ({
  name: 'force-tsx-transform',
  enforce: 'pre' as const,
  async transform(code: string, id: string) {
    if (!id.endsWith('/src/App.tsx')) return null
    return await transformWithOxc(code, id, { lang: 'tsx' })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [forceTsxTransform(), react()],
  server: { proxy: { '/api': 'http://localhost:8787' } },
})
