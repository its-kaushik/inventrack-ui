import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Sign in to your account')).toBeVisible()
  })

  test('login form has phone and password fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel(/phone/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/phone/i).fill('0000000000')
    await page.getByLabel(/password/i).fill('wrong')
    await page.getByRole('button', { name: /sign in/i }).click()
    // Should show error (either toast or inline)
    await expect(
      page.locator('[data-sonner-toast]').or(page.getByText(/invalid|error|failed/i)),
    ).toBeVisible({ timeout: 5000 })
  })
})
