import { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';

import fetchWithAuth from "../../../services/fetchWithAuth";
function ViewRespondent() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState(null)
    useEffect(() => {
        const getRespondent = async() => {
            try{
                const response = await fetchWithAuth(`respondents/api/get/${id}`);
                const data = await response.json();
                setData(data);
                setLoading(false);
            }
            catch(err){
                console.warn('Failed to get respondent from server: ', err);
                setLoading(false);
            }
        }
        getRespondent()
    }, [])
    console.log(data)
    if(loading){return (<p>Loading...</p>)}
    return (
        <div>
            <h5>Viewing...</h5>
            {!data.isAnonymous && (<h2>{data.first_name} {data.last_name}</h2>)}
            {data.isAnonymous && (<h2>Anonymous</h2>)}
        </div>
    )
}

export default ViewRespondent