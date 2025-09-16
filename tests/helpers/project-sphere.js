import { expect } from '@playwright/test';

async function clickWhenVisible(locator) {
    await locator.waitFor({ state: 'visible', timeout: 30000 });
    await locator.click();
}

async function fillWhenVisible(locator, value) {
    await locator.fill(value, { timeout: 30000 });
}


export async function createOrg(page, name = 'Test Org') {
    await page.goto('/organizations');
    await expect(page.getByRole('heading', { name: 'Organizations' })).toBeVisible();

    await clickWhenVisible(page.getByRole('button', { name: 'Add an Organization' }));
    await fillWhenVisible(page.locator('#name'), name);
    await clickWhenVisible(page.getByRole('button', { name: 'Save', exact: true }));

    await expect(page.getByRole('heading', { name })).toBeVisible();
    console.log('Organization created.');
    const url = page.url();
    const id = url.match(/\/organizations\/(\d+)/)?.[1];
    return { id, name };
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
        await clickWhenVisible(page.locator('div', { has: page.getByRole('heading', { name: prereq }) })
                .getByRole('button', { name: 'Add Indicator' })
        );
        await clickWhenVisible(page.getByRole('button', { name: 'Done Selecting' }));

        if (matchSubcats) {
            await clickWhenVisible(page.locator('label', { hasText: 'T101: Test Indicator' }));
        }
    }

    await clickWhenVisible(page.getByRole('button', { name: 'Save', exact: true }));
    if(!throwError){
        await expect(page.getByRole('heading', { name: `${code}: ${name}` })).toBeVisible();
    }
    console.log('Indicator created.')
    return { code, name };
}


export async function createClient(page, name='Test Client') {
    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: /Clients/i })).toBeVisible();

    await clickWhenVisible(page.getByText('Create New Client', { exact: true }));
    await expect(page.getByRole('heading', { name: `Creating New Client` })).toBeVisible();

    await fillWhenVisible(page.locator('#name'), name);
    await fillWhenVisible(page.locator('#description'), 'This is a test.');
    await clickWhenVisible(page.getByRole('button', { name: 'Save', exact: true }));
    
    await expect(page.getByRole('heading', { name })).toBeVisible();
    console.log('Client created.')
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
    await expect(page.getByRole('heading', { name })).toBeVisible();
    console.log('Project created.')
    return { name, status, client };
}


export async function createProjectActivity(page, name='Test Activity', status='Active') {
    await clickWhenVisible(page.getByText('Activities', { exact: true }));
    await clickWhenVisible(page.locator('button[aria-label="newactivity"]'));
    await fillWhenVisible(page.locator('#name'), name);
    await fillWhenVisible(page.locator('#description'), 'This is a test activity.');
    await fillWhenVisible(page.locator('#start'), '2024-02-01');
    await fillWhenVisible(page.locator('#end'), '2024-02-03');
    await clickWhenVisible(page.locator(`label[for="status__${status}"]`));
    await clickWhenVisible(page.locator(`label[for="category__general"]`));
    await clickWhenVisible(page.locator(`label[for="visible_to_all"]`));

    await clickWhenVisible(page.getByRole('button', { name: 'Save', exact: true }));
    await page.waitForURL(/\/projects\/\d+$/);

    await clickWhenVisible(page.getByRole('heading', { name: 'Activities' }));
    await expect(page.getByRole('heading', { name: name })).toBeVisible();
    console.log('Project Activity created.')
    return name;
}

export async function createProjectDeadline(page, name='Test Deadline', status='Active') {
    await clickWhenVisible(page.getByText('Deadlines', { exact: true }));
    await clickWhenVisible(page.locator('button[aria-label="newdeadline"]'));

    await fillWhenVisible(page.locator('#name'), name);
    await fillWhenVisible(page.locator('#description'), 'This is a test activity.');
    await fillWhenVisible(page.locator('#deadline_date'), '2024-03-31');
    await clickWhenVisible(page.locator(`label[for="visible_to_all"]`));

    await clickWhenVisible(page.getByRole('button', { name: 'Save', exact: true }));
    await page.waitForURL(/\/projects\/\d+$/);

    await clickWhenVisible(page.getByRole('heading', { name: 'Deadlines' }));
    await expect(page.getByRole('heading', { name: name })).toBeVisible();
    console.log('Deadline Created')
    return name;
}

export async function assignOrg(page, orgName='Test Org', projName='Test Project') {
    await clickWhenVisible(page.getByRole('button', { name: 'Organizations' }));
    await clickWhenVisible(page.getByRole('button', { name:'Add Organization(s)' }));

    await clickWhenVisible(page.getByRole('button', { name: 'Select' }))

    // Wait for org to appear before clicking
    await clickWhenVisible(page.getByRole('heading', { name: orgName })
        .locator('..') // parent container
        .getByRole('button', { name: `Assign to ${projName}` }));

    await clickWhenVisible(page.getByRole('button', { name: 'Select' }))

    await clickWhenVisible(page.getByRole('button', { name: 'Confirm Selection & Assign Organizations' }));

    const link = page.getByRole('link', { name: orgName });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /\/projects\/\d+\/organizations\/\d+$/);
    console.log('Organization assigned');
    return { orgName, projName};
}

