// global-setup.js
import { request } from '@playwright/test';

export default async function globalSetup(config) {
  // reset DB once
  const context = await request.newContext();
  const response = await context.post('http://localhost:8000/api/tests/reset-db-DANGER/');
  if (!response.ok()) {
    throw new Error(`DB reset failed: ${response.status()} ${await response.text()}`);
  }
  console.log('✅ test database reset...');

  // login once and save auth state
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:5173/login');
  await page.fill('#username', 'admin');
  await page.fill('#password', 'testpass123');
  await page.click('button[type=submit]');

  // wait for consent modal or dashboard
  const consentButton = page.getByRole('button', { name: /I understand/i });
  if (await consentButton.count() > 0) {
    await consentButton.click();
  }

  // save storage state for reuse
  await page.context().storageState({ path: 'storageState.json' });
  await browser.close();
}