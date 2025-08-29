export const initial = {
    /*
    default values
    */
    organization: '',
    project: '',
}

export function filterConfig(orgs, projects, oSC, pSC, user){
    /*
    Config function that tells the filter component (src/components/reuseables/Filter.jsx) what inputs to build
    - orgs (array): gets a list of orgs from all of the tasks
    - projects (projects): gets a list of projects from all of the tasks
    - osc (function): function that allows search value to be passed from org select to parent component
    - psc (function): function that allows search value to be passed from project component to parent component
    */
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