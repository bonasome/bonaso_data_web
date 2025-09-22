import { test } from './playwright.setup'; 
import { expect } from '@playwright/test'; 
import { resetDB } from './helpers/helpers';

const goToResp = async(page, anon=true, name='') => {
    /*
    Goes to index and clicks on a detail page
    - page - page context
    - anon: is the respondent anonymous (if yes, it will look for Anonymous heading, will not work if there
        are multiple)
    - name: if not anon, name of header to find
     */
    await page.goto('/respondents');
    await expect(page.getByRole('heading', { name: /Respondents/i })).toBeVisible({timeout: 10000});
    if(anon) await page.getByRole('link', { name: /Anonymous/i }).click();
    else await page.getByRole('link', { name: `${name}` }).click();
    if(anon) await expect(page.getByRole('heading', { name: /Anonymous/i })).toBeVisible();
    else await expect(page.getByRole('heading', { name: `${name}` })).toBeVisible();
}


test('can batch create interactions and also test that subcategories correctly hide', async ({ authPage: page, resetDB }) => {
    //test create batch interaction with prereq and dependent that have matched subcategories
    await goToResp(page, false, 'Goolius Boozler');
    //expect no previous interactions
    await expect(page.getByText('No interactions yet. Be the first to create one!')).toBeVisible();
    //fill date/location
    await page.fill('#interaction_date', '2025-04-01');
    await page.fill('#interaction_location', 'Nerd City');
    //select prereq
    await page.getByRole('button', { name: 'Select T101: Test 1 (Parent Org, Test Project (for Client Org))' }).click();
    await expect(page.getByText('Additional Information Required')).toBeVisible();
    //select subcats 1/2
    await page.locator('label[for="subcats-1"]').click();
    await page.locator('label[for="subcats-2"]').click();
    let subcatModal = page.locator('#subcat-select');
    //confirm that 3 exists
    await expect(subcatModal).toContainText('Cat 3');
    await page.getByRole('button', { name: 'Confirm Choices' }).click();
    await expect(page.getByText('Additional Information Required')).not.toBeVisible(); //confirm modal is closed

    //select dependent indicator
    await page.getByRole('button', { name: 'Select T102: Test Dep (Parent Org, Test Project (for Client Org))' }).click();
    await expect(page.getByText('Additional Information Required')).toBeVisible();
    //select same two subcats
    await page.locator('label[for="subcats-1"]').click();
    await page.locator('label[for="subcats-2"]').click();
    let subcatModal2 = page.locator('#subcat-select');
    //confirm the third subcat is not visible, since it was not selected with the prereq
    await expect(subcatModal2).not.toContainText('Cat 3');
    await page.getByRole('button', { name: 'Confirm Choices' }).click();
    await expect(page.getByText('Additional Information Required')).not.toBeVisible();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const container = page.locator('#previous-interactions');

    //confirm interactions were created wtih correct date/time
    await expect(container).toContainText(/T101: Test 1/i, { timeout: 10000 });
    await expect(container).toContainText(/T102: Test Dep/i);
    const dates = container.getByText('April 1, 2025'); 
    await expect(dates).toHaveCount(2);
    const locs = container.getByText('Nerd City'); 
    await expect(locs).toHaveCount(2);
});

test('prerequisite warnings appear and disappear', async({ authPage: page, resetDB }) => {
    //test that a warning appears if the prereq does not exist and disappears if provided
    await goToResp(page, false, 'Goolius Boozler');
    await expect(page.getByText('No interactions yet. Be the first to create one!')).toBeVisible();
    //select a date (all that we need)
    await page.fill('#interaction_date', '2025-04-01');
    //select dependent task and one random subcat
    await page.getByRole('button', { name: 'Select T102: Test Dep (Parent Org, Test Project (for Client Org))' }).click();
    await expect(page.getByText('Additional Information Required')).toBeVisible();
    await page.locator('label[for="subcats-1"]').click();
    await page.getByRole('button', { name: 'Confirm Choices' }).click();
    await expect(page.getByText('Additional Information Required')).not.toBeVisible(); //close modal
    //check that a warning appears
    await expect(page.getByText(/This indicator requires this respondent to have had an interaction associated with task/i)).toBeVisible();
    
    //select prereq
    await page.getByRole('button', { name: 'Select T101: Test 1 (Parent Org, Test Project (for Client Org))' }).click();
    await expect(page.getByText('Additional Information Required')).toBeVisible();
    await page.locator('label[for="subcats-1"]').click();
    await page.getByRole('button', { name: 'Confirm Choices' }).click();
    await expect(page.getByText('Additional Information Required')).not.toBeVisible();
    //check that warning now disappears
    await expect(page.getByText(/This indicator requires this respondent to have had an interaction associated with task/i)).not.toBeVisible();
})

