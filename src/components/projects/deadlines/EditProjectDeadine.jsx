import React from 'react';
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import errorStyles from '../../../styles/errors.module.css'
import Loading from '../../reuseables/Loading';
import DynamicForm from '../../reuseables/DynamicForm';
import fetchWithAuth from "../../../../services/fetchWithAuth";
import styles from '../../reuseables/dynamicForm.module.css';
import deadlinesConfig from './deadlinesConfig';

export default function EditProjectDeadline() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);
    const [existing, setExisting] = useState(null);
    const { id, deadlineID } = useParams();

    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    useEffect(() => {
        const fetchProjectDeadlines = async () => {
            try {
                console.log('fetching project deadlines...');
                const response = await fetchWithAuth(`/api/manage/deadlines/${deadlineID}/`);
                const data = await response.json();
                if(response.ok){
                    setExisting(data);
                }
                else{
                    navigate(`/not-found`);
                }
                
            } 
            catch (err) {
                console.error('Failed to fetch project: ', err);
            } 
            finally{
                setLoading(false);
            }
        }
        fetchProjectDeadlines();
    }, [deadlineID])

    const formConfig = useMemo(() => {
        return deadlinesConfig(existing);
    }, [existing]);

    const handleCancel = () => {
        navigate(`/projects/${id}`)
    }
    const handleSubmit = async(data) => {
        if(data.start > data.end){
            setErrors(['Start date must be after the end date.'])
            return;
        }
        data.project_id = id
        if(!data.organization_ids) data.organization_ids = [];
        console.log('submitting data...', data)
        try{
            setSaving(true);
            const response = await fetchWithAuth(`/api/manage/deadlines/${deadlineID}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
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
                        serverResponse.push(`${field}: ${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record project: ', err)
        }
        finally{
            setSaving(false);
        }
    }

    if(loading) return <Loading />
    return(
        <div className={styles.container}>
            <h1>Editing Deadline {existing?.name}</h1>
            {errors.length != 0 && <div ref={alertRef} className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <DynamicForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} onError={(e) => setErrors(e)} saving={saving}/>
        </div>
    )
}