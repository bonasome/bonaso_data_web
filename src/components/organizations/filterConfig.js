export const initial = {
    project: '',
}

export function filterConfig(projects, searchCallback){
    if(!projects) return []
    return [
        {name: 'project', label: 'In Project', type: 'select', constructors: {
            values: projects.map((p) => (p.id)),
            labels: projects.map((p) => (p.name)),
            search: true,
            searchCallback: searchCallback
        }},

    ]
}   