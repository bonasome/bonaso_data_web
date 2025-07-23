import theme from '../../../../theme/theme';

const colorMap = {
    general: "#8884d8",
    training: "#82ca9d",
    me: "#ffc658",
    finance: "#999999",
    default: 'ffffff'
};

export default function ganttBuilder(project, activities=[], deadlines=[]){
    let data = []
    const projectStart = new Date(project.start);
    const projectEnd = new Date(project.end);
    const diffInMs = projectEnd - projectStart; // Difference in milliseconds
    const duration = diffInMs / (1000 * 60 * 60 * 24); // Convert to days

    data.push({name: project.name, category: 'project', start: 0, duration: duration, durationFill: theme.colors.bonasoLightAccent })
    for(const activity of activities){
        const start = new Date(activity.start);
        const end = new Date(activity.end);
        const diffInMs = end - start; 
        const duration = diffInMs / (1000 * 60 * 60 * 24); 
        
        const gapInMs = start - projectStart;
        const gap = gapInMs / (1000 * 60 * 60 * 24)
        data.push({name: activity.name, category: activity.category, start: gap, duration: duration, durationFill: colorMap[activity.category] || colorMap.default,})
    }
    return data
}