import { expect, test } from '@playwright/test'
import { abrirMenuSiHaceFalta, iniciarSesion, irA } from './navegacion'

test.describe('Etapa 1 · bienvenida y acceso', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('la bienvenida muestra MINDNOVA, el lema y el botón de ingreso', async ({ page }) => {
    await expect(page.getByText('MINDNOVA — bienestar estudiantil')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tu tiempo')
    await expect(page.getByRole('button', { name: 'Ingresar como estudiante' })).toBeVisible()
  })

  test('ruta protegida redirige al inicio de sesión', async ({ page }) => {
    await page.goto('/inicio')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: 'Ingresar', exact: true })).toBeVisible()
  })

  test('ingresa con la cuenta de prueba, navega y cierra sesión', async ({ page }) => {
    await iniciarSesion(page)

    await expect(page).toHaveURL(/\/inicio$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await irA(page, 'Mi horario')
    await expect(page).toHaveURL(/\/calendario$/)
    await expect(page.getByRole('heading', { name: 'Mi horario' })).toBeVisible()

    await abrirMenuSiHaceFalta(page)
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('la sesión sobrevive a una recarga', async ({ page }) => {
    await iniciarSesion(page)
    await expect(page).toHaveURL(/\/inicio$/)

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveURL(/\/inicio$/)
  })
})
