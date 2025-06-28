export default function organizationConfig(orgIDs, orgNames, searchCallback, existing=null){
    return [
            {name: 'name', label: 'Organization Name', type: 'text', required: true, value: existing?.name ? existing.name : ''},
            {name: 'full_name', label: 'Full Name', type: 'text', required: false, value: existing?.full_name ? existing.full_name : ''},
            {name: 'parent_organization_id', label: 'Parent Organization', type: 'select', required: false, value: existing?.parent_organization ? existing.parent_organization.id : '', 
                constructors: {
                    values: orgIDs,
                    labels: orgNames,
                    multiple: false,
                    search: true,
                    searchCallback: searchCallback,
            }},
            {name: 'office_address', label: 'Office Address', type: 'text', required: false, value: existing?.office_address ? existing.office_address : ''},
            {name: 'office_email', label: 'Office Email', type: 'email', required: false, value: existing?.office_email ? existing.office_email : ''},
            {name: 'office_phone',label:'Office Phone Number', type: 'text', required: false, value: existing?.office_phone ? existing.office_phone : ''},
            {name: 'executive_director', label: 'Executive Director Name', type: 'text', required: false, value: existing?.executive_director ? existing.executive_director : ''},
            {name: 'ed_email', label:"Executive Director's Email", type: 'email', required: false, value: existing?.ed_email ? existing.ed_email : ''},
            {name: 'ed_phone', label: "Executive Director's Phone Number", type: 'text', required: false, value: existing?.ed_phone ? existing.ed_phone : ''},
        ]
}