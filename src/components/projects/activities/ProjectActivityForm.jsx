import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm,  useWatch } from "react-hook-form";

import { useProjects } from '../../../contexts/ProjectsContext';
import { useAuth } from '../../../contexts/UserAuth';

import fetchWithAuth from "../../../../services/fetchWithAuth";

import Loading from '../../reuseables/loading/Loading';
import FormSection from '../../reuseables/forms/FormSection';
import Messages from '../../reuseables/Messages';
import ReturnLink from '../../reuseables/ReturnLink';
import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import OrganizationsIndex from '../../organizations/OrganizationsIndex';

import styles from '../../../styles/form.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";

export default function ProjectActivityForm(){
    const navigate = useNavigate();
    
    //param to get indicator (blank if new)
    const { id, activityID } = useParams();
    //context
    const { projectsMeta, setProjectsMeta } = useProjects();
    const { user } = useAuth();

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
        const getMeta = async () => {
            if(Object.keys(projectsMeta).length !== 0){
                setLoading(false);
                return;
            }
            else{
                try{
                    console.log('fetching projects meta...');
                    const response = await fetchWithAuth(`/api/manage/projects/meta/`);
                    const data = await response.json();
                    setProjectsMeta(data);
                }
                catch(err){
                    setSubmissionErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch project model information: ', err);
                }
                finally{
                    setLoading(false);
                }
            }
        }
        getMeta();
    }, []);

    //get the activity details if existing
    useEffect(() => {
        const fetchProjectActivities = async () => {
            if(!activityID) return;
            try {
                console.log('fetching project activities...');
                const response = await fetchWithAuth(`/api/manage/activities/${activityID}/`);
                const data = await response.json();
                if(response.ok){
                    setExisting(data);
                }
                else{
                    navigate(`/not-found`);
                }
            } 
            catch (err) {
                setSubmissionErrors(['Something went wrong. Please try again later.']);
                console.error('Failed to fetch project: ', err);
            } 
        }
        fetchProjectActivities();
    }, [id]);   

    //handle form submission
    const onSubmit = async(data, e) => {
        setSubmissionErrors([]);
        setSuccess([]);
        data.project_id = id
        data.organization_ids = data?.organization_ids?.map((org) => (org.id)) ?? [];
        const action = e.nativeEvent.submitter.value;
        try{
            setSaving(true);
            console.log('submitting data...', data);
            const url = activityID ? `/api/manage/activities/${activityID}/` : `/api/manage/activities/`;
            const response = await fetchWithAuth(url, {
                method: activityID ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setSuccess(['Activity created successfuly!']);
                navigate(`/projects/${id}`);
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
            console.error('Could not record activity: ', err)
        }
        finally{
            setSaving(false);
        }
    }
    
    const defaultValues = useMemo(() => {
        return {
            name: existing?.name ?? '',
            description: existing?.description ?? '',
            start: existing?.start ?? '',
            end: existing?.end ?? '',

            organization_ids: existing?.organizations ?? [],
            status: existing?.status ?? 'planned',
            category: existing?.category ?? null,
            cascade_to_children: existing?.cascade_to_children ?? false,
            visible_to_all: existing?.visible_to_all ?? false,
        }
    }, [existing]);

    const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({ defaultValues });

    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    const start = watch("start");

    const basics = [
        { name: 'name', label: 'Activity Name', type: "text", rules: { required: "Required" }},
        { name: 'description', label: "Activity Description", type: "textarea",},
        { name: 'start', label: "Activity Starts On", type: "date", rules: { required: "Required" }},
        { name: 'end', label: "Activity Ends On", type: "date", rules: { required: "Required" ,
            validate: value => !start || value >= start || "This project cannot end before it starts."
        }},

        {name: 'status', label: 'Activity Status', type: 'radio',
            options: projectsMeta?.statuses,  rules: { required: "Required" } },
        {name: 'category', label: 'Activity Status', type: 'radio',
            options: projectsMeta?.activity_categories,  rules: { required: "Required" } },
        {name: 'cascade_to_children', label: 'Make Visible to Subgrantees?', type: 'checkbox'}
    ]
     const admin= [
        { name: 'organization_ids', label: "Organizations Involved", type: "multimodel", IndexComponent: OrganizationsIndex,
            labelField: 'name',
        },
        {name: 'visible_to_all', label: 'Make Visible to All Project Members', type: 'checkbox'}
    ]
    

    if(loading || !projectsMeta?.statuses) return <Loading />
    return(
        <div className={styles.form}>
            <ReturnLink url={`/projects/${id}`} display={'Return to project page'} />
            <h1>{activityID ? `Editing ${existing?.display_name}` : 'New Activity' }</h1>
            <Messages errors={submissionErrors} success={success} ref={alertRef} />
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormSection fields={basics} control={control} />
                {user.role === 'admin' && <FormSection fields={admin} control={control} />}
                {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    <Link to={`/projects/${id}`}><button type="button">
                        <FcCancel /> Cancel
                    </button></Link>
                </div>}
                {saving && <ButtonLoading />}
            </form>
        </div>
    )
}