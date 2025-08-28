import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm,  useWatch } from "react-hook-form";

import { useProjects } from '../../contexts/ProjectsContext';
import { useAuth } from '../../contexts/UserAuth';

import fetchWithAuth from "../../../services/fetchWithAuth";

import Loading from '../reuseables/loading/Loading';
import FormSection from '../reuseables/forms/FormSection';
import Messages from '../reuseables/Messages';
import ReturnLink from '../reuseables/ReturnLink';
import ButtonLoading from '../reuseables/loading/ButtonLoading';
import ClientsIndex from '../projects/clients/ClientsIndex';

import styles from '../../styles/form.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import { BsDatabaseFillAdd } from "react-icons/bs";

export default function ProjectForm(){
    const navigate = useNavigate();
    
    //param to get indicator (blank if new)
    const { id } = useParams();
    //context
    const { projectsMeta, setProjectsMeta, projectDetails, setProjectDetails } = useProjects();
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
        const getProject = async () => {
            if(!id) return;
            const found = projectDetails.find(o => o.id.toString() === id.toString());
            if (found) {
                setExisting(found);
                return;
            }
            else{
                try{
                    console.log('fetching project info...')
                    const response = await fetchWithAuth(`/api/manage/projects/${id}/`);
                    const data = await response.json();
                    setExisting(data)
                    setProjectDetails(prev => [...prev, data]);
                }
                catch(err){
                    setSubmissionErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch projects: ', err)
                }
            }
        }
        getProject();
    }, [id]);   

    //handle form submission
    const onSubmit = async(data, e) => {
        setSubmissionErrors([]);
        setSuccess([]);
        const action = e.nativeEvent.submitter.value;
        data.client_id = data?.client_id.id ?? null;
        try{
            setSaving(true);
            console.log('submitting data...', data);
            const url = id ? `/api/manage/projects/${id}/` : '/api/manage/projects/';
            const response = await fetchWithAuth(url, {
                method: id ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setSuccess(['Project created successfuly!']);
                setProjectDetails(prev => {
                    const others = prev.filter(r => r.id !== returnData.id);
                    return [...others, returnData];
                });
                if(action === 'create_another'){
                    setExisting(null);
                    reset();
                    navigate('/projects/new');
                }
                else{
                    navigate(`/projects/${returnData.id}`);
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
            console.error('Could not record project: ', err)
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

            client_id: existing?.client ?? null,
            status: existing?.status ?? 'planned',

        }
    }, [existing]);

    const { register, control, handleSubmit, reset, watch, setFocus, formState: { errors } } = useForm({ defaultValues });
    
    //scroll to errors
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
    //load existing values once existing loads, if provided
    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    const start = watch("start");

    const basics = [
        { name: 'name', label: 'Project Name (Required)', type: "text", rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} },
            placeholder: 'My cool project...', tooltip: 'Give it a memorable name.',
        },
        { name: 'description', label: "Project Description", type: "textarea",
             placeholder: 'A brief overview, the purpose, objectives, anything...'
        },
    ]
    const timing = [
        { name: 'start', label: "Project Starts On (Required)", type: "date", rules: { required: "Required" },
            tooltip: 'When does the project start? NOTE: Data collected before this date will not count!'
        },
        { name: 'end', label: "Project Ends On (Required)", type: "date", rules: { required: "Required" ,
            validate: value => !start || value >= start || "This project cannot end before it starts."
        }, tooltip: 'When does the project end? NOTE: Data collected after this date will not count!'},
        {name: 'status', label: 'Project Status (Required)', type: 'radio',
            options: projectsMeta?.statuses,  rules: { required: "Required" }, 
            tooltip: 'For internal tracking, but also note that non-admins will only be able to see active projects.'
        },
    ]
    const client = [
        { name: 'client_id', label: "Project for Client", type: "model", IndexComponent: ClientsIndex,
            tooltip: 'Who is this project done on behalf of?'
        },
    ]

    

    if(loading || !projectsMeta?.statuses) return <Loading />
    return(
        <div className={styles.form}>
            <ReturnLink url={id ? `/projects/${id}` : '/projects'} display={id ? 'Return to detail page' : 'Return to projects overview'} />
            <h1>{id ? `Editing ${existing?.name}` : 'New Project' }</h1>
            <Messages errors={submissionErrors} success={success} ref={alertRef} />
            <form onSubmit={handleSubmit(onSubmit, onError)}>
                <FormSection fields={basics} control={control} header={'Basic Information'} />
                <FormSection fields={timing} control={control} header={'Date & Status'}/>
                <FormSection fields={client} control={control} header={'Client'} />
                {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    {!id && <button type="submit" value='create_another'><BsDatabaseFillAdd /> Save and Create Another</button>}
                    <Link to={id ? `/projects/${id}` : '/projects'}><button type="button">
                        <FcCancel /> Cancel
                    </button></Link>
                </div>}
                {saving && <ButtonLoading />}
            </form>
        </div>
    )
}