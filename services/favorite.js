import fetchWithAuth from "./fetchWithAuth";

export async function checkFavorited(model, id){
    try {
        console.log('checking favorite status...')
        const url = `/api/profiles/favorite-${model}s/is-favorited/?id=${id}`;

        const method = 'POST';

        const response = await fetchWithAuth(url);

        const returnData = await response.json();

        if (response.ok) {
            return returnData.is_favorited
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
        ? `/api/profiles/favorite-${model}s/unfavorite/`
        : `/api/profiles/favorite-${model}s/`;

        const method = 'POST';

        const response = await fetchWithAuth(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            [`${model}_id`]: id,
        }),
        });

        const returnData = await response.json();

        if (response.ok) {
        return []; // Success, return empty error array
        } else {
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
    } catch (err) {
        console.error('Could not record favorite:', err);
        return ['Something went wrong, please try again later'];
    }
}