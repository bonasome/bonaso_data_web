export const initial = {
    //set initial values
    sex: '',
    age_range: '',
}

export function filterConfig(meta){
    /*
    Config function that tells the filter component (src/components/reuseables/Filter.jsx) what inputs to build
    - meta (object): the events meta for building options
    */
    if(!meta) return []
    return [
        {name: 'sex', label: 'Sex', type: 'select', constructors: {
            values: meta?.sexs?.map((s) => (s.value)),
            labels: meta?.sexs?.map((s) => (s.label)),
        }},
        {name: 'age_range', label: 'Age Range', type: 'select', constructors: {
            values: meta?.age_ranges?.map((ar) => (ar.value)),
            labels: meta?.age_ranges?.map((ar) => (ar.label)),
        }},
    ]
}   