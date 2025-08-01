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