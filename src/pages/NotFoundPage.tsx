import { Link } from 'react-router-dom'
import { buttonPrimary } from '../components/ui'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-4 text-center text-slate-100">
      <p className="text-sm font-semibold tracking-widest text-violet-300 uppercase">Error 404</p>
      <h1 className="text-3xl font-bold">Esta página no existe</h1>
      <Link to="/" className={buttonPrimary}>
        Volver al inicio
      </Link>
    </div>
  )
}
