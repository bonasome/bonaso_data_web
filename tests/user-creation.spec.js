import { test } from './playwright.setup';
import { expect } from '@playwright/test';
import { resetDB } from './helpers/helpers';


test('create a user', async({ authPage: page, resetDB }) => {
    //test general user creation/activation
    await page.goto('/profiles');
    //go to user page
    await expect(page.getByRole('heading', { name: /Users/i })).toBeVisible();
    //click the add user buttom
    await page.getByRole('button', { name: /Add New Team Member/i }).click();
    //should be on create page
    await expect(page.getByRole('heading', { name: 'New User' })).toBeVisible();
    //fill out the form
    await page.locator('#username').fill('Test Event Create');
    await page.locator('#password').fill('testpass123');
    await page.locator('#confirm_password').fill('poop'); //uh-oh, our passwords don't match
    await page.locator('#first_name').fill('Beezer Twelve');
    await page.locator('#last_name').fill('Washingbeard');
    //click through admin/meofficer/manager roles and confirm they show warnings
    await page.locator(`label[for="role__meofficer"]`).click();
    await expect(page.getByText(/You are about to make this user a Monitoring and Evaluation Officer/i)).toBeVisible();
    await page.locator(`label[for="role__manager"]`).click();
    await expect(page.getByText(/You are about to make this user a Manager/i)).toBeVisible();
    await page.locator(`label[for="role__admin"]`).click();
    await expect(page.getByText(/You are about to make this user an admin/i)).toBeVisible();
    //choose their org
    await page.getByRole('button', { name: 'Choose a new Organization'}).click();
    await page.getByRole('button', { name: 'Select Parent Org' }).click();
    //try saving
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    //make sure a warning appears that our passwords don't match
    await expect(page.getByText('Passwords do not match')).toBeVisible();
    await page.locator('#confirm_password').fill('testpass123'); //fix it
    await page.getByRole('button', { name: 'Save', exact: true }).click(); //try again
    //should be on the detail page
    await expect(page.getByRole('heading', { name: 'Beezer Twelve Washingbeard' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('User is inactive')).toBeVisible(); //users should be inactive by default
    await page.locator('button[aria-label="activateuser"]').click(); //try activating them
    await expect(page.getByText('User is inactive')).not.toBeVisible(); //now they should be active
});

