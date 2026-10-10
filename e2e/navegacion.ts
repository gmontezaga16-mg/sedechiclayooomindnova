import { expect, type Page } from '@playwright/test'

export async function abrirMenuSiHaceFalta(page: Page) {
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeAttached()
  const boton = page.getByRole('button', { name: 'Abrir menú' })
  if (await boton.isVisible()) await boton.click()
}

export async function iniciarSesion(page: Page) {
  const correo = process.env.E2E_CORREO
  const clave = process.env.E2E_CLAVE
  if (!correo || !clave) {
    throw new Error('Define E2E_CORREO y E2E_CLAVE con una cuenta institucional de prueba.')
  }
  await page.goto('/login')
  await page.getByLabel('Correo institucional').fill(correo)
  await page.getByLabel('Contraseña').fill(clave)
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
}

export async function irA(page: Page, destino: string) {
  await abrirMenuSiHaceFalta(page)
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: destino }).click()
}
