import React from 'react';
import { useState, useEffect, createContext, useContext } from "react";
import { setRefreshAuth } from "../../services/authServices";
export const UserContext = createContext();

export function UserAuth({ children }) {
    const baseUrl = import.meta.env.VITE_API_URL;
    const [loading, setLoading] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [refreshPromise, setRefreshPromise] = useState(null);

    useEffect(() => {
        if (loggedIn) {
            const refreshInterval = setInterval(async () => {
                try {
                    console.log('refreshing token...')
                    await fetch("/api/users/token/refresh/", {
                    method: "POST",
                    credentials: "include",
                    });
                    // if your server also rotates the refresh token, set-cookie will update it automatically
                } 
                catch (err) {
                    console.error("Silent refresh failed", err);
                }
            }, 4 * 60 * 1000); // every 4 minutes if your access token is 5 min
            return () => clearInterval(refreshInterval);
        }
    }, [loggedIn]);

    const refreshAuth = async () => {
        if (refreshPromise) return refreshPromise;

        const promise = (async () => {
            setLoading(true);
            try {
                // Step 1: Refresh token
                const refreshResponse = await fetch(`${baseUrl}/api/users/token/refresh/`, {
                    method: 'POST',
                    credentials: 'include',
                });

                if (!refreshResponse.ok) {
                    // Only throw if it’s not 401, or you can log 401 and continue
                    if (refreshResponse.status !== 401) {
                        throw new Error('Token refresh failed');
                    }
                    // If 401, we know it’s “expected” sometimes — just clear state
                    //setUser(null);
                    //setLoggedIn(false);
                    //return; // don't throw, just stop here
                }

                // Step 2: Fetch current user info
                const userResponse = await fetch(`${baseUrl}/api/users/me/`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (userResponse.ok) {
                    const data = await userResponse.json();
                    setUser(data);
                    setLoggedIn(true);
                } 
                else {
                    setUser(null);
                    setLoggedIn(false);
                }
            } 
            catch (err) {
                // Only propagate unexpected errors
                if (!(err instanceof Error)) {
                    console.warn('Unexpected refresh error:', err);
                }
                throw err;
            } 
            finally {
                setLoading(false);
                setRefreshPromise(null);
            }
        })();

        setRefreshPromise(promise);
        return promise;
    };

    useEffect(() => {
        setRefreshAuth(refreshAuth); // make it available globally
        refreshAuth(); // run on mount
    }, [baseUrl]);

    return (
        <UserContext.Provider value={{ loggedIn, user, setUser, setLoggedIn, loading, refreshAuth }}>
        {children}
        </UserContext.Provider>
    );
}
export const useAuth = () => useContext(UserContext);