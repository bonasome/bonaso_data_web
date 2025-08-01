export const contentTypeMap = {
    'respondents.respondent': { id: 10, label: 'Respondent', url: 'respondents' },
    'respondents.interaction': { id: 14, label: 'Interaction', url: 'respondents' },
    'events.demographiccount': { id: 36, label: 'Event Count', url: 'events' },
    'social.socialmediapost': { id: 63, label: 'Social Media Post', url: 'social' }
};

export const getContentTypeString = (id) => {
    return Object.entries(contentTypeMap).find(([, value]) => value.id === id)?.[0];
};

export const getContentTypeLabel = (id) => {
    return Object.values(contentTypeMap).find(ct => ct.id === id)?.label ?? `Unknown (${id})`;
};
export const getContentTypeURL = (id) => {
    return Object.values(contentTypeMap).find(ct => ct.id === id)?.url?? ``;
};

export const generateURL = (id, target) => {
    const objID = target?.parent ?? target.id
    return `/${getContentTypeURL(id)}/${objID}`
}

export const urlBuilder = (app, id, parent = '', otherParent = '') => {
    const appName = app.toLowerCase();
    let url = '';

    if (['events.event'].includes(appName)) {
        url = `/events/${id}`;
    } else if (['events.demographicount'].includes(appName)) {
        url = `/events/${parent}`;
    } else if (['flags.flag'].includes(appName)) {
        url = `/flags`;
    } else if (['indicators.indicator'].includes(appName)) {
        url = `/indicators/${id}`;
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