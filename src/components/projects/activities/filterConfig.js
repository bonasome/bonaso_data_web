export const initial = {
    //initial filter values
    status: '',
    start: '',
    end: '',
    category: '',
    visible_to_all: '',
    organization: '',
}

export function filterConfig(meta, orgs, searchCallback){
    /*
    Config function that tells the filter component (src/components/reuseables/Filter.jsx) what inputs to build
    - meta (object): model information for building options
    - orgs (array): an array of projects that can be selected
    - searchCallback (function): pass search value from select component to the API.
    */
    if(!meta?.statuses) return [];
    return [
        {name: 'status', label: 'Activity Status', type: 'select', constructors: {
            values: meta.statuses.map((s) => (s.value)),
            labels: meta.statuses.map((s) => (s.label)),
        }},
        {name: 'category', label: 'Activity Category', type: 'select', constructors: {
            values: meta.activity_categories.map((c) => (c.value)),
            labels: meta.activity_categories.map((c) => (c.label)),
        }},
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