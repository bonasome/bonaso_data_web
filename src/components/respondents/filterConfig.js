export const initial = {
    sex: '',
    age_range: '',
}

export function filterConfig(respondentsMeta){
    if(!respondentsMeta) return []
    return [
        {name: 'sex', label: 'Sex', type: 'select', constructors: {
            values: respondentsMeta?.sexs?.map((s) => (s.value)),
            labels: respondentsMeta?.sexs?.map((s) => (s.label)),
        }},
        {name: 'age_range', label: 'Age Range', type: 'select', constructors: {
            values: respondentsMeta?.age_ranges?.map((ar) => (ar.value)),
            labels: respondentsMeta?.age_ranges?.map((ar) => (ar.label)),
        }},
    ]
}   