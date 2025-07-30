import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm,  useWatch } from "react-hook-form";

import { useSocialPosts } from '../../contexts/SocialPostsContext';

import fetchWithAuth from "../../../services/fetchWithAuth";

import Loading from '../reuseables/loading/Loading';
import FormSection from '../reuseables/forms/FormSection';
import Messages from '../reuseables/Messages';
import ReturnLink from '../reuseables/ReturnLink';
import ButtonLoading from '../reuseables/loading/ButtonLoading';
import Tasks from '../tasks/Tasks';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import { BsDatabaseFillAdd } from "react-icons/bs";
import { FaFacebookSquare, FaInstagramSquare, FaTiktok, FaTwitter, FaYoutube, FaQuestion } from "react-icons/fa";

export default function UserForm(){
    const navigate = useNavigate();
    
    //param to get indicator (blank if new)
    const { id } = useParams();
    //context
    const { socialPosts, setSocialPosts, socialPostsMeta, setSocialPostsMeta } = useSocialPosts();

    //existing values to start with
    const [existing, setExisting] = useState(null);

    //page meta
    const [loading, setLoading] = useState(true);
    const [submissionErrors, setSubmissionErrors] = useState([]);
    const [success, setSuccess] = useState([]);
    const [saving, setSaving] = useState(false);

    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (submissionErrors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [submissionErrors]);

    //fetch the meta
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
                    setSubmissionErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch posts meta: ', err)
                }
                finally{
                    setLoading(false);
                }
            }
        }
        getMeta();
    }, []);

    useEffect(() => {
        const getPostDetails = async () => {
            if(!id) return;
            const found = socialPosts.find(o => o.id.toString() === id.toString()); //try with context first
            if (found) {
                setExisting(found);
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
                    setSubmissionErrors(['Something went wrong. Please try again later.']);
                } 
            }
        };
        getPostDetails();
    }, [id]);   

    //handle form submission
    const onSubmit = async(data, e) => {
        setSubmissionErrors([]);
        setSuccess([]);
        if(data.task_ids.length > 0) {
            data.task_ids = data.task_ids.map(task => (task.id))
        }
        const action = e.nativeEvent.submitter.value;
        try{
            setSaving(true);
            console.log('submitting data...', data);
            const url = id ? `/api/social/posts/${id}/` : `/api/social/posts/`;
            const response = await fetchWithAuth(url, {
                method: id ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setSuccess(['Post recorded successfuly!']);
                setSocialPosts(prev => {
                    const others = prev.filter(r => r.id !== returnData.id);
                    return [...others, returnData];
                });
                if(action === 'create_another'){
                    setExisting(null);
                    reset();
                    navigate('/social/new');
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
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setSubmissionErrors(serverResponse)
            }
        }
        catch(err){
            setSubmissionErrors(['Something went wrong. Please try again later.']);
            console.error('Could not record post: ', err)
        }
        finally{
            setSaving(false);
        }
    }
    
    const defaultValues = useMemo(() => {
        return {
            name: existing?.name ?? '',
            name: existing?.description ?? '',
            task_ids: existing?.tasks ?? [],
            published_at: existing?.published_at ?? new Date().toISOString().split('T')[0],

            platform: existing?.platform ?? null,
            other_platform: existing?.other_platform ?? '',
        }
    }, [existing]);

    const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({ defaultValues });

    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    const platform = watch("platform");

    const images = [FaFacebookSquare, FaInstagramSquare, FaTiktok, FaTwitter, FaYoutube, FaQuestion];

    const basics = [
        { name: 'name', label: 'Post Name', type: "text", rules: { required: "Required" }},
        { name: 'description', label: "Post Description", type: "textarea",},
        { name: 'published_at', label: "Post Made On", type: "date", rules: { required: "Required" }},

        { name: 'task_ids', label: "Post Associated with Task(s)", type: "multimodel", IndexComponent: Tasks},
        {name: 'platform', label: 'Post Made on Platform', type: 'image',
            options: socialPostsMeta?.platforms, images: images,  rules: { required: "Required" } },
    ]
    const other = [
        { name: 'other_platform', label: 'Please Specify the Platform', type: "text", rules: { required: "Required" }},
    ]

    

    if(loading || !socialPostsMeta?.platforms) return <Loading />
    return(
        <div>
            <ReturnLink url={id ? `/social/${id}` : '/social'} display={id ? 'Return to detail page' : 'Return to social overview'} />
            <h1>{id ? `Editing ${existing?.display_name}` : 'New User' }</h1>
            <Messages errors={submissionErrors} success={success} ref={alertRef} />
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormSection fields={basics} control={control} />
                {platform==='other' && <FormSection fields={other} control={control} />}

                {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    {!id && <button type="submit" value='create_another'><BsDatabaseFillAdd /> Save and Create Another</button>}
                    <Link to={id ? `/social/${id}` : '/social'}><button type="button">
                        <FcCancel /> Cancel
                    </button></Link>
                </div>}
                {saving && <ButtonLoading />}
            </form>
        </div>
    )
}