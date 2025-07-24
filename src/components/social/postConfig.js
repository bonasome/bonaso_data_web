export default function postConfig(meta, existing){
    return [
        {name: 'name', label: 'Post Name', type: 'text', required: true, value: existing?.name ? existing.name : ''},
        {name: 'task_ids', type: 'multi-tasks', label: 'Select Associated Tasks',  required: true, value: existing?.tasks ? existing.tasks : [], callbackText: 'Add Task', toDisplay: ['indicator']['name']},
        {name: 'published_at', label: 'Published At', type: 'date', required: true, value: existing?.published_at ? existing.published_at : new Date().toISOString().split('T')[0]},
        {name: 'description', type: 'textarea', required: false, value: existing?.description ? existing.description : ''},
        {name: 'platform', type: 'select', required: true, switchpath: 'other', value: existing?.platform ? existing.platform : '', constructors: {
            values: meta.platforms,
            labels: meta.platform_labels
        }},
        {name: 'other_platform', type: 'text', label: 'Specify Other Platform', showonpath: true, value: existing?.other_platform ? existing.other_platform : ''}
    ]
}