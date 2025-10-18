/*
Several functions to helping to convert generic foreign key models into readable labels/urls.
*/

export const contentTypeMap = {
    /*
    Reference map of app names with the label that should be used and the url path
    */
    'respondents.respondent': { label: 'Respondent', url: 'respondents' },
    'respondents.interaction': { label: 'Interaction', url: 'respondents' },
    'aggregates.aggregatecount': { label: 'Aggregate Count', url: 'aggregates' },
    'social.socialmediapost': { label: 'Social Media Post', url: 'social' },
    'events.event': { label: 'Event', url: 'events' },
    'projects.project': { label: 'Project', url: 'projects' }
};

export const getContentTypeLabel = (modelName) => {
    //Accepts an appname.modelname string and returns the label
    return contentTypeMap[modelName]?.label ?? `Unknown (${modelName})`;
};

export const getContentTypeURL = (modelName) => {
    //Accepts an appname.modelname string and returns the base url
    return contentTypeMap[modelName]?.url?? ``;
};

export const generateURL = (modelName, target) => {
    //accepts an appname.modelname string and a target prop (sent by the backend)
    const objID = target?.parent ?? target.id
    return `/${getContentTypeURL(modelName)}/${objID}`
}
export const faveURL = (id, modelName) => {
    //simplified URL constructor for favorites specifically, accepts only an id and an appname.modelname string
    return `/${getContentTypeURL(modelName)}/${id}`
}

export const urlBuilder = (modelName, id, parent = '', otherParent = '') => {
    /*
    Slightly more complex URL constructor for the activity page of the profile section which has some more
    complex url structures. Accepts an appname.modelname string, an object ID, and up to two parent IDs
    that may be required for fully constructing the URL.
    */
    const appName = modelName.toLowerCase();
    let url = '';

    if (['events.event'].includes(appName)) {
        url = `/events/${id}`;
    } else if (['aggregates.aggregategroup'].includes(appName)) {
        url = `/aggregates/${id}`;
    } else if (['flags.flag'].includes(appName)) {
        url = `/flags`;
    } else if (['indicators.indicator'].includes(appName)) {
        url = `/indicators/${id}`;
    } else if (['indicators.assessment'].includes(appName)) {
        url = `/indicators/assessments/${id}`;
    } else if (['organizations.organization'].includes(appName)) {
        url = `/organizations/${id}`;
    } else if (['projects.client'].includes(appName)) {
        url = `/clients/${id}`;
    } else if (['projects.projectactivity', 'projects.projectdeadline'].includes(appName)) {
        url = `/projects/${parent}`;
    } else if (['projects.project'].includes(appName)) {
        url = `/projects/${id}`;
    } else if (['projects.target', 'projects.task'].includes(appName)) {
        url = `/projects/${parent}/organizations/${otherParent}`;
    } else if (['respondents.respondent'].includes(appName)) {
        url = `/respondents/${id}`;
    } else if (['respondents.interaction'].includes(appName)) {
        url = `/respondents/${parent}`;
    } else if (['social.socialmediapost'].includes(appName)) {
        url = `/social/${id}`;
    }

  return url === '' ? null : url;
};