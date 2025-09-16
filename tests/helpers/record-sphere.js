import { expect } from '@playwright/test'; 

export async function createEvent(page, task, org = 'Test Org', name = 'Test Event', status = 'completed') {
    await page.goto('/events', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1, name: /Events/i })).toBeVisible();

    await page.getByRole('button', { name: /Create a New Event/i }).click();

    // Fill fields
    await page.fill('#name', name);
    await page.fill('#description', 'This is a test.');
    await page.fill('#start', '2024-01-01');
    await page.fill('#end', '2024-12-31');
    await page.fill('#location', 'There');

    // Select organization
    await page.getByText('Choose a new item', { exact: true }).click();
    const orgOption = page.locator('div', { has: page.getByRole('heading', { name: org }) })
    await expect(orgOption).toBeVisible();
    await orgOption.locator('Select Organization').click();
    await page.getByRole('button', { name: /Done/i }).click();

    // Set status if not planned
    if (status !== 'planned') {
        await page.locator(`label[for="status__${status}"]`).click();
    }

    // Link task
    await page.locator('div', { has: page.getByRole('heading', { name: 'Linked to Tasks (Required)' }) })
            .getByRole('button', { name: 'Select' })
            .click();
    const taskOption = page.locator('div', { has: page.getByRole('heading', { name: task }) })
    await expect(taskOption).toBeVisible();
    await taskOption.locator('Select Task').click();
    await page.getByRole('button', { name: /Done/i }).click();

    // Submit
    await page.click('button[type=submit]');

    // Assert creation
    await expect(page.getByText(name)).toBeVisible();

    return { name, task, org, status };
}

export async function createCount(page, task, vals = ['10', '10', '10']) {
    // Assumes we are on a valid event page
    await page.getByLabel('Select a Task').selectOption({ label: task });

    // Expand dropdowns/selectors
    await page.locator(`label[for="sex"]`).click();
    await page.locator(`label[for="age_range"]`).click();

    // Fill values
    const inputs = page.locator('input[name^="count"]');
    for (let i = 0; i < vals.length; i++) {
        await inputs.nth(i).fill(vals[i]);
    }

    // Save
    await page.getByRole('button', { name: /Save/i }).click();

    // Assert success
    await expect(page.getByText(`Counts for ${task}`)).toBeVisible();

    return { task, values: vals };
}

export async function createSocialPost(page, task, name='Test Post'){
    await page.goto('/social', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1, name: /Posts/i })).toBeVisible();

    await page.getByRole('button', { name: /Record a New Post/i }).click();

    // Fill fields
    await page.fill('#name', name);
    await page.fill('#description', 'This is a test.');
    await page.fill('#published_at', '2024-02-01');

    // Link task
    await page.locator('div', { has: page.getByRole('heading', { name: "Post Associated with Task(s) (Required)" }) })
        .getByRole('button', { name: 'Select' })
        .click();
    const taskOption = page.getByRole('heading', { name: "Post Associated with Task(s) (Required)" })
    await expect(taskOption).toBeVisible();
    await taskOption.locator('Select Task').click();
    await page.getByRole('button', { name: /Done/i }).click();

    // Select platform
    await page.locator('div[aria-label="tiktok"]').click();

    // Submit
    await page.click('button[type=submit]');

    // Assert creation
    await expect(page.getByText(name)).toBeVisible();

    return { name, task, org, status };
}

export async function createRespondent(page, anon = false, id = '000010000', fName = 'Test', lName = 'Testersonne', sex='M') {
    await page.goto('/respondents');
    await expect(page.getByRole('heading', { name: 'Respondents' })).toBeVisible();

    // Handle dashboard button or consent modal
    const createButton = page.getByRole('button', { name: /Create New Respondent/i });
    if (await createButton.isVisible()) await createButton.click();
    await page.waitForURL(/\/respondents\/new/);

    const consentButton = page.getByRole('button', { name: /I understand/i });
    if (await consentButton.isVisible()) await consentButton.click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('New Respondent');

    // Fill form
    if (anon) {
        await page.locator('label[for="is_anonymous"]').click();
        await page.selectOption('select#age_range', { label: '20-24' });
    } 
    else {
        await page.fill('#id_no', id);
        await page.fill('#first_name', fName);
        await page.fill('#last_name', lName);
        await page.fill('#dob', '2000-01-01');
        await page.fill('#plot_no', '123 Place St.');
        await page.fill('#ward', 'Da Club');
        await page.fill('#email', 'person@website.com');
        await page.fill('#phone_number', '+267 71 234 567');
    }

    // Common fields
    const clickLabels = [
        `sex__${sex}`,
        'kp_status_names-PWID',
        'kp_status_names-LBQ',
        'disability_status_names-VI',
        'disability_status_names-HD',
        'special_attribute_names-community_leader',
        'special_attribute_names-CHW',
    ];

    for (const label of clickLabels) {
        await page.locator(`label[for="${label}"]`).click();
    }

    await page.fill('#village', 'Gaborone');
    await page.selectOption('select#district', { label: 'Greater Gaborone Area' });
    await page.selectOption('select#citizenship', { label: 'Botswana' });

    // Submit
    await page.click('button[type=submit]');

    await expect(
        page.getByRole('heading', { name: anon ? /Anonymous Respondent/i : `${fName}: ${lName}` })
    ).toBeVisible();

    return { anon, id, firstName: fName, lastName: lName };
}