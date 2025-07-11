import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useEvents } from '../../contexts/EventsContext';
import eventConfig from './eventConfig';
import styles from '../reuseables/dynamicForm.module.css';
import errorStyles from '../../styles/errors.module.css';
import DynamicForm from '../reuseables/DynamicForm';

export default function EditEvent(){
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { eventDetails, setEventDetails, eventsMeta, setEventsMeta } = useEvents();
    const [existing, setExisting] = useState(null);
    const [orgIDs, setOrgIDs] = useState([]);
    const [orgNames, setOrgNames] = useState([]);
    const [search, setSearch] = useState('')
    
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

        const getEventDetails = async () => {
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
                    console.error('Failed to fetch event: ', err);
                } 
            }
        };
        getEventDetails();
    }, [id]);

    useEffect(() => {
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
        return eventConfig(orgIDs, orgNames, eventsMeta.event_types, (val) => setSearch(val), existing);
    }, [orgIDs, orgNames, eventsMeta]);

    const handleCancel = () => {
        navigate(`/events/${id}`)
    }

    const handleSubmit = async(data) => {
        console.log('submitting data...', data)
        try{
            const response = await fetchWithAuth(`/api/activities/events/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setEventDetails(prev => {
                    const others = prev.filter(r => r.id !== returnData.id);
                    return [...others, returnData];
                });
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
    }

    if(loading) return <Loading />

    return(
        <div className={styles.container}>
            <h1>Editing event {existing?.name}</h1>
            {errors.length != 0 &&
            <div className={errorStyles.errors} ref={alertRef}>
                <ul>{errors.map((msg)=>
                    <li key={msg}>{msg}</li>)}
                </ul>
            </div>}
            <DynamicForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} onError={(e) => setErrors(e)} />
        </div>
    )
}