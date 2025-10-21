export const initial = {
    //initial/default filter values
    role: '',
    organization: '',
    client: '',
    active: 'true',
}

export function filterConfig(meta, orgs, clients, orgSearchCallback, clientSearchCallback, user){
    /*
    Config function that tells the filter component (src/components/reuseables/Filter.jsx) what inputs to build
    - meta (object): information about the user model
    - orgs (array): list of organizations
    - clients (array): list of client_organizations
    - orgSearcgCallback (function): passes search value from select component in Filter to the parent component for searching the org API
    - psc (function): passes search value from select component in Filter to the parent component for seraching the client org API
    - user (object): the user, so perms can show/hide certain filters
    */
    if(!meta?.roles) return [];
    let filters = [
        {name: 'role', label: 'User Role', type: 'select', constructors: {
            options: meta?.roles,
        }},

        {name: 'organization', label: 'User With Organization', type: 'select', constructors: {
            options: orgs?.map((org) => ({value: org.id, label: org.name})),
            search: true,
            searchCallback: orgSearchCallback,
        }},
        {name: 'active', label: 'User is Active', type: 'select', constructors: {
            options: [{value: 'true', label: 'Active'}, {value: 'false', label: 'Inactive'}],
        }},
    ]
    if(user.role == 'admin'){
        filters.push({name: 'client', label: 'User With Client', type: 'select', constructors: {
            options: clients?.map((c) => ({value: c.id, label: c.name})),
            search: true,
            searchCallback: clientSearchCallback,
        }})
    }
    return filters
}   