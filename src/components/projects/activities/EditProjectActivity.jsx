import React from 'react';
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import errorStyles from '../../../styles/errors.module.css'
import Loading from '../../reuseables/Loading';
import DynamicForm from '../../reuseables/DynamicForm';
import fetchWithAuth from "../../../../services/fetchWithAuth";
import { useProjects } from '../../../contexts/ProjectsContext';
import styles from '../../reuseables/dynamicForm.module.css';
import activitiesConfig from './activitiesConfig';

export default function EditProjectActivity() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { projectsMeta, setProjectsMeta } = useProjects();
    const [saving, setSaving] = useState(false);
    const [existing, setExisting] = useState(null);
    const { id, activityID } = useParams();

    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    useEffect(() => {
        const getProjectMeta = async () => {
            if(Object.keys(projectsMeta).length != 0){
                setLoading(false);
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/manage/projects/meta/`);
                    const data = await response.json();
                    setProjectsMeta(data);
                    setLoading(false);
                }
                catch(err){
                    console.error('Failed to fetch projects: ', err)
                    setLoading(false)
                }

            }
        }
        getProjectMeta();

        const fetchProjectActivities = async () => {
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
                console.error('Failed to fetch project: ', err);
            } 
        }
        fetchProjectActivities();
    }, [activityID])

    const formConfig = useMemo(() => {
        return activitiesConfig(projectsMeta, existing);
    }, [projectsMeta, existing]);

    const handleCancel = () => {
        navigate(`/projects`)
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
            const response = await fetchWithAuth(`/api/manage/activities/${activityID}/`, {
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
            <h1>Creating a New Activity</h1>
            {errors.length != 0 && <div ref={alertRef} className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <DynamicForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} onError={(e) => setErrors(e)} saving={saving}/>
        </div>
    )
}