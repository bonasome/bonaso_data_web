import { refreshAuth } from "./authServices";
const baseUrl = import.meta.env.VITE_API_URL;

export default async function fetchWithAuth(url, options = {}, retry=true) {

    // Only set Content-Type for methods that send a body
    const headers = {
        ...(options.headers || {}),
    };

    let response = await fetch(baseUrl+url, {
        ...options,
        headers,    
        credentials: 'include',
    });

    if (response.status === 401 && retry) {
        try {
            await refreshAuth(); // ask context to refresh
            return fetchWithAuth(url, options, false);
        } 
        catch (err) {
            console.warn("Refresh failed:", err);
            return response; // still return 401 so app can handle logout
        }

        // retry once after refresh
        
    }
    return response;
}