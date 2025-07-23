export default function activitiesConfig(meta, existing=null){
    return [
        {name: 'name', label: 'Activity Name', type: 'text', required: true, value: existing?.name ? existing.name : ''},
        {name: 'start', type: 'date', required: true, value: existing?.start ? existing.start : ''},
        {name: 'end', type: 'date', required: true, value: existing?.end ? existing.end : ''},
        {name: 'description', type: 'textarea', required: false, value: existing?.description ? existing.description : ''},

        {name: 'status', type: 'select', required: true, value: existing?.status ? existing.status : 'Planned', constructors: {
            values: meta.statuses,
            labels: meta.status_labels
        }},
        {name: 'category', type: 'select', required: true, value: existing?.category ? existing.category : 'general', constructors: {
            values: meta.activity_categories,
            labels: meta.activity_category_labels
        }},
        {name: 'visible_to_all', label: 'Make Visible to All Project Members?', rolerestrict: ['admin'], type: 'checkbox', required: false, value: existing?.visible_to_all ? existing.visible_to_all : false},
        {name: 'organization_ids', type: 'organization', required: false, value: existing?.organizations ? existing.organizations : [],  callbackText: 'Choose Organization'},
        {name: 'cascade_to_children', label: 'Cascade to your subgrantees?', type: 'checkbox', required: false, value: existing?.cascade_to_children ? existing.cascade_to_children : false}
    ]
}