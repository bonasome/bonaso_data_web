import React from 'react';
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import fetchWithAuth from "../../../services/fetchWithAuth";
import DynamicForm from '../reuseables/DynamicForm';
import postConfig from './postConfig';
import styles from '../reuseables/dynamicForm.module.css';
import errorStyles from '../../styles/errors.module.css';
import { useSocialPosts } from '../../contexts/SocialPostsContext';



export default function CreateSocialPost(){
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { setSocialPosts, socialPostsMeta, setSocialPostsMeta } = useSocialPosts();
    const [search, setSearch] = useState('')
    const [saving, setSaving] = useState(false);

    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    useEffect(() => {
        const getMeta = async() => {
            if(Object.keys(socialPostsMeta).length != 0){
                setLoading(false);
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/social/posts/get-meta/`);
                    const data = await response.json();
                    setSocialPostsMeta(data);
                }
                catch(err){
                    console.error('Failed to fetch posts meta: ', err)
                }
                finally{
                    setLoading(false);
                }
            }
        }
        getMeta();
    }, []);

    const formConfig = useMemo(() => {
        return postConfig(socialPostsMeta, (val) => setSearch(val));
    }, [socialPostsMeta]);

    const handleCancel = () => {
        navigate('/social')
    }

    const handleSubmit = async(data) => {
        const names = data.subcategory_data
        let commas = []
        if(data.task_ids.length > 0) {
            data.task_ids = data.task_ids.map(task => (task.id))
        }
        console.log('submitting data...')
        try{
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
                navigate(`/social/${returnData.id}`);
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
            <h1>New Social Media Post</h1>
            {errors.length != 0 &&
                <div className={errorStyles.errors} ref={alertRef}>
                    <ul>{errors.map((msg)=>
                        <li key={msg}>{msg}</li>)}
                    </ul>
                </div>}
            <DynamicForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} onError={(e) => setErrors(e)} saving={saving} />
        </div>
    )
}