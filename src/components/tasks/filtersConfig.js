export const initial = {
    organization: '',
    project: '',
}

export function filterConfig(orgs, projects, oSC, pSC, user){
    let filters = [
        {name: 'project', label: 'For Project', type: 'select', constructors: {
            values: projects.map((t) => (t.id)),
            labels: projects.map((t) => (t.name)),
            search: true,
            searchCallback: pSC
        }}
    ]
    if(['admin', 'client', 'manager', 'meofficer'].includes(user.role)){
        filters.push({name: 'organization', label: 'For Organization', type: 'select', constructors: {
            values: orgs.map((t) => (t.id)),
            labels: orgs.map((t) => (t.name)),
            search: true,
            searchCallback: oSC
        }})
    }
    return filters
}   