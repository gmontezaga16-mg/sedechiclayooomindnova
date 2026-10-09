export type Interes = 'arte' | 'gym' | 'musica' | 'voluntariado'

export interface StudentProfile {
  id: string
  nombre: string
  apellido: string
  codigo: string
  carrera: string
  ciclo: number
  intereses: Interes[]
  horasLibresSemana: number
}

export const INTERES_LABELS: Record<Interes, string> = {
  arte: 'Arte',
  gym: 'Gym',
  musica: 'Música',
  voluntariado: 'Voluntariado',
}

// Perfil ficticio para la demostración. No se conecta a sistemas universitarios.
export const DEMO_STUDENT: StudentProfile = {
  id: 'demo-sofia-gonzales',
  nombre: 'Sofía',
  apellido: 'Gonzales',
  codigo: '2025-90001',
  carrera: 'Diseño Gráfico',
  ciclo: 3,
  intereses: ['arte', 'musica'],
  horasLibresSemana: 5,
}
