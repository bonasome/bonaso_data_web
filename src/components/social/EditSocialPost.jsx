import React from 'react';
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../reuseables/loading/Loading';
import fetchWithAuth from "../../../services/fetchWithAuth";
import DynamicForm from '../reuseables/DynamicForm';
import postConfig from './postConfig';
import styles from '../reuseables/dynamicForm.module.css';
import errorStyles from '../../styles/errors.module.css';
import { useSocialPosts } from '../../contexts/SocialPostsContext';
import ReturnLink from '../reuseables/ReturnLink';


export default function EditSocialPost(){
    const navigate = useNavigate();
    //existing id
    const { id } = useParams();

    //context
    const { socialPosts, setSocialPosts, socialPostsMeta, setSocialPostsMeta } = useSocialPosts();
    //existing details
    const [existing, setExisting] = useState(null);

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

    //get the meta (platforms)
    useEffect(() => {
        const getMeta = async() => {
            if(Object.keys(socialPostsMeta).length != 0){
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
                    setErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch posts meta: ', err)
                }
            }
        }
        getMeta();
    }, []);

    //get the existing details
    useEffect(() => {
        const getPostDetails = async () => {
            const found = socialPosts.find(o => o.id.toString() === id.toString()); //try with context first
            if (found) {
                setExisting(found);
                setLoading(false);
                return;
            }
            else{
                try {
                    console.log('fetching post details...');
                    const response = await fetchWithAuth(`/api/social/posts/${id}/`);
                    const data = await response.json();
                    console.log(data)
                    if(response.ok){
                        setSocialPosts(prev => [...prev, data]);
                        setExisting(data);
                    }
                    else{
                        navigate(`/not-found`);
                    }
                    
                } 
                catch (err) {
                    console.error('Failed to fetch post: ', err);
                    setErrors(['Something went wrong. Please try again later.']);
                } 
                finally{
                    setLoading(false);
                }
            }
        };
        getPostDetails();
    }, [id])

    //set up for the form
    const formConfig = useMemo(() => {
        return postConfig(socialPostsMeta, existing);
    }, [socialPostsMeta, existing]);

    //redirect on cancel
    const handleCancel = () => {
        navigate(`/social/${id}`)
    }

    //handle submission
    const handleSubmit = async(data) => {
        //comp passes objects by default, so map these to ids
        if(data.task_ids.length > 0) {
            data.task_ids = data.task_ids.map(task => (task.id))
        }
        try{
            console.log('submitting data...');
            setSaving(true);
            const response = await fetchWithAuth(`/api/social/posts/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setSocialPosts(prev => {
                    const others = prev.filter(r => r.id !== returnData.id);
                    return [...others, returnData];
                });
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
            <ReturnLink url={`/social/${id}`} display='Return to post page' />
            <h1>Editing Post {existing.name}</h1>
            {errors.length != 0 && <div className={errorStyles.errors} ref={alertRef}>
                <ul>{errors.map((msg)=>
                    <li key={msg}>{msg}</li>)}
                </ul>
            </div>}
            <DynamicForm config={formConfig} onSubmit={handleSubmit} 
                onCancel={handleCancel} onError={(e) => setErrors(e)} saving={saving} />
        </div>
    )
}