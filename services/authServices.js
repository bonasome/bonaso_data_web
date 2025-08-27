/*
Helper functions that convert the refreshAuth function found in /src/contexts/UserAuth.jsx to JS so that 
fetchWithAuth can use it. 
*/

let refreshAuthFn = null;

export const setRefreshAuth = (fn) => {
    refreshAuthFn = fn;
};

export const refreshAuth = () => {
    if (!refreshAuthFn) throw new Error("refreshAuth not initialized");
    return refreshAuthFn();
};