import cleanLabels from '../../../../services/cleanLabels';

export default function splitToChart(data, map, axis=null, legend=null, stack=null, targets = []) {
    /*
    Function that helps transform data sent from the backend to a rechart format. 
    - data (object): the data from the backend
    - map (object): a map that has labels/values about demographic fields to make human readable labels
    - axis (string, optional): the selected axis for bar/line charts
    - legend (string, optional): the selected legend
    - stack (string, optional): the selected stack for bar charts
    - targets (array, optional): an array of information about targets associated with this chart
    */
    const chartMap = {};
    const keyMeta = {};  // To track each key's breakdowns for stacking
    if(!data) return { dataArray: [], keys: []}
    const arr = Object.values(data);

    for (const row of arr) {
        const period = row.period || 'All-Time'; //default if no axis
        
        const legendVal = row[legend] || 'Total'; //default if not legend
        const stackVal = row[stack] || ''; 
        
        // Initialize chartMap row
        if (!chartMap[period]) chartMap[period] = { period };
        
        let legendValCleaned = legendVal;
        if(legend && (!['option', 'indicator', 'platform', 'organization', 'metric'].includes(legend))){
            legendValCleaned = map[legend]?.find(i => i.value == legendVal)?.label
        } //try to get the legend value label if map has its value
        let stackValCleaned = stackVal
        if(stack && (!['option', 'indicator', 'platform', 'organization', 'metric'].includes(stack))){
            stackValCleaned = map[stack]?.find(i => i.value == stackVal)?.label
        } //try to get the stack value label if map has its value
        const key = stack ? `${legendVal}__${stackVal}` : `${legendVal}` //create a key for reference
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
    //sort axis by date
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
        stackId: stackKey ||  '', //for grouping bars into stacks
        label: stack ? `${cleanLabels(legend)}: ${legendKey} - ${cleanLabels(stack)} ${stackKey}` : `${cleanLabels(legendKey)}`, //the label
        fill: undefined // optional: use a color mapping here
    }))

    return { dataArray, keys }; //return both the data and the keys
}