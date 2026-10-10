import { Bell, CalendarDays, Gamepad2, HeartHandshake, Home, Palette, Sparkles, type LucideIcon } from 'lucide-react'

export const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/inicio', label: 'Inicio', icon: Home },
  { to: '/calendario', label: 'Mi horario', icon: CalendarDays },
  { to: '/actividades', label: 'Actividades', icon: Palette },
  { to: '/nova', label: 'Nova', icon: Sparkles },
  { to: '/bienestar', label: 'Bienestar', icon: HeartHandshake },
  { to: '/juegos', label: 'Juegos', icon: Gamepad2 },
  { to: '/notificaciones', label: 'Avisos', icon: Bell },
]
