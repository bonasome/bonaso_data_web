import fetchWithAuth from "./fetchWithAuth";

/*
A couple of functions to help streamline the repeated process of favoriting/unfavoriting items.
*/
export async function checkFavorited(model, id){
    /*
    Accepts a appname.modelname str and an id and checks if this item has been favorited by a user (for determining
    state of the favorite button).
    */
    try {
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
            return returnData.favorited //boolean
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
    /*
    Accepts a appname.modelname str and an id and favorites that item. If unfavorite is selected, it will 
    unfavorite.
    */
    try {
        const url = unfavorite
        ? `/api/profiles/users/unfavorite/` //if unfavorite is true, use the correct url
        : `/api/profiles/users/favorite/`;

        const method = unfavorite ? 'DELETE' : 'POST'; //change method if unfavoriting

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