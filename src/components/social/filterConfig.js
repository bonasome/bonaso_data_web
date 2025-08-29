export const initial = {
    //set initial values
    platform: '',
    start: '',
    end: '',
}

export function filterConfig(meta){
    /*
    Config function that tells the filter component (src/components/reuseables/Filter.jsx) what inputs to build
    - meta (object): the posts meta for building options
    */
    if(!meta?.platforms) return []
    return [
        {name: 'platform', label: 'Platform Used', type: 'select', constructors: {
            values: meta.platforms.map((s) => (s.value)),
            labels: meta.platforms.map((s) => (s.label)),
        }},
        {name: 'start', label: 'Starts After', type: 'date'},
        {name: 'end', label: 'Ends Before', type: 'date'},
    ]
}   