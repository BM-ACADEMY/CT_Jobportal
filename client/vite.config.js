import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Apply native browser image lazy-loading consistently without relying on every
// page author to remember the attributes. Explicit `loading` values are kept.
const imageLoadingDefaults = () => ({
  name: 'image-loading-defaults',
  enforce: 'pre',
  transform(code, id) {
    if (!/\.[jt]sx$/.test(id) || !code.includes('<img')) return null

    return {
      code: code.replace(/<img\b(?![^>]*\bloading\s*=)/g, '<img loading="lazy" decoding="async"'),
      map: null,
    }
  },
})

// Dev server: the browser calls the API on its own origin (/api, /uploads) and Vite forwards
// those requests to DEV_API_TARGET (the live API unless set, e.g. http://localhost:5000 for a
// local server). Same origin means no CORS, so `npm run dev` gets real data on any port,
// even with no client/.env. Values set in client/.env still win; builds are unaffected.
const devApi = (env) => {
  const target = env.DEV_API_TARGET || 'https://api.velaivaaipu.in'
  const define = {}
  if (!env.VITE_API_BASE_URL) define['import.meta.env.VITE_API_BASE_URL'] = JSON.stringify('/api')
  if (env.VITE_API_DOMAIN === undefined) define['import.meta.env.VITE_API_DOMAIN'] = JSON.stringify('')
  const forward = { target, changeOrigin: true, secure: true }
  return { define, proxy: { '/api': forward, '/uploads': forward } }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const dev = command === 'serve' ? devApi(loadEnv(mode, __dirname, '')) : null
  return {
    plugins: [
      imageLoadingDefaults(),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    ...(dev && { define: dev.define, server: { proxy: dev.proxy } }),
  }
})
