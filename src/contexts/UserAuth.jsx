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
                    throw new Error('Token refresh failed');
                }
                // Step 2: Fetch current user info
                const response = await fetch(`${baseUrl}/api/users/me/`, {
                    method: 'GET',
                    credentials: 'include',
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                    setLoggedIn(true);
                } 
                else {
                    console.log('error thrown in else')
                    setUser(null);
                    setLoggedIn(false);
                }
            } 
            catch (err) {
                console.log('error thrown in catch')
                setUser(null);
                setLoggedIn(false);
                throw err; // propagate so fetchWithAuth can catch it
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
        <UserContext.Provider value={{ loggedIn, user, loading, refreshAuth }}>
        {children}
        </UserContext.Provider>
    );
}
export const useAuth = () => useContext(UserContext);