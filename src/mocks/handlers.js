import { http, HttpResponse } from 'msw';
import { getIndicatorDetailTypical, getIndicatorList, indicatorMeta } from './handlerHelpers/indicatorHandler';
import { getProjectsList, getProjectMeta, getProjectDetail, getTasksList } from './handlerHelpers/projectHandler';
import { getRespondentsList, getRespondentDetail, getInteractions, getRespondentsMeta, postInteractionBatch, patchInteraction, getRespondentSensitive } from './handlerHelpers/respondentsHandler';
import { getOrgsList, parentOrgDetail } from './handlerHelpers/organizationsHandler'
import { getUsersList } from './handlerHelpers/usersHandler';
export const handlers = [
    http.get('/api/users/me', () => {
        return HttpResponse.json({
            'refresh': '1234',
            'role': 'admin'
        });
    }),
    http.get('/api/organizations/', () => {
        return HttpResponse.json({
            count: 2,
            results: getOrgsList
        })
    }),
    http.get('/api/organizations/1/', () => {
        return HttpResponse.json(
            parentOrgDetail
        )
    }),
    http.post('/api/organizations/', async({ request }) => {
        const body = await request.json();

        // Define expected keys and required keys
        const expectedKeys = ['name', 'full_name', 'parent_organization_id', 'office_address','office_phone', 'office_email', 'executive_director', 'ed_phone', 'ed_email'];
        const requiredKeys = ['name'];

        // Check for required keys
        const missingKeys = requiredKeys.filter(key => !(key in body));
        if (missingKeys.length > 0) {
            return HttpResponse.json(
                Object.fromEntries(missingKeys.map(k => [k, ['This field is required.']])),
                { status: 400 }
            );
        }
        // Optional: validate that no unexpected fields are present
        const invalidKeys = Object.keys(body).filter(key => !expectedKeys.includes(key));
        if (invalidKeys.length > 0) {
        return HttpResponse.json(
            { error: `Unexpected keys: ${invalidKeys.join(', ')}` },
            { status: 400 }
        );
        }
        // Return a mock response
        return HttpResponse.json({
            id: 99,
            ...body,
        }, { status: 201 });
    }),

    http.patch('/api/organizations/1/', async({ request }) => {
        const body = await request.json();

        // Define expected keys and required keys
        const expectedKeys = ['name', 'full_name', 'parent_organization_id', 'office_address','office_phone', 'office_email', 'executive_director', 'ed_phone', 'ed_email'];
        const requiredKeys = ['name'];

        // Check for required keys
        const missingKeys = requiredKeys.filter(key => !(key in body));
        if (missingKeys.length > 0) {
            return HttpResponse.json(
                Object.fromEntries(missingKeys.map(k => [k, ['This field is required.']])),
                { status: 400 }
            );
        }
        // Optional: validate that no unexpected fields are present
        const invalidKeys = Object.keys(body).filter(key => !expectedKeys.includes(key));
        if (invalidKeys.length > 0) {
        return HttpResponse.json(
            { error: `Unexpected keys: ${invalidKeys.join(', ')}` },
            { status: 400 }
        );
        }
        // Return a mock response
        return HttpResponse.json({
            id: 1,
            ...body,
        }, { status: 201 });
    }),
    http.get('/api/indicators/meta', () => {
        console.log(indicatorMeta)
        return HttpResponse.json(
            indicatorMeta
        );
    }),
    http.get('/api/indicators/', () => {
        return HttpResponse.json({
            count: 4,
            results: getIndicatorList
        });
    }),
    http.post('/api/indicators/', async ({ request }) => {
        const body = await request.json();

        // Define expected keys and required keys
        const expectedKeys = ['name', 'code', 'status', 'require_numeric','require_subcategories', 'subcategory_names', 'prerequisite_id', 'description'];
        const requiredKeys = ['name','code', 'status'];

        // Check for required keys
        const missingKeys = requiredKeys.filter(key => !(key in body));
        if (missingKeys.length > 0) {
        return HttpResponse.json(
            Object.fromEntries(missingKeys.map(k => [k, ['This field is required.']])),
            { status: 400 }
        );
        }
        if ('subcategory_names' in body && !Array.isArray(body.subcategory_names)) {
            return HttpResponse.json(
            { subcategory_names: ['This field must be an array.'] },
            { status: 400 }
            );
        }

        // Optional: validate that no unexpected fields are present
        const invalidKeys = Object.keys(body).filter(key => !expectedKeys.includes(key));
        if (invalidKeys.length > 0) {
        return HttpResponse.json(
            { error: `Unexpected keys: ${invalidKeys.join(', ')}` },
            { status: 400 }
        );
        }
        // Return a mock response
        return HttpResponse.json({
            id: 99,
            ...body,
        }, { status: 201 });
    }),
    http.patch('/api/indicators/1', async ({ request }) => {
        const body = await request.json();

        // Define expected keys and required keys
        const expectedKeys = ['name', 'code', 'status', 'require_numeric','require_subcategories', 'subcategory_names', 'prerequisite_id', 'description'];
        const requiredKeys = ['name','code', 'status'];

        // Check for required keys
        const missingKeys = requiredKeys.filter(key => !(key in body));
        if (missingKeys.length > 0) {
        return HttpResponse.json(
            Object.fromEntries(missingKeys.map(k => [k, ['This field is required.']])),
            { status: 400 }
        );
        }
        if ('subcategory_names' in body && !Array.isArray(body.subcategory_names)) {
            return HttpResponse.json(
            { subcategory_names: ['This field must be an array.'] },
            { status: 400 }
            );
        }

        // Optional: validate that no unexpected fields are present
        const invalidKeys = Object.keys(body).filter(key => !expectedKeys.includes(key));
        if (invalidKeys.length > 0) {
        return HttpResponse.json(
            { error: `Unexpected keys: ${invalidKeys.join(', ')}` },
            { status: 400 }
        );
        }
        // Return a mock response
        return HttpResponse.json({
            id: 1,
            ...body,
        }, { status: 201 });
    }),
    http.get('api/indicators/1/' , () => {
        return HttpResponse.json(getIndicatorDetailTypical)
    }),
    http.get('api/manage/projects/meta/' , () => {
        return HttpResponse.json(
            getProjectMeta
        );
    }),
    http.get('api/manage/projects/' , () => {
        return HttpResponse.json({
            count: 2,
            results: getProjectsList
        });
    }),
    http.get('api/manage/projects/1/' , () => {
        return HttpResponse.json(
            getProjectDetail
        );
    }),
     http.post('/api/manage/projects/', async ({ request }) => {
        const body = await request.json();

        // Define expected keys and required keys
        const expectedKeys = ['name', 'client_id', 'description', 'status', 'start', 'end'];
        const requiredKeys = ['name','start', 'end', 'status'];

        // Check for required keys
        const missingKeys = requiredKeys.filter(key => !(key in body));
        if (missingKeys.length > 0) {
        return HttpResponse.json(
            Object.fromEntries(missingKeys.map(k => [k, ['This field is required.']])),
            { status: 400 }
        );
        }
        if ('subcategory_names' in body && !Array.isArray(body.subcategory_names)) {
            return HttpResponse.json(
            { subcategory_names: ['This field must be an array.'] },
            { status: 400 }
            );
        }

        // Optional: validate that no unexpected fields are present
        const invalidKeys = Object.keys(body).filter(key => !expectedKeys.includes(key));
        if (invalidKeys.length > 0) {
        return HttpResponse.json(
            { error: `Unexpected keys: ${invalidKeys.join(', ')}` },
            { status: 400 }
        );
        }
        // Return a mock response
        return HttpResponse.json({
            id: 99,
            ...body,
        }, { status: 201 });
    }),

    http.patch('/api/manage/projects/1/', async ({ request }) => {
        const body = await request.json();

        // Define expected keys and required keys
        const expectedKeys = ['name', 'client_id', 'description', 'status', 'start', 'end'];
        const requiredKeys = ['name','start', 'end', 'status'];

        // Check for required keys
        const missingKeys = requiredKeys.filter(key => !(key in body));
        if (missingKeys.length > 0) {
        return HttpResponse.json(
            Object.fromEntries(missingKeys.map(k => [k, ['This field is required.']])),
            { status: 400 }
        );
        }
        if ('subcategory_names' in body && !Array.isArray(body.subcategory_names)) {
            return HttpResponse.json(
            { subcategory_names: ['This field must be an array.'] },
            { status: 400 }
            );
        }

        // Optional: validate that no unexpected fields are present
        const invalidKeys = Object.keys(body).filter(key => !expectedKeys.includes(key));
        if (invalidKeys.length > 0) {
        return HttpResponse.json(
            { error: `Unexpected keys: ${invalidKeys.join(', ')}` },
            { status: 400 }
        );
        }
        // Return a mock response
        return HttpResponse.json({
            id: 1,
            ...body,
        }, { status: 201 });
    }),
    http.get('api/manage/tasks/' , () => {
        return HttpResponse.json({
            count: 4,
            results: getTasksList
        });
    }),
    http.delete('/api/manage/tasks/:taskId/', ({ params }) => {
        console.log('Mock DELETE task with ID:', params.taskId);
        return HttpResponse.json({}, { status: 200 });
    }),
    http.post('/api/manage/targets/', async ({ request }) => {
        const body = await request.json();

        // Define expected keys and required keys
        const expectedKeys = ['task_id','start', 'end', 'amount', 'related_to_id', 'percentage_of_related'];
        const requiredKeys = ['task_id','start', 'end'];

        // Check for required keys
        const missingKeys = requiredKeys.filter(key => !(key in body));
        if (missingKeys.length > 0) {
        return HttpResponse.json(
            Object.fromEntries(missingKeys.map(k => [k, ['This field is required.']])),
            { status: 400 }
        );
        }
        if ('subcategory_names' in body && !Array.isArray(body.subcategory_names)) {
            return HttpResponse.json(
            { subcategory_names: ['This field must be an array.'] },
            { status: 400 }
            );
        }

        // Optional: validate that no unexpected fields are present
        const invalidKeys = Object.keys(body).filter(key => !expectedKeys.includes(key));
        if (invalidKeys.length > 0) {
        return HttpResponse.json(
            { error: `Unexpected keys: ${invalidKeys.join(', ')}` },
            { status: 400 }
        );
        }
        // Return a mock response
        return HttpResponse.json({
            id: 1,
            ...body,
        }, { status: 201 });
    }),

    http.patch('/api/manage/targets/1/', async ({ request }) => {
        const body = await request.json();

        // Define expected keys and required keys
        const expectedKeys = ['task_id','start', 'end', 'amount', 'related_to_id', 'percentage_of_related'];
        const requiredKeys = ['task_id', 'start', 'end'];

        // Check for required keys
        const missingKeys = requiredKeys.filter(key => !(key in body));
        if (missingKeys.length > 0) {
        return HttpResponse.json(
            Object.fromEntries(missingKeys.map(k => [k, ['This field is required.']])),
            { status: 400 }
        );
        }
        if ('subcategory_names' in body && !Array.isArray(body.subcategory_names)) {
            return HttpResponse.json(
            { subcategory_names: ['This field must be an array.'] },
            { status: 400 }
            );
        }

        // Optional: validate that no unexpected fields are present
        const invalidKeys = Object.keys(body).filter(key => !expectedKeys.includes(key));
        if (invalidKeys.length > 0) {
        return HttpResponse.json(
            { error: `Unexpected keys: ${invalidKeys.join(', ')}` },
            { status: 400 }
        );
        }
        // Return a mock response
        return HttpResponse.json({
            id: 1,
            ...body,
        }, { status: 201 });
    }),
    http.delete('/api/manage/targets/:targetId/', ({ params }) => {
        console.log('Mock DELETE task with ID:', params.targetId);
        return HttpResponse.json({}, { status: 200 });
    }),
    http.get('api/record/respondents/meta/' , () => {
        return HttpResponse.json(
            getRespondentsMeta
        );
    }),
    http.get('api/record/respondents/' , () => {
        return HttpResponse.json({
            count: 2,
            results: getRespondentsList
        });
    }),
    http.get('api/record/respondents/1/' , () => {
        return HttpResponse.json(
            getRespondentDetail
        );
    }),
    http.get('api/record/respondents/1/sensitive-info/' , () => {
        return HttpResponse.json(
            getRespondentSensitive
        );
    }),
    http.post('/api/record/respondents/', async ({ request }) => {
        const body = await request.json();

        // Define expected keys and required keys
        const expectedKeys = ['is_anonymous', 'first_name', 'last_name', 'id_no', 'sex','dob', 'village', 'ward', 'district', 'citizenship', 'age_range', 'email', 'phone_number'];
        let requiredKeys = []
        if(body.is_anonymous === false){
            requiredKeys = ['is_anonymous','first_name', 'last_name', 'id_no', 'sex','dob', 'village', 'district', 'citizenship'];
        }
        if(body.is_anonymous === true){
            requiredKeys = ['is_anonymous','sex','age_range', 'village', 'district', 'citizenship'];
        }

        // Check for required keys
        const missingKeys = requiredKeys.filter(key => !(key in body));
        if (missingKeys.length > 0) {
        return HttpResponse.json(
            Object.fromEntries(missingKeys.map(k => [k, ['This field is required.']])),
            { status: 400 }
        );
        }

        // Optional: validate that no unexpected fields are present
        const invalidKeys = Object.keys(body).filter(key => !expectedKeys.includes(key));
        if (invalidKeys.length > 0) {
        return HttpResponse.json(
            { error: `Unexpected keys: ${invalidKeys.join(', ')}` },
            { status: 400 }
        );
        }
        // Return a mock response
        return HttpResponse.json({
            id: 99,
            ...body,
        }, { status: 201 });
    }),

    http.patch('/api/record/respondents/1/', async ({ request }) => {
        const body = await request.json();

        // Define expected keys and required keys
        const expectedKeys = ['is_anonymous', 'first_name', 'last_name', 'sex','dob', 'village', 'ward', 'district', 'citizenship', 'age_range', 'email', 'phone_number'];
        let requiredKeys = []
        if(body.is_anonymous === false){
            requiredKeys = ['is_anonymous','first_name', 'last_name', 'sex','dob', 'village', 'district', 'citizenship'];
        }
        if(body.is_anonymous === true){
            requiredKeys = ['is_anonymous','sex','age_range', 'village', 'district', 'citizenship'];
        }

        // Check for required keys
        const missingKeys = requiredKeys.filter(key => !(key in body));
        if (missingKeys.length > 0) {
        return HttpResponse.json(
            Object.fromEntries(missingKeys.map(k => [k, ['This field is required.']])),
            { status: 400 }
        );
        }

        // Optional: validate that no unexpected fields are present
        const invalidKeys = Object.keys(body).filter(key => !expectedKeys.includes(key));
        if (invalidKeys.length > 0) {
        return HttpResponse.json(
            { error: `Unexpected keys: ${invalidKeys.join(', ')}` },
            { status: 400 }
        );
        }
        // Return a mock response
        return HttpResponse.json({
            id: 1,
            ...body,
        }, { status: 201 });
    }),

    http.get('api/record/interactions/' , () => {
        return HttpResponse.json({
            count: 1,
            results: getInteractions
        });
    }),
    postInteractionBatch, 
    patchInteraction,
    http.get('/api/template/', () => {
        // Simulate a file download by returning a Blob response
        const fileContents = 'Name, Age\nAlice, 30\nBob, 25';
        const blob = new Blob([fileContents], { type: 'text/csv' });

        return new HttpResponse(blob, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="template.csv"',
        },
        });
    }),

    http.post('/api/record/interactions/upload/', async ({ request }) => {
        const formData = await request.formData();
        const file = formData.get('file');
        console.log(file.name)
        if (file && file.name === 'success.xlsx') {
            return HttpResponse.json({ errors: [], warnings: [] }, { status: 200 });
        }

        return HttpResponse.json({
            errors: ['Missing required data.'],
            warnings: ['Row 3: ambiguous value'],
        }, { status: 200 });
    }),

    http.get('/api/record/interactions/template/', ({ request }) => {
        const url = new URL(request.url);
        const project = url.searchParams.get('project');
        const organization = url.searchParams.get('organization');

        if (!project || !organization) {
            return HttpResponse.json({ error: 'Missing project or organization' }, { status: 400 });
        }

        // Simulate returning a blob (Excel file)
        const blob = new Blob(['dummy excel content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const headers = {
            'Content-Disposition': 'attachment; filename="template.xlsx"',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };

        return new HttpResponse(blob, { status: 200, headers });
    }),
    http.get('api/profiles/users/', () => {
        return HttpResponse.json({
            count: 2,
            results: getUsersList
        });
    }),
    http.get('api/profiles/users/:id/', () => {
        return HttpResponse.json(
            getUsersList[0]
        );
    }),
    http.post('/api/users/create-user/', async ({ request }) => {
        const body = await request.json();

        // Define expected keys and required keys
        const expectedKeys = ['username', 'first_name', 'last_name', 'organization', 'role', 'password', 'confirm_password', 'email'];
        const requiredKeys = ['username', 'first_name', 'last_name', 'organization', 'password', 'confirm_password', 'email'];

        const missingKeys = requiredKeys.filter(key => !(key in body));
        if (missingKeys.length > 0) {
        return HttpResponse.json(
            Object.fromEntries(missingKeys.map(k => [k, ['This field is required.']])),
            { status: 400 }
        );
        }

        const invalidKeys = Object.keys(body).filter(key => !expectedKeys.includes(key));
        if (invalidKeys.length > 0) {
        return HttpResponse.json(
            { error: `Unexpected keys: ${invalidKeys.join(', ')}` },
            { status: 400 }
        );
        }
        // Return a mock response
        return HttpResponse.json({
            id: 99,
            ...body,
        }, { status: 201 });
    }),

    http.patch('/api/profiles/users/:id/', async ({ request }) => {
        const body = await request.json();

        // Define expected keys and required keys
        const expectedKeys = ['username', 'first_name', 'last_name', 'role','organization_id', 'email', 'is_active'];
        const requiredKeys = []

        // Check for required keys
        const missingKeys = requiredKeys.filter(key => !(key in body));
        if (missingKeys.length > 0) {
        return HttpResponse.json(
            Object.fromEntries(missingKeys.map(k => [k, ['This field is required.']])),
            { status: 400 }
        );
        }

        // Optional: validate that no unexpected fields are present
        const invalidKeys = Object.keys(body).filter(key => !expectedKeys.includes(key));
        if (invalidKeys.length > 0) {
        return HttpResponse.json(
            { error: `Unexpected keys: ${invalidKeys.join(', ')}` },
            { status: 400 }
        );
        }
        // Return a mock response
        return HttpResponse.json({
            id: 1,
            ...body,
        }, { status: 201 });
    }),
    http.get('/api/uploads/narrative-report/', ({ url }) => {
        return HttpResponse.json({
            results: [
            {
                id: 11,
                title: 'Report 1',
                description: 'Description for report 1',
                file: '/uploads/report1.pdf',
            },
            {
                id: 12,
                title: 'Report 2',
                description: 'Description for report 2',
                file: '/uploads/report2.pdf',
            },
            ],
        })
    }),
    http.get('/api/uploads/narrative-report/:id/download/', ({ params }) => {
        if (params.id === '11' || params.id === '12') {
        const blob = new Blob(['dummy pdf content'], { type: 'application/pdf' });
        return new HttpResponse(blob, {
            headers: { 'Content-Type': 'application/pdf' },
            status: 200,
        });
        }
        return HttpResponse.json({ detail: 'File not found' }, { status: 404 });
     }),

    http.post('/api/uploads/narrative-report/', async ({ request }) => {
        const formData = await request.formData();
        const title = formData.get('title');
        const file = formData.get('file');
        if (!file || !title) {
        return HttpResponse.json({ detail: 'Invalid upload' }, { status: 400 });
        }
        return HttpResponse.json({}, { status: 200 });
    })

];