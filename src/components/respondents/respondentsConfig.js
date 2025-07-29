export default function respondentsConfig(meta, existing=null){
    if(!meta?.sexs) return [];

    //for our m2m fields, map existing values first, else return empty arrays
    let special = []
    let kps = []
    let dis = []
    if(existing && existing.special_attribute){
        special = existing.special_attribute.map((s) => (s.name))
    }
    if(existing && existing.kp_status){
        kps = existing.kp_status.map((kp) => (kp.name))
    }
    if(existing && existing.disability_status){
        dis = existing.disability_status.map((d) => (d.name))
    }

    return [
        //always show
        {name: 'is_anonymous', label: 'Does this respondent want to remain anonymous', type: 'checkbox', required: true, switchpath: true, value: existing?.is_anonymous ? existing.is_anonymous : false},

        //show if not anonymous
        {name: 'id_no', label:'ID/Passport Number', type: 'text', required: true, hideonpath: true, value: existing?.id_no ? existing.id_no : ''},
        {name: 'first_name', label: 'First Name', type: 'text', required: true, hideonpath: true, value: existing?.first_name ? existing.first_name : ''},
        {name: 'last_name', label: 'Surname', type: 'text', required: true, hideonpath: true, value: existing?.last_name ? existing.last_name : ''},

        //always show
        {name: 'sex', label: 'Sex', type: 'select', required: true, value: existing?.sex ? existing.sex : '', constructors: {
            values: meta.sexs.map((s) => (s.value)),
            labels: meta.sexs.map((s) => (s.label)),
        }},
        //show ONLY if anonymous
        {name: 'age_range', label: 'Age Range', type: 'select', required: true, showonpath:true, value: existing?.age_range ? existing.age_range : '', constructors: {
            values: meta.age_ranges.map((a) => (a.value)),
            labels: meta.age_ranges.map((a) => (a.label)),
        }},
        //show if not anonymous
        {name: 'dob', label: 'Date of Birth', type: 'date', required: true, hideonpath: true, value: existing?.dob ? existing.dob : ''},
        {name: 'ward', label: 'Ward', type: 'text', required: false, hideonpath: true, value: existing?.ward ? existing.ward : ''},

        //always show
        {name: 'village', label: 'Village/Town/City (Primary Place of Residence)', type: 'text', required: true, value: existing?.village ? existing.village : ''},
        {name: 'district', label: 'District', type: 'select', required: true, value: existing?.district ? existing.district : '', constructors: {
            values: meta.districts.map((d) => (d.value)),
            labels: meta.districts.map((d) => (d.label)),
        }},
        {name: 'citizenship', label: 'Citizenship', type: 'text', value: existing?.citizenship ? existing.citizenship : 'Motswana', required: true, },
        
        {name: 'special_attribute_names', label: 'Special Attributes', type: 'multi-select', required: false, value: existing?.special_attribute ? special : [], constructors: {
            values: meta.special_attributes.filter(a => (!['PLWHIV', 'KP', 'PWD'].includes(a.value))).map((a) => (a.value)),
            labels: meta.special_attributes.filter(a => (!['PLWHIV', 'KP', 'PWD'].includes(a.value))).map((a) => (a.label)),
        }},

        {name: 'kp_status_names', label: 'Key Population Status', type: 'multi-select', required: false, value: existing?.kp_status ? kps : [], constructors: {
            values: meta.kp_types.map((kp) => (kp.value)),
            labels: meta.kp_types.map((kp) => (kp.label)),
        }},
        {name: 'disability_status_names', label: 'Disability Status', type: 'multi-select', required: false, value: existing?.disability_status ? dis: [], constructors: {
            values: meta.disability_types.map((d) => (d.value)),
            labels: meta.disability_types.map((d) => (d.label)),
        }},


        //show if not anonymous
        {name: 'email', label: 'Email', type: 'email', required: false, hideonpath: true, value: existing?.email ? existing.email : ''},
        {name: 'phone_number', label: 'Phone Number', type: 'number', required: false, hideonpath: true, value: existing?.phone_number ? existing.phone_number : ''},
    
    ]
}   