export default function splitToChart(data, legend='', stack='', targets = []) {
    const chartMap = {};
    const keyMeta = {};  // To track each key's subcategory for stacking
    const arr = Object.values(data);
    
    for (const row of arr) {
        const period = row.period || 'All-Time';

        const legendVal = row[legend] || 'Total';
        const stackVal = row[stack] || '';

        // Initialize chartMap row
        if (!chartMap[period]) chartMap[period] = { period };

        const key = stack !=='' ? `${legendVal}__${stackVal}` : `${legendVal}`
        // Add the value
        chartMap[period][key] = row.count;
        
        if (!keyMeta[key]) {
            keyMeta[key] = {stackKey: stackVal, legendKey: legendVal}
        }
    }
    // Overlay targets (e.g., target lines or bars)
    for (const tar of targets) {
        const period = tar.period || 'All-Time';
        const amount = tar.amount;
        if (!chartMap[period]) chartMap[period] = { period };
        chartMap[period]['Target'] = amount;
    }

    const dataArray = Object.values(chartMap);
    // Construct keys array (for legends & Recharts <Bar/> components)
    
    const keys = Object.entries(keyMeta).map(([compoundKey, { stackKey, legendKey }]) => ({
        key: compoundKey,
        bar: legendKey ?? '',
        stackId: stackKey ||  '',
        label: stack !== '' ? `${legend}: ${legendKey} - ${stack} ${stackKey}` : `${legendKey}`,
        fill: undefined // optional: use a color mapping here
    }));

    return { dataArray, keys };
}