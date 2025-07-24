export default function respondentsConfig(respondentsMeta, existing=null){
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
            
            {name: 'id_no', label:'ID/Passport Number', type: 'text', required: true, hideonpath: true, value: existing?.id_no ? existing.id_no : ''},

            //show if not anonymous
            {name: 'first_name', label: 'First Name', type: 'text', required: true, hideonpath: true, value: existing?.first_name ? existing.first_name : ''},
            {name: 'last_name', label: 'Surname', type: 'text', required: true, hideonpath: true, value: existing?.last_name ? existing.last_name : ''},

            //always show
            {name: 'sex', label: 'Sex', type: 'select', required: true, value: existing?.sex ? existing.sex : '', constructors: {
                values: respondentsMeta?.sexs,
                multiple: false,
                labels: respondentsMeta?.sex_labels
            }},
            //show ONLY if anonymous
            {name: 'age_range', label: 'Age Range', type: 'select', required: true, showonpath:true, value: existing?.age_range ? existing.age_range : '', constructors: {
                values: respondentsMeta?.age_ranges,
                multiple: false, showonpath: true,
                labels: respondentsMeta?.age_range_labels
            }},
            //show if not anonymous
            {name: 'dob', label: 'Date of Birth', type: 'date', required: true, hideonpath: true, value: existing?.dob ? existing.dob : ''},
            {name: 'ward', label: 'Ward', type: 'text', required: false, hideonpath: true, value: existing?.ward ? existing.ward : ''},

            //always show
            {name: 'village', label: 'Village/Town/City', type: 'text', required: true, value: existing?.village ? existing.village : ''},
            {name: 'district', label: 'District', type: 'select', required: true, value: existing?.district ? existing.district : '', constructors: {
                values: respondentsMeta?.districts,
                multiple: false,
                labels: respondentsMeta?.district_labels
            }},
            {name: 'citizenship', label: 'Citizenship', type: 'text', value: existing?.citizenship ? existing.citizenship : 'Motswana', required: true, },
            
            {name: 'special_attribute_names', label: 'Special Attributes', type: 'multi-select', required: false, value: existing?.special_attribute ? special : [], constructors: {
                values: respondentsMeta?.special_attributes,
                labels: respondentsMeta?.special_attribute_labels
            }},

            {name: 'kp_status_names', label: 'Key Population Status', type: 'multi-select', required: false, value: existing?.kp_status ? kps : [], constructors: {
                values: respondentsMeta?.kp_types,
                labels: respondentsMeta?.kp_type_labels
            }},
            {name: 'disability_status_names', label: 'Disability Status', type: 'multi-select', required: false, value: existing?.disability_status ? dis: [], constructors: {
                values: respondentsMeta?.disability_types,
                labels: respondentsMeta?.disability_type_labels
            }},


            //show if not anonymous
            {name: 'email', label: 'Email', type: 'email', required: false, hideonpath: true, value: existing?.email ? existing.email : ''},
            {name: 'phone_number', label: 'Phone Number', type: 'number', required: false, hideonpath: true, value: existing?.phone_number ? existing.phone_number : ''},
        
        ]
}   