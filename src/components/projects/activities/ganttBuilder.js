import theme from '../../../../theme/theme';

const colorMap = {
    //map that ganttBuilder uses to assign colors to different categories
    general: "#8884d8",
    training: "#82ca9d",
    me: "#ffc658",
    finance: "#999999",
    default: 'ffffff'
};

export default function ganttBuilder(project, activities=[]){
    /*
    Helper function that converts the list of activites/deadlines into something that, when you look at 
    it from the right angle, kind of maybe looks like a gantt chart displaying a project timeline.
    - project (object): the project the gantt chart is about (used to show overall timespan)
    - activities (array): an array of activities related to the project
    NOTE: deadlines are added manually in the chart component
    */
    let data = []
    const projectStart = new Date(project.start);
    const projectEnd = new Date(project.end);
    const diffInMs = projectEnd - projectStart; // Difference in milliseconds
    const duration = diffInMs / (1000 * 60 * 60 * 24); // Convert to days

    data.push({name: project.name, category: 'project', start: 0, duration: duration, durationFill: theme.colors.bonasoLightAccent })
    for(const activity of activities){
        const start = new Date(activity.start);
        const end = new Date(activity.end);
        //calculate the total length of the activity
        const diffInMs = end - start; //in ms
        let duration = diffInMs / (1000 * 60 * 60 * 24);  //to days
        if(duration == 0) duration = 1; //if the start/end are the same, denote it as one day (otherwise its invisible)
        const gapInMs = start - projectStart; //find the amount of time between the activity start and project start so it can be offset
        const gap = gapInMs / (1000 * 60 * 60 * 24)
        data.push({name: activity.name, category: activity.category, start: gap, duration: duration, durationFill: colorMap[activity.category] || colorMap.default,})
    }
    return data //array containin objects with name, category, start (where the transparent bar will end) and duration (where the color bar will end) and the color
}