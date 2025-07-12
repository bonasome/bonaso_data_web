import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useEvents } from '../../contexts/EventsContext';
import eventConfig from './eventConfig';
import styles from '../reuseables/dynamicForm.module.css';
import DynamicForm from '../reuseables/DynamicForm';
import errorStyles from '../../styles/errors.module.css';

export default function CreateEvent(){
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { events, setEvents, setEventDetails, eventsMeta, setEventsMeta } = useEvents();
    const [orgIDs, setOrgIDs] = useState([]);
    const [orgNames, setOrgNames] = useState([]);
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
            if(Object.keys(eventsMeta).length != 0){
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/activities/events/meta/`);
                    const data = await response.json();
                    setEventsMeta(data);
                }
                catch(err){
                    console.error('Failed to fetch indicators meta: ', err)
                }
            }
        }
        getMeta()

        const getOrgs= async () => {
            try {
                console.log('fetching organizations info...');
                const response = await fetchWithAuth(`/api/organizations/?search=${search}`);
                const data = await response.json();
                const ids = data.results.map(o => o.id);
                const names = data.results.map(o => o.name);
                setOrgIDs(ids);
                setOrgNames(names);
                setLoading(false);
            } 
            catch (err) {
                console.error('Failed to fetch indicators: ', err);
                setLoading(false);
            }
        };
        getOrgs();
    }, [search]);

    const formConfig = useMemo(() => {
        return eventConfig(orgIDs, orgNames, eventsMeta.event_types, (val) => setSearch(val));
    }, [orgIDs, orgNames, eventsMeta]);

    const handleCancel = () => {
        navigate('/indicators')
    }

    const handleSubmit = async(data) => {
        console.log('submitting data...',)
        try{
            setSaving(true);
            const response = await fetchWithAuth('/api/activities/events/', {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setEventDetails(prev => [...prev, returnData])
                navigate(`/events/${returnData.id}`);
            }
            else{
                const serverResponse = []
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${returnData[field]}`);
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
            <h1>New Event</h1>
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