import { test } from './playwright.setup'; 
import { expect } from '@playwright/test'; 

test('respondent flow', async ({ authToken: page }) => {
    await page.goto('http://localhost:5173/respondents');
    await page.waitForSelector('h1');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Respondents');

    // Either dashboard button or consent modal
    const createButton = page.getByRole('button', { name: /Create New Respondent/i });
    const consentButton = page.getByRole('button', { name: /I understand/i });

    if (await createButton.isVisible()) {
        await createButton.click();
    }
    await page.waitForURL(/\/respondents\/new/);

    if (await consentButton.isVisible()) {
        await consentButton.click();
    }

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('New Respondent');

    // Fill form
    await page.fill('#id_no', `${new Date().toLocaleTimeString()}`);
    await page.fill('#first_name', '');
    await page.fill('#last_name', 'Testersonne');
    await page.fill('#dob', '2000-01-01');
    await page.locator('label[for="sex__M"]').click();
    await page.fill('#plot_no', '123 Place St.');
    await page.fill('#ward', 'Da Club');
    await page.fill('#village', 'Gaborone');
    await page.selectOption('select#district', { label: 'Greater Gaborone Area' });
    await page.selectOption('select#citizenship', { label: 'Botswana' });
    await page.locator('label[for="kp_status_names-PWID"]').click();
    await page.locator('label[for="kp_status_names-LBQ"]').click();
    await page.locator('label[for="disability_status_names-VI"]').click();
    await page.locator('label[for="disability_status_names-HD"]').click();
    await page.locator('label[for="special_attribute_names-community_leader"]').click();
    await page.locator('label[for="special_attribute_names-CHW"]').click();
    await page.fill('#email', 'person@website.com');
    await page.fill('#phone_number', '+267 71 234 567');
    await page.click('button[type=submit]');

    // Expect validation
    await expect(page.getByRole('listitem')).toHaveText('Required');

    // Fix first name
    await page.fill('#first_name', 'Test');
    await page.click('button[type=submit]'),

    await page.waitForURL(/\/respondents\/\d+$/),
    await page.waitForSelector('h1');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Test Testersonne');

    // Open Key Population dropdown
    await page.getByText('Key Population Status', { exact: true }).click();
    await expect(page.getByText('Lesbian Bisexual or Queer', { exact: true })).toBeVisible();
    await expect(page.getByText('People Who Inject Drugs', { exact: true })).toBeVisible();

    // Open Disability dropdown
    await page.getByText('Disability Status', { exact: true }).click();
    await expect(page.getByText('Visually Impaired', { exact: true })).toBeVisible();
    await expect(page.getByText('Hearing Impaired', { exact: true })).toBeVisible();
    
    // Edit HIV Status
    await page.getByText('HIV Status CONFIDENTIAL', { exact: true }).click();
    await expect(page.getByText('HIV Negative')).toBeVisible();
    await page.locator('button[aria-label="edithivstatus"]').click();
    await page.locator('label[for="hiv_positive"]').click();
    await page.fill('#date_positive', '2024-01-01');
    await page.locator('button[aria-label="save"]').click();
    await expect(page.getByText(/HIV Positive Since January 1, 2024/i)).toBeVisible();

    // Edit Pregnancy Status
    await page.getByText('Pregnancy Information', { exact: true }).click();
    await expect(page.getByText('No recorded pregnancies.')).toBeVisible();
    await page.locator('button[aria-label="recordnewpregnancy"]').click();
    await page.fill('#term_began', '2024-01-01');
    await page.fill('#term_ended', '2024-09-01');
    await page.locator('button[aria-label="save"]').click();
    await expect(page.getByText(/Pregnant from January 1, 2024 to September 1, 2024/i)).toBeVisible();
});