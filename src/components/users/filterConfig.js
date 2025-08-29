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
            values: meta?.roles?.map((r) => (r.value)),
            labels: meta?.roles?.map((r) => (r.label)),
        }},

        {name: 'organization', label: 'User With Organization', type: 'select', constructors: {
            values: orgs?.map((org) => (org.id)),
            labels: orgs?.map((org) => (org.name)),
            search: true,
            searchCallback: orgSearchCallback,
        }},
        {name: 'active', label: 'User is Active', type: 'select', constructors: {
            values: ['true', 'false'],
            labels: ['Active', 'Inactive'],
        }},
    ]
    if(user.role == 'admin'){
        filters.push({name: 'client', label: 'User With Client', type: 'select', constructors: {
            values: clients?.map((c) => (c.id)),
            labels: clients?.map((c) => (c.name)),
            search: true,
            searchCallback: clientSearchCallback,
        }})
    }
    return filters
}   