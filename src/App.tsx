import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/RouteGuards'
import { ActividadesPage } from './pages/ActividadesPage'
import { BienestarPage } from './pages/BienestarPage'
import { HomePage } from './pages/HomePage'
import { NovaPage } from './pages/NovaPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SchedulePage } from './pages/SchedulePage'
import { WelcomePage } from './pages/WelcomePage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/inicio" element={<HomePage />} />
            <Route path="/calendario" element={<SchedulePage />} />
            <Route path="/actividades" element={<ActividadesPage />} />
            <Route path="/nova" element={<NovaPage />} />
            <Route path="/bienestar" element={<BienestarPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}
