export const initial = {
    indicator_type: '',
    status: '',
}

export function filterConfig(meta){
    if(!meta) return []
    return [
        {name: 'indicator_type', label: 'Type', type: 'select', constructors: {
            values: meta.indicator_types.map((t) => (t.value)),
            labels: meta.indicator_types.map((t) => (t.label)),
        }},

        {name: 'status', label: 'Status', type: 'select', constructors: {
            values: meta.statuses.map((s) => (s.value)),
            labels: meta.statuses.map((s) => (s.label)),
        }},
    ]
}   