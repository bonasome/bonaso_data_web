export default function monthlyCounts(data, showTargets=false) {
    const interactions = data.interactions || [];
    const targets = showTargets ? data.targets : null;
    
    const countsByMonth = {};
    const targetsByMonth = {};
    // Count interactions by month
    for (const interaction of interactions) {
        let amount = 1;
        const date = new Date(interaction.interaction_date);
        const key = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        if(data.require_numeric == true && interaction.numeric_component){
            amount = interaction.numeric_component
        }
        countsByMonth[key] = (countsByMonth[key] || 0) + amount;
    }
    if(showTargets){
        console.log('here')
        for (const target of targets) {
            console.log(target)
            const date = new Date(target.end);
            const key = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            targetsByMonth[key] = (targetsByMonth[key] || 0) + target.amount;
        }
        console.log(targetsByMonth)
    }
    

    // Optional: fill missing months (e.g., for a consistent time range)
    const result = Object.keys(countsByMonth)
        .sort()
        .map((month) => ({
            month,
            count: countsByMonth[month], 
            ...(showTargets ? {target: targetsByMonth[month]} : {}),
        }));
    
    console.log(result)
    return result;
}