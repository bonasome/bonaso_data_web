import { test } from './playwright.setup'; 
import { expect } from '@playwright/test'; 
import { resetDB } from './helpers/helpers';

// python manage.py runserver --settings=bonaso_data_server.settings_test
const createRespondent = async (page, id='000010000', fname='Test', lname='Testersonne') => {
    //function will assume page is already on create page, verify URL before proceeding
    await page.waitForURL(/\/respondents\/new/);
    //handle privacy modal
    const consentButton = page.getByRole('button', { name: /I understand/i });
    if (await consentButton.isVisible()) {
        await consentButton.click();
    }
    await expect(page.getByRole('heading', { name: 'New Respondent' })).toBeVisible();
    // Fill form
    await page.fill('#id_no', `${id}`);
    await page.fill('#first_name', `${fname}`);
    await page.fill('#last_name', `${lname}`);
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
    //attempt save
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    //leave open ended
}

test.describe('Respondent creation', () => {
    test.beforeAll(async ({ request }) => {
        await resetDB(request);
    });

    test('can create respondent and auto resolve creation flags', async ({ authPage: page }) => {
        await page.goto('/respondents');
        await expect(page.getByRole('heading', { name: /Respondents/i })).toBeVisible();

        // Either dashboard button or consent modal
        await page.getByRole('button', { name: /Create New Respondent/i }).click();
        await createRespondent(page, 'T100');

        await expect(page.getByRole('heading', { name: 'Test Testersonne' })).toBeVisible();
        await page.getByText('Flags', { exact: true }).click();
        const active = page.getByText('(ACTIVE)'); 
        await expect(active).toHaveCount(3);

        await page.locator('button[aria-label="editrespondent"]').click();
        await expect(page.getByRole('heading', { name: 'Editing Test Testersonne'})).toBeVisible();
        const input = page.locator('#id_no'); // or getByRole/getByLabel
        await expect(input).toHaveValue('T100', { timeout: 5000 });
        await input.fill('000010000');
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        
        await page.waitForURL(/\/respondents\/\d+$/),
        await expect(page.getByRole('heading', { name: 'Test Testersonne'})).toBeVisible();

        await page.getByText('Flags', { exact: true }).click();
        const resolved = page.getByText('(RESOLVED)'); 
        await expect(resolved).toHaveCount(3);
    });

    test('required respondent fields display warnings', async ({ authPage: page }) => {
        await page.goto('/respondents');
        await expect(page.getByRole('heading', { name: /Respondents/i })).toBeVisible();

        // Either dashboard button or consent modal
        await page.getByRole('button', { name: /Create New Respondent/i }).click();
        await createRespondent(page, 'Test', '', '');
        const errors = page.getByText('Required', {exact: true});
        await expect(errors).toHaveCount(2); //first + last name were empty
    });

    test('link appears for duplicate creation', async ({ authPage: page }) => {
        await page.goto('/respondents');
        await expect(page.getByRole('heading', { name: /Respondents/i })).toBeVisible();

        // Either dashboard button or consent modal
        await page.getByRole('button', { name: /Create New Respondent/i }).click();
        await createRespondent(page, '000010001', 'Doesnt', 'Matter');
        await page.getByRole('link', { name: /Review them here/i }).click();
        await page.waitForURL(/\/respondents\/\d+$/);
        await expect(page.getByRole('heading', { name: 'Goolius Boozler' })).toBeVisible();
    });
});

const goToResp = async(page, anon=true, name='') => {
    await page.goto('/respondents');
    await expect(page.getByRole('heading', { name: /Respondents/i })).toBeVisible();
    if(anon) await page.getByRole('link', { name: /Anonymous/i }).click();
    else await page.getByRole('link', { name: `${name}` }).click();
    if(anon) await expect(page.getByRole('heading', { name: /Anonymous/i })).toBeVisible();
    else await expect(page.getByRole('heading', { name: `${name}` })).toBeVisible();
}

test.describe('Respondent detail page', () => {
    test.beforeAll(async ({ request }) => {
        await resetDB(request);
    });

    test('kp/disability fields render correctly', async ({ authPage: page }) => {
        await goToResp(page);
        // Open Key Population dropdown
        await page.getByText('Key Population Status', { exact: true }).click();
        await expect(page.getByText('Lesbian Bisexual or Queer', { exact: true })).toBeVisible();
        await expect(page.getByText('Female Sex Workers', { exact: true })).toBeVisible();

        // Open Disability dropdown
        await page.getByText('Disability Status', { exact: true }).click();
        await expect(page.getByText('Visually Impaired', { exact: true })).toBeVisible();
        await expect(page.getByText('Hearing Impaired', { exact: true })).toBeVisible();
    });

    test('can view/edit HIV status', async ({ authPage: page }) => {
        await goToResp(page);
        // Edit HIV Status
        await page.getByText('HIV Status CONFIDENTIAL', { exact: true }).click();
        await expect(page.getByText('HIV Negative')).toBeVisible();
        await page.locator('button[aria-label="edithivstatus"]').click();
        await page.locator('label[for="hiv_positive"]').click();
        await page.fill('#date_positive', '2024-01-01');
        await page.locator('button[aria-label="save"]').click();
        await expect(page.getByText(/HIV Positive Since January 1, 2024/i)).toBeVisible();
    });

    test('can view/edit pregnancies', async ({ authPage: page }) => {
        await goToResp(page);
         // Edit Pregnancy Status
        await page.getByText('Pregnancy Information', { exact: true }).click();
        await expect(page.getByText('No recorded pregnancies.')).toBeVisible();
        await page.locator('button[aria-label="recordnewpregnancy"]').click();
        await page.fill('#term_began', '2024-01-01');
        await page.fill('#term_ended', '2024-09-01');
        await page.locator('button[aria-label="save"]').click();
        await expect(page.getByText(/Pregnancy started on January 1, 2024 ended on September 1, 2024/i)).toBeVisible();
        await page.locator('button[aria-label="deletepregnancy"]').click();

        await expect(page.getByText('No recorded pregnancies.')).toBeVisible();

        await page.locator('button[aria-label="recordnewpregnancy"]').click();
        await page.fill('#term_began', '2025-01-01');
        await page.locator('button[aria-label="save"]').click();
        await expect(page.getByText(/Pregnancy started on January 1, 2025/i)).toBeVisible();
    });

});

test.describe('interactions', () => {
    test.beforeAll(async ({ request }) => {
        await resetDB(request);
    });

    test('can batch create interactions and also test that subcategories correctly hide', async ({ authPage: page }) => {
        await goToResp(page, false, 'Goolius Boozler');
        // Open Key Population dropdown
        await expect(page.getByText('No interactions yet. Be the first to create one!')).toBeVisible();
        await page.fill('#interaction_date', '2025-04-01');
        await page.fill('#interaction_location', 'Nerd City');
        await page.getByRole('button', { name: 'Select T101: Test 1 (Parent Org, Test Project (for Client Org))' }).click();
        await expect(page.getByText('Additional Information Required')).toBeVisible();
        await page.locator('label[for="subcats-1"]').click();
        await page.locator('label[for="subcats-2"]').click();
        let subcatModal = page.locator('#subcat-select');
        await expect(subcatModal).toContainText('Cat 3');
        await page.getByRole('button', { name: 'Confirm Choices' }).click();

        await page.getByRole('button', { name: 'Select T102: Test Dep (Parent Org, Test Project (for Client Org))' }).click();
        await expect(page.getByText('Additional Information Required')).toBeVisible();
        await expect(page.getByText('Additional Information Required')).toBeVisible();  
        await page.locator('label[for="subcats-1"]').click();
        await page.locator('label[for="subcats-2"]').click();
        let subcatModal2 = page.locator('#subcat-select');
        await expect(subcatModal2).not.toContainText('Cat 3');
        await page.getByRole('button', { name: 'Confirm Choices' }).click();
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        const container = page.locator('#previous-interactions');
        await expect(container).toContainText('T101: Test 1');
        await expect(container).toContainText('T102: Test Dep');
        const dates = container.getByText('April 1, 2025'); 
        await expect(dates).toHaveCount(2);
        const locs = container.getByText('Nerd City'); 
        await expect(locs).toHaveCount(2);
    });

    test('prerequisite warnings appear and disappear', async({ authPage: page}) => {
        await goToResp(page, false, 'Goolius Boozler');
        await expect(page.getByText('No interactions yet. Be the first to create one!')).toBeVisible();
        await page.fill('#interaction_date', '2025-04-01');
        await page.getByRole('button', { name: 'Select T102: Test Dep (Parent Org, Test Project (for Client Org))' }).click();
        await expect(page.getByText('Additional Information Required')).toBeVisible();
        await page.locator('label[for="subcats-1"]').click();
        await page.getByRole('button', { name: 'Confirm Choices' }).click();
        await expect(page.getByText('Additional Information Required')).not.toBeVisible();
        await expect(page.getByText(/This indicator requires this respondent to have had an interaction associated with task/i)).toBeVisible();
        
        await page.getByRole('button', { name: 'Select T101: Test 1 (Parent Org, Test Project (for Client Org))' }).click();
        await expect(page.getByText('Additional Information Required')).toBeVisible();
        await page.locator('label[for="subcats-1"]').click();
        await page.getByRole('button', { name: 'Confirm Choices' }).click();
        await expect(page.getByText(/This indicator requires this respondent to have had an interaction associated with task/i)).not.toBeVisible();
    })

    test('flags are created and resolved', async({ authPage: page}) => {
        await goToResp(page, false, 'Goolius Boozler');
        await expect(page.getByText('No interactions yet. Be the first to create one!')).toBeVisible();
        await page.fill('#interaction_date', '2025-04-01');
        await page.fill('#interaction_location', 'Sick of this project city');
        await page.getByRole('button', { name: 'Select T102: Test Dep (Parent Org, Test Project (for Client Org))' }).click();
        await expect(page.getByText('Additional Information Required')).toBeVisible();
        await page.locator('label[for="subcats-1"]').click();
        await page.getByRole('button', { name: 'Confirm Choices' }).click();
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        const container = page.locator('#previous-interactions');
        await expect(container).toContainText('T102: Test Dep');
        await expect(container).toContainText('This interaction has active flags.');

        await page.getByRole('button', { name: 'Select T101: Test 1 (Parent Org, Test Project (for Client Org))' }).click();
        await expect(page.getByText('Additional Information Required')).toBeVisible();
        await page.locator('label[for="subcats-1"]').click();
        await page.locator('label[for="subcats-2"]').click();
        await page.getByRole('button', { name: 'Confirm Choices' }).click();
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(container).toContainText('T101: Test 1');
        await expect(container).toContainText('This interacion previously had flags.');
    })
});