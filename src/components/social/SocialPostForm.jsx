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

import styles from '../../styles/form.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import { BsDatabaseFillAdd } from "react-icons/bs";
import { FaFacebookSquare, FaInstagramSquare, FaTiktok, FaTwitter, FaYoutube, FaQuestion } from "react-icons/fa";

export default function SocialPostForm(){
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
            link_to_post: existing?.link_to_post ?? '',
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
        { name: 'name', label: 'Post Name (Required)', type: "text", rules: { required: "Required",
                maxLength: { value: 255, message: 'Maximum length is 255 characters.'}
            }, tooltip: 'A quick name to help you remember what this post is about.',
            placeholder: 'ex: NCD Facebook Campaign post 5...'
        },

        { name: 'description', label: "Post Description", type: "textarea", 
            placeholder: 'Any information tat you may want to rembmber about this post...'
        },

        { name: 'published_at', label: "Post Made On (Required)", type: "date", rules: { required: "Required" },
            tooltip: 'What date did you make this post?'
        },
        
        {name: 'link_to_post', label: 'Link to Post', type: 'text', rules: {pattern: {value: /^(https?:\/\/)?([\w.-]+)+(:\d+)?(\/[\w./#-]*)?$/,
                message: 'Please enter a valid url.',
            }}, tooltip: `You can provide a url to this post for your records.`
        },
    ]
    const task = [
        { name: 'task_ids', label: "Post Associated with Task(s) (Required)", type: "multimodel", IndexComponent: Tasks,
            includeParams: [{field: 'indicator_type', value: 'social'}], tooltip: `What tasks does this post contribute towards?`
        }
    ]
    const platformInfo = [
        {name: 'platform', label: 'Post Made on Platform (Required)', type: 'image',
            options: socialPostsMeta?.platforms, images: images,  rules: { required: "Required" },
            tooltip: `What platform was this post made on? You may only select one per post.`
        },
    ]
    const other = [
        { name: 'other_platform', label: 'Please Specify the Platform (Required)', type: "text", rules: { required: "Required",
            maxLength: { value: 255, message: 'Maximum length is 255 characters.'}
         }},
    ]

    if(loading || !socialPostsMeta?.platforms) return <Loading />
    return(
        <div className={styles.form}>
            <ReturnLink url={id ? `/social/${id}` : '/social'} display={id ? 'Return to detail page' : 'Return to social overview'} />
            <h1>{id ? `Editing Post ${existing?.display_name}` : 'New Post' }</h1>
            <Messages errors={submissionErrors} success={success} ref={alertRef} />
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormSection fields={basics} control={control} header='Basic Information'/>
                <FormSection fields={task} control={control} header='Related to Task(s)' />
                <FormSection fields={platformInfo} control={control} header='Made on Platform'/>
                {platform==='other' && <FormSection fields={other} control={control} header='Specify Platform' />}

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