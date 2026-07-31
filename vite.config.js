import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  base: '/',
  build: {
    manifest: true,
  },
  plugins: [react(), cloudflare()],
})
