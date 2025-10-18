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
    if(!meta?.category) return []
    let filters = [
        {name: 'category', label: 'Type', type: 'select', constructors: {
            values: meta.category.map((t) => (t.value)),
            labels: meta.category.map((t) => (t.label)),
        }},
    ]
        
    return filters;
}   