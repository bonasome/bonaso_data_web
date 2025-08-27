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