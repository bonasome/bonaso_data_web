function getQuarter(date) {
  const month = date.getMonth(); // 0 = Jan, 11 = Dec
  return 'Quarter ' + (Math.floor(month / 3) + 1);
}

function quarterSort(a, b) {
  const [qa, ya] = a.split(' ').slice(1); // 'Quarter 1 2025' => ['1', '2025']
  const [qb, yb] = b.split(' ').slice(1);
  return new Date(`${ya}-0${qa * 3 - 2}-01`) - new Date(`${yb}-0${qb * 3 - 2}-01`);
}

export default function monthlyCounts(data, filters = null, axis='month', legend='', meta=null) {
    const interactions = data?.interactions || [];
    const targets = legend==='targets' ? (data?.targets || []) : [];

    const axisGroups = {};
    const targetAxisGroups = {};

    for (const interaction of interactions) {
        let amount = 1;
        const date = new Date(interaction.interaction_date);
        if (filters) {
            console.log(filters.organization, interaction.organization.id)
            const respondent = interaction.respondent;

            if (filters.age_range && filters.age_range !== respondent.age_range) continue;
            if (filters.sex && filters.sex !== respondent.sex) continue;
            if (filters.district && filters.district !== respondent.district) continue;
            if (filters.organization && filters.organization != interaction.organization.id) continue;
            if (filters.citizen !== '') {
                const citizenship = filters.citizen === 'true';
                if (citizenship !== respondent.citizenship) continue;
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

        if (data.require_numeric && interaction.numeric_component) {
            amount = interaction.numeric_component;
        }

        if (legend==='subcategories' && data?.subcategories?.length > 0) {
            interaction.subcategories.forEach(cat => {
                axisGroups[key][cat] = (axisGroups[key][cat] || 0) + amount;
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
        else if (Object.keys(interaction.respondent).includes(legend)) {
            if(legend==='citizenship'){
                const cat=interaction.respondent[legend];
                const label = cat ? 'Citizen' : 'Non-Citizen';
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
    }
    // Targets
    for (const target of targets) {
        console.log(target)
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
        targetAxisGroups[key] = (targetAxisGroups[key] || 0) + target.amount;
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