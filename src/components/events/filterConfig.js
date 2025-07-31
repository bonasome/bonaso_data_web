export const initial = {
    organization: '',
    category: '',
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
        {name: 'category', label: 'Category', type: 'select', constructors: {
            values: meta.categories.map((c) => (c.value)),
            labels: meta.categories.map((c) => (c.label)),
        }},
        {name: 'organization', label: 'Organization', type: 'select', constructors: {
            values: orgs.categories.map((c) => (c.id)),
            labels: orgs.categories.map((c) => (c.name)),
            search: true,
            searchCallback: searchCallback
        }},
        {name: 'start', label: 'Starts After', type: 'date'},
        {name: 'end', label: 'Ends Before', type: 'date'},
    ]
}   