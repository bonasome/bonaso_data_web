import { test } from './playwright.setup'; 
import { expect } from '@playwright/test'; 

import { createClient, createProject, createProjectActivity, createProjectDeadline, createOrg, createIndicator, createTask, createTarget, assignOrg, assignSubgrantee } from './create-helpers/project-sphere';

export async function projectFlow(page, lightweight=false){
    // basic setup
    await createOrg(page);
    await createIndicator(page);
    await createIndicator(page, 'T102', 'Test Dep', 'respondent', false, true, 'T101: Test Indicator', true)
    await createClient(page);
    await createProject(page);

    // skip this part of using as setup
    if(!lightweight){
        await createProjectActivity(page);
        await createProjectDeadline(page);
    }

    // assign test organization
    
    await assignOrg(page);
    const link = page.getByRole('link', { name: 'Test Org' });
    // Go to detail page
    await link.click();

    await expect(page.getByRole('heading', { name: /Viewing Page for Test Org for Test Project/ })).toBeVisible();
    await createTask(page);
    await createTask(page, 'T102: Test Dep')
    await createTarget(page);
    await createTarget(page, 'T102: Test Dep (Test Org, Test Project (for Test Client))');

    await assignSubgrantee(page);

}

test('project flow', async ({ authToken: page, resetDB }) => {
    await projectFlow(page);
});