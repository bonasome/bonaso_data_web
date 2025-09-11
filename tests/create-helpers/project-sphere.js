import { expect } from '@playwright/test';

async function clickWhenVisible(locator) {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
}

async function fillWhenVisible(locator, value) {
    await locator.waitFor({ state: 'visible' });
    await locator.fill(value);
}

async function waitForText(page, text, options = {}) {
    const timeout = options.timeout || 30000;
    await page.waitForSelector(`text=${text}`, { timeout });
}


export async function createOrg(page, name = 'Test Org') {
    await page.goto('/organizations');
    await expect(page.getByRole('heading', { name: 'Organizations' })).toBeVisible();

    await clickWhenVisible(page.getByRole('button', { name: 'Add an Organization' }));
    await fillWhenVisible(page.locator('#name'), name);
    await clickWhenVisible(page.getByRole('button', { name: 'Save', exact: true }));

    await waitForText(page, name);
    await expect(page.getByRole('heading', { name })).toBeVisible();
    return name;
}

export async function createIndicator(page, code = 'T101', name = 'Test Indicator', type = 'respondent', numeric = false, subcats = true, prereq = '', matchSubcats = false, throwError = false) {
    await page.goto('/indicators');
    await expect(page.getByRole('heading', { name: /Indicators/i })).toBeVisible();
    await clickWhenVisible(page.getByRole('button', { name: 'Create a New Indicator' }));
    await expect(page.getByRole('heading', { name: 'New Indicator' })).toBeVisible();

    await fillWhenVisible(page.locator('#code'), throwError ? '' : code);
    await fillWhenVisible(page.locator('#name'), name);
    await fillWhenVisible(page.getByLabel('Description'), 'This is a test.');

    if (type !== 'respondent') {
        await clickWhenVisible(page.getByLabel(type, { exact: true }));
    }
    if (numeric) {
        await clickWhenVisible(page.locator(`label[for="require_numeric"]`));
    }

    if (subcats && !matchSubcats) {
        await clickWhenVisible(page.locator(`label[for="require_subcategories"]`));
        await fillWhenVisible(page.getByLabel('1.'), 'Category 1');
        const addRow = page.getByRole('button', { name: /Add Row/i });
        await clickWhenVisible(addRow);
        await fillWhenVisible(page.getByLabel('2.'), 'Category 2');
        await clickWhenVisible(addRow);
        await fillWhenVisible(page.getByLabel('3.'), throwError ? '' : 'Category 3');
    }

    if (prereq) {
        await clickWhenVisible(page.getByRole('button', { name: 'Select', exact: true }));
        await clickWhenVisible(
            page.locator('div', { has: page.getByRole('heading', { name: prereq }) })
                .getByRole('button', { name: 'Add Indicator' })
        );
        await clickWhenVisible(page.getByRole('button', { name: 'Done Selecting' }));

        if (matchSubcats) {
            await clickWhenVisible(page.locator('label', { hasText: 'T101: Test Indicator' }));
        }
    }

    await clickWhenVisible(page.getByRole('button', { name: 'Save', exact: true }));
    if(!throwError){
        await waitForText(page, `${code}: ${name}`);
        await expect(page.getByRole('heading', { name: `${code}: ${name}` })).toBeVisible();
    }

    return { code, name };
}


export async function createClient(page, name='Test Client') {
    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: /Clients/i })).toBeVisible();

    await clickWhenVisible(page.getByText('Create New Client', { exact: true }));
    await expect(page.getByText('Creating New Client')).toBeVisible();

    await fillWhenVisible(page.locator('#name'), name);
    await fillWhenVisible(page.locator('#description'), 'This is a test.');
    await clickWhenVisible(page.getByRole('button', { name: 'Save', exact: true }));
    
    await waitForText(page, name);
    await expect(page.getByRole('heading', { name })).toBeVisible();

    return { name };
}

