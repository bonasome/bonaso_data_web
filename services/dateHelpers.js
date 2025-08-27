/*
Several date helper functions that take date ranges/time periods and convert them to each other. This is primarily
used so that a user can select a month/quarter for a target and the system automatically converts it to start/end
dates. 
*/

export function tryMatchDates(start, end, project){
    /* 
    Accepts two dates in ISO format (start and end) and a project (for comparing possibly trimmed start/end
    dates if the project period does not align perfectly with a month/quarter) and will try to match it to a 
    month/quarter 
    */

    if(!project) return
    //start date information
    const startDate = new Date(start)
    const startYear = startDate.getFullYear()
    const startMonth = startDate.getMonth() + 1; // 1-based
    const startDay = startDate.getDate();

    //end date information
    const endDate = new Date(end)
    const endYear = endDate.getFullYear()
    const endMonth = endDate.getMonth() + 1; // 1-based
    const endDay = endDate.getDate();

    //find project start/end information
    const projectStart = new Date(project.start);
    const projectEnd = new Date(project.end);
    const projectStartYear = projectStart.getFullYear()
    const projectStartMonth = projectStart.getMonth() + 1; // 1-based
    const projectStartDay = projectStart.getDate();

    const projectEndYear = projectEnd.getFullYear()
    const projectEndMonth = projectEnd.getMonth() + 1; // 1-based
    const projectEndDay = projectEnd.getDate();
    
    //find out if the duration is the project
    if(start === project.start && end === project.end) return {type: 'Project Duration', value: ''}
    if(startYear != endYear) return {type: 'custom', value: ''}

    //if target lines up with a month perfectly (or perfectly save for getting clipped by project start/end dates, set the options to reflect that)
    if(((startDay === 1 || (startDay === projectStartDay && startMonth===projectStartMonth && startYear===projectStartYear)) &&
        (endDay === new Date(endYear, endMonth, 0).getDate() || (endDay === projectEndDay && endMonth===projectEndMonth && endYear===projectEndYear)) 
        && (endMonth === startMonth))){
        return {type: 'month', value: `${startYear}-${String(startMonth).padStart(2, '0')}`}
    }
    //if target lines up with a quarter perfectly (or perfectly save for getting clipped by project start/end dates, set the options to reflect that)
    const quarters = [
        { start: new Date(`${startYear}-01-01`), end: new Date(`${startYear}-03-31`), str: `Q1 ${startYear}` },
        { start: new Date(`${startYear}-04-01`), end: new Date(`${startYear}-06-30`), str: `Q2 ${startYear}` },
        { start: new Date(`${startYear}-07-01`), end: new Date(`${startYear}-09-30`), str: `Q3 ${startYear}` },
        { start: new Date(`${startYear}-10-01`), end: new Date(`${startYear}-12-31`), str: `Q4 ${startYear}` },
    ]; 

    let quarter = null;
    for (const q of quarters) {
        const qStartMonth = q.start.getMonth() + 1;
        const qEndMonth = q.end.getMonth() + 1;
        const qEndDay = q.end.getDate();

        const isFullQuarter = (
            (
                startDay === 1 ||
                (startDay === projectStartDay && startMonth === projectStartMonth && startYear === projectStartYear)
            ) &&
            (
                endDay === qEndDay ||
                (endDay === projectEndDay && endMonth === projectEndMonth && endYear === projectEndYear)
            ) &&
            endMonth === qEndMonth &&
            startMonth === qStartMonth
        );

        if (isFullQuarter) {
            quarter = { type: 'quarter', value: q.str };
            break;
        }
    }
        if(quarter) return quarter
        else return {type: 'custom', value: ''}
}

export function getWindowsBetween(startDateStr, endDateStr) {
    /*
    Accepts two dates and returns all months/quarters as between those two dates as an object of arrays
    */
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
        return { months: [], quarters: [] };
    }

    const months = [];
    const quarters = new Set();

    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (current <= endDate) {
        const year = current.getFullYear();
        const month = current.getMonth() + 1;

        // Add month in format YYYY-MM
        months.push(`${year}-${month.toString().padStart(2, '0')}`);

        // Determine quarter
        const q = Math.floor((month - 1) / 3) + 1;
        quarters.add(`Q${q} ${year}`);

        // Move to next month
        current.setMonth(current.getMonth() + 1);
    }
    return {
        months,
        quarters: Array.from(quarters),
    };
}

export function getQuarterDates(quarter, year, project) {
    /*
    Takes a numeric input signalling a quarter and a year and returns the start and end date. Project is taken
    as an input to trim the values if they do not align with a project start/end.
    */
    const projectStart = new Date(project.start);
    const projectEnd = new Date(project.end);

    let quarters = {
        1: { start: `${year}-01-01`, end: `${year}-03-31` },
        2: { start: `${year}-04-01`, end: `${year}-06-30` },
        3: { start: `${year}-07-01`, end: `${year}-09-30` },
        4: { start: `${year}-10-01`, end: `${year}-12-31` },
    };

    const qStart = new Date(quarters[quarter].start);
    const qEnd = new Date(quarters[quarter].end);

    if (projectStart > qStart && projectStart < qEnd) {
        quarters[quarter].start = project.start;
    }
    if (projectEnd > qStart && projectEnd < qEnd) {
        quarters[quarter].end = project.end;
    }

    return quarters[quarter] || null;
}

export function getQuarterDatesStr(qString, project) {
    /*
    Takes a string (Q1-YYYY) and converts it to a start/end date (ISO format)
    */
    if(typeof qString != 'string') return
    const match = qString.match(/Q([1-4])\s*[-]?\s*(\d{4})/);
    if (!match) return null;

    const quarter = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    return getQuarterDates(quarter, year, project);
}

export function getMonthDatesStr(monthString, project) {
    /*
    Takes a string (MM-YYYY) and converts it to a start/end date (ISO format)
    */
    const date = new Date(monthString);
    if (isNaN(date)) return null;

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth is 0-based
    return getMonthDates(month, year, project);
}

export function getMonthDates(month, year, project) {
    /*
    Takes a month/year and returns a start/end date for it. Also takes a project argument to trim values if the 
    project start/end do not align with the month's start/end
    */
    const paddedMonth = String(month).padStart(2, '0');

    const projectStart = new Date(project.start);
    const projectEnd = new Date(project.end);

    const projectStartYear = projectStart.getFullYear()
    const projectStartMonth = projectStart.getMonth() + 1; // 1-based
    const projectStartDay = projectStart.getDate();
    const startDay = (projectStartMonth === month && projectStartYear === year) ? String(projectStartDay).padStart(2, '0') : '01';
    const start = `${year}-${paddedMonth}-${startDay}`;

    const projectEndYear = projectEnd.getFullYear()
    const projectEndMonth = projectEnd.getMonth() + 1; // 1-based
    const projectEndDay = projectEnd.getDate();
    // Get last day of the month
    const endOfMonth = new Date(year, month, 0).getDate(); // 0 gives last day of this month
    const endDay = (projectEndMonth === month && projectEndYear === year) ? String(projectEndDay).padStart(2, '0') : String(endOfMonth).padStart(2, '0');
    const end = `${year}-${paddedMonth}-${endDay}`;

    return { start, end };
}
