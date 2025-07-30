export const initial = {
    status: '',
    start: '',
    end: '',
}

export function filterConfig(meta){
    if(!projects) return []
    return [
        {name: 'status', label: 'In Project', type: 'select', constructors: {
            values: meta.statuses.map((s) => (s.value)),
            labels: meta.statuses.map((s) => (s.label)),
        }},
        {name: 'start', label: 'Starts After', type: 'date'},
        {name: 'end', label: 'Ends Before', type: 'date'},

    ]
}   