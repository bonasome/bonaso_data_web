export default function deadlinesConfig(existing=null){
    return [
        {name: 'name', label: 'Deadline Name', type: 'text', required: true, value: existing?.name ? existing.name : ''},
        {name: 'deadline_date', label: 'Due Date', type: 'date', required: true, value: existing?.deadline_date ? existing.deadline_date : ''},
        {name: 'description', type: 'textarea', required: false, value: existing?.description ? existing.description : ''},
        {name: 'visible_to_all', label: 'Make Visible to All Project Members?', rolerestrict: ['admin'], type: 'checkbox', required: false, value: existing?.visible_to_all ? existing.visible_to_all : false},
        {name: 'organization_ids', type: 'organization', required: false, value: existing?.organizations ? existing.organizations : [],  callbackText: 'Choose Organization'},
        {name: 'cascade_to_children', label: 'Cascade to your subgrantees?', type: 'checkbox', required: false, value: existing?.cascade_to_children ? existing.cascade_to_children : false}
    ]
}