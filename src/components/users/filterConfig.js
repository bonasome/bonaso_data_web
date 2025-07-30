export const initial = {
    role: '',
    organization: '',
    client_organization: '',
    active: '',
}

export function filterConfig(meta, orgs, clients, orgSearchCallback, clientSearchCallback){
    if(!meta) return [];

    return [
        {name: 'role', label: 'User Role', type: 'select', constructors: {
            values: meta?.roles?.map((r) => (r.value)),
            labels: meta?.roles?.map((r) => (r.label)),
        }},
        
        {name: 'organization', label: 'User With Organization', type: 'select', constructors: {
            values: orgs?.map((org) => (org.name)),
            labels: orgs?.map((org) => (org.id)),
            search: true,
            searchCallback: orgSearchCallback,
        }},

        {name: 'client_org', label: 'User With Client', type: 'select', constructors: {
            values: clients?.map((c) => (c.name)),
            labels: clients?.map((c) => (c.id)),
            search: true,
            searchCallback: clientSearchCallback,
        }},

        {name: 'active', label: 'User is Active', type: 'select', constructors: {
            values: ['true', 'false'],
            labels: ['Active', 'Inactive'],
        }},
    ]
}   