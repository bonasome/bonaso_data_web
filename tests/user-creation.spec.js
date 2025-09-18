import { test } from './playwright.setup';
import { expect } from '@playwright/test';
import { resetDB } from './helpers/helpers';


test('create a user', async({ authPage: page, resetDB }) => {
    await page.goto('/profiles');
    await expect(page.getByRole('heading', { name: /Users/i })).toBeVisible();

    await page.getByRole('button', { name: /Add New Team Member/i }).click();
    await expect(page.getByRole('heading', { name: 'New User' })).toBeVisible();

    await page.locator('#username').fill('Test Event Create');
    await page.locator('#password').fill('testpass123');
    await page.locator('#confirm_password').fill('poop');
    await page.locator('#first_name').fill('Beezer Twelve');
    await page.locator('#last_name').fill('Washingbeard');
    await page.locator(`label[for="role__meofficer"]`).click();
    await expect(page.getByText(/You are about to make this user a Monitoring and Evaluation Officer/i)).toBeVisible();
    await page.locator(`label[for="role__manager"]`).click();
    await expect(page.getByText(/You are about to make this user a Manager/i)).toBeVisible();
    await page.locator(`label[for="role__admin"]`).click();
    await expect(page.getByText(/You are about to make this user an admin/i)).toBeVisible();

    await page.getByRole('button', { name: 'Choose a new Organization'}).click();
    await page.getByRole('button', { name: 'Select Parent Org' }).click();

    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
    await page.locator('#confirm_password').fill('testpass123');
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Beezer Twelve Washingbeard' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('User is inactive')).toBeVisible();
    await page.locator('button[aria-label="activateuser"]').click();
    await expect(page.getByText('User is inactive')).not.toBeVisible();
});

