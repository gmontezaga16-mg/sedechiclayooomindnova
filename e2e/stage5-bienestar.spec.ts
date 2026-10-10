import { expect, test } from '@playwright/test'
import { iniciarSesion, irA } from './navegacion'

test.describe('Etapa 5 · Bienestar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/bienestar')
    await iniciarSesion(page)
    await irA(page, 'Bienestar')
    await expect(page.getByRole('heading', { name: 'Bienestar', exact: true })).toBeVisible()
  })

  test('muestra el aviso, la Línea 113 opción 5 y las fuentes', async ({ page }) => {
    await expect(page.getByRole('note', { name: 'Aviso importante' })).toContainText('MINDNOVA no sustituye la atención profesional.')
    await expect(page.getByRole('link', { name: 'Llamar 113, opción 5' })).toHaveAttribute('href', 'tel:113')
    await expect(page.getByRole('link', { name: /Fuente:.*se abre en otra pestaña/ }).first()).toHaveAttribute('target', '_blank')
  })

  test('un choque con clases solo avisa, y la cita demostrativa se agenda y cancela', async ({ page }) => {
    await page.getByLabel('Día').selectOption('martes')
    await page.getByLabel('Hora de inicio (50 minutos)').selectOption('14:00')
    await expect(page.getByRole('alert')).toContainText('Ilustración digital')
    await page.getByRole('checkbox', { name: /cita demostrativa/ }).check()
    await expect(page.getByRole('button', { name: 'Agendar cita demostrativa' })).toBeEnabled()

    await page.getByLabel('Día').selectOption('lunes')
    await page.getByLabel('Hora de inicio (50 minutos)').selectOption('12:00')
    await page.getByRole('button', { name: 'Agendar cita demostrativa' }).click()
    await expect(page.getByRole('status')).toContainText('No se envió a ningún consultorio')

    await page.reload()
    await expect(page.getByText('Lunes, 12:00–12:50 · Presencial')).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar cita del lunes a las 12:00' }).click()
    await expect(page.getByText('Aún no tienes citas demostrativas agendadas.')).toBeVisible()
  })
})
