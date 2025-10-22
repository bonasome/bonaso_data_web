export const initial = {
    //load initial values
    project: '',
    organization: '',
}

export function filterConfig(projects, projSearchCallback, orgs, orgSearchCallback){
    /*
    Config function that tells the filter component (src/components/reuseables/Filter.jsx) what inputs to build
    - projects (array): an array of projects that can be selected
    -  projSearchCallback (function): pass search value from select component to the API.
    - orgs (array): an array of orgs that can be selected
    -  orgSearchCallback (function): pass search value from select component to the API.
    */
    if(!projects) return []
    return [
        {name: 'project', label: 'For Project', type: 'select', constructors: {
            options: projects.map((p) => ({value:p.id, label: p.name})),
            search: true,
            searchCallback: projSearchCallback
        }},
        {name: 'organization', label: 'For Organization', type: 'select', constructors: {
            options: orgs.map((o) => ({value:o.id, label: o.name})),
            search: true,
            searchCallback: orgSearchCallback
        }},

    ]
}   