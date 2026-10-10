import { expect, test } from '@playwright/test'
import { iniciarSesion, irA } from './navegacion'

test.describe('Etapa 2 · Mi horario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/calendario')
    await iniciarSesion(page)
    await irA(page, 'Mi horario')
    await expect(page.getByRole('heading', { name: 'Mi horario' })).toBeVisible()
  })

  test('clasifica las clases de ejemplo y los compromisos por categoría', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Editar Tipografía, lunes/ })).toHaveAttribute('data-categoria', 'clase')
    await expect(page.getByRole('button', { name: /Editar Ilustración digital, martes/ })).toHaveAttribute('data-categoria', 'clase')
    await expect(page.getByRole('button', { name: /Editar Trabajo, miércoles/ })).toHaveAttribute('data-categoria', 'laboral')
    await expect(page.getByRole('button', { name: /Editar Compromiso familiar, viernes/ })).toHaveAttribute('data-categoria', 'familiar')
  })

  test('añade, edita y elimina un compromiso, y el cambio sobrevive a una recarga', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo compromiso' }).click()
    const dialogo = page.getByRole('dialog')
    await dialogo.getByLabel('Título').fill('Gimnasio')
    await dialogo.getByLabel('Día').selectOption('jueves')
    await dialogo.getByLabel('Inicio').fill('18:00')
    await dialogo.getByLabel('Fin').fill('19:00')
    await dialogo.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByRole('button', { name: /Editar Gimnasio, jueves de 18:00 a 19:00/ })).toBeVisible()

    await page.getByRole('button', { name: /Editar Gimnasio/ }).click()
    await page.getByRole('dialog').getByLabel('Título').fill('Gimnasio con amigos')
    await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByRole('button', { name: /Editar Gimnasio con amigos/ })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('button', { name: /Editar Gimnasio con amigos/ })).toBeVisible()

    await page.getByRole('button', { name: /Editar Gimnasio con amigos/ }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()
    await expect(page.getByRole('button', { name: /Gimnasio/ })).toHaveCount(0)
  })

  test('los espacios libres se pueden configurar', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Espacio libre lunes de 07:00 a 08:00/ })).toBeVisible()
    await page.getByLabel('Espacio libre mínimo').selectOption('120')
    await expect(page.getByRole('button', { name: /Espacio libre lunes de 07:00 a 08:00/ })).toHaveCount(0)

    await page.getByRole('checkbox', { name: /mostrar espacios libres/i }).uncheck()
    await expect(page.getByRole('button', { name: /Espacio libre/ })).toHaveCount(0)
  })
})
