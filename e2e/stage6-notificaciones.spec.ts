import { expect, test } from '@playwright/test'

test.describe('Etapa 6 · Notificaciones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/actividades')
    await page.getByRole('button', { name: 'Ingresar como estudiante' }).click()
    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Actividades' }).click()
    await expect(page.getByRole('heading', { name: 'Explorar actividades' })).toBeVisible()
  })

  test('un taller agregado aparece en Avisos y los recordatorios se pueden apagar', async ({ page }) => {
    await page.getByRole('article', { name: 'Voluntariado' }).getByRole('button', { name: 'AGREGAR' }).click()
    await expect(page.getByRole('article', { name: 'Voluntariado' }).getByText('En tu horario')).toBeVisible()

    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Avisos' }).click()
    await expect(page.getByRole('heading', { name: 'Notificaciones' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Próximos talleres' })).toContainText('Voluntariado')
    await expect(page.getByRole('region', { name: /Actividades seleccionadas/ })).toContainText('Voluntariado')
    await expect(page.getByText('MINDNOVA no envía notificaciones al móvil ni correos.')).toBeVisible()

    await page.getByRole('checkbox', { name: 'Mostrar recordatorios de talleres' }).uncheck()
    await expect(page.getByText(/Los recordatorios están desactivados/)).toBeVisible()

    await page.reload()
    await expect(page.getByText(/Los recordatorios están desactivados/)).toBeVisible()
  })
})
