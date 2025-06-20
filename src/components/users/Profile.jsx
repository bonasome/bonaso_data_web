import { useEffect, useState } from "react";
import { useAuth } from '../../contexts/UserAuth';
import fetchWithAuth from "../../../services/fetchWithAuth";
import DynamicForm from "../reuseables/DynamicForm";
import Loading from '../reuseables/Loading'
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
export default function Profile(){
    const { user } = useAuth();
    const{ id } = useParams();
    const[loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null)
    const [active, setActive] = useState(false);

    useEffect(() => {
        const getProfile = async () => {
            try{
                console.log('fetching model info...')
                const response = await fetchWithAuth(`/api/profiles/users/${id}/`);
                const data = await response.json();
                setProfile(data)
                if(data.is_active){setActive(true)}
                setLoading(false)
            }
            catch(err){
                console.error('Failed to fetch profile: ', err)
                setLoading(false)
            }
        }
        getProfile()

    }, [])
    
    const deactivate = async() => {
        try{
            console.log('fetching model info...')
            const response = await fetchWithAuth(`/api/profiles/users/${id}/`,{
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'is_active': false
                })
            });
            const data = await response.json();
            if(response.ok){
                setActive(false);
            }
            else{
                console.log(data)
            }
        }
        catch(err){
            console.error('Failed to fetch profile: ', err)
        }
    }

    if(loading) return <Loading />
    return(
        <div>
            <h1>{profile.username}</h1>
            <Link to={`/profiles/${profile.id}`}> <button>Edit Profile</button></Link>
            <button onClick={() => deactivate}>Deactive User</button>
        </div>
    )
}