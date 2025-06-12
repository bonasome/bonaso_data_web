
export default async function fetchWithAuth(url, options = {}){
    const dns = import.meta.env.VITE_DNS
    let accessToken = localStorage.getItem('access');
    const refreshToken = localStorage.getItem('refresh');
    if (!options.headers) options.headers = {};
    
    options.headers['Authorization'] = `Bearer ${accessToken}`;
    if (options.body && !options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
    }
    let response = await fetch(`${dns}${url}`, options);
    if(response.status == 401 && refreshToken){
        const refreshResponse = await fetch(`${dns}/users/api/token/refresh/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 'refresh': refreshToken }),
        });

        if(refreshResponse.ok){
            const data = await refreshResponse.json();
            accessToken = data.access;
            localStorage.setItem('access', accessToken);

            options.headers.Authorization = `Bearer ${accessToken}`;
            response = await fetch(`${dns}${url}`, options);
        }
        else{
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            console.error('Authentication failed. Please log in again.')
        }
    }
    return response
}