export const initial = {
    //default filter values
    start: '',
    end: '',
    visible_to_all: '',
    organization: '',
}

export function filterConfig(orgs, searchCallback){
    /*
    Config function that tells the filter component (src/components/reuseables/Filter.jsx) what inputs to build
    - orgs (array): an array of projects that can be selected
    - searchCallback (function): pass search value from select component to the API.
    */
    return [
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