import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from '../../contexts/UserAuth';
import { useProfiles } from '../../contexts/ProfilesContext';

import fetchWithAuth from "../../../services/fetchWithAuth";
import prettyDates from '../../../services/prettyDates';
import Loading from '../reuseables/loading/Loading'
import Messages from '../reuseables/Messages';
import ReturnLink from '../reuseables/ReturnLink';
import AdminResetPassword from '../auth/passwordReset/AdminResetPassword'
import Activity from './Activity';
import ButtonHover from "../reuseables/inputs/ButtonHover";

import styles from './profile.module.css';

import { ImPencil } from "react-icons/im";
import { IoIosArrowDropup, IoIosArrowDropdownCircle } from "react-icons/io";
import { RiUserForbidFill, RiUserFollowFill } from "react-icons/ri";
import { TbPasswordUser } from "react-icons/tb";

export default function Profile(){
    /*
    Displays information about a user. Permissions depend on role. Requires an ID URL param for loading user details.
    */
    //user id from params
    const{ id } = useParams();

    //context
    const { user } = useAuth();
    const { setProfiles, profilesMeta, setProfilesMeta } = useProfiles();

    const [profile, setProfile] = useState(null); //user information
    const [activity, setActivity] = useState([]); //a user's activity (created/updated)

    //control section visibility
    const [showDetails, setShowDetails] = useState(true);
    const [showActivity, setShowActivity] = useState(false);

    //page meta
    const[loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [changePass, setChangePass] = useState(false); //shows/hides password changer
    
    //get profile detials, meta, and activity
    useEffect(() => {
        const getProfile = async () => {
            try{
                console.log('fetching profile info...')
                const response = await fetchWithAuth(`/api/profiles/users/${id}/`);
                const data = await response.json();
                setProfile(data);
                setProfiles(prev => [...prev, data]);
                setLoading(false)
            }
            catch(err){
                setErrors(['Something went wrong. Please try again later.']);
                console.error('Failed to fetch profile: ', err);
                setLoading(false)
            }
        }
        getProfile();

        const getMeta = async() => {
            if(Object.keys(profilesMeta).length != 0){
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/profiles/users/meta/`);
                    const data = await response.json();
                    setProfilesMeta(data);
                }
                catch(err){
                    setErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch profiles meta: ', err)
                }
            }
        }
        getMeta();

        const getActivity = async() => {
            try{
                console.log('fetching model info...')
                const response = await fetchWithAuth(`/api/profiles/users/${id}/activity/`);
                const data = await response.json();
                setActivity(data);
            }
            catch(err){
                setErrors(['Something went wrong. Please try again later.']);
                console.error('Failed to fetch profiles meta: ', err)
            }
        }
        getActivity();
    }, [id])

    //deactivate/activate user (admin only)
    const changeStatus = async(to) => {
        //to = activate or deactivate (based on user's current status)
        try{
            console.log('updating user status...')
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
                setProfile(data);
            }
            else{
                const serverResponse = []
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Failed to change status. Please try again later.']);
            console.error('Failed to fetch profile: ', err);
        }
    }

    //helper to convert db values to labels
    const getLabelFromValue = (field, value) => {
        if(!profilesMeta) return null
        const match = profilesMeta[field]?.find(range => range.value === value);
        return match ? match.label : null;
    };
    
    if(loading || !profile?.role) return <Loading />

    return(
        <div className={styles.container}>
            <Messages errors={errors} />
            
            {['admin', 'meofficer', 'manager'].includes(user.role) && 
                <ReturnLink url={'/profiles'} display='Return to team overview' />}

            <h1>{profile?.first_name} {profile?.last_name}</h1>

            {profile?.username === user.username && <h3><i>This is you.</i></h3>}

            {!profile?.is_active && <div>
                <h3>User is inactive.</h3>
            </div>}

            <div className={styles.dropdownSegment}>
                <div className={styles.toggleDropdown} onClick={() => setShowDetails(!showDetails)}>
                    <h3 style={{ textAlign: 'start'}}>Profile</h3>
                    {showDetails ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                    <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                </div>

                {showDetails && <div className={styles.dropdownContent}>
                    <div className={styles.card}>
                        <h3>Username</h3>
                        <p>{profile.username}</p>

                        <h3>Organization</h3>
                        {profile.role == 'client' ? <Link to={`/clients/${profile?.client_organization?.id}`}>
                                <p>{profile.client_organization.name}</p>
                            </Link> :
                            <Link to={`/organizations/${profile?.organization?.id}`}>
                                <p>{profile.organization.name}</p>
                            </Link>}

                        {profile.email && <div> 
                            <h3>Email</h3>
                            <p>{profile.email}</p>
                        </div>}

                        <h3>Role</h3> 
                        <p>{getLabelFromValue('roles', profile.role)}</p>

                        {changePass && <AdminResetPassword id={profile.id} />}
                        <h3>Joined</h3>
                        <p>{prettyDates(profile.date_joined)}</p>
                        <h3>Last Logged in</h3>
                        {profile.last_login ? <p>{prettyDates(profile.last_login, true)}</p> : <p>Never</p>}
                    </div>
                    {/* For changing passwords */}
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        {profile.is_active && <Link to={`/profiles/${profile?.id}/edit`}> <ButtonHover noHover={<ImPencil />} 
                            hover={'Edit Profile'} /></Link>}
                        {user.role === 'admin' && <ButtonHover callback={() => setChangePass(!changePass)} 
                            noHover={<TbPasswordUser />} hover={changePass ? 'Cancel' : 'Reset User Password'} forWarning={true}/>}
                        {user.role === 'admin' && <div>
                            {profile.is_active && <ButtonHover callback={() => changeStatus(false)} 
                                noHover={<RiUserForbidFill />} hover={'Deactivate User'} forDelete={true} />}
                            {!profile.is_active && <ButtonHover callback={() => changeStatus(true)} 
                                noHover={<RiUserFollowFill />} hover={'Activate User'} />}
                        </div>}
                    </div>
                </div>}
            </div>

            <div className={styles.dropdownSegment}>
                <div className={styles.toggleDropdown} onClick={() => setShowActivity(!showActivity)}>
                    <h3 style={{ textAlign: 'start'}}>Activity</h3>
                    {showActivity ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                    <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                </div>

                {showActivity && <div className={styles.dropdownContent}>
                    {Object.keys(activity).length > 0 ? <Activity activity={activity} /> : <p>No activity yet. Check back later.</p>}
                </div>}
            </div>
            <div className='spacer'></div>
        </div>
    )
}