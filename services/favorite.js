import fetchWithAuth from "./fetchWithAuth";

export async function checkFavorited(model, id){
    try {
        console.log('checking favorite status...')
        const url = `/api/profiles/users/is-favorited/`;
        
        const data = {
            model: model,
            id: id,
        }

        const response = await fetchWithAuth(url, {
            method: 'POST',
            headers: {
                'Content-Type': "application/json",
            },
            body: JSON.stringify(data)
        });

        const returnData = await response.json();

        if (response.ok) {
            return returnData.favorited
        } 
        else {
            const serverResponse = [];

            for (const field in returnData) {
                if (Array.isArray(returnData[field])) {
                returnData[field].forEach((msg) => {
                    serverResponse.push(`${field}: ${msg}`);
                });
                } 
                else {
                serverResponse.push(`${field}: ${returnData[field]}`);
                }
            }

            return serverResponse;
        }
    } catch (err) {
        console.error('Could not record favorite:', err);
        return ['Something went wrong, please try again later'];
    }
}
export async function favorite(model, id, unfavorite = false) {
    try {
        console.log('favoriting object...')
        const url = unfavorite
        ? `/api/profiles/users/unfavorite/`
        : `/api/profiles/users/favorite/`;

        const method = unfavorite ? 'DELETE' : 'POST';

        const response = await fetchWithAuth(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: model,
            id: id,
        }),
        });

        const returnData = await response.json();

        if (response.ok) {
            return []; // Success, return empty error array
        } 
        else {
            const serverResponse = [];

            for (const field in returnData) {
                if (Array.isArray(returnData[field])) {
                returnData[field].forEach((msg) => {
                    serverResponse.push(`${field}: ${msg}`);
                });
                } else {
                serverResponse.push(`${field}: ${returnData[field]}`);
                }
            }
            return serverResponse;
        }
    } 
    catch (err) {
        console.error('Could not record favorite:', err);
        return ['Something went wrong, please try again later'];
    }
}