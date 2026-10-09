export type Interes = 'arte' | 'gym' | 'musica' | 'voluntariado'

export interface StudentProfile {
  id: string
  nombre: string
  apellido: string
  correo: string
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

export const DEMO_PASSWORD = 'MindNova2026'

export const STUDENTS: StudentProfile[] = [
  {
    id: 'est-001',
    nombre: 'Ana',
    apellido: 'Torres Quispe',
    correo: 'ana.torres@universidad-demo.edu',
    codigo: '2024-10001',
    carrera: 'Psicología',
    ciclo: 4,
    intereses: ['arte', 'voluntariado'],
    horasLibresSemana: 6,
  },
  {
    id: 'est-002',
    nombre: 'Luis',
    apellido: 'Mendoza Rojas',
    correo: 'luis.mendoza@universidad-demo.edu',
    codigo: '2023-20417',
    carrera: 'Ingeniería de Sistemas',
    ciclo: 6,
    intereses: ['gym', 'musica'],
    horasLibresSemana: 9,
  },
  {
    id: 'est-003',
    nombre: 'Sofía',
    apellido: 'Vargas Peña',
    correo: 'sofia.vargas@universidad-demo.edu',
    codigo: '2025-30088',
    carrera: 'Diseño Gráfico',
    ciclo: 2,
    intereses: ['arte', 'musica'],
    horasLibresSemana: 4,
  },
]
