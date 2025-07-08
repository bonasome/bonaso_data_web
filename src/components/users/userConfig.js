export default function userConfig(orgIDs, orgNames, clientIDs, clientNames, meta, searchCallback, existing=null){
    console.log(existing)
    if(!existing){
        return [
        {name: 'username', label: 'Username', type: 'text', required: true, value: existing?.username ? existing.username : ''},
        {name: 'password', label: 'Enter Password', type: 'password', required: true, value: ''},
        {name: 'confirm_password', label: 'Confirm Password', type: 'password', required: true, value: ''},
        {name: 'organization', label: 'User Organization', type: 'select', required: false, value: existing?.organization_detail?.id ? existing.organization_detail?.id : '', 
            constructors: {
                values: orgIDs,
                labels: orgNames,
                multiple: false,
                search: true,
                searchCallback: searchCallback,
        }},
        {name: 'first_name', label: 'First Name', type: 'text', required: true, value: existing?.first_name ? existing.first_name : ''},
        {name: 'last_name', label:'Last Name', type: 'text', required: true, value: existing?.last_name ? existing.last_name : ''},
        {name: 'email', label: 'Email', type: 'email', required: false, value: existing?.email ? existing.email : ''},
        {name: 'role', rolerestrict:['admin'], label: 'User Role', type: 'select',  required: true, value: existing?.role ? existing.role : '',
            constructors: {
                values: meta.roles,
                labels: meta.role_labels,
                multiple: false,
        }},
        {name: 'client_id', label: 'Select a Client', rolerestrict:['admin'], type: 'select', required: false, constructors: {
            values: clientIDs,
            labels: clientNames,
            multiple: false,
        }},
    ]
    }
    if(existing){
        return [
            {name: 'username', label: 'Username', type: 'text', required: true, value: existing?.username ? existing.username : ''},
            {name: 'organization', label: 'User Organization', type: 'select', required: false, value: existing?.organization_detail?.id ? existing.organization_detail?.id : '', 
                constructors: {
                    values: orgIDs,
                    labels: orgNames,
                    multiple: false,
                    search: true,
                    searchCallback: searchCallback,
            }},
            {name: 'first_name', label: 'First Name', type: 'text', required: true, value: existing?.first_name ? existing.first_name : ''},
            {name: 'last_name', label:'Last Name', type: 'text', required: true, value: existing?.last_name ? existing.last_name : ''},
            {name: 'email', label: 'Email', type: 'email', required: false, value: existing?.email ? existing.email : ''},
            {name: 'role', rolerestrict: ['admin'], label: 'User Role', type: 'select',  required: true, value: existing?.role ? existing.role : '',
                constructors: {
                    values: meta.roles,
                    labels: meta.role_labels,
                    multiple: false,
            }},
            {name: 'client_id',  label: 'Select a Client', rolerestrict:['admin'], type: 'select', required: false, constructors: {
                values: clientIDs,
                labels: clientNames,
                multiple: false,
            }},
        ]
    }
}