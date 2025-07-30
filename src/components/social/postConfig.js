import { FaFacebookSquare, FaInstagramSquare, FaTiktok, FaTwitter, FaYoutube, FaQuestion } from "react-icons/fa";

export default function postConfig(meta, existing){
    if(!meta || !meta?.platforms) return [];

    return [
        {name: 'name', label: 'Post Name', type: 'text', required: true, value: existing?.name ? existing.name : ''},
        {name: 'task_ids', type: 'multi-tasks', label: 'Select Associated Tasks',  required: true, value: existing?.tasks ? existing.tasks : [], callbackText: 'Add Task', toDisplay: ['indicator']['name']},
        {name: 'published_at', label: 'Published At', type: 'date', required: true, value: existing?.published_at ? existing.published_at : new Date().toISOString().split('T')[0]},
        {name: 'description', type: 'textarea', required: false, value: existing?.description ? existing.description : ''},
        {name: 'platform', type: 'image', label: 'What platform was this posted on?', required: true, switchpath: 'other', value: existing?.platform ? existing.platform : null, constructors: {
            values: meta.platforms.map((p) => (p.value)),
            labels: meta.platforms.map((p) => (p.label)),
            imgs: [FaFacebookSquare, FaInstagramSquare, FaTiktok, FaTwitter, FaYoutube, FaQuestion],
            multiple: false,
        }},
        {name: 'other_platform', type: 'text', label: 'Specify Other Platform', showonpath: true, value: existing?.other_platform ? existing.other_platform : ''}
    ]
}