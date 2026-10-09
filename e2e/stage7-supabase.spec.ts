import { expect, test } from '@playwright/test'

// Con credenciales públicas, la app lee el catálogo de Supabase. Sin ellas, usa la demostración local.
// Para la prueba con Supabase:
//   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npx playwright test e2e/stage7-supabase.spec.ts
const conSupabase = Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY)

test.describe('Etapa 7 · origen de datos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.getByRole('button', { name: 'Ingresar como estudiante' }).click()
  })

  test('sin credenciales, la app funciona en modo demo local', async ({ page }) => {
    test.skip(conSupabase, 'Esta prueba es para el modo sin credenciales')
    await expect(page.getByText('Datos: demostración local.')).toBeVisible()
    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Actividades' }).click()
    await expect(page.getByText('Mostrando 4 de 4 actividades')).toBeVisible()
  })

  test('con credenciales, el catálogo sale de Supabase y se muestra en solo lectura', async ({ page }) => {
    test.skip(!conSupabase, 'Requiere VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
    await expect(page.getByText('Datos: catálogo de Supabase (solo lectura).')).toBeVisible()
    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Actividades' }).click()
    await expect(page.getByText('Mostrando 4 de 4 actividades')).toBeVisible()
    await expect(page.getByRole('article', { name: 'Gym' })).toBeVisible()
  })
})
