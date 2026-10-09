import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ACTIVIDADES } from './actividades'
import { EVENTOS_INICIALES } from './horario'
import { DEMO_STUDENT } from './students'

const raiz = join(__dirname, '..', '..')
const leer = (ruta: string) => readFileSync(join(raiz, ruta), 'utf8')

const migracion = leer('supabase/migrations/20261009120000_mindnova_esquema.sql')
const seed = leer('supabase/seed.sql')

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre)
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta]
  })
}

describe('seed.sql coincide con los datos de la app', () => {
  it.each(ACTIVIDADES)('contiene la actividad $titulo con sus horas y lugar', (a) => {
    expect(seed).toContain(`'${a.id}'`)
    expect(seed).toContain(`'${a.titulo}'`)
    expect(seed).toContain(`'${a.lugar}'`)
    expect(seed).toContain(`'${a.inicio}', '${a.fin}'`)
  })

  it.each(EVENTOS_INICIALES)('contiene el compromiso $titulo de demostración', (e) => {
    expect(seed).toContain(`'${e.id}', 'demo-sofia-gonzales', '${e.titulo}', '${e.dia}', '${e.inicio}', '${e.fin}', '${e.categoria}'`)
  })

  it('el estudiante de demostración tiene el mismo identificador que la app', () => {
    expect(seed).toContain(`'${DEMO_STUDENT.id}'`)
  })
})

describe('migración: RLS y permisos', () => {
  it('activa RLS en todas las tablas del esquema', () => {
    for (const tabla of ['catalogo_actividades', 'estudiantes_demo', 'eventos_demo', 'eventos_personales']) {
      expect(migracion).toContain(`alter table public.${tabla} enable row level security`)
    }
  })

  it('ninguna política permite escribir a anon', () => {
    const politicasDeEscritura = migracion.match(/create policy[\s\S]*?;/g) ?? []
    politicasDeEscritura
      .filter((p) => /for (insert|update|delete)/.test(p))
      .forEach((p) => expect(p).not.toMatch(/to[^;]*anon/))
  })

  it('el catálogo no tiene políticas de escritura', () => {
    const politicasCatalogo = (migracion.match(/create policy[\s\S]*?;/g) ?? []).filter((p) =>
      p.includes('public.catalogo_actividades'),
    )
    expect(politicasCatalogo).toHaveLength(1)
    expect(politicasCatalogo[0]).toContain('for select')
  })

  it('los cambios personales solo se leen y escriben con auth.uid()', () => {
    const personales = (migracion.match(/create policy[\s\S]*?;/g) ?? []).filter((p) =>
      p.includes('public.eventos_personales'),
    )
    expect(personales.length).toBeGreaterThanOrEqual(4)
    personales.forEach((p) => expect(p).toContain('auth.uid()'))
  })

  it('las pruebas RLS existen en la carpeta supabase/tests', () => {
    expect(leer('supabase/tests/politicas_rls.sql')).toContain('rollback;')
  })
})

describe('secretos', () => {
  it('ningún archivo de src usa una variable de clave de servicio', () => {
    const codigo = archivos(join(raiz, 'src'))
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .map((f) => readFileSync(f, 'utf8'))
    codigo.forEach((c) => expect(c).not.toMatch(/VITE_[A-Z_]*(SERVICE|SECRET)/))
  })

  it('.env.example no trae valores escritos para las claves', () => {
    const env = leer('.env.example')
    expect(env).toMatch(/^VITE_SUPABASE_ANON_KEY=\s*$/m)
    expect(env).toMatch(/^VITE_SUPABASE_URL=\s*$/m)
    expect(env).toMatch(/^ANTHROPIC_API_KEY=\s*$/m)
    // Los comentarios pueden mencionar formatos de clave; lo que no puede haber es un valor real.
    const valores = env.split('\n').filter((l) => !l.startsWith('#') && l.includes('='))
    valores.forEach((l) => expect(l).not.toMatch(/eyJ|sb_secret_|sb_publishable_/))
  })
})
