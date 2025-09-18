// global-setup.js
import { request } from '@playwright/test';

//arguably not currently used
export default async function globalSetup(config) {
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