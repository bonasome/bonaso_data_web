import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from '../../contexts/UserAuth';
import fetchWithAuth from "../../../services/fetchWithAuth";
import userConfig from "./userConfig";
import Loading from '../reuseables/loading/Loading'
import { useNavigate } from "react-router-dom";
import styles from '../reuseables/dynamicForm.module.css';
import { useProfiles } from "../../contexts/ProfilesContext";
import DynamicForm from '../reuseables/DynamicForm';
import ReturnLink from '../reuseables/ReturnLink';
import errorStyles from '../../styles/errors.module.css';

export default function CreateUser(){
    const navigate = useNavigate();
    const[loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState(null)
    const { setProfiles, profilesMeta, setProfilesMeta } = useProfiles();
    const [saving, setSaving] = useState(false);

    //scroll to errors automatically
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    useEffect(() => {
        const getMeta = async() => {
            if(Object.keys(profilesMeta).length != 0){
                setLoading(false);
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
                    console.error('Failed to fetch profiles meta: ', err);
                    setErrors(['Something went wrong. Please try again later.'])
                }
                finally{
                    setLoading(false);
                }
            }
        }
        getMeta()
    }, [])

    const formConfig = useMemo(() => {
        return userConfig(profilesMeta);
    }, [profilesMeta]);

    const handleCancel = () => {
        navigate('/profiles')
    }
    
    const handleSubmit = async(data, createAnother) => {
        setErrors([]);
        setSuccess(null);
        let subErrors = []
        if(data.password != data.confirm_password){
            subErrors.push('Passwords do not match.')
        }
        if(typeof(data.organization) == 'object') data.organization = data?.organization?.id;
        if(typeof(data.client_id) == 'object') data.client_id = data?.client_id.id;
        if(data?.client_id && data.role != 'client') data.client_id = null;
        if(data.role != 'client' && !data?.organization) subErrors.push('Organization is required.');
        if(data.role == 'client' && !data?.client_id) subErrors.push('Client Organization is required.');
        if(subErrors.length > 0){
            setErrors(subErrors);
            return;
        }
        try{
            console.log('submitting data...')
            setSaving(true);
            const response = await fetchWithAuth('/api/users/create-user/', {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setProfiles(prev => [...prev, returnData])
                if(createAnother){
                    navigate(`/profiles/new`);
                    setSuccess('User created successfuly!')
                }
                else{
                    navigate(`/profiles/${returnData.id}`);
                }
            }
            else{
                const serverResponse = []
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${msg}`);
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
            setErrors(['Something went wrong. Please try again later.']);
            console.error('Could not create user: ', err)
        }
        finally{
            setSaving(false);
        }
    }
    
    if(loading) return <Loading />
    return(
        <div className={styles.container}>
            <ReturnLink url={'/profiles'} display={'Return to team overview'} />
            <h1>New User</h1>
            {errors.length != 0 &&
                <div className={errorStyles.errors} ref={alertRef}>
                    <ul>{errors.map((msg)=>
                        <li key={msg}>{msg}</li>)}
                    </ul>
            </div>}
            {success && success !== '' && <div className={errorStyles.success}><p>{success}</p></div>}
            <DynamicForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} 
                errors={errors} createAnother={true} onError={(e)=> setErrors(e)} saving={saving} />
        </div>
    )
}