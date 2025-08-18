let refreshAuthFn = null;

export const setRefreshAuth = (fn) => {
    refreshAuthFn = fn;
};

export const refreshAuth = () => {
    if (!refreshAuthFn) throw new Error("refreshAuth not initialized");
    return refreshAuthFn();
};