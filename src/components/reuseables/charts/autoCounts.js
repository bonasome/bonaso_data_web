function getQuarter(date) {
  const month = date.getMonth(); // 0 = Jan, 11 = Dec
  return 'Quarter ' + (Math.floor(month / 3) + 1);
}

function quarterSort(a, b) {
    const [qa, ya] = a.split(' ').slice(1); // 'Quarter 1 2025' => ['1', '2025']
    const [qb, yb] = b.split(' ').slice(1);
    return new Date(`${ya}-0${qa * 3 - 2}-01`) - new Date(`${yb}-0${qb * 3 - 2}-01`);
}

export default function autoCounts(data, type, filters = null, axis='month', legend='') {
    const events = data?.events || [];
    const targets = legend==='targets' ? (data?.targets || []) : [];

    const axisGroups = {};
    const targetAxisGroups = {};

    for (const event of events) {
        console.log(event)
        const date = new Date(event.event.event_date);
        if(filters){
            if (filters.after.trim() !== '') {
                const after = new Date(filters.after);
                if (!isNaN(after) && date < after) continue;
            }

            if (filters.before.trim() !== '') {
                const before = new Date(filters.before);
                if (!isNaN(before) && date > before) continue;
            }
            if (filters.organization && filters.organization != event.event.host?.id) continue;
        }
        
        let key='count'
        let amount = 0;
        console.log(type)
        if(axis==='month'){
            key = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        }
        else if(axis==='quarter'){
            key = getQuarter(date);
        }
        if(type==='Event_No'){
            amount = 1
        }
        else if(type==='Org_Event_No' && event.event.event_type==='Training'){
            amount = event.event.organizations.length || 0
        }
        if (legend === 'organization') {
            const label = event.event.host?.name || 'Unknown';
            // Ensure axisGroups[key] is an object
            if (!axisGroups[key]) axisGroups[key] = {};

            if (!axisGroups[key][label]) axisGroups[key][label] = 0;
            axisGroups[key][label] += amount;
        } 
        else {
            if (!axisGroups[key]) axisGroups[key] = 0;
            axisGroups[key] += amount;
        }
    }
    for (const target of targets) {
        const start = new Date(target.start);
        const end = new Date(target.end);

        if (filters?.after?.trim?.() !== '') {
            const after = new Date(filters.after);
            if (!isNaN(after) && start < after) continue;
        }

        if (filters?.before?.trim?.() !== '') {
            const before = new Date(filters.before);
            if (!isNaN(before) && end > before) continue;
        }
        if(filters?.organization && filters.organization != target.organization) continue;
        let key = 'count';
        if(axis==='month'){
            key = end.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        }
        if(axis==='quarter'){
            key = getQuarter(end);
        }
        targetAxisGroups[key] = (targetAxisGroups[key] || 0) + target.amount;
    }

    const allGroups = new Set([...Object.keys(axisGroups), ...Object.keys(targetAxisGroups)]);
    const result = [...allGroups]
        .sort((a, b) => axis === 'quarter' ? quarterSort(a, b) : new Date(`1 ${a}`) - new Date(`1 ${b}`))
        .map((ag) => {
            const base = { ag };

            if (!['', 'targets'].includes(legend) && typeof axisGroups[ag] === 'object') {
                for (const [subcat, value] of Object.entries(axisGroups[ag])) {
                    base[subcat] = value;
                }
            } 
            else {
                base.count = axisGroups[ag] || 0;
            }

            if (legend==='targets') {
                base.target = targetAxisGroups[ag] || 0;
            }

            return base;
        });
    console.log(result)
    return result;
}