import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DatosProvider } from './components/DatosProvider'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/RouteGuards'
import { ActividadesPage } from './pages/ActividadesPage'
import { BienestarPage } from './pages/BienestarPage'
import { HomePage } from './pages/HomePage'
import { JuegosPage } from './pages/JuegosPage'
import { LoginPage } from './pages/LoginPage'
import { NotificacionesPage } from './pages/NotificacionesPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { NovaPage } from './pages/NovaPage'
import { RegistroPage } from './pages/RegistroPage'
import { SchedulePage } from './pages/SchedulePage'
import { WelcomePage } from './pages/WelcomePage'

export default function App() {
  return (
    <DatosProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/inicio" element={<HomePage />} />
              <Route path="/calendario" element={<SchedulePage />} />
              <Route path="/actividades" element={<ActividadesPage />} />
              <Route path="/nova" element={<NovaPage />} />
              <Route path="/bienestar" element={<BienestarPage />} />
              <Route path="/juegos" element={<JuegosPage />} />
              <Route path="/notificaciones" element={<NotificacionesPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </DatosProvider>
  )
}
