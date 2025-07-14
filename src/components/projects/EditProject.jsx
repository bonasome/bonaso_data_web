import React from 'react';
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useProjects } from '../../contexts/ProjectsContext';
import { useParams } from 'react-router-dom';
import errorStyles from '../../styles/errors.module.css';
import projectsConfig from './projectsConfig';

export default function EditProject(){
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { projectsMeta, setProjectsMeta, projectDetails, setProjectDetails } = useProjects();
    const [existing, setExisting] = useState({})
    const [saving, setSaving] = useState(false);

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
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/manage/projects/meta/`);
                    const data = await response.json();
                    setProjectsMeta(data);
                }
                catch(err){
                    console.error('Failed to fetch projects: ', err)
                }

            }
        }
        getProjectMeta();
        
        const getProjectDetails = async () => {
            setLoading(true);
            const found = projectDetails.find(p => p.id.toString() === id.toString());
            if (found) {
                setExisting(found);
                setLoading(false);
                return;
            }
            else{
                try {
                    console.log('fetching project details...');
                    const response = await fetchWithAuth(`/api/manage/projects/${id}/`);
                    const data = await response.json();
                    if(response.ok){
                        setProjectDetails(prev => [...prev, data]);
                        setExisting(data);
                        setLoading(false);
                    }
                    else{
                        navigate(`/not-found`);
                    }
                    
                } 
                catch (err) {
                    console.error('Failed to fetch project: ', err);
                    setLoading(false);
                } 
            }
        };
        getProjectDetails();

    }, [projectsMeta, setProjectsMeta, projectDetails, setProjectDetails, id])

    const formConfig = useMemo(() => {
        return projectsConfig(projectsMeta, existing);
    }, [existing, projectsMeta]);

    
    const handleCancel = () => {
        navigate(`/projects/${id}`)
    }

    const handleSubmit = async(data) => {
        if(data.start > data.end){
            setErrors(['Start date must be after the end date.'])
            return;
        }
        console.log('submitting data...', data)
        try{
            if(typeof data.client_id === 'object' && data.client_id?.id) data.client_id = data.client_id.id
            setSaving(true);
            const response = await fetchWithAuth(`/api/manage/projects/${existing.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setProjectDetails(prev => {
                    const others = prev.filter(r => r.id !== returnData.id);
                    return [...others, returnData];
                });
                navigate(`/projects/${returnData.id}`);
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
            setSaving(false)
        }
    }

    if(loading) return <Loading />

    return(
        <div>
            <h1>Editing Project {projectDetails.name}</h1>
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