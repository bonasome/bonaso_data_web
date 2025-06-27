import { useEffect, useState } from "react";
import { useAuth } from '../../contexts/UserAuth';
import fetchWithAuth from "../../../services/fetchWithAuth";
import Loading from '../reuseables/Loading'
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import styles from './profile.module.css';
import errorStyles from '../../styles/errors.module.css';
import { IoMdReturnLeft } from "react-icons/io";

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
                if(data.is_active){
                    setActive(true)
                }
                setLoading(false)
            }
            catch(err){
                console.error('Failed to fetch profile: ', err)
                setLoading(false)
            }
        }
        getProfile()

    }, [])
    
    
    const changeStatus = async(to) => {
        try{
            console.log('fetching model info...')
            const response = await fetchWithAuth(`/api/profiles/users/${id}/`,{
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'is_active': to
                })
            });
            const data = await response.json();
            if(response.ok){
                setActive(to);
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
        <div className={styles.container}>
            <Link to={'/profiles'} className={styles.return}>
                <IoMdReturnLeft className={styles.returnIcon} />
                <p>Return to team overview</p>   
            </Link>
            <h1>{profile.first_name} {profile.last_name}</h1>
            {!active && <h3>User is inactive.</h3>}
            <Link to={`/profiles/${profile.id}/edit`}> <button>Edit Profile</button></Link>
            {user.role === 'admin' &&<button className={errorStyles.deleteButton} onClick={() => changeStatus(!active)}>{active ? 'Deactivate User' : 'Activate User'}</button>}
        </div>
    )
}