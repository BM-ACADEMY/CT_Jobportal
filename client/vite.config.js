import path from "path"
import { defineConfig } from 'vite'
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

// https://vite.dev/config/
export default defineConfig({
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
})
