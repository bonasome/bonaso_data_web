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
            options: meta.statuses,
        }},
        {name: 'category', label: 'Activity Category', type: 'select', constructors: {
            options: meta.activity_categories,
        }},
        {name: 'organization', label: 'Involves Organization', type: 'select', constructors: {
            options: orgs.map((o) => ({value: o.id, label: o.name})),
            search: true,
            searchCallback: searchCallback
        }},
        {name: 'visible_to_all', label: 'Is Public?', type: 'select', constructors: {
            options: [{value: 'true', label: 'Visible to All'}, {value: 'false', label: 'Not Visible to All'}],
        }},
        {name: 'start', label: 'Starts After', type: 'date'},
        {name: 'end', label: 'Ends Before', type: 'date'},
    ]
}   