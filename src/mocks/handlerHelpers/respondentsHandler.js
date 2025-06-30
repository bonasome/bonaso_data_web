import { getTaskSubcats } from './projectHandler';
import { http, HttpResponse } from 'msw';

export const getRespondentsMeta = {
    districts: ['central', 'southern', 'northern'],
    district_labels: ['Central', 'Southern', 'Northern'],
    sexs: ['male', 'female', 'other'],
    sex_labels: ['Male', 'Female', 'Other'],
    age_ranges: ['under_18', '18_24', '25_34', '35_49', '50_plus'],
    age_range_labels: ['Under 18', '18–24', '25–34', '35–49', '50+'],
    kp_types: ['msm', 'fsw', 'pwid', 'prisoners'],
    kp_type_labels: ['MSM', 'FSW', 'PWID', 'Prisoners'],
    disability_types: ['visual', 'hearing', 'mobility', 'cognitive'],
    disability_type_labels: ['Visual', 'Hearing', 'Mobility', 'Cognitive']
}

export const getRespondentsList = [
   {
    'id': 1,
    'first_name': 'John',
    'last_name': 'Doe',
    'village': 'Village X'
   },
   {
    'id': 2,
    'first_name': 'Jane',
    'last_name': 'Doe',
    'village': 'Village Y'
   }  
]

export const getRespondentDetail = {
    id: 1,
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    is_anonymous: false,
    first_name: "John",
    last_name: "Doe",
    sex: "male",
    ward: "Ward A",
    village: "Village X",
    district: "central",
    citizenship: "Country Z",
    comments: "Regular participant",
    email: "john.doe@example.com",
    phone_number: "+123456789",
    dob: "1990-05-15",
    age_range: "30-39",
    created_by: {id: 2, username: 'test'},
    updated_by: {id: 3, username: 'test2'}
}
export const getRespondentSensitive = {
    id: 1,
    kp_status: [
        { id: 1, name: 'fsw' },
        { id: 2, name: 'msm' },
    ],
    pregnancy_info: {
        is_pregnant: true,
        term_began: '2025-04-01',
        term_ended: null,
    },
    hiv_status_info: {
        hiv_positive: true,
        date_positive: '2024-10-10',
    },
    disability_status: [
        { id: 1, name: 'visual' },
    ],
    created_by: {id: 2, username: 'test'},
    updated_by: null,
};

export const getAnonRespondentDetail = {
    id: 2,
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    is_anonymous: true,
    sex: "male",
    village: "Village X",
    district: "District Y",
    citizenship: "Country Z",
    comments: "Regular participant",
    age_range: "30-39",
    created_by: {id: 2, username: 'test'},
    updated_by: {id: 3, username: 'test2'}
}

export const getInteractions = [{
    id: 1,
    respondent: 5,
    task_detail: getTaskSubcats,
    subcategories: [
        { id: 101, name: 'CCC' },
        { id: 103, name: 'Testing' }
    ],
    numeric_component: 25,
    interaction_date: '2025-06-26',
    comments: 'Follow-up needed',
    flagged: false,
    created_by: {id: 2, username: 'test'},
    updated_by: null,
}]

export const postInteractionBatch = http.post(
  '/api/record/interactions/batch/',
  async ({ request }) => {
    const body = await request.json();

    const errors = [];

    // Top-level validation
    if (!body.respondent || typeof body.respondent !== 'number') {
      errors.push('Invalid or missing respondent ID');
    }

    if (!body.interaction_date || isNaN(Date.parse(body.interaction_date))) {
      errors.push('Invalid or missing interaction date');
    }

    if (!Array.isArray(body.tasks)) {
      errors.push('Tasks must be an array');
    }

    // Task-level validation
    body.tasks?.forEach((task, i) => {
      if (typeof task.task !== 'number') {
        errors.push(`Task ${i + 1}: Missing or invalid task ID`);
      }
      if (task.subcategory_names && !Array.isArray(task.subcategory_names)) {
        errors.push(`Task ${i + 1}: subcategory_names must be an array`);
      }
    });

    if (errors.length > 0) {
      return HttpResponse.json({ errors }, { status: 400 });
    }

    // Mock a successful response
    return HttpResponse.json({ message: 'Interactions recorded successfully' }, { status: 201 });
  }
);

export const patchInteraction =  http.patch(
    '/api/record/interactions/:id', async ({ request }) => {
    const body = await request.json();

    // Simple validation
    if (!body || !body.respondent || !body.task || !body.interaction_date) {
        return HttpResponse.json(
        { detail: 'Missing required fields' },
        { status: 400 }
        );
    }

    return HttpResponse.json( { status: 200 });
});