export async function createProject(page, name = 'Test Project', status = 'Active', client = 'Test Client') {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { level: 1, name: /Projects/i })).toBeVisible();

    await clickWhenVisible(page.getByRole('button', { name: /Create New Project/i }));
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    await fillWhenVisible(page.locator('#name'), name);
    await fillWhenVisible(page.locator('#description'), 'This is a test.');
    await fillWhenVisible(page.locator('#start'), '2024-01-01');
    await fillWhenVisible(page.locator('#end'), '2024-12-31');
    await clickWhenVisible(page.locator(`label[for="status__${status}"]`));

    if (client) {
        await clickWhenVisible(page.getByText('Choose a new item', { exact: true }));
        await clickWhenVisible(
            page.locator('div', { has: page.getByRole('heading', { name: client }) })
                .getByRole('button', { name: 'Select a Client' })
        );
    }

    await clickWhenVisible(page.getByRole('button', { name: 'Save', exact: true }));
    await waitForText(page, name);
    await expect(page.getByRole('heading', { name })).toBeVisible();

    return { name, status, client };
}


export async function createProjectActivity(page, name='Test Activity', status='Active') {
    await clickWhenVisible(page.getByText('Activities', { exact: true }));
    await clickWhenVisible(page.locator('button[aria-label="newactivity"]'));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await fillWhenVisible(page.locator('#name'), name);
    await fillWhenVisible(page.locator('#description'), 'This is a test activity.');
    await fillWhenVisible(page.locator('#start'), '2024-02-01');
    await fillWhenVisible(page.locator('#end'), '2024-02-03');
    await clickWhenVisible(page.locator(`label[for="status__${status}"]`));
    await clickWhenVisible(page.locator(`label[for="category__general"]`));
    await clickWhenVisible(page.locator(`label[for="visible_to_all"]`));

    await clickWhenVisible(page.getByRole('button', { name: 'Save', exact: true }));
    await page.waitForURL(/\/projects\/\d+$/);

    await clickWhenVisible(page.getByText('Activities', { exact: true }));
    await expect(page.getByText(name)).toBeVisible();
}

export async function createProjectDeadline(page, name='Test Deadline', status='Active') {
    await clickWhenVisible(page.getByText('Deadlines', { exact: true }));
    await clickWhenVisible(page.locator('button[aria-label="newdeadline"]'));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await fillWhenVisible(page.locator('#name'), name);
    await fillWhenVisible(page.locator('#description'), 'This is a test activity.');
    await fillWhenVisible(page.locator('#deadline_date'), '2024-03-31');
    await clickWhenVisible(page.locator(`label[for="visible_to_all"]`));

    await clickWhenVisible(page.getByRole('button', { name: 'Save', exact: true }));
    await page.waitForURL(/\/projects\/\d+$/);

    await waitForText(page, 'Deadlines');
    await clickWhenVisible(page.getByText('Deadlines', { exact: true }));
    await waitForText(page, name);
    await expect(page.getByText(name)).toBeVisible();
}

export async function assignOrg(page, orgName='Test Org', projName='Test Project') {
    await page.getByText('Organizations', { exact: true }).click();
    await clickWhenVisible(page.getByText('Add Organization(s)'));

    await page.getByText('Select', { exact: true }).click();

    // Wait for org to appear before clicking
    await page.getByRole('heading', { name: orgName })
        .locator('..') // parent container
        .getByRole('button', { name: `Assign to ${projName}` })
        .click();

    await page.getByText('Done Selecting', { exact: true }).click();

    const confirmBtn = page.getByText(/Confirm Selection & Assign Organizations/i);
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    const link = page.getByRole('link', { name: orgName });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /\/projects\/\d+\/organizations\/\d+$/);
}

