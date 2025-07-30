export default function userConfig(meta, existing=null){
    if(!meta?.roles) return [];
    console.log(meta)
    let fields = [
        {name: 'username', label: 'Username', type: 'text', required: true, value: existing?.username ? existing.username : ''},
        {name: 'organization', label: 'User Organization', type: 'organization', required: false, value: existing?.organization_detail ? existing.organization_detail : '',},
        {name: 'first_name', label: 'First Name', type: 'text', required: true, value: existing?.first_name ? existing.first_name : ''},
        {name: 'last_name', label:'Last Name', type: 'text', required: true, value: existing?.last_name ? existing.last_name : ''},
        {name: 'email', label: 'Email', type: 'email', required: false, value: existing?.email ? existing.email : ''},
        {name: 'role', rolerestrict: ['admin'], label: 'User Role', type: 'select', switchpath: 'client',  required: true, value: existing?.role ? existing.role : '',
            constructors: {
                values: meta?.roles?.map((r) => (r.value)),
                labels: meta?.roles?.map((r) => (r.label)),
        }},
        {name: 'client_id',  label: 'Select a Client', rolerestrict:['admin'], type: 'client', showonpath: true, required: false},
    ]
    if(!existing){
        fields.push({name: 'password', label: 'Enter Password', type: 'password', required: true, value: ''})
        fields.push({name: 'confirm_password', label: 'Confirm Password', type: 'password', required: true, value: ''})
    }
    return fields
}