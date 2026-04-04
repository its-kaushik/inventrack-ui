import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('unauthenticated user redirects to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('signup page is accessible', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByText(/create.*account/i)).toBeVisible()
  })
})
