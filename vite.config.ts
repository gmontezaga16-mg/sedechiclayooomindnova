import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En desarrollo, Vite no ejecuta api/: este middleware sirve /api/nova con el mismo handler que Vercel.
function novaApiDev(): Plugin {
  return {
    name: 'nova-api-dev',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      process.env.GROQ_API_KEY = env.GROQ_API_KEY
      process.env.GROQ_MODEL = env.GROQ_MODEL
      server.middlewares.use('/api/nova', async (req, res) => {
        const { default: handler } = await server.ssrLoadModule('/api/nova.ts')
        const cuerpo = await new Promise<string>((resolver) => {
          let datos = ''
          req.on('data', (fragmento) => (datos += fragmento))
          req.on('end', () => resolver(datos))
        })
        const peticion = new Request(`http://localhost${req.url ?? ''}`, {
          method: req.method,
          headers: { 'Content-Type': 'application/json' },
          body: req.method === 'POST' ? cuerpo : undefined,
        })
        const respuesta: Response = await handler(peticion)
        res.statusCode = respuesta.status
        res.setHeader('Content-Type', 'application/json')
        res.end(await respuesta.text())
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), novaApiDev()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    // Las pruebas unitarias y de interfaz corren siempre en modo demo, aunque haya credenciales en .env.local.
    // Solo la prueba de integración con Supabase recibe las variables, y hay que pedirlo con MINDNOVA_INTEGRACION=1.
    env: process.env.MINDNOVA_INTEGRACION === '1' ? {} : { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
  },
})
