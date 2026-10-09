import { useEffect, useState, type ReactNode } from 'react'
import { cargarDatosRemotos } from '../services/catalogo'
import { supabaseConfigurado } from '../services/supabase'

// Sin credenciales de Supabase la app arranca al instante con la demostración local.
// Con credenciales, espera a la lectura remota (acotada en el tiempo por cargarDatosRemotos) para que las
// funciones síncronas ya vean el catálogo y el horario de Supabase.
export function DatosProvider({ children }: { children: ReactNode }) {
  const [listo, setListo] = useState(() => !supabaseConfigurado())

  useEffect(() => {
    if (!supabaseConfigurado()) return
    let activo = true
    cargarDatosRemotos().finally(() => {
      if (activo) setListo(true)
    })
    return () => {
      activo = false
    }
  }, [])

  if (!listo) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Cargando MINDNOVA…
      </div>
    )
  }
  return <>{children}</>
}
