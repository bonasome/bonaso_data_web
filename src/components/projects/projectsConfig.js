export default function projectsConfig(meta, existing=null){
    return [
        {name: 'name', label: 'Project Name', type: 'text', required: true, value: existing?.name ? existing.name : ''},
        {name: 'start', type: 'date', required: true, value: existing?.start ? existing.start : ''},
        {name: 'end', type: 'date', required: true, value: existing?.end ? existing.end : ''},
        {name: 'client_id', type: 'client', label: 'Select a Client',  required: true, value: existing?.client ? existing.client : '', callbackText: 'Choose Client'},
        {name: 'status', type: 'select', required: true, value: existing?.status ? existing.status : '', constructors: {
            values: meta.statuses,
        }},
        {name: 'description', type: 'textarea', required: false, value: existing?.description ? existing.description : ''}
    ]
}