export async function createTask(page, indicator='T101: Test Indicator') {
    if ((await page.getByText('Search your tasks by name, organization, or project.').count()) === 0) {
        await clickWhenVisible(page.getByText('Tasks'));
    }
    await clickWhenVisible(page.getByText('Assign New Task(s)'));
    await expect(page.getByRole('heading', { name: /Assigning tasks/i })).toBeVisible();

    await clickWhenVisible(page.getByRole('button', { name: 'Select' }));
    await expect(page.getByRole('heading', { name: indicator })).toBeVisible();

    await clickWhenVisible(page.getByRole('heading', { name: indicator })
        .locator('..') // parent container
        .getByRole('button', { name: `Assign as Task` }))

    await clickWhenVisible(page.getByRole('button', { name: 'Done Selecting' }));
    await clickWhenVisible(page.getByRole('button', { name: 'Confirm Selection & Assign Tasks' }));
    await expect(page.getByText(/Successfully assigned 1 new tasks/i)).toBeVisible();

    console.log('Task created')
    return indicator;
}

export async function createTarget(page, task='T101: Test Indicator (Test Org, Test Project (for Test Client))', related = '') {
    await page.screenshot({ path: 'full_page_screenshot.png', fullPage: true });
    if ((await page.getByText('Search for targets by indicator or project.').count()) === 0) {
        await clickWhenVisible(page.getByText('Targets'));
    }

    // Open new target form
    await clickWhenVisible(page.getByRole('button', { name: 'New Target' }));
    await expect(page.getByRole('heading', { name: 'New Target' })).toBeVisible();

    // Choose task
    await clickWhenVisible(page.getByRole('button', { name: 'Choose a new item' }));
    await clickWhenVisible(page.getByRole('heading', { name: indicator })
        .locator('..') // parent container
        .getByRole('button', { name: 'Select Task' }));

    // Related target case
    if (related) {
        await clickWhenVisible(page.locator('label[for="as_percentage"]'));
        await clickWhenVisible(page.getByRole('button', { name: 'Choose a new item' }));

        const relatedRow = page.locator('div', { has: page.getByRole('heading', { name: related }) });
        await expect(relatedRow).toBeVisible();
        await clickWhenVisible(relatedRow.getByRole('button', { name: 'Select Task' }))

        await fillWhenVisible(page.locator('#percentage_of_related'), '100');
    } 
    else {
        await fillWhenVisible(page.locator('#amount'), '500');
    }

    // Date selection
    await clickWhenVisible(page.locator('label[for="date_type__quarter"]'));
    await clickWhenVisible(page.locator('label[for="quarter__Q1 2024"]'));

    // Save & wait for navigation
    await clickWhenVisible(page.getByRole('button', { name: 'Save', exact: true }));
    await expect(page.getByRole('heading', { name: 'New Target' })).toBeHidden();
    await expect(page.getByRole('heading', { name: /Viewing Page For/i })).toBeVisible();

    // Validate new view
    await expect(page.getByRole('heading', { name: /Viewing Page For/i })).toBeVisible();

    // Go back to targets list
    await clickWhenVisible(page.getByRole('link', { name: 'Targets' }));

    // Assert created target
    await expect(page.getByText(new RegExp(`Target for Task ${task}`))).toBeVisible({ timeout: 10000 });

    console.log('Target created');
    return { task, related };
}

export async function assignSubgrantee(page, name='Test Org Jr.') {
    if ((await page.locator('button[aria-label="assignnewsubgrantee(s)"]').count()) === 0) {
        await clickWhenVisible(page.getByText('Subgrantees', { exact: true }));
    }

    await clickWhenVisible(page.getByText('Assign New Subgrantee(s)', { exact: true }));
    await expect(page.getByText(/Assigning subgrantees/i)).toBeVisible();

    await clickWhenVisible(page.getByText('Select', { exact: true }));
    await clickWhenVisible(page.getByRole('button', { name: /Add an Organization/i }));

    await expect(page.getByRole('heading', { name: 'New Organization' })).toBeVisible();
    await fillWhenVisible(page.locator('#name'), name);
    await clickWhenVisible(page.getByRole('button', { name: 'Save', exact: true }));

    await expect(page.getByRole('heading', { name: 'New Organization' })).toBeHidden();
    await expect(page.getByText(/Assigning subgrantees/i)).toBeVisible();
    await clickWhenVisible(page.getByRole('button', { name: 'Select' }));
    await expect(page.getByText(name)).toBeVisible();
    await clickWhenVisible(page.getByRole('heading', { name: name })
        .locator('..') // parent container
        .getByRole('button', { name: `Assign as Subgrantee` }))
    await clickWhenVisible(page.getByText('Done Selecting', { exact: true }));
    await clickWhenVisible(page.getByText(/Confirm Selection/i));
    await expect(page.getByText(/Successfully assigned 1 new subgrantees/i)).toBeVisible();
    console.log('Subgrantee assigned.')
    return name;
}