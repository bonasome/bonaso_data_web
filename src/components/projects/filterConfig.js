export const initial = {
    //set default values
    status: '',
    start: '',
    end: '',
}

export function filterConfig(meta){
    /*
    Config function that tells the filter component (src/components/reuseables/Filter.jsx) what inputs to build
    - meta (object): model information for building options
    */
    if(!meta?.statuses) return [];
    return [
        {name: 'status', label: 'Project Status', type: 'select', constructors: {
            values: meta.statuses.map((s) => (s.value)),
            labels: meta.statuses.map((s) => (s.label)),
        }},
        {name: 'start', label: 'Starts After', type: 'date'},
        {name: 'end', label: 'Ends Before', type: 'date'},
    ]
}   