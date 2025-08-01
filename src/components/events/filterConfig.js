export const initial = {
    host: '',
    type: '',
    status: '',
    start: '',
    end: '',
}

export function filterConfig(meta, orgs, searchCallback){
    if(!meta?.statuses) return [];
    return [
        {name: 'status', label: 'Status', type: 'select', constructors: {
            values: meta.statuses.map((s) => (s.value)),
            labels: meta.statuses.map((s) => (s.label)),
        }},
        {name: 'type', label: 'Event Type', type: 'select', constructors: {
            values: meta.event_types.map((c) => (c.value)),
            labels: meta.event_types.map((c) => (c.label)),
        }},
        {name: 'host', label: 'Event Host', type: 'select', constructors: {
            values: orgs.map((c) => (c.id)),
            labels: orgs.map((c) => (c.name)),
            search: true,
            searchCallback: searchCallback
        }},
        {name: 'start', label: 'Starts After', type: 'date'},
        {name: 'end', label: 'Ends Before', type: 'date'},
    ]
}   