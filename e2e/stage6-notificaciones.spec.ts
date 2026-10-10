import { expect, test } from '@playwright/test'
import { iniciarSesion, irA } from './navegacion'

test.describe('Etapa 6 · Notificaciones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/actividades')
    await iniciarSesion(page)
    await irA(page, 'Actividades')
    await expect(page.getByRole('heading', { name: 'Explorar actividades' })).toBeVisible()
  })

  test('un taller agregado aparece en Avisos y los recordatorios se pueden apagar', async ({ page }) => {
    await page.getByRole('article', { name: 'Guitarra' }).getByRole('button', { name: 'AGREGAR' }).click()
    await expect(page.getByRole('article', { name: 'Guitarra' }).getByText('En tu horario')).toBeVisible()

    await irA(page, 'Avisos')
    await expect(page.getByRole('heading', { name: 'Notificaciones' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Próximos talleres' })).toContainText('Guitarra')
    await expect(page.getByRole('region', { name: /Actividades seleccionadas/ })).toContainText('Guitarra')
    await expect(page.getByText('MINDNOVA no envía notificaciones al móvil ni correos.')).toBeVisible()

    await page.getByRole('checkbox', { name: 'Mostrar recordatorios de talleres' }).uncheck()
    await expect(page.getByText(/Los recordatorios están desactivados/)).toBeVisible()

    await page.reload()
    await expect(page.getByText(/Los recordatorios están desactivados/)).toBeVisible()
  })
})
