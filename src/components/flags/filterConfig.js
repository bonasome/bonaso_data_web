export const initial = {
    //set initial filter values
    organization: '',
    model: '',
    reason: '',
    start: '',
    end: '',
    resolved: '',
    auto: '',
}

export function filterConfig(meta, orgs, searchCallback){
    /*
    Config function that tells the filter component (src/components/reuseables/Filter.jsx) what inputs to build
    - meta (object): the events meta for building options
    - orgs (array): an array of organizations for constructing the host filter
    - searchCallaback (function): a function that passes value from the select component to the api that 
        gets the organizations.
    */
    if(!meta?.flag_reasons) return []
    return [
        
        {name: 'organization', label: 'Organization', type: 'select', constructors: {
            values: orgs.map((t) => (t.id)),
            labels: orgs.map((t) => (t.name)),
            search: true,
            searchCallback: searchCallback
        }},

        {name: 'model', label: 'Related to Data Type', type: 'select', constructors: {
            values: meta.models.map((m) => (m.value)),
            labels: meta.models.map((m) => (m.label)),
        }},

        {name: 'reason', label: 'Reason Type', type: 'select', constructors: {
            values: meta.flag_reasons.map((s) => (s.value)),
            labels: meta.flag_reasons.map((s) => (s.label)),
        }},
        {name: 'resolved', label: 'Status', type: 'select', constructors: {
            values: ['true', 'false'],
            labels: ['Resolved', 'Active'],
        }},
        {name: 'auto', label: 'Made By', type: 'select', constructors: {
            values: ['true', 'false'],
            labels: ['Automatically Generated', 'Human Generated'],
        }},
        {name: 'start', label: 'Starts After', type: 'date'},
        {name: 'end', label: 'Ends Before', type: 'date'},

    ]
}   