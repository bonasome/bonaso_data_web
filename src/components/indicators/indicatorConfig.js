export default function indicatorConfig(ids, names, meta, searchCallback, existing=null){
    let subcats = []
    let attrs = []
    if(existing?.subcategories.length > 0){
        subcats = existing.subcategories.map((cat) => (cat.name))
    }
    if(existing?.required_attribute.length > 0){
        attrs = existing.required_attribute.map((a) => (a.name))
    }
    return [
        {name: 'code', label: 'Indicator code', type: 'text', required: true, value: existing?.code ? existing.code : ''},
        {name: 'name', label: 'Indicator Name', type: 'textarea', required: true, value: existing?.name ? existing.name : ''},
        {name: 'prerequisite_id', label: 'Prerequisite', type: 'select',  required: false, value: existing?.prerequisite?.id ? existing.prerequisite?.id : '',
            constructors: {
                values: ids,
                labels: names,
                multiple: false,
                search: true,
                searchCallback: searchCallback
        }},
        {name: 'description', label: 'Description', type: 'textarea', required: false, value: existing?.description ? existing.description : ''},
        {name: 'status', label: 'Indicator Status', type: 'select',  required: true, value: existing?.status ? existing.status : 'Active',
            constructors: {
                values: meta.statuses,
                labels: meta.statuses,
                multiple: false,
        }},
        {name: 'indicator_type', label: 'Indicator Type', type: 'select',  required: true, switchpath2: 'Respondent', value: existing?.indicator_type ? existing.indicator_type : 'Respondent',
            constructors: {
                values: meta.indicator_types,
                labels: meta.indicator_types,
                multiple: false,
        }},
        {name: 'required_attribute_names', label: 'Requires Special Respondent Attribute', type: 'select',  required: false, showonpath2: true, value: existing?.required_attribute ? attrs : [],
            constructors: {
                values: meta.required_attributes,
                labels: meta.required_attribute_labels,
                multiple: true,
        }},
        {name: 'allow_repeat', label:'Allow repeat interactions (within 30 days)?', type: 'checkbox', showonpath2:true, required: false, value: existing?.allow_repeat ? true: false},
        {name: 'require_numeric', label:'Require a Numeric Value?', type: 'checkbox', required: false, value: existing?.require_numeric ? true: false},
        {name: 'require_subcategories', label: 'Require Subcategories', type: 'checkbox', required: false, value: existing?.subcategories.length>0 ? true : false, switchpath: true},
        {name: 'subcategory_names', label: 'Subcategories', type: 'dynamic', required: false, value: existing?.subcategories.length > 0 ? subcats : [], showonpath: true},
    ]
}