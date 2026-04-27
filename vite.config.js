import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // スマホなどの別端末からアクセス可能にする設定
    port: 5173
  }
})
