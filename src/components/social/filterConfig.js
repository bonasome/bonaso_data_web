export const initial = {
    platform: '',
    start: '',
    end: '',
}

export function filterConfig(meta){
    if(!meta?.platforms) return []
    return [
        {name: 'platform', label: 'Platform Used', type: 'select', constructors: {
            values: meta.platforms.map((s) => (s.value)),
            labels: meta.platforms.map((s) => (s.label)),
        }},
        {name: 'start', label: 'Starts After', type: 'date'},
        {name: 'end', label: 'Ends Before', type: 'date'},
    ]
}   