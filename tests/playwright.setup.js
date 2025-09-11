import { test as base } from '@playwright/test';

export const test = base.extend({
  resetDB: async ({ request }, use) => {
    const response = await request.post('http://localhost:8000/api/tests/reset-db-DANGER/');
    if (!response.ok()) {
      throw new Error(`DB reset failed: ${response.status()} ${await response.text()}`);
    }
    console.log('test database reset...')
    await use(null);
  },

  authToken: async ({ page }, use) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'testpass123');
    await page.click('button[type=submit]');

    // Wait for either dashboard heading OR consent modal
    await page.waitForSelector('button:has-text("I understand")');

    // Handle consent modal if it appears
    const consentButton = page.getByRole('button', { name: /I understand/i });
    if (await consentButton.count() > 0) {
      await consentButton.click();
    }

    await use(page);
  }
});