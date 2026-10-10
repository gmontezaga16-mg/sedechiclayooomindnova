import { expect, test } from '@playwright/test'
import { iniciarSesion, irA } from './navegacion'

test.describe('Etapa 4 · Nova', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/nova')
    await iniciarSesion(page)
    await irA(page, 'Nova')
    await expect(page.getByRole('heading', { name: 'Nova' })).toBeVisible()
  })

  test('recomienda solo días que caben en el horario y enlaza a Actividades', async ({ page }) => {
    await page.getByLabel('Escribe tu mensaje').fill('Me gusta pintar y también el gym')
    await page.getByRole('button', { name: 'Enviar' }).click()

    const lista = page.getByRole('list', { name: 'Actividades recomendadas' }).first()
    await expect(lista.getByText('Días que encajan: Lunes, Jueves', { exact: true })).toBeVisible()
    await expect(lista.getByText('Días que encajan: Lunes, Martes, Miércoles, Jueves, Viernes', { exact: true })).toBeVisible()
    await expect(page.getByText(/Conflicto: Miércoles 15:00–17:00 se superpone con Trabajo/)).toBeVisible()

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