export async function createTask(page, indicator='T101: Test Indicator') {
    if ((await page.getByText('Search your tasks by name, organization, or project.').count()) === 0) {
        await clickWhenVisible(page.getByText('Tasks'));
    }
    await page.getByRole('button', { name: 'Assign New Task(s)' }).click();
    await expect(page.getByText(/Assigning tasks/i)).toBeVisible();

    await clickWhenVisible(page.getByText('Select', { exact: true }));
    await waitForText(page, indicator);
    await expect(page.getByText(indicator)).toBeVisible();

    await page.getByRole('heading', { name: indicator })
        .locator('..') // parent container
        .getByRole('button', { name: `Assign as Task` })
        .click();

    await clickWhenVisible(page.getByText('Done Selecting', { exact: true }));
    await clickWhenVisible(page.getByText(/Confirm Selection & Assign Tasks/i));
    await expect(page.getByText(/Successfully assigned 1 new tasks/i)).toBeVisible();

    return indicator;
}

export async function createTarget(page, task='T101: Test Indicator (Test Org, Test Project (for Test Client))', related = '') {
    if ((await page.getByText('Search for targets by indicator or project.').count()) === 0) {
        await clickWhenVisible(page.getByText('Targets'));
    }

// Click new target button
    await page.getByRole('button', { name: 'New Target' }).click();
    await page.waitForTimeout(200);
    // Wait for modal to appear
    const modal = page.locator('div[role="dialog"]:has-text("Choose a new item")');
    await modal.waitFor({ state: 'visible' });

    // Click 'Choose a new item'
    await modal.getByRole('button', { name: 'Choose a new item' }).click();

    // now wait for the task row to appear
    const taskRow = page.locator('div', {
        has: page.getByRole('heading', { name: /T101: Test Indicator/ })
    });

    // wait for the row to be visible
    await taskRow.waitFor({ state: 'visible' });

    // then click the button inside that row
    await clickWhenVisible(taskRow.getByRole('button', { name: 'Select Task' }));

    if (related) {
        await clickWhenVisible(page.locator('label[for="as_percentage"]'));
        await clickWhenVisible(page.getByText('Choose a new item', { exact: true }));
        await expect(page.getByText(related)).toBeVisible();
        await clickWhenVisible(
            page.locator('div', { has: page.getByRole('heading', { name: related }) })
                .getByRole('button', { name: 'Select Task' })
        );
        await fillWhenVisible(page.locator('#percentage_of_related'), '100');
    } else {
        await fillWhenVisible(page.locator('#amount'), '500');
    }

    await clickWhenVisible(page.locator('label[for="date_type__quarter"]'));
    await clickWhenVisible(page.locator('label[for="date_type__Q1 2024"]'));
    await clickWhenVisible(page.getByRole('button', { name: 'Save', exact: true }));
    await expect(page.getByText(task)).toBeVisible();

    return { task, related };
}

export async function assignSubgrantee(page, name='Test Org Jr.') {
    if ((await page.locator('button[aria-label="assignnewsubgrantee(s)"]').count()) === 0) {
        await clickWhenVisible(page.getByText('Subgrantees', { exact: true }));
    }

    await clickWhenVisible(page.getByText('Assign New Subgrantee(s)', { exact: true }));
    await expect(page.getByText(/Assigning subgrantees/i)).toBeVisible();

    await clickWhenVisible(page.getByText('Select', { exact: true }));
    await clickWhenVisible(page.getByText(/Add an Organization/));

    await expect(page.getByRole('heading', { name: 'New Organizations' })).toBeVisible();
    await fillWhenVisible(page.locator('#name'), name);
    await clickWhenVisible(page.getByRole('button', { name: 'Save', exact: true }));

    await expect(page.getByText(/Assigning subgrantees/i)).toBeVisible();
    await clickWhenVisible(page.getByText('Select', { exact: true }));
    await expect(page.getByText(name)).toBeVisible();
    await clickWhenVisible(
        page.locator('div', { has: page.getByRole('heading', { name }) })
            .getByRole('button', { name: 'Assign as Subgrantee' })
    );
    await clickWhenVisible(page.getByText('Done Selecting', { exact: true }));
    await clickWhenVisible(page.getByText(/Confirm Selection/i));
    await expect(page.getByText(/Successfully assigned 1 new subgrantees/i)).toBeVisible();

    return name;
}