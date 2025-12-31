import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

// Plugin to preserve menu.json in dist during builds
const preserveMenuPlugin = () => {
  let savedMenu = null
  return {
    name: 'preserve-menu',
    configResolved() {
      // Save menu.json before Vite clears dist directory
      const menuPath = join(process.cwd(), 'dist', 'menu.json')
      if (existsSync(menuPath)) {
        savedMenu = readFileSync(menuPath, 'utf-8')
      }
    },
    writeBundle() {
      // Restore menu.json after all files are written
      if (savedMenu) {
        const menuPath = join(process.cwd(), 'dist', 'menu.json')
        writeFileSync(menuPath, savedMenu, 'utf-8')
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), preserveMenuPlugin()],
})
