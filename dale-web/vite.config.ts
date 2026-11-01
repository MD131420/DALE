import path from 'node:path'
import { getRequestListener } from '@hono/node-server'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/** Dev only: the API (server/app.ts) runs inside the Vite dev server, so `npm run dev` is one process. */
function daleApi(): Plugin {
  return {
    name: 'dale-api',
    apply: 'serve',
    async configureServer(server) {
      const { createApp } = await import('./server/app.ts')
      const { app } = createApp({ dataDir: path.resolve(process.env.DALE_DATA_DIR ?? path.join(process.cwd(), 'data')) })
      const listener = getRequestListener(app.fetch)
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        if (url.startsWith('/api/') || url.startsWith('/media/')) listener(req, res)
        else next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), daleApi()],
  server: { watch: { ignored: ['**/data/**'] } },
})
