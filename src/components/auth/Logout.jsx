import React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth';

import fetchWithAuth from '../../../services/fetchWithAuth';

import bonasoWhite from '../../assets/bonasoWhite.png'
import styles from './login.module.css';

export default function Logout() {
    /*
    Simple display for when a user is logging out before being redirected to the login page
    */
    const navigate = useNavigate();
    const { setUser, setLoggedIn, refreshAuth } = useAuth();

    //get domain from env
    const dns = import.meta.env.VITE_DNS;

    //call logout link and delete cookies
    useEffect(() => {
        const logout = async () => {
            try{
                const response = await fetchWithAuth(`/api/users/logout/`, {
                    method: 'POST',
                    credentials: 'include',
                });
                if (response.ok) {
                    setUser(null);
                    setLoggedIn(false);
                    navigate('/users/login');
                } 
                else {
                    const err = await response.json();
                    console.error('Logout failed: ', err);
                }
                }
            catch(err){
                console.error('Error logging out: ', err)
            }
        };
        logout();
    }, [dns, navigate]);

    //page display in case logout takes a second to register and redirect, so display something basic
    return(
            <div>
                <div className={styles.login}>
                        <div className={styles.header}>
                            <img src={bonasoWhite} className={styles.headerImage} />
                            <h2>Until next time!</h2>
                        </div>
                    </div>
            </div>
        )
}