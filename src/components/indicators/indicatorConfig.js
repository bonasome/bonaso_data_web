export default function indicatorConfig(meta, existing=null){
    if(!meta?.statuses) return [];
    let subcats = [];
    let attrs = [];
    console.log(meta)
    const allowed_attrs = meta?.required_attributes.filter(a => a.value === 'PLWHIV')
    if(existing?.subcategories?.length > 0){
        subcats = existing.subcategories.map((cat) => (cat))
    }
    if(existing?.required_attribute?.length > 0){
        attrs = existing.required_attribute.map((a) => (a.name))
    }
    
    return [
        {name: 'code', label: 'Indicator code', type: 'text', required: true, value: existing?.code ? existing.code : ''},
        {name: 'name', label: 'Indicator Name', type: 'textarea', required: true, value: existing?.name ? existing.name : ''},
        
        {name: 'description', label: 'Description', type: 'textarea', required: false, value: existing?.description ? existing.description : ''},
        {name: 'status', label: 'Indicator Status', type: 'select',  required: true, value: existing?.status ? existing.status : 'active',
            constructors: {
                values: meta.statuses.map((s) => (s.value)),
                labels: meta.statuses.map((s) => (s.label)),
        }},
        {name: 'indicator_type', label: 'Indicator Type', type: 'select',  required: true, switchpath2: 'respondent', value: existing?.indicator_type ? existing.indicator_type : 'respondent',
            constructors: {
                values: meta.indicator_types.map((t) => (t.value)),
                labels: meta.indicator_types.map((t) => (t.label)),
        }},
        {name: 'required_attribute_names', label: 'Requires Special Respondent Attribute', type: 'multi-select',  required: false, showonpath2: true, value: existing?.required_attribute ? attrs : [],
            constructors: {
                values: meta.required_attributes.map((a) => (a.value)),
                labels: meta.required_attributes.map((a) => (a.label)),
                multiple: true,
        }},
        {name: 'allow_repeat', label:'Allow repeat interactions (within 30 days)?', type: 'checkbox', showonpath2:true, required: false, value: existing?.allow_repeat ? true: false},
        {name: 'require_numeric', label:'Require a Numeric Value?', type: 'checkbox', required: false, value: existing?.require_numeric ? true: false},
        {name: 'prerequisite_ids', type: 'indicator-prereq', value: existing ? {prereqs: existing?.prerequisites, match: existing?.match_subcategories_to} : null},
        
        {name: 'require_subcategories', label: 'Require Subcategories', type: 'checkbox', required: false, value: existing?.subcategories?.length>0 ? true : false, switchpath: true, hideonpath3: true},
        {name: 'match_subcategories_to'},
        {name: 'subcategory_data', label: 'Subcategories', type: 'dynamic', required: false, 
            value: (existing?.subcategories?.length > 0 && !existing?.match_subcategories) ? subcats : [], 
            showonpath: true, hideonpath3: true},
        
        {name: 'governs_attribute', label: 'Set to Govern Respondent Attribute', type: 'select',  required: false, showonpath2: true, value: existing?.governs_attribute ? existing.governs_attribute : '',
        constructors: {
            values: allowed_attrs.map((a) => (a.value)),
            labels: allowed_attrs.map((a) => (a.label)),
        }},
    ]
}