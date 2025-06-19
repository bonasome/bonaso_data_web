const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
export default async function fetchWithAuth(url, options = {}) {

    // Only set Content-Type for methods that send a body
    const headers = {
        ...(options.headers || {}),
    };

    let response = await fetch(BASE_URL+url, {
        ...options,
        headers,
        credentials: 'include',
    });

    if (response.status === 401) {
        const refreshResponse = await fetch(`${BASE_URL}/api/users/token/refresh/`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        if (refreshResponse.ok) {
            response = await fetch(BASE_URL+url, {
                ...options,
                headers,
                credentials: 'include',
            });
        } else {
            const data = await refreshResponse.json();
            console.warn('refresh token failed: ', data.detail);
        }
    }

    return response;
}