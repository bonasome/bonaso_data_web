export const initial = {
    //load initial values
    project: '',
}

export function filterConfig(projects, searchCallback){
    /*
    Config function that tells the filter component (src/components/reuseables/Filter.jsx) what inputs to build
    - projects (array): an array of projects that can be selected
    -  searchCallback (function): pass search value from select component to the API.
    */
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