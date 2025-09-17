import { test } from './playwright.setup'; 
import { expect } from '@playwright/test'; 
import { resetDB } from './helpers/helpers';

const goToResp = async(page, anon=true, name='') => {
    await page.goto('/respondents');
    await expect(page.getByRole('heading', { name: /Respondents/i })).toBeVisible({timeout: 10000});
    if(anon) await page.getByRole('link', { name: /Anonymous/i }).click();
    else await page.getByRole('link', { name: `${name}` }).click();
    if(anon) await expect(page.getByRole('heading', { name: /Anonymous/i })).toBeVisible();
    else await expect(page.getByRole('heading', { name: `${name}` })).toBeVisible();
}


test('can batch create interactions and also test that subcategories correctly hide', async ({ authPage: page, resetDB }) => {
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
    await expect(page.getByText('Additional Information Required')).not.toBeVisible();

    await page.getByRole('button', { name: 'Select T102: Test Dep (Parent Org, Test Project (for Client Org))' }).click();
    await expect(page.getByText('Additional Information Required')).toBeVisible();
    await expect(page.getByText('Additional Information Required')).toBeVisible();  
    await page.locator('label[for="subcats-1"]').click();
    await page.locator('label[for="subcats-2"]').click();
    let subcatModal2 = page.locator('#subcat-select');
    await expect(subcatModal2).not.toContainText('Cat 3');
    await page.getByRole('button', { name: 'Confirm Choices' }).click();
    await expect(page.getByText('Additional Information Required')).not.toBeVisible();

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const container = page.locator('#previous-interactions');
    await expect(container).toContainText(/T101: Test 1/i, { timeout: 10000 });
    await expect(container).toContainText(/T102: Test Dep/i);
    const dates = container.getByText('April 1, 2025'); 
    await expect(dates).toHaveCount(2);
    const locs = container.getByText('Nerd City'); 
    await expect(locs).toHaveCount(2);
});

test('prerequisite warnings appear and disappear', async({ authPage: page, resetDB }) => {
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
    await expect(page.getByText('Additional Information Required')).not.toBeVisible();
    await expect(page.getByText(/This indicator requires this respondent to have had an interaction associated with task/i)).not.toBeVisible();
})

test('flags are created and resolved', async({ authPage: page, resetDB }) => {
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
    await expect(container).toContainText('T102: Test Dep', { timeout: 10000 });
    await expect(container).toContainText('This interaction has active flags.', { timeout: 10000 });
    await container.getByRole('heading', { name: 'This interaction has active flags.' }).click();
    await page.getByRole('heading', { name: /(ACTIVE)/i }).click();
    await expect(page.getByText(/to have a valid interaction with this respondent within the past year/i)).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click();

    await page.getByRole('button', { name: 'Select T101: Test 1 (Parent Org, Test Project (for Client Org))' }).click();
    await expect(page.getByText('Additional Information Required')).toBeVisible();
    await page.locator('label[for="subcats-1"]').click();
    await page.locator('label[for="subcats-2"]').click();
    await page.getByRole('button', { name: 'Confirm Choices' }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(container).toContainText('T101: Test 1', { timeout: 15000 });
    await expect(container).toContainText('This interacion previously had flags.');
});

test('warning/flag is given for interactions occuring too closely', async({ authPage: page, resetDB }) => {
    await goToResp(page);
    const container = page.locator('#previous-interactions');
    await expect(container).toContainText('T101: Test 1');

    await page.fill('#interaction_date', '2025-04-01');
    await page.fill('#interaction_location', 'That place that sells chili');
    await page.getByRole('button', { name: 'Select T101: Test 1 (Parent Org, Test Project (for Client Org))' }).click();
    await expect(page.getByText('Additional Information Required')).toBeVisible();
    await page.locator('label[for="subcats-1"]').click();
    await page.locator('label[for="subcats-2"]').click();
    await page.getByRole('button', { name: 'Confirm Choices' }).click();
    await expect(page.getByText(/This respondent has had this another interaction with this task within the past 30 days/i)).toBeVisible();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(container).toContainText('This interaction has active flags.', { timeout: 10000 });
    await container.getByRole('heading', { name: 'This interaction has active flags.' }).click();
    await page.getByRole('heading', { name: /(ACTIVE)/i }).click();
    await expect(page.getByText(/has had an interaction associated with task/i)).toBeVisible();
});

test('warning/flag is given for closeness is exempted if marked + numeric test', async({ authPage: page, resetDB }) => {
    await goToResp(page);
    const container = page.locator('#previous-interactions');
    await expect(container).toContainText('T103: Test Numeric Subcats');

    await page.fill('#interaction_date', '2025-04-01');
    await page.fill('#interaction_location', 'That place that sells chili');
    await page.getByRole('button', { name: 'T103: Test Numeric Subcats (Parent Org, Test Project (for Client Org))' }).click();
    await expect(page.getByText('Additional Information Required')).toBeVisible();
    await page.locator('label[for="subcats-1"]').click();
    await page.fill('#number-1', '5');
    await page.locator('label[for="subcats-2"]').click();
    await page.fill('#number-2', '7');
    await page.getByRole('button', { name: 'Confirm Choices' }).click();
    await expect(page.getByText(/This respondent has had this another interaction with this task within the past 30 days/i)).not.toBeVisible();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(container).not.toContainText('This interaction has active flags.', { timeout: 10000 });
    await page.getByText('April 1, 2025').click();
    await expect(page.getByText('Cat 1 (5)')).toBeVisible();
    await expect(page.getByText('Cat 2 (7)')).toBeVisible();
});

test('editing subcategory shennanigans', async({ authPage: page, resetDB }) => {
    await goToResp(page);
    const container = page.locator('#previous-interactions');
    await expect(container).toContainText('T101: Test 1');
    await expect(container).toContainText('T102: Test Dep');
    await container.getByText('T102: Test Dep').click();
    const card = await page.locator('div', { hasText: 'T102: Test Dep' })
    const edit = await card.locator('button[aria-label="editdetails"]');
    await edit.click()
    await page.locator('label[for="subcategories_data-2"]').click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(container).toContainText('This interaction has active flags.', { timeout: 10000 });
    await container.getByRole('heading', { name: 'This interaction has active flags.' }).click();
    await page.getByRole('heading', { name: /(ACTIVE)/i }).click();
    await expect(page.getByText(/The selected subcategories for task/i)).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click();
    await container.getByText('T102: Test Dep').click();
    await edit.click()
    await page.locator('label[for="subcategories_data-2"]').click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(container).toContainText('This interacion previously had flags.', { timeout: 10000});
})
