import { expect, test } from '@playwright/test'

test.describe('Etapa 2 · Mi horario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/calendario')
    await page.getByRole('button', { name: 'Ingresar como estudiante' }).click()
    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Mi horario' }).click()
    await expect(page.getByRole('heading', { name: 'Mi horario' })).toBeVisible()
  })

  test('muestra las clases de ejemplo en azul y los compromisos en lavanda', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Editar Inglés, lunes/ })).toHaveClass(/bg-blue-500/)
    await expect(page.getByRole('button', { name: /Editar Interpretación, martes/ })).toHaveClass(/bg-blue-500/)
    await expect(page.getByRole('button', { name: /Editar Trabajo, miércoles/ })).toHaveClass(/bg-violet-300/)
    await expect(page.getByRole('button', { name: /Editar Compromiso familiar, viernes/ })).toHaveClass(/bg-violet-300/)
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
