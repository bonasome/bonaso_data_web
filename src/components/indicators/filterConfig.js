export const initial = {
    indicator_type: '',
    status: '',
}

export function filterConfig(meta, user){
    if(!meta?.indicator_types) return []
    let filters = [
        {name: 'indicator_type', label: 'Type', type: 'select', constructors: {
            values: meta.indicator_types.map((t) => (t.value)),
            labels: meta.indicator_types.map((t) => (t.label)),
        }},
    ]
    if(user.role == 'admin'){
        filters.push({name: 'status', label: 'Status', type: 'select', constructors: {
            values: meta.statuses.map((s) => (s.value)),
            labels: meta.statuses.map((s) => (s.label)),
        }})
    }

        
    return filters;
}   