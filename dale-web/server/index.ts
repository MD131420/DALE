// Production server: the built site (dist/) + API on one port.
//   npm run build && npm start
// Environment: PORT (8080), HOST (127.0.0.1), DALE_DATA_DIR (./data),
// DALE_TRUST_PROXY=1 behind nginx/Caddy, DALE_ORIGINS=https://dale.com,https://www.dale.com,
// DALE_INSECURE_COOKIES=1 only for testing the production build over plain http.
import path from 'node:path'
import { serve } from '@hono/node-server'
import { createApp } from './app.ts'

const root = path.resolve(import.meta.dirname, '..')
const { app } = createApp({
  dataDir: path.resolve(process.env.DALE_DATA_DIR ?? path.join(root, 'data')),
  distDir: path.join(root, 'dist'),
  production: true,
  secureCookies: process.env.DALE_INSECURE_COOKIES !== '1',
  trustProxy: process.env.DALE_TRUST_PROXY === '1',
  origins: process.env.DALE_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean),
})

const port = Number(process.env.PORT ?? 8080)
const hostname = process.env.HOST ?? '127.0.0.1'
serve({ fetch: app.fetch, port, hostname }, () => console.log(`DALE: http://${hostname}:${port}`))
