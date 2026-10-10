import { Outlet } from 'react-router-dom'
import { origenDatos, type OrigenDatos } from '../services/catalogo'
import { Sidebar } from './Sidebar'

const ETIQUETA_ORIGEN: Record<OrigenDatos, string> = {
  'demo-local': 'demostración local',
  supabase: 'catálogo de Supabase (solo lectura)',
  'supabase-error': 'demostración local (no se pudo leer Supabase)',
}

export function AppShell() {
  return (
    <div className="min-h-screen bg-[#F5FAF9] font-['DM_Sans',system-ui,sans-serif] text-[#243D51] antialiased selection:bg-[#48AD9C]/30">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-8 lg:py-14">
          <Outlet />
        </div>
        <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-[#243D51]/65 sm:px-8">
          Datos: {ETIQUETA_ORIGEN[origenDatos()]}. Tus cambios se guardan solo en este navegador.
        </footer>
      </main>
    </div>
  )
}
