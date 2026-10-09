import { expect, test } from '@playwright/test'

const DEMO_PASSWORD = 'MindNova2026'

test.describe('Etapa 1 · bienvenida e inicio de sesión', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('la portada carga con el título y el acceso institucional', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tu bienestar')
    await expect(page.getByRole('link', { name: /ingresar con correo institucional/i })).toBeVisible()
  })

  test('ruta protegida redirige al login y conserva el destino', async ({ page }) => {
    await page.goto('/inicio')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: /inicia sesión/i })).toBeVisible()
  })

  test('rechaza un correo fuera del dominio institucional', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Correo institucional').fill('persona@gmail.com')
    await page.getByLabel('Contraseña', { exact: true }).fill(DEMO_PASSWORD)
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await expect(page.getByRole('alert')).toContainText('@universidad-demo.edu')
  })

  test('inicia sesión, muestra el panel y cierra sesión', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /luis mendoza rojas/i }).click()
    await page.getByRole('button', { name: 'Ingresar' }).click()

    await expect(page).toHaveURL(/\/inicio$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Luis')
    await expect(page.getByText('Ingeniería de Sistemas')).toBeVisible()

    await page.getByRole('button', { name: /cerrar sesión/i }).click()
    await expect(page).toHaveURL(/\/$/)

    await page.goto('/inicio')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('la sesión sobrevive a una recarga', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /sofía vargas peña/i }).click()
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await expect(page).toHaveURL(/\/inicio$/)

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sofía')
  })
})
