import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the site works on any GitHub Pages project URL
  // (https://<user>.github.io/<repo>/) without hardcoding the repo name.
  base: './',
})
