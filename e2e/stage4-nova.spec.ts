import { expect, test } from '@playwright/test'

test.describe('Etapa 4 · Nova', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/nova')
    await page.getByRole('button', { name: 'Ingresar como estudiante' }).click()
    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Nova' }).click()
    await expect(page.getByRole('heading', { name: 'Nova' })).toBeVisible()
  })

  test('recomienda solo días que caben en el horario y enlaza a Actividades', async ({ page }) => {
    await page.getByLabel('Escribe tu mensaje').fill('Me gusta pintar y también el gym')
    await page.getByRole('button', { name: 'Enviar' }).click()

    const lista = page.getByRole('list', { name: 'Actividades recomendadas' }).first()
    await expect(lista.getByText('Días que encajan: Lunes, Jueves, Viernes').first()).toBeVisible()
    await expect(page.getByText(/Conflicto: Martes 14:00–16:00 se superpone con Interpretación/)).toBeVisible()

    await page.getByRole('link', { name: /Ver en Explorar actividades/ }).first().click()
    await expect(page).toHaveURL(/\/actividades$/)
    await expect(page.getByRole('heading', { name: 'Explorar actividades' })).toBeVisible()
  })

  test('no inventa talleres que no existen', async ({ page }) => {
    await page.getByLabel('Escribe tu mensaje').fill('Quiero hacer natación')
    await page.getByRole('button', { name: 'Enviar' }).click()
    await expect(page.getByText(/MINDNOVA no ofrece natación por ahora/)).toBeVisible()
    await expect(page.getByRole('list', { name: 'Actividades recomendadas' })).toHaveCount(0)
  })

  test('una crisis muestra la alerta con líneas de ayuda', async ({ page }) => {
    await page.getByLabel('Escribe tu mensaje').fill('A veces pienso en suicidarme')
    await page.getByRole('button', { name: 'Enviar' }).click()
    await expect(page.getByRole('alert')).toContainText('113')
  })
})
