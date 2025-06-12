import { useState, useEffect, createContext, useContext } from "react";
import getUser from "../../services/getUser";

const UserContext = createContext();

export function UserAuth({ children }) {
    const dns = import.meta.env.VITE_DNS
    const [loading, setLoading] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try{
                const accessToken = localStorage.getItem('access');
                const refreshToken = localStorage.getItem('refresh');
                if(accessToken){
                    const user = await getUser();
                    setUser(user);
                    setLoggedIn(true);
                    setLoading(false);
                }
                if(!accessToken && refreshToken){
                    const response = await fetch(`${dns}/users/api/request-token/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 'refresh': refreshToken }),
                    });
                    if(response.ok){
                        const data = await response.json();
                        localStorage.setItem('access', data.access);
                        const user = await getUser();
                        setUser(user);
                        setLoggedIn(true);
                        setLoading(false);
                    }
                    else{
                        console.warn('invalid token')
                        setLoggedIn(false);
                        setUser(null);
                        setLoading(false);
                    }
                }
                if(!accessToken && !refreshToken){
                    setLoggedIn(false);
                    setUser(null);
                    setLoading(false);
                }
            }
            catch(err){
                console.warn(`Server Error: ${err}: Logging out...`);
                setLoggedIn(false);
                setUser(null);
                setLoading(false);
            }
            finally{
                setLoading(false);
            }
        }
        checkAuth();
    }, []);
    return(
        <UserContext.Provider value={{ loggedIn, setLoggedIn, user, setUser, loading }}>
            { children }
        </UserContext.Provider>
    );
}

export const useAuth = () => useContext(UserContext);