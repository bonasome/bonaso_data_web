import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm,  useWatch } from "react-hook-form";

import { useEvents } from '../../contexts/EventsContext';

import fetchWithAuth from "../../../services/fetchWithAuth";

import Loading from '../reuseables/loading/Loading';
import FormSection from '../reuseables/forms/FormSection';
import Messages from '../reuseables/Messages';
import ReturnLink from '../reuseables/ReturnLink';
import ButtonLoading from '../reuseables/loading/ButtonLoading';
import OrganizationsIndex from '../organizations/OrganizationsIndex';
import Tasks from '../tasks/Tasks';

import styles from '../../styles/form.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import { BsDatabaseFillAdd } from "react-icons/bs";

export default function UserForm(){
    const navigate = useNavigate();
    
    //param to get indicator (blank if new)
    const { id } = useParams();
    //context
    const { eventDetails, setEventDetails, eventsMeta, setEventsMeta } = useEvents();

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
            if(Object.keys(eventsMeta).length !== 0){
                setLoading(false);
                return;
            }
            else{
                try{
                    console.log('fetching events meta...');
                    const response = await fetchWithAuth(`/api/activities/events/meta/`);
                    const data = await response.json();
                    setEventsMeta(data);
                }
                catch(err){
                    setSubmissionErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch event model information: ', err);
                }
                finally{
                    setLoading(false);
                }
            }
        }
        getMeta();
    }, []);

    useEffect(() => {
        const getEvent = async () => {
            if(!id) return;
           const found = eventDetails.find(e => e.id.toString() === id.toString());
            if (found) {
                setExisting(found);
                return;
            }
            else{
                try {
                    console.log('fetching event details...');
                    const response = await fetchWithAuth(`/api/activities/events/${id}/`);
                    const data = await response.json();
                    if(response.ok){
                        setEventDetails(prev => [...prev, data]);
                        console.log(data)
                        setExisting(data);
                    }
                    else{
                        navigate(`/not-found`);
                    }
                } 
                catch (err) {
                    setSubmissionErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch event: ', err);
                } 
            }
        };
        getEvent();
    }, [id]);   

    //handle form submission
    const onSubmit = async(data, e) => {
        setSubmissionErrors([]);
        setSuccess([]);
        const action = e.nativeEvent.submitter.value;
        data.host_id = data.host_id?.id ?? null;
        data.task_ids = data?.task_ids?.map((t) => (t.id)) ?? [];
        data.organization_ids = data?.organization_ids?.map((o) => (o.id)) ?? [];
        try{
            setSaving(true);
            console.log('submitting data...', data);
            const url = id ? `/api/activities/events/${id}/` : `/api/activities/events/`;
            const response = await fetchWithAuth(url, {
                method: id ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setSuccess(['Event created successfuly!']);
                setEventDetails(prev => {
                    const others = prev.filter(r => r.id !== returnData.id);
                    return [...others, returnData];
                });
                if(action === 'create_another'){
                    setExisting(null);
                    reset();
                    navigate('/events/new');
                }
                else{
                    navigate(`/events/${returnData.id}`);
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
            console.error('Could not record event: ', err)
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
            location: existing?.location ?? '',
            host_id: existing?.host ?? null,
            status: existing?.status ?? 'planned',
            event_type: existing?.event_type ?? '',

            task_ids: existing?.tasks ?? [],
            organization_ids: existing?.organizations ?? [],
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

    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    const start = watch("start");
    const hostOrg = watch('host_id');
    const participantOrgs = watch('organization_ids');
    
    const validOrgs = useMemo(() => {
        const host_id = hostOrg?.id
        const pos = participantOrgs.map((org) => (org.id));
        return [...pos, host_id];
    }, [hostOrg, participantOrgs])

    const basics = [
        { name: 'name', label: 'Event Name (Required)', type: "text", rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} },
            placeholder: 'ex. World AIDS Day, Counselling Session, Blood Drive...'
        },
        { name: 'description', label: "Event Description", type: "textarea",
            placeholder: 'Any notes about the purpose or function of this event...'
        },
    ]
    const info = [
        { name: 'start', label: "Event Start (Required)", type: "date", rules: { required: "Required" }},
        { name: 'end', label: "Event End (Required)", type: "date", rules: { required: "Required" ,
            validate: value => !start || value >= start || "This event cannot end before it starts."
        }},
        { name: 'location', label: "Event Location (Required)", type: "text", rules: { required: "Required" },
            tooltip: `Where did this event take place? Please be as specific as possible.`
        },
        { name: 'host_id', label: "Hosted by Organization (Required)", type: "model", IndexComponent: OrganizationsIndex,
            rules: { required: "Required" }, tooltip: `Which organization was in charge of this event? Put your own
            organization if you are not sure, even if you did not plan the event.`
        },
        {name: 'status', label: 'Event Status (Required)', type: 'radio',
            options: eventsMeta?.statuses,  rules: { required: "Required" }, 
            tooltip: `What is the current status of this event? Has it already happened? Is it ongoing?
            NOTE: For this event to contribute towards tasks that measure the number of events held, it must be 
            marked as complete!`
        },
        {name: 'event_type', label: 'Event Type (Required)', type: 'radio',
            options: eventsMeta?.event_types,  rules: { required: "Required" }, 
            tooltip: 'What kind of event was this? This is just for your own record.'
        },
        ]
    const participants = [
        {name: 'organization_ids', label: 'Participating Organizations', type: 'multimodel', IndexComponent: OrganizationsIndex,
            labelField: 'name', tooltip: `Did any of your subgrantees attend this event? You can also include any 
            subgrantees you may have trained. NOTE: If you assign a participant and also assign a task for this organization,
            they will be allowed to edit counts for that task.`
         },
    ]
    const tasks = [
        {name: 'task_ids', label: 'Linked to Tasks (Required)', type: 'multimodel', IndexComponent: Tasks,
            excludeParams: [{field: 'indicator_type', value: 'social'}], includeParams: [{field: 'organizations', value: validOrgs.join(',')}],
            tooltip: `What tasks does this event contribute to?`
        },
    ]

    if(loading || !eventsMeta?.statuses) return <Loading />
    return(
        <div className={styles.form}>
            <ReturnLink url={id ? `/events/${id}` : '/events'} display={id ? 'Return to detail page' : 'Return to events overview'} />
            <h1>{id ? `Editing ${existing?.display_name}` : 'New Event' }</h1>
            <Messages errors={submissionErrors} success={success} ref={alertRef} />
            <form onSubmit={handleSubmit(onSubmit, onError)}>
                <FormSection fields={basics} control={control} header='Basic Information'/>
                <FormSection fields={info} control={control} header='Event Information' />
                <FormSection fields={participants} control={control} header='Participants' />
                <FormSection fields={tasks} control={control} header='Associated with Task' />

                {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    {!id && <button type="submit" value='create_another'><BsDatabaseFillAdd /> Save and Create Another</button>}
                    <Link to={id ? `/events/${id}` : '/events'}><button type="button">
                        <FcCancel /> Cancel
                    </button></Link>
                </div>}
                {saving && <ButtonLoading />}
            </form>
        </div>
    )
}