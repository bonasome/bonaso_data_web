export function tryMatchDates(start, end, project){
    if(!project) return
    const startDate = new Date(start)
    const startYear = startDate.getFullYear()
    const startMonth = startDate.getMonth() + 1; // 1-based
    const startDay = startDate.getDate();

    const endDate = new Date(end)
    const endYear = endDate.getFullYear()
    const endMonth = endDate.getMonth() + 1; // 1-based
    const endDay = endDate.getDate();

    const projectStart = new Date(project.start);
    const projectEnd = new Date(project.end);
    const projectStartYear = projectStart.getFullYear()
    const projectStartMonth = projectStart.getMonth() + 1; // 1-based
    const projectStartDay = projectStart.getDate();

    const projectEndYear = projectEnd.getFullYear()
    const projectEndMonth = projectEnd.getMonth() + 1; // 1-based
    const projectEndDay = projectEnd.getDate();
    
    if(start === project.start && end === project.end) return {type: 'Project Duration', value: ''}
    if(startYear != endYear) return {type: 'custom', value: ''}

    //if target lines up with a month perfectly (or perfectly save for getting clipped by project start/end dates, set the options to reflect that)
    if(((startDay === 1 || (startDay === projectStartDay && startMonth===projectStartMonth && startYear===projectStartYear)) &&
        (endDay === new Date(endYear, endMonth, 0).getDate() || (endDay === projectEndDay && endMonth===projectEndMonth && endYear===projectEndYear)) 
        && (endMonth === startMonth))){
        return {type: 'months', value: `${startYear}-${String(startMonth).padStart(2, '0')}`}
    }
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
        quarter = { type: 'quarters', value: q.str };
        break;
    }
}
    if(quarter) return quarter
    else return {type: 'custom', value: ''}
}

export function getWindowsBetween(startDateStr, endDateStr) {
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
    if(typeof qString != 'string') return
    const match = qString.match(/Q([1-4])\s*[-]?\s*(\d{4})/);
    if (!match) return null;

    const quarter = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    return getQuarterDates(quarter, year, project);
}

export function getMonthDatesStr(monthString, project) {
    const date = new Date(monthString);
    if (isNaN(date)) return null;

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth is 0-based
    return getMonthDates(month, year, project);
}

export function getMonthDates(month, year, project) {
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
    console.log(projectEndDay)
    // Get last day of the month
    const endOfMonth = new Date(year, month, 0).getDate(); // 0 gives last day of this month
    console.log(projectEndMonth === month && projectEndYear === year)
    const endDay = (projectEndMonth === month && projectEndYear === year) ? String(projectEndDay).padStart(2, '0') : String(endOfMonth).padStart(2, '0');
    const end = `${year}-${paddedMonth}-${endDay}`;

    return { start, end };
}
