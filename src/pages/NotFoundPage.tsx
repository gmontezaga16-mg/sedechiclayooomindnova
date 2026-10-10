import { Link } from 'react-router-dom'
import { buttonPrimary } from '../components/ui'

const SERIF = "font-['Fraunces',Georgia,serif]"

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F5FAF9] px-4 text-center font-['DM_Sans',system-ui,sans-serif] text-[#243D51]">
      <p className="text-sm font-semibold tracking-widest text-[#2E7D70] uppercase">Error 404</p>
      <h1 className={`${SERIF} text-4xl font-medium tracking-tight`}>Esta página no existe</h1>
      <Link to="/" className={buttonPrimary}>
        Volver al inicio
      </Link>
    </div>
  )
}
