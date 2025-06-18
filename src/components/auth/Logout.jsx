import React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/UserAuth';
import fetchWithAuth from '../../../services/fetchWithAuth';
export default function Logout() {
    const dns = import.meta.env.VITE_DNS;
    const { refreshAuth } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const logout = async () => {
            try{
                const response = await fetchWithAuth(`/api/users/logout/`, {
                    method: 'POST',
                    credentials: 'include',
                });
                if (response.ok) {
                    await refreshAuth();
                    console.log('Logged out.');
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
    }, [dns, refreshAuth, navigate]);

  return <p>Logging you out now...</p>;
}