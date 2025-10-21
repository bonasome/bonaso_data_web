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
            options: meta?.sexs,
        }},
        {name: 'age_range', label: 'Age Range', type: 'select', constructors: {
            options: meta?.age_ranges
        }},
    ]
}   