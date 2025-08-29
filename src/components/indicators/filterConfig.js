export const initial = {
    //initial filter values
    indicator_type: '',
    status: '',
}

export function filterConfig(meta, user){
    /*
    Config function that tells the filter component (src/components/reuseables/Filter.jsx) what inputs to build
    - meta (object): the indicators meta for building options
    - user (object): the user for permissions checks
    */
    if(!meta?.indicator_types) return []
    let filters = [
        {name: 'indicator_type', label: 'Type', type: 'select', constructors: {
            values: meta.indicator_types.map((t) => (t.value)),
            labels: meta.indicator_types.map((t) => (t.label)),
        }},
    ]
    //since non-active indicators should not be visible to non-admins
    if(user.role == 'admin'){
        filters.push({name: 'status', label: 'Status', type: 'select', constructors: {
            values: meta.statuses.map((s) => (s.value)),
            labels: meta.statuses.map((s) => (s.label)),
        }})
    }

        
    return filters;
}   