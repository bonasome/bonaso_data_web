export default function userConfig(orgIDs, orgNames, existing=null){
    const roles = ['data_collector', 'manager', 'meofficer', 'view_only', 'admin']
    const roleNames = ['Data Collector', 'Manager', 'M&E Officer', 'Viewer', 'Site Administrator']
    if(!existing){
        return [
        {name: 'username', label: 'Username', type: 'text', required: true, value: existing?.username ? existing.username : ''},
        {name: 'password', label: 'Password', type: 'text', required: true, value: ''},
        {name: 'confirm_password', label: 'Confirm Password', type: 'text', required: true, value: ''},
        {name: 'organization', label: 'User Organization', type: 'select',  required: true, value: existing?.organization?.id ? existing.organization?.id : '',
            constructors: {
                values: orgIDs,
                labels: orgNames,
                multiple: false,
        }},
        {name: 'first_name', label: 'First Name', type: 'text', required: true, value: existing?.first_name ? existing.first_name : ''},
        {name: 'last_name', label:'Last Name', type: 'text', required: true, value: existing?.last_name ? existing.last_name : ''},
        {name: 'email', label: 'Email', type: 'email', required: false, value: existing?.email ? existing.email : ''},
        {name: 'role', rolerestrict:['admin'], label: 'User Role', type: 'select',  required: true, value: existing?.role ? existing.role : '',
            constructors: {
                values: roles,
                labels: roleNames,
                multiple: false,
        }},
    ]
    }
    if(existing){
        return [
            {name: 'username', label: 'Username', type: 'text', required: true, value: existing?.username ? existing.username : ''},
            {name: 'organization_id', label: 'User Organization', type: 'select',  required: true, value: existing?.organization?.id ? existing.organization?.id : '',
                constructors: {
                    values: orgIDs,
                    labels: orgNames,
                    multiple: false,
            }},
            {name: 'first_name', label: 'First Name', type: 'text', required: true, value: existing?.last_name ? existing.last_name : ''},
            {name: 'last_name', label:'Last Name', type: 'text', required: true, value: existing?.first_name ? existing.first_name : ''},
            {name: 'email', label: 'Email', type: 'email', required: false, value: existing?.email ? existing.email : ''},
            {name: 'role', rolerestrict: ['admin'], label: 'User Role', type: 'select',  required: true, value: existing?.role ? existing.role : '',
                constructors: {
                    values: roles,
                    labels: roleNames,
                    multiple: false,
            }},
        ]
    }
}