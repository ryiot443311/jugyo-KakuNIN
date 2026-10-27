import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// 配信するページに付ける Content-Security-Policy（自分のファイルと data: 画像以外は読み込まない）
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

// 本番ビルドだけの処理: CSP の追加と、Service Worker への「ビルド番号」「保存するファイル一覧」の書き込み
function productionExtras() {
  let outDir = 'dist'
  return {
    name: 'production-extras',
    apply: 'build',
    configResolved(config) { outDir = path.resolve(config.root, config.build.outDir) },
    transformIndexHtml: {
      order: 'post',
      handler: (html) => html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />\n    <meta name="referrer" content="no-referrer" />`),
    },
    closeBundle() {
      const swPath = path.join(outDir, 'sw.js')
      if (!fs.existsSync(swPath)) return
      const files = fs.readdirSync(outDir, { recursive: true, withFileTypes: true })
        .filter((e) => e.isFile() && !e.name.startsWith('.') && e.name !== 'sw.js')
        .map((e) => path.relative(outDir, path.join(e.parentPath, e.name)).split(path.sep).join('/'))
      const sw = fs.readFileSync(swPath, 'utf8')
        .replace('__BUILD_ID__', Date.now().toString(36))
        .replace('/*__PRECACHE__*/ []', JSON.stringify(['./', ...files]))
      fs.writeFileSync(swPath, sw)
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), productionExtras()],
  build: { reportCompressedSize: false },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
  server: {
    // 既定では自分の端末からだけ開ける。スマホなど別の端末から開くときは EXPOSE_LAN=1 npm run dev
    host: process.env.EXPOSE_LAN === '1',
    port: 5173,
  },
  preview: {
    host: process.env.EXPOSE_LAN === '1',
    port: 5173,
  },
})