test('flags are created and resolved', async({ authPage: page, resetDB }) => {
    //test that a can be created for prereqs and auto resolved
    await goToResp(page, false, 'Goolius Boozler');
    //confirm nothing already exists
    await expect(page.getByText('No interactions yet. Be the first to create one!')).toBeVisible();
    //set date/location
    await page.fill('#interaction_date', '2025-04-01');
    await page.fill('#interaction_location', 'Sick of this project city');
    //select dependent
    await page.getByRole('button', { name: 'Select T102: Test Dep (Parent Org, Test Project (for Client Org))' }).click();
    await expect(page.getByText('Additional Information Required')).toBeVisible();
    await page.locator('label[for="subcats-1"]').click();
    await page.getByRole('button', { name: 'Confirm Choices' }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    //confirm that a flag was created
    const container = page.locator('#previous-interactions');
    await expect(container).toContainText('T102: Test Dep', { timeout: 10000 });
    await expect(container).toContainText('This interaction has active flags.', { timeout: 10000 });
    await container.getByRole('heading', { name: 'This interaction has active flags.' }).click();
    await page.getByRole('heading', { name: /(ACTIVE)/i }).click(); //first (and only) flag
    //check the reason is correct
    await expect(page.getByText(/to have a valid interaction with this respondent within the past year/i)).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click();

    //add prerequisite
    await page.getByRole('button', { name: 'Select T101: Test 1 (Parent Org, Test Project (for Client Org))' }).click();
    await expect(page.getByText('Additional Information Required')).toBeVisible();
    await page.locator('label[for="subcats-1"]').click();
    await page.locator('label[for="subcats-2"]').click();
    await page.getByRole('button', { name: 'Confirm Choices' }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(container).toContainText('T101: Test 1', { timeout: 15000 });
    //confirm that flag was resolved and correct message displays
    await expect(container).toContainText('This interacion previously had flags.');
});

test('warning/flag is given for interactions occuring too closely', async({ authPage: page, resetDB }) => {
    await goToResp(page); //go to respondent with preexxisting
    const container = page.locator('#previous-interactions');
    await expect(container).toContainText('T101: Test 1');
    //date within 30 days of interaction with this indicator in database
    await page.fill('#interaction_date', '2025-04-01');
    await page.fill('#interaction_location', 'That place that sells chili');
    //select task with same indicator
    await page.getByRole('button', { name: 'Select T101: Test 1 (Parent Org, Test Project (for Client Org))' }).click();
    await expect(page.getByText('Additional Information Required')).toBeVisible();
    await page.locator('label[for="subcats-1"]').click();
    await page.locator('label[for="subcats-2"]').click();
    await page.getByRole('button', { name: 'Confirm Choices' }).click();
    //confirm warning appears
    await expect(page.getByText(/This respondent has had this another interaction with this task within the past 30 days/i)).toBeVisible();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    //confirm flag was created
    await expect(container).toContainText('This interaction has active flags.', { timeout: 10000 });
    await container.getByRole('heading', { name: 'This interaction has active flags.' }).click();
    //click first/only flag to expand card
    await page.getByRole('heading', { name: /(ACTIVE)/i }).click();
    //check that correct reason is provided
    await expect(page.getByText(/has had an interaction associated with task/i)).toBeVisible();
});

test('warning/flag is given for closeness is exempted if marked + numeric test', async({ authPage: page, resetDB }) => {
    await goToResp(page); //go to respondent with interaction with the same indicator as one that allows repeats
    const container = page.locator('#previous-interactions');
    await expect(container).toContainText('T103: Test Numeric Subcats');

    //set date within 30 days of interaction
    await page.fill('#interaction_date', '2025-04-01');
    await page.fill('#interaction_location', 'That place that sells chili');
    //same indicator as the one that exists and allows repear
    await page.getByRole('button', { name: 'T103: Test Numeric Subcats (Parent Org, Test Project (for Client Org))' }).click();
    await expect(page.getByText('Additional Information Required')).toBeVisible();
    //this one has numeric subcats to select them and enter a number
    await page.locator('label[for="subcats-1"]').click();
    await page.fill('#number-1', '5');
    await page.locator('label[for="subcats-2"]').click();
    await page.fill('#number-2', '7');
    await page.getByRole('button', { name: 'Confirm Choices' }).click();
    //confirm this warning does not display
    await expect(page.getByText(/This respondent has had this another interaction with this task within the past 30 days/i)).not.toBeVisible();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    //no flag should appear
    await expect(container).not.toContainText('This interaction has active flags.', { timeout: 10000 });
    await page.getByText('April 1, 2025').click();
    //confirm that correct numbers/subcategories display
    await expect(page.getByText('Cat 1 (5)')).toBeVisible();
    await expect(page.getByText('Cat 2 (7)')).toBeVisible();
});

test('editing subcategory shennanigans', async({ authPage: page, resetDB }) => {
    //test that interactions can be edited with subcats and that altering matched subcategory interactions can create/resolve flags
    await goToResp(page); //go to anon respondent that has prior interactions
    const container = page.locator('#previous-interactions');
    //confirm these two interactions exist
    await expect(container).toContainText('T101: Test 1');
    await expect(container).toContainText('T102: Test Dep');
    //expand dependent interaction card
    await container.getByText('T102: Test Dep').click();
    const card = await page.locator('div', { hasText: 'T102: Test Dep' })
    //click edit button
    const edit = await card.locator('button[aria-label="editdetails"]');
    await edit.click()
    //add a subcategory that us not selected in the prereq
    await page.locator('label[for="subcategories_data-2"]').click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    //expect a flag to be created
    await expect(container).toContainText('This interaction has active flags.', { timeout: 10000 });
    await container.getByRole('heading', { name: 'This interaction has active flags.' }).click();
    await page.getByRole('heading', { name: /(ACTIVE)/i }).click();
    //confirm correct message
    await expect(page.getByText(/The selected subcategories for task/i)).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click();
    //edit again
    await container.getByText('T102: Test Dep').click();
    await edit.click();
    //unselect that subcategory
    await page.locator('label[for="subcategories_data-2"]').click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    //confirm flag was resolved
    await expect(container).toContainText('This interacion previously had flags.', { timeout: 10000});
})
