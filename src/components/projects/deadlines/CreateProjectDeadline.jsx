import React from 'react';
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import errorStyles from '../../../styles/errors.module.css'
import Loading from '../../reuseables/loading/Loading';
import DynamicForm from '../../reuseables/DynamicForm';
import fetchWithAuth from "../../../../services/fetchWithAuth";
import { useProjects } from '../../../contexts/ProjectsContext';
import styles from '../../reuseables/dynamicForm.module.css';
import deadlinesConfig from './deadlinesConfig';

export default function CreateProjectDeadline(){
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const { projectsMeta, setProjectsMeta } = useProjects();
    const [saving, setSaving] = useState(false);
    const { id } = useParams();

    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    const formConfig = useMemo(() => {
        return deadlinesConfig();
    }, []);

    const handleCancel = () => {
        navigate(`/projects/${id}`)
    }
    const handleSubmit = async(data) => {
        data.project_id = id
        if(!data.organization_ids) data.organization_ids = [];
        if(!Array.isArray(data.organization_ids)){
            data.organization_ids = [data.organization_ids];
        }
        if(data.organization_ids?.length > 0 && typeof data.organization_ids[0] == 'object'){
            data.organization_ids = data.organization_ids.map((org) => (org.id))
        }
        console.log('submitting data...', data)
        try{
            setSaving(true);
            const response = await fetchWithAuth('/api/manage/deadlines/', {
                method: 'POST',
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
            <h1>Creating a New Deadline</h1>
            {errors.length != 0 && <div ref={alertRef} className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <DynamicForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} onError={(e) => setErrors(e)} saving={saving}/>
        </div>
    )
}