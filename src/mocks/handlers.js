import { http, HttpResponse } from 'msw';

export const handlers = [
    http.get('/api/record/respondents/meta/', () => {
        return HttpResponse.json({
            kp_types: ['FSW', 'MSM'],
            kp_type_labels: ['Female Sex Worker', 'Men who have Sex with Men'],
            disability_types: ['VI', 'HI'],
            disability_type_labels: ['Visual Impairment', 'Hearing Impairment']
        });
    }),

    http.get('/api/record/respondents/:id/sensitive-info/', () => {
        return HttpResponse.json({
            hiv_status_info: {
                hiv_positive: true,
                date_positive: '2023-06-01'
            },
            pregnancy_info: {
                is_pregnant: true,
                term_began: '2024-01-01',
                term_ended: '2024-05-01'
            },
            kp_status: [{ name: 'FSW' }],
            disability_status: [{ name: 'HI' }]
            });
    }),
];