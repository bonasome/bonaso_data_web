import { test as base } from '@playwright/test';
/*
Helper functions that run before playwright tests
*/
export const test = base.extend({
  /*
  Resets the database and prepopulates some basse context information before a test (for a clean slate)
  Will only work assuming a local dev server is launched with --settings=bonaso_data_server.test_settings 
  and a local DB entitled bonaso_test_db is present.
  */
  resetDB: async ({ request }, use) => {
    const response = await request.post('http://localhost:8000/api/tests/reset-db-DANGER/');
    if (!response.ok()) {
      throw new Error(`DB reset failed: ${response.status()} ${await response.text()}`);
    }
    console.log('test database reset...')
    await use(null);
  },

  authPage: async ({ page }, use, testInfo) => {
    /*
    Navigates the login page and ensures the user is logged in when starting the test.
    */
    const username = testInfo.project.metadata?.user || 'admin';
    const password = testInfo.project.metadata?.password || 'testpass123';

    await page.goto('http://localhost:5173/login');
    await page.fill('#username', username);
    await page.fill('#password', password);
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