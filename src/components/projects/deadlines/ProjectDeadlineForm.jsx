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


export default function ProjectDeadlineForm(){
    /*
    Form for editing/creating project deadlines. Requires a URL param for the related project (id) and 
    accepts an optional deadlineID URL param for when editing an existing value. 
    */
    const navigate = useNavigate();
    
    //params for the project (required) and the deadline (only if editing)
    const { id, deadlineID } = useParams(); //id is project ID
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

    useEffect(() => {
        const fetchProjectDeadlines = async () => {
            if(!deadlineID) return;
            try {
                console.log('fetching project deadlines...');
                const response = await fetchWithAuth(`/api/manage/deadlines/${deadlineID}/`);
                const data = await response.json();
                if(response.ok){
                    setExisting(data);
                }
                else{
                    navigate(`/not-found`); //navigate to 404 if a bad ID is provided
                }
            } 
            catch (err) {
                setSubmissionErrors(['Something went wrong. Please try again later.']);
                console.error('Failed to fetch deadlines: ', err);
            } 
        }
        fetchProjectDeadlines();
    }, [id]);   

    //handle form submission
    const onSubmit = async(data, e) => {
        setSubmissionErrors([]);
        setSuccess([]);

        data.project_id = id; //set the related project based on the URL param
        //these are received as objects but the backend will expect ids
        data.organization_ids = data?.organization_ids?.map((org) => (org.id)) ?? [];
        try{
            setSaving(true);
            console.log('submitting data...', data);
            const url = deadlineID ? `/api/manage/deadlines/${deadlineID}/` : `/api/manage/deadlines/`;
            const response = await fetchWithAuth(url, {
                method: deadlineID ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setSuccess(['Deadline created successfuly!']);
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
            console.error('Could not record project: ', err)
        }
        finally{
            setSaving(false);
        }
    }
    
    //set default values
    const defaultValues = useMemo(() => {
        return {
            name: existing?.name ?? '',
            description: existing?.description ?? '',
            deadline_date: existing?.deadline_date ?? '',

            organization_ids: existing?.organizations ?? [],
            cascade_to_children: existing?.cascade_to_children ?? false,
            visible_to_all: existing?.visible_to_all ?? false,
        }
    }, [existing]);

    //construct RHF variables
    const { register, control, handleSubmit, reset, watch, setFocus, formState: { errors } } = useForm({ defaultValues });

    //scroll to field errors on submission
    const onError = (errors) => {
        const firstError = Object.keys(errors)[0];
        if (firstError) {
            setFocus(firstError); // sets cursor into the field
            // scroll the element into view smoothly
            const field = document.querySelector(`[name="${firstError}"]`);
            if (field && field.scrollIntoView) {
            field.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    };

    //wait for existing to load and then set the default values
    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    const basics = [
        { name: 'name', label: 'Deadline Name (Required)', type: "text", rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} },
            placeholder: "Give this deadline a short snappy name so that people know what's due...",
        },
        { name: 'description', label: "Deadline Description", type: "textarea",
            placeholder: "Any additional information that will help people understand this deadline..."
        },
        { name: 'deadline_date', label: "Due Date (Required)", type: "date", rules: { required: "Required" }}, 
    ]
    const audience = [
        { name: 'organization_ids', label: "Organizations Involved", type: "multimodel", IndexComponent: OrganizationsIndex,
            labelField: 'name', tooltip: 'What organization(s) does this deadline affect (leave blank for your own organization, to include all subgrantees, use the box below)?'},
        {name: 'cascade_to_children', label: 'Make Visible to Subgrantees?', type: 'checkbox',
            tooltip: 'Apply this deadline to all your subgrantees'
        }
    ]
    //should only be visible to admins
    const admin = [
        {name: 'visible_to_all', label: 'Make Visible to All Project Members', type: 'checkbox',
            tooltip: 'Apply this deadline to all project members.'
        }
    ]
    
    if(loading || !projectsMeta?.statuses) return <Loading />
    return(
        <div className={styles.form}>
            <ReturnLink url={`/projects/${id}`} display={'Return to project page'} />
            <h1>{deadlineID ? `Editing ${existing?.display_name}` : 'New Deadline' }</h1>
            <Messages errors={submissionErrors} success={success} ref={alertRef} />
            <form onSubmit={handleSubmit(onSubmit, onError)}>
                <FormSection fields={basics} control={control} header='Basic Information'/>
                <FormSection fields={audience} control={control} header='Audience' />
                {user.role === 'admin' && <FormSection fields={admin} control={control} header='Admin Only' />}
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