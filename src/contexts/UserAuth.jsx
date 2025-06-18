import React from 'react';
import { useState, useEffect, createContext, useContext } from "react";
import fetchWithAuth from '../../services/fetchWithAuth';
const UserContext = createContext();

export function UserAuth({ children }) {
    const dns = import.meta.env.VITE_DNS
    const [loading, setLoading] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    const refreshAuth = async () => {
        setLoading(true);
        try {
            const response = await fetchWithAuth(`/api/users/me/`, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data);
                setLoggedIn(true);
            } else {
                setUser(null);
                setLoggedIn(false);
            }
        } catch (err) {
            setUser(null);
            setLoggedIn(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            try{
                const response = await fetchWithAuth(`/api/users/me/`, {
                    method: 'GET',
                    credentials: 'include',
                });
                if(response.ok){
                    const data = await response.json()
                    setUser(data);
                    setLoggedIn(true);
                    setLoading(false);
                }
                else{
                    setLoggedIn(false);
                    setUser(null);
                    setLoading(false);
                }
            }
            catch(err){
                console.warn(`Your login session is not valid: ${err}: Logging out...`);
                setLoggedIn(false);
                setUser(null);
                setLoading(false);
            }
        }
        checkAuth();
    }, [dns]);

    return(
        <UserContext.Provider value={{ loggedIn, setLoggedIn, user, setUser, loading, refreshAuth }}>
            { children }
        </UserContext.Provider>
    );
}
export const useAuth = () => useContext(UserContext);