export const initial = {
    role: '',
    organization: '',
    client: '',
    active: 'true',
}

export function filterConfig(meta, orgs, clients, orgSearchCallback, clientSearchCallback, user){
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
    ]
    if(user.role == 'admin'){
        filters.push({name: 'client', label: 'User With Client', type: 'select', constructors: {
            values: clients?.map((c) => (c.id)),
            labels: clients?.map((c) => (c.name)),
            search: true,
            searchCallback: clientSearchCallback,
        }})

        filters.push({name: 'active', label: 'User is Active', type: 'select', constructors: {
            values: ['true', 'false'],
            labels: ['Active', 'Inactive'],
        }})
    }
    return filters
}   