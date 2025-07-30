import React from 'react';
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from 'react-router-dom';

import { useSocialPosts } from '../../contexts/SocialPostsContext';

import fetchWithAuth from "../../../services/fetchWithAuth";
import postConfig from './postConfig';

import Loading from '../reuseables/loading/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import ReturnLink from '../reuseables/ReturnLink';

import styles from '../reuseables/dynamicForm.module.css';
import errorStyles from '../../styles/errors.module.css';


export default function CreateSocialPost(){
    const navigate = useNavigate();
    //context
    const { setSocialPosts, socialPostsMeta, setSocialPostsMeta } = useSocialPosts();

    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);

    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    //retrieve the meta (for platforms)
    useEffect(() => {
        const getMeta = async() => {
            if(Object.keys(socialPostsMeta).length != 0){
                setLoading(false);
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/social/posts/meta/`);
                    const data = await response.json();
                    setSocialPostsMeta(data);
                }
                catch(err){
                    setErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch posts meta: ', err)
                }
                finally{
                    setLoading(false);
                }
            }
        }
        getMeta();
    }, []);

    //set up the form
    const formConfig = useMemo(() => {
        return postConfig(socialPostsMeta);
    }, [socialPostsMeta]);

    //redirect on cancel
    const handleCancel = () => {
        navigate('/social')
    }

    //handle form submission
    const handleSubmit = async(data, createAnother) => {
        setErrors([]);
        setSuccess(null);
        //tasks sends objects by default, so convert to just the id
        if(data.task_ids.length > 0) {
            data.task_ids = data.task_ids.map(task => (task.id))
        }
        try{
            console.log('submitting data...');
            setSaving(true);
            const response = await fetchWithAuth('/api/social/posts/', {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setSocialPosts(prev => [...prev, returnData])
                if(createAnother){
                    navigate(`/social/new`);
                    setSuccess('Post successfuly created!')
                }
                else{
                    navigate(`/social/${returnData.id}`);
                }
                
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
                        serverResponse.push(`${field}: ${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record indicator: ', err)
        }
        finally{
            setSaving(false);
        }
    }

    if(loading) return <Loading />
    return(
        <div className={styles.container}>
            <ReturnLink url={'/social'} display={'Return to social overview'} />
            <h1>New Social Media Post</h1>
            {errors.length != 0 && <div className={errorStyles.errors} ref={alertRef}>
                <ul>{errors.map((msg)=>
                    <li key={msg}>{msg}</li>)}
                </ul>
            </div>}
            {success && success !== '' && <div className={errorStyles.success}><p>{success}</p></div>}
            <DynamicForm config={formConfig} onSubmit={handleSubmit} createAnother={true}
                onCancel={handleCancel} onError={(e) => setErrors(e)} saving={saving} 
            />
        </div>
    )
}