export default function eventConfig(orgIDs, orgNames, types, searchCallback, existing=null){
    
    return [
        {name: 'name', label: 'Event Name', type: 'text', required: true, value: existing?.name ? existing.name : ''},
        {name: 'description', label: 'Event Description', type: 'textarea', required: false, value: existing?.description ? existing.description : ''},
        {name: 'host_id', label: 'Hosting Organization', type: 'organization', callbackText: 'Select as Host',  required: true, value: existing?.host ? existing.host : null},
        {name: 'location', label: 'Event Location', type: 'text', required: true, value: existing?.location ? existing.location : ''},
        {name: 'event_type', label: 'Event Type', type: 'select',  required: true, value: existing?.event_type ? existing.event_type : '',
            constructors: {
                values: types,
                labels: types,
                multiple: false,
        }},
        {name: 'event_date', label:'Event Date', type: 'date', required: true, value: existing?.event_date ? existing.event_date: ''},
    ]
}