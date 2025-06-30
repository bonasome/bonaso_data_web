export default function monthlyCounts(data, showTargets = false, filters = null) {
    const interactions = data?.interactions || [];
    const targets = showTargets ? (data?.targets || []) : [];

    const countsByMonth = {};
    const targetsByMonth = {};
    console.log(interactions)
    // Count interactions by month
    for (const interaction of interactions) {
        let amount = 1;
        const date = new Date(interaction.interaction_date);

        if (filters) {
            const respondent = interaction.respondent;

            if (filters.age_range && filters.age_range !== respondent.age_range) continue;
            if (filters.sex && filters.sex !== respondent.sex) continue;
            if (filters.district && filters.district !== respondent.district) continue;

             if(filters.citizen !== ''){
                const citizenship = filters.citizen === 'true' ? true : false
                if(citizenship !== interaction.respondent.citizenship){
                    continue
                }
            }

            if (filters.kp_status.length > 0) {
                const include = respondent.kp_status?.some(kp => filters.kp_status.includes(kp));
                if (!include) continue;
            }

            if (filters.disability_status.length > 0) {
                const include = respondent.disability_status?.some(dis => filters.disability_status.includes(dis));
                if (!include) continue;
            }
        }

        const key = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });

        if (data.require_numeric && interaction.numeric_component) {
            amount = interaction.numeric_component;
        }

        countsByMonth[key] = (countsByMonth[key] || 0) + amount;
    }

    // Aggregate targets by month
    for (const target of targets) {
        const date = new Date(target.end);
        const key = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        targetsByMonth[key] = (targetsByMonth[key] || 0) + target.amount;
    }

    // Merge counts and targets, ensuring all months are included
    const allMonths = new Set([...Object.keys(countsByMonth), ...Object.keys(targetsByMonth)]);
    const result = [...allMonths]
        .sort((a, b) => new Date(`1 ${a}`) - new Date(`1 ${b}`)) // Sort chronologically
        .map((month) => ({
            month,
            count: countsByMonth[month] || 0,
            ...(showTargets ? { target: targetsByMonth[month] || 0 } : {}),
        }));

    return result;
}