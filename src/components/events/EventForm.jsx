import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";

import { useEvents } from '../../contexts/EventsContext';

import fetchWithAuth from "../../../services/fetchWithAuth";

import Loading from '../reuseables/loading/Loading';
import FormSection from '../reuseables/forms/FormSection';
import Messages from '../reuseables/Messages';
import ReturnLink from '../reuseables/ReturnLink';
import ButtonLoading from '../reuseables/loading/ButtonLoading';
import OrganizationsIndex from '../organizations/OrganizationsIndex';
import Tasks from '../tasks/Tasks';
import ProjectIndex from '../projects/ProjectsIndex';

import styles from '../../styles/form.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import { BsDatabaseFillAdd } from "react-icons/bs";

export default function EventForm(){
    const navigate = useNavigate();
    const { id } = useParams();
    const { eventDetails, setEventDetails, eventsMeta, setEventsMeta } = useEvents();

    const [existing, setExisting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submissionErrors, setSubmissionErrors] = useState([]);
    const [success, setSuccess] = useState([]);
    const [saving, setSaving] = useState(false);

    const alertRef = useRef(null);
    useEffect(() => {
        if (submissionErrors.length > 0 && alertRef.current) {
            alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            alertRef.current.focus({ preventScroll: true });
        }
    }, [submissionErrors]);

    useEffect(() => {
        const getMeta = async () => {
            if(Object.keys(eventsMeta).length !== 0){
                setLoading(false);
                return;
            }
            try{
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
        };
        getMeta();
    }, [eventsMeta, setEventsMeta]);

    useEffect(() => {
        const getEvent = async () => {
            if(!id) return;
            const found = eventDetails.find(e => e.id.toString() === id.toString());
            if (found) {
                setExisting(found);
                return;
            }
            try {
                const response = await fetchWithAuth(`/api/activities/events/${id}/`);
                const data = await response.json();
                if(response.ok){
                    setEventDetails(prev => [...prev, data]);
                    setExisting(data);
                } else {
                    navigate(`/not-found`);
                }
            } catch (err) {
                setSubmissionErrors(['Something went wrong. Please try again later.']);
                console.error('Failed to fetch event: ', err);
            }
        };
        getEvent();
    }, [id, eventDetails, setEventDetails, navigate]);   

    const onSubmit = async(data, e) => {
        setSubmissionErrors([]);
        setSuccess([]);
        const action = e.nativeEvent.submitter.value;
        data.host_id = data.host_id?.id ?? null;
        data.task_ids = data?.task_ids?.map((t) => (t.id)) ?? [];
        data.organization_ids = data?.organization_ids?.map((o) => (o.id)) ?? [];

        // Require task OR project
        if((!data.task_ids || data.task_ids.length === 0) && !data.project_id?.id){
            setSubmissionErrors(['Task or project is required.']);
            return;
        }

        if(data.task_ids && data.task_ids.length > 0){
            data.project_id = null;
        }
        else if(data.project_id){
            data.project_id = data.project_id.id ?? data.project_id;
        }
        try{
            setSaving(true);
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
                const msg = id ? 'Event updated successfully!' : 'Event created successfully!';
                setSuccess([msg]);
                setEventDetails(prev => {
                    const others = prev.filter(r => r.id !== returnData.id);
                    return [...others, returnData];
                }); 

                if(action === 'create_another'){ 
                    setExisting(null);
                    reset();
                    navigate('/events/new');
                } else {
                    navigate(`/events/${returnData.id}`);
                }
            } else {
                const serverResponse = [];
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                            serverResponse.push(`${field}: ${msg}`);
                        });
                    } else {
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setSubmissionErrors(serverResponse);
            }
        } catch(err){
            setSubmissionErrors(['Something went wrong. Please try again later.']);
            console.error('Could not record event: ', err);
        } finally{
            setSaving(false);
        }
    };

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
            project_id: existing?.project ?? null,
            organization_ids: existing?.organizations ?? [],
        }
    }, [existing]);

    const { register, control, handleSubmit, reset, watch, setFocus, formState: { errors } } = useForm({ defaultValues });

    const onError = (errors) => {
        const firstError = Object.keys(errors)[0];
        if (firstError) {
            setFocus(firstError);
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
    const hostOrg = watch('host_id') ?? null;
    const selectedTasks = watch('task_ids') ?? [];
    const basics = [
        { name: 'name', label: 'Event Name (Required)', type: "text", rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} },
            placeholder: 'ex. World AIDS Day, Counselling Session, Blood Drive...'
        },
        { name: 'description', label: "Event Description", type: "textarea",
            placeholder: 'Any notes about the purpose or function of this event...'
        },
    ];
    const info = [
        { name: 'start', label: "Event Start (Required)", type: "date", rules: { required: "Required" }},
        { name: 'end', label: "Event End (Required)", type: "date", rules: { required: "Required",
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
    ];
    const participants = [
        {name: 'organization_ids', label: 'Participating Organizations', type: 'multimodel', IndexComponent: OrganizationsIndex,
            labelField: 'name', tooltip: `Did any of your subgrantees attend this event? You can include any 
            subgrantees you may have trained. `
         },
    ];
    const tasks = [
        {name: 'task_ids', label: 'Linked to Tasks (Required)', type: 'multimodel', IndexComponent: Tasks,
            includeParams: [{field: 'organization', value: hostOrg?.id}, {field: 'for_event', value: 'true'}],
            tooltip: `What tasks does this event contribute to?`
        },
    ];
    const project = [
        {name: 'project_id', label: 'For Project', type: 'model', IndexComponent: ProjectIndex,
            tooltip: `If not attached to one or more tasks, what project is the event for?`
        },
    ];

    if(loading || !eventsMeta?.statuses) return <Loading />;
    return(
        <div className={styles.form}>
            <ReturnLink url={id ? `/events/${id}` : '/events'} display={id ? 'Return to detail page' : 'Return to events overview'} />
            <h1>{id ? `Editing ${existing?.display_name}` : 'New Event' }</h1>
            <Messages errors={submissionErrors} success={success} ref={alertRef} />
            <form onSubmit={handleSubmit(onSubmit, onError)}>
                <FormSection fields={basics} control={control} header='Basic Information'/>
                <FormSection fields={info} control={control} header='Event Information' />
                {hostOrg && <FormSection fields={participants} control={control} header='Participants' />}
                {hostOrg && <FormSection fields={tasks} control={control} header='Associated with Task' />}
                {selectedTasks.length === 0 && hostOrg && <FormSection fields={project} control={control} header='Associated with Project' />}
                {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    {!id && <button type="submit" value='create_another'><BsDatabaseFillAdd /> Save and Create Another</button>}
                    <button type="button" onClick={() => navigate(id ? `/events/${id}` : '/events')}>
                        <FcCancel /> Cancel
                    </button>
                </div>}
                {saving && <ButtonLoading />}
            </form>
        </div>
    );
} /* Updated with cleanup: fixed task/project validation logic, safe watch fallbacks, success messages, proper useEffect dependencies, removed unused imports, simplified cancel button to use navigate. */