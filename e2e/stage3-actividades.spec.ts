import { expect, test } from '@playwright/test'

test.describe('Etapa 3 · Explorar actividades', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/actividades')
    await page.getByRole('button', { name: 'Ingresar como estudiante' }).click()
    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Actividades' }).click()
    await expect(page.getByRole('heading', { name: 'Explorar actividades' })).toBeVisible()
  })

  test('marca en verde las actividades compatibles y en rojo las que chocan', async ({ page }) => {
    await expect(page.getByRole('article', { name: 'Voluntariado' })).toHaveClass(/border-emerald-400/)
    await expect(page.getByRole('article', { name: 'Pintura' })).toHaveClass(/border-rose-400/)
    await expect(page.getByRole('article', { name: 'Gym' })).toHaveClass(/border-rose-400/)
    await expect(page.getByRole('article', { name: 'Música' })).toHaveClass(/border-rose-400/)
  })

  test('explica el conflicto y no deja agregar una actividad en rojo', async ({ page }) => {
    const gym = page.getByRole('article', { name: 'Gym' })
    await expect(gym.getByText('Martes 15:00–16:00 se superpone con Interpretación (14:00–16:00).')).toBeVisible()
    await expect(gym.getByRole('button', { name: 'AGREGAR' })).toBeDisabled()
  })

  test('agrega una actividad compatible, sobrevive a una recarga y aparece en Mi horario', async ({ page }) => {
    await page.getByRole('article', { name: 'Voluntariado' }).getByRole('button', { name: 'AGREGAR' }).click()
    await expect(page.getByRole('article', { name: 'Voluntariado' }).getByText('En tu horario')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('article', { name: 'Voluntariado' }).getByRole('button', { name: 'Agregada' })).toBeVisible()

    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Mi horario' }).click()
    await expect(page.getByRole('button', { name: /Editar Voluntariado, lunes de 10:00 a 12:00/ })).toBeVisible()
  })

  test('la búsqueda ignora tildes y el filtro de compatibles oculta las actividades en rojo', async ({ page }) => {
    await page.getByLabel('Buscar').fill('musica')
    await expect(page.getByRole('status')).toHaveText('Mostrando 1 de 4 actividades')
    await expect(page.getByRole('article', { name: 'Música' })).toBeVisible()

    await page.getByLabel('Buscar').fill('')
    await page.getByRole('checkbox', { name: /mostrar solo compatibles/i }).check()
    await expect(page.getByRole('article', { name: 'Voluntariado' })).toBeVisible()
    await expect(page.getByRole('article', { name: 'Gym' })).toHaveCount(0)
  })
})
