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
            options: orgs.map((org) => ({value: org.id, label: org.name})),
            search: true,
            searchCallback: searchCallback
        }},

        {name: 'model', label: 'Related to Data Type', type: 'select', constructors: {
            options: meta.models,
        }},

        {name: 'reason', label: 'Reason Type', type: 'select', constructors: {
            options: meta.flag_reasons,
        }},
        {name: 'resolved', label: 'Status', type: 'select', constructors: {
            options: [{value: 'true', label: 'Resolved'}, {value: 'false', label: 'Active'}],
        }},
        {name: 'auto', label: 'Made By', type: 'select', constructors: {
            options: [{value: 'true', label: 'Automatically Generated'}, {value: 'false', label: 'Human Generated'}],
        }},
        {name: 'start', label: 'Starts After', type: 'date'},
        {name: 'end', label: 'Ends Before', type: 'date'},

    ]
}   