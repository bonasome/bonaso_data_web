import { useEffect, useState } from "react";
import { useAuth } from '../../contexts/UserAuth';
import fetchWithAuth from "../../../services/fetchWithAuth";
import Loading from '../reuseables/Loading'
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import styles from './profile.module.css';
import errorStyles from '../../styles/errors.module.css';
import { IoMdReturnLeft } from "react-icons/io";
import AdminResetPassword from '../auth/passwordReset/AdminResetPassword'
import ProfileChart from '../reuseables/charts/ActivityChart';
import ActivityChart from "../reuseables/charts/ActivityChart";
import IndexView from '../reuseables/IndexView';

export default function Profile(){
    const { user } = useAuth();
    const{ id } = useParams();
    const[loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [feed, setFeed] = useState([]);
    const [active, setActive] = useState(false);
    const [changePass, setChangePass] = useState(false)
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const [search, setSearch] = useState('')

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
        const getActivityFeed = async () => {
            try{
                console.log('fetching model info...')
                const response = await fetchWithAuth(`/api/profiles/users/activity/${id}/feed/?page=${page}&search=${search}`);
                const data = await response.json();
                console.log(data.results)
                setFeed(data.results)
                setEntries(data.count)
                setLoading(false)
            }
            catch(err){
                console.error('Failed to fetch profile feed: ', err)
                setLoading(false)
            }
        }
        getActivityFeed()

    }, [page, search])
    
    
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
    const map = {
        'admin': 'Site Administrator',
        'meofficer': 'M&E Officer',
        'manager': 'Manager',
        'data_collector': 'Data Collector',
        'view_only': 'Uninitiated',
    }

    if(loading) return <Loading />
    return(
        <div className={styles.container}>
            <Link to={'/profiles'} className={styles.return}>
                <IoMdReturnLeft className={styles.returnIcon} />
                <p>Return to team overview</p>   
            </Link>
            <h1>{profile?.first_name} {profile?.last_name}</h1>
            {!active && <h3>User is inactive.</h3>}
            {changePass && <AdminResetPassword id={profile.id} />}
            <Link to={`/profiles/${profile?.id}/edit`}> <button>Edit Profile</button></Link>
            {user.role === 'admin' &&<button className={errorStyles.deleteButton} onClick={() => changeStatus(!active)}>{active ? 'Deactivate User' : 'Activate User'}</button>}
            {user.role === 'admin' && <button className={errorStyles.warningButton} onClick={() => setChangePass(true)}>Reset User Password</button>}
            <div className={styles.card}>
                <h3>Username</h3>
                <p>{profile?.username}</p>
                <h3>Email</h3>
                <p>{profile?.email}</p>
                <h3>Role</h3>
                <p>{map[profile?.role]}</p>
            </div>
            <div className={styles.card}>
                <h3>Activity (Interactions) </h3>
                <ActivityChart profile={profile} />
                <IndexView onPageChange={setPage} entries={entries} onSearchChange={setSearch}>
                    {feed.length > 0 ? 
                        <div>
                        {feed.map((a) => (
                            <p>{a.summary} at {new Date(a.date).toLocaleString()}</p>
                        ))}
                        </div> :
                        <p>No recent activity</p>
                    }
                </IndexView>
            </div>
        
        </div>
    )
}