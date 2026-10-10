import { expect, test } from '@playwright/test'
import { iniciarSesion, irA } from './navegacion'

test.describe('Etapa 3 · Explorar actividades', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/actividades')
    await iniciarSesion(page)
    await irA(page, 'Actividades')
    await expect(page.getByRole('heading', { name: 'Explorar actividades' })).toBeVisible()
  })

  test('marca como compatibles las actividades que caben y como conflicto las que chocan', async ({ page }) => {
    await expect(page.getByRole('article', { name: 'Guitarra' })).toHaveAttribute('data-estado', 'compatible')
    await expect(page.getByRole('article', { name: 'Pintura' })).toHaveAttribute('data-estado', 'compatible')
    await expect(page.getByRole('article', { name: 'Karate' })).toHaveAttribute('data-estado', 'conflicto')
  })

  test('explica el conflicto y no deja agregar una actividad en rojo', async ({ page }) => {
    const karate = page.getByRole('article', { name: 'Karate' })
    await expect(karate.getByText('Miércoles 15:00–17:00 se superpone con Trabajo (15:00–18:00).')).toBeVisible()
    await expect(karate.getByRole('button', { name: 'AGREGAR' })).toBeDisabled()
  })

  test('agrega una actividad compatible, sobrevive a una recarga y aparece en Mi horario', async ({ page }) => {
    await page.getByRole('article', { name: 'Guitarra' }).getByRole('button', { name: 'AGREGAR' }).click()
    await expect(page.getByRole('article', { name: 'Guitarra' }).getByText('En tu horario')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('article', { name: 'Guitarra' }).getByRole('button', { name: 'Agregada' })).toBeVisible()

    await irA(page, 'Mi horario')
    await expect(page.getByRole('button', { name: /Editar Guitarra, lunes de 13:00 a 15:00/ })).toBeVisible()
  })

  test('la búsqueda ignora tildes y el filtro de compatibles oculta las actividades en rojo', async ({ page }) => {
    await page.getByLabel('Buscar').fill('musica')
    await expect(page.getByRole('status')).toHaveText('Mostrando 3 de 10 actividades')
    await expect(page.getByRole('article', { name: 'Guitarra' })).toBeVisible()

    await page.getByLabel('Buscar').fill('')
    await page.getByRole('checkbox', { name: /mostrar solo compatibles/i }).check()
    await expect(page.getByRole('article', { name: 'Guitarra' })).toBeVisible()
    await expect(page.getByRole('article', { name: 'Karate' })).toHaveCount(0)
  })

  test('elige los días de una actividad y solo se agregan esos', async ({ page }) => {
    const guitarra = page.getByRole('article', { name: 'Guitarra' })
    await guitarra.getByRole('button', { name: 'Viernes' }).click()
    await guitarra.getByRole('button', { name: 'AGREGAR' }).click()
    await expect(guitarra.getByRole('button', { name: 'Agregada' })).toBeVisible()

    await irA(page, 'Mi horario')
    await expect(page.getByRole('button', { name: /Editar Guitarra, lunes de 13:00 a 15:00/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Editar Guitarra, viernes/ })).toHaveCount(0)
  })
})
