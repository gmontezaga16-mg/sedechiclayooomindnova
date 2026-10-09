import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
