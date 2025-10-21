export const initial = {
    //set initial filter values
    host: '',
    type: '',
    status: '',
    start: '',
    end: '',
}

export function filterConfig(meta, orgs, searchCallback){
    /*
    Config function that tells the filter component (src/components/reuseables/Filter.jsx) what inputs to build
    - meta (object): the events meta for building options
    - orgs (array): an array of organizations for constructing the host filter
    - searchCallaback (function): a function that passes value from the select component to the api that 
        gets the organizations.
    */

    if(!meta?.statuses) return [];
    return [
        {name: 'status', label: 'Status', type: 'select', constructors: {
            options: meta.statuses,
        }},
        {name: 'type', label: 'Event Type', type: 'select', constructors: {
            options: meta.event_types
        }},
        {name: 'host', label: 'Event Host', type: 'select', constructors: {
            options: orgs.map((org) => ({value: org.id, label: org.name})),
            search: true,
            searchCallback: searchCallback
        }},
        {name: 'start', label: 'Starts After', type: 'date'},
        {name: 'end', label: 'Ends Before', type: 'date'},
    ]
}   