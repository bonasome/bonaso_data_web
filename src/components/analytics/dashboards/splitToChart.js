import cleanLabels from '../../../../services/cleanLabels';

export default function splitToChart(data, axis=null, legend=null, stack=null, targets = [], map) {
    const chartMap = {};
    const keyMeta = {};  // To track each key's subcategory for stacking
    if(!data) return { dataArray: [], keys: []}
    const arr = Object.values(data);

    for (const row of arr) {
        const period = row.period || 'All-Time';

        const legendVal = row[legend] || 'Total';
        const stackVal = row[stack] || '';

        // Initialize chartMap row
        if (!chartMap[period]) chartMap[period] = { period };
        
        let legendValCleaned = legendVal;
        if(legend && (!['subcategory', 'indicator', 'platform', 'organization', 'metric'].includes(legend))){
            legendValCleaned = map[legend][legendVal]
        }
        let stackValCleaned = stackVal
        if(stack && (!['subcategory', 'indicator', 'platform', 'organization', 'metric'].includes(legend))){
            stackValCleaned = map[stack][stackVal]
        }
        const key = stack ? `${legendVal}__${stackVal}` : `${legendVal}`
        // Add the value
        chartMap[period][key] = row.count;
        
        if (!keyMeta[key]) {
            keyMeta[key] = {stackKey: stackValCleaned, legendKey: legendValCleaned}
        }
    }
    
    // Overlay targets (e.g., target lines or bars)

    for (const tar of targets) {
        Object.keys(tar).forEach((t) => {
            const period = t;
            const amount = tar[t];
            if(!axis) chartMap['Target'] += amount
            else {
                if (!chartMap[period]) chartMap[period] = { period };
                chartMap[period]['Target'] = amount;
            }
        })
    }

    let dataArray = Object.values(chartMap);
    // Construct keys array (for legends & Recharts <Bar/> components)
    if(axis==='month'){
        dataArray = dataArray.sort((a, b) => new Date(`1 ${a.period}`) - new Date(`1 ${b.period}`));
    }
    if(axis==='quarter'){
        dataArray.sort((a, b) => {
            const [qA, yA] = a.period.split(' ');
            const [qB, yB] = b.period.split(' ');
            const quarterA = parseInt(qA.replace('Q', ''), 10);
            const quarterB = parseInt(qB.replace('Q', ''), 10);
            const yearA = parseInt(yA, 10);
            const yearB = parseInt(yB, 10);

            return yearA - yearB || quarterA - quarterB;
        });
    }

    const keys = Object.entries(keyMeta).map(([compoundKey, { stackKey, legendKey }]) => ({
        key: compoundKey,
        bar: legendKey ?? '',
        stackId: stackKey ||  '',
        label: stack ? `${cleanLabels(legend)}: ${legendKey} - ${cleanLabels(stack)} ${stackKey}` : `${cleanLabels(legendKey)}`,
        fill: undefined // optional: use a color mapping here
    })).sort((a, b) => a.label.localeCompare(b.label));

    return { dataArray, keys };
}