export default function respondentsConfig(respondentsMeta, existing=null){
        return [
            //always show
            {name: 'is_anonymous', label: 'Does this respondent want to remain anonymous', type: 'checkbox', required: true, switchpath: true, value: existing?.is_anonymous ? existing.is_anonymous : false},
            
            !existing && {name: 'id_no', label:'ID/Passport Number', type: 'text', required: true, hideonpath: true},
            //this is a little odd, but we need a way to switch from anon to not anon, but if the id already exists, that should not be editable (we don't want to send that to the front-end), so we check if they have a non anon required field and if not, assume they have no id and render it
            existing && !existing?.first_name && {name: 'id_no', label:'ID/Passport Number', type: 'text', required: true, hideonpath: true},
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
            {name: 'village', label: 'Village', type: 'text', required: true, value: existing?.village ? existing.village : ''},
            {name: 'district', label: 'District', type: 'select', required: true, value: existing?.district ? existing.district : '', constructors: {
                values: respondentsMeta?.districts,
                multiple: false,
                labels: respondentsMeta?.district_labels
            }},
            {name: 'citizenship', label: 'Citizenship', type: 'text', value: existing?.citizenship ? existing.citizenship : 'Motswana', required: true, },
            
            //show if not anonymous
            {name: 'email', label: 'Email', type: 'email', required: false, hideonpath: true, value: existing?.email ? existing.email : ''},
            {name: 'phone_number', label: 'Phone Number', type: 'number', required: false, hideonpath: true, value: existing?.phone_number ? existing.phone_number : ''},
        
        ]
}   