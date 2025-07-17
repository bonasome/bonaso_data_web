import { getMonthStringsBetween, getQuarterStringsBetween } from "../../../../services/dateHelpers";

function getQuarter(date) {
    const month = date.getMonth(); // 0 = Jan, 11 = Dec
    return 'Q' + (Math.floor(month / 3) + 1) + ' ' + (date.getFullYear());
}

function quarterSort(a, b) {
    const [qa, ya] = a.split(' ').slice(1); // 'Quarter 1 2025' => ['1', '2025']
    const [qb, yb] = b.split(' ').slice(1);
    return new Date(`${ya}-0${qa * 3 - 2}-01`) - new Date(`${yb}-0${qb * 3 - 2}-01`);
}


export default function monthlyCounts(data, filters = null, axis='month', legend='', meta=null) {
    const events = data?.events || [];
    const interactions = data?.interactions || [];
    const targets = legend==='targets' ? (data?.targets || []) : [];

    const axisGroups = {};
    const targetAxisGroups = {};
    let fromIr = 0
    let fromCounts = 0
    for (const interaction of interactions) {
        let amount = 1;
        const date = new Date(interaction.interaction_date);
        if (filters) {
            const respondent = interaction.respondent;
            if(filters.type === 'event') continue;
            if (filters.age_range && filters.age_range !== respondent.age_range) continue;
            if (filters.sex && filters.sex !== respondent.sex) continue;
            if (filters.district && filters.district !== respondent.district) continue;
            if (filters.organization && filters.organization != interaction.organization.id) continue;
            if (filters.citizen !== '') {
                const citizenship = filters.citizen === 'true';
                if (citizenship !== respondent.citizenship) continue;
            }
            if (filters.pregnant !== '') {
                const preg = filters.pregnant === 'true';
                if (preg !== respondent.pregnant) continue;
            }
            if (filters.hiv_status !== '') {
                const hiv = filters.hiv_status === 'true';
                if (hiv !== respondent.hiv_status) continue;
            }

            if (filters.kp_status.length > 0) {
                const include = respondent.kp_status?.some(kp => filters.kp_status.includes(kp));
                if (!include) continue;
            }

            if (filters.disability_status.length > 0) {
                const include = respondent.disability_status?.some(dis => filters.disability_status.includes(dis));
                if (!include) continue;
            }

            const doi = new Date(interaction.interaction_date);
            if (filters.after.trim() !== '') {
                const after = new Date(filters.after);
                if (!isNaN(after) && doi < after) continue;
            }

            if (filters.before.trim() !== '') {
                const before = new Date(filters.before);
                if (!isNaN(before) && doi > before) continue;
            }
        }
        let key = 'count';
        if(axis==='month'){
            key = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        }
        else if(axis==='quarter'){
            key = getQuarter(date);
        }
        if (!axisGroups[key]) {
            axisGroups[key] = !['', 'targets'].includes(legend) ? {} : 0;
        }

        else if(legend !== 'subcategories' && data?.subcategories?.length > 0 && data.require_numeric){
            amount = 0
            interaction.subcategories.forEach(s => amount += s.numeric_component)
        }

        if (legend==='subcategories' && data?.subcategories?.length > 0) {
            interaction.subcategories.forEach(cat => {
                amount = (data.require_numeric && cat.numeric_component) ? cat.numeric_component : 1
                const name = cat.deprecated ? `${cat.name} (Deprecated)` : cat.name
                axisGroups[key][name] = (axisGroups[key][name] || 0) + amount;
            });
        } 
        else if (legend === 'organization' && interaction?.organization){
            const label = interaction.organization.name
            axisGroups[key][label] = (axisGroups[key][label] || 0) + amount;
        }
        else if(['kp_status', 'disability_status'].includes(legend)){
            if(interaction.respondent[legend].length === 0) continue;
            const metaName = legend.replace('status', 'types');
            const metaLabel = legend.replace('status', 'type') + '_labels';
            interaction.respondent[legend].forEach(cat => {
                const labelIndex = meta[metaName].indexOf(cat)
                const label = meta[metaLabel][labelIndex]
                axisGroups[key][label] = (axisGroups[key][label] || 0) + amount;
            });
        }
        else if (interaction?.respondent && Object.keys(interaction.respondent).includes(legend)) {
            if(legend==='citizenship'){
                const cat=interaction.respondent[legend];
                const label = cat ? 'Citizen' : 'Non-Citizen';
                axisGroups[key][label] = (axisGroups[key][label] || 0) + amount;
            }
            else if(legend==='pregnant'){
                const cat=interaction.respondent[legend];
                const label = cat ? 'Pregnant' : 'Not Pregnant';
                axisGroups[key][label] = (axisGroups[key][label] || 0) + amount;
            }
            else if(legend==='hiv_status'){
                const cat=interaction.respondent[legend];
                const label = cat ? 'HIV Positive' : 'HIV Negative';
                axisGroups[key][label] = (axisGroups[key][label] || 0) + amount;
            }
            else{
                const metaName = legend + 's';
                const metaLabel = legend + '_labels';
                const cat=interaction.respondent[legend];
                const labelIndex = meta[metaName].indexOf(cat);
                const label = meta[metaLabel][labelIndex];
                axisGroups[key][label] = (axisGroups[key][label] || 0) + amount;
            }
        }
        else {
            axisGroups[key] += amount;
        }
        fromIr += amount;
    }


    //events
    for (const event of events) {
        const date = new Date(event.event.event_date);
        for(const count of event.counts){
            if(legend==='district') continue;
            if (filters) {
                if(filters.type === 'interaction') continue;
                if (filters.age_range && filters.age_range !== count?.age_range) continue;
                if (filters.sex && filters.sex !== count?.sex) continue;
                if (filters.organization && filters.organization != count?.task.organization.id) continue;
                if (filters.citizen !== '') {
                    const citizenship = filters.citizen === 'true';
                    if (citizenship !== count?.citizenship) continue;
                }
                if (filters.pregnant !== '') {
                    const preg = filters.pregnant === 'true';
                    if (preg !== count.pregnancy) continue;
                }
                if (filters.hiv_status !== '') {
                    const hiv = filters.hiv_status === 'true';
                    if (hiv !== count.hiv_status) continue;
                }
                if (filters.kp_status.length > 0 && !filters.kp_status.includes(count.kp_type)) continue;
                if (filters.disability_status.length > 0 && !filters.disability_status.includes(count.disability_type)) continue;

                if (filters.after.trim() !== '') {
                    const after = new Date(filters.after);
                    if (!isNaN(after) && date < after) continue;
                }

                if (filters.before.trim() !== '') {
                    const before = new Date(filters.before);
                    if (!isNaN(before) && date > before) continue;
                }
            }
        
        
            let key = 'count';
            if(axis==='month'){
                key = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            }
            else if(axis==='quarter'){
                key = getQuarter(date);
            }
            console.log(axisGroups[key])
            if (!axisGroups[key]) {
                axisGroups[key] = !['', 'targets'].includes(legend) ? {} : 0;
            }
            const amount = count?.count;
            if (legend==='subcategories' && data?.subcategories?.length > 0) {
                const name = count?.subcategory?.deprecated ? `${ count?.subcategory?.name} (Deprecated)` :  count?.subcategory?.name
                axisGroups[key][name] = (axisGroups[key][name] || 0) + amount;
            } 
            else if (legend === 'organization' && count?.task?.organization?.name){
                const label = count?.task.organization.name
                axisGroups[key][label] = (axisGroups[key][label] || 0) + amount;
            }
            else if(legend==='kp_status'){
                if(!count.kp_type) continue;
                const metaName = legend.replace('status', 'types');
                const metaLabel = legend.replace('status', 'type') + '_labels';
                const labelIndex = meta[metaName].indexOf(count.kp_type)
                const label = meta[metaLabel][labelIndex]
                axisGroups[key][label] = (axisGroups[key][label] || 0) + amount;
            }
            else if(legend==='disability_status'){
                if(!count.disability_type) continue;
                const metaName = legend.replace('status', 'types');
                const metaLabel = legend.replace('status', 'type') + '_labels';
                const labelIndex = meta[metaName].indexOf(count.disability_type)
                const label = meta[metaLabel][labelIndex]
                axisGroups[key][label] = (axisGroups[key][label] || 0) + amount;
            }
            else if(legend==='citizenship'){
                if(!count.citizenship) continue;
                const cat=count.citizenship;
                const label = cat ? 'Citizen' : 'Non-Citizen';
                axisGroups[key][label] = (axisGroups[key][label] || 0) + amount;
            }
            else if(legend==='pregnant'){
                if(!count.pregancy) continue;
                const cat=count.pregnancy;
                console.log(cat)
                const label = cat ? 'Pregnant' : 'Not Pregnant';
                axisGroups[key][label] = (axisGroups[key][label] || 0) + amount;
            }
            else if(legend==='hiv_status'){
                if(!count.hiv_status) continue;
                const cat=count.hiv_status;
                const label = cat ? 'HIV Positive' : 'HIV Negative';
                axisGroups[key][label] = (axisGroups[key][label] || 0) + amount;
            }
            else if (count && Object.keys(count).includes(legend)){
                const metaName = legend + 's';
                const metaLabel = legend + '_labels';
                if(!count[legend]) continue;
                const cat=count[legend];
                const labelIndex = meta[metaName].indexOf(cat);
                const label = meta[metaLabel][labelIndex];
                axisGroups[key][label] = (axisGroups[key][label] || 0) + amount;
            }
            
            else {
                axisGroups[key] += amount;
            }
            fromCounts += amount
        }
        
    }
    console.log('interactions:', fromIr, 'events:', fromCounts)
    // Targets
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
            const targetDateMonths = getMonthStringsBetween(target.start, target.end)
            console.log(targetDateMonths)
            targetDateMonths.forEach(m => {
                targetAxisGroups[m] = (targetAxisGroups[m] || 0) + (target.amount)/targetDateMonths.length;
            })
        }
        else if(axis==='quarter'){
            const targetDateQuarters = getQuarterStringsBetween(target.start, target.end)
            targetDateQuarters.forEach(q => {
                targetAxisGroups[q] = (targetAxisGroups[q] || 0) + (target.amount)/targetDateQuarters.length;
            })
        }
        else targetAxisGroups[key] = (targetAxisGroups[key] || 0) + target.amount;
    }

    // Combine into final array
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
    return result;
}