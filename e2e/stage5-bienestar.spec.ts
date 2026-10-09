import { expect, test } from '@playwright/test'

test.describe('Etapa 5 · Bienestar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/bienestar')
    await page.getByRole('button', { name: 'Ingresar como estudiante' }).click()
    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Bienestar' }).click()
    await expect(page.getByRole('heading', { name: 'Bienestar', exact: true })).toBeVisible()
  })

  test('muestra el aviso, la Línea 113 opción 5 y las fuentes', async ({ page }) => {
    await expect(page.getByRole('note', { name: 'Aviso importante' })).toContainText('MINDNOVA no sustituye la atención profesional.')
    await expect(page.getByRole('link', { name: 'Llamar 113, opción 5' })).toHaveAttribute('href', 'tel:113')
    await expect(page.getByRole('link', { name: /Fuente:.*se abre en otra pestaña/ }).first()).toHaveAttribute('target', '_blank')
  })

  test('una cita que choca con clases no se puede enviar y una libre se registra como simulada', async ({ page }) => {
    await page.getByLabel('Día').selectOption('martes')
    await page.getByLabel('Hora de inicio (1 hora)').selectOption('14:00')
    await expect(page.getByRole('alert')).toContainText('Interpretación')
    await page.getByRole('checkbox', { name: /solicitud simulada/ }).check()
    await expect(page.getByRole('button', { name: 'Enviar solicitud simulada' })).toBeDisabled()

    await page.getByLabel('Hora de inicio (1 hora)').selectOption('10:00')
    await page.getByLabel('Día').selectOption('jueves')
    await page.getByRole('button', { name: 'Enviar solicitud simulada' }).click()
    await expect(page.getByRole('status')).toContainText('No se envió a ningún consultorio')

    await page.reload()
    await expect(page.getByText('Estado: simulada, no confirmada.')).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar solicitud simulada' }).click()
    await expect(page.getByRole('button', { name: 'Enviar solicitud simulada' })).toBeVisible()
  })
})
