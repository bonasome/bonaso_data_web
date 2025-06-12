import fetchWithAuth from "./fetchWithAuth";

export default async function getUser(){
    const dns = import.meta.env.VITE_DNS
    const accessToken = localStorage.getItem('access');
    try{
        const response = await fetchWithAuth(`users/api/me/`, { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await response.json();
        return data;
    }
    catch(err){
        console.error('Failed to fetch user info: ', err)
    }
    return;
}
