import { expect, test } from '@playwright/test'

test.describe('Etapa 1 · bienvenida y acceso demostrativo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('la bienvenida muestra MINDNOVA, el lema y el botón de ingreso', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('MINDNOVA')
    await expect(page.getByText('Tu tiempo, tu espacio, tu bienestar')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ingresar como estudiante' })).toBeVisible()
  })

  test('ruta protegida redirige a la bienvenida', async ({ page }) => {
    await page.goto('/inicio')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: 'Ingresar como estudiante' })).toBeVisible()
  })

  test('ingresa como Sofía Gonzales, navega y cierra sesión', async ({ page }) => {
    await page.getByRole('button', { name: 'Ingresar como estudiante' }).click()

    await expect(page).toHaveURL(/\/inicio$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sofía')
    await expect(page.getByText('Diseño Gráfico')).toBeVisible()

    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Mi horario' }).click()
    await expect(page).toHaveURL(/\/calendario$/)
    await expect(page.getByRole('heading', { name: 'Mi horario' })).toBeVisible()

    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('la sesión sobrevive a una recarga', async ({ page }) => {
    await page.getByRole('button', { name: 'Ingresar como estudiante' }).click()
    await expect(page).toHaveURL(/\/inicio$/)

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sofía')
  })
})
