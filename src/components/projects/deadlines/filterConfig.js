export const initial = {
    start: '',
    end: '',
    visible_to_all: '',
    organization: '',
}

export function filterConfig(orgs, searchCallback){
    return [
        {name: 'organization', label: 'Involves Organization', type: 'select', constructors: {
            values: orgs.map((o) => (o.id)),
            labels: orgs.map((o) => (o.name)),
            search: true,
            searchCallback: searchCallback
        }},
        {name: 'visible_to_all', label: 'Is Public?', type: 'select', constructors: {
            values: ['true', 'false'],
            labels: ['Visible to All', 'Not Visible to All'],
        }},
        {name: 'start', label: 'Starts After', type: 'date'},
        {name: 'end', label: 'Ends Before', type: 'date'},
    ]
}   