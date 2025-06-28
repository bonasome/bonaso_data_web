export default function indicatorConfig(ids, names, statuses, searchCallback, existing=null){
    let subcats = []
    if(existing?.subcategories.length > 0){
        subcats = existing.subcategories.map((cat) => (cat.name))
    }
    return [
        {name: 'code', label: 'Indicator code', type: 'text', required: true, value: existing?.code ? existing.code : ''},
        {name: 'name', label: 'Indicator Name', type: 'text', required: true, value: existing?.name ? existing.name : ''},
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
                values: statuses,
                labels: statuses,
                multiple: false,
        }},
        {name: 'require_numeric', label:'Require a Numeric Value?', type: 'checkbox', required: false, value: existing?.require_numeric ? true: false},
        {name: 'require_subcategories', label: 'Require Subcategories', type: 'checkbox', required: false, value: existing?.subcategories.length>0 ? true : false, switchpath: true},
        {name: 'subcategory_names', label: 'Subcategories', type: 'dynamic', required: false, value: existing?.subcategories.length > 0 ? subcats : [], showonpath: true},
    ]

}