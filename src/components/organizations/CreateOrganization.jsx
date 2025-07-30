import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth';
import { useOrganizations } from '../../contexts/OrganizationsContext';

import fetchWithAuth from "../../../services/fetchWithAuth";
import organizationConfig from './organizationConfig';

import Loading from '../reuseables/loading/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import ReturnLink from '../reuseables/ReturnLink';

import styles from '../reuseables/dynamicForm.module.css';
import errorStyles from '../../styles/errors.module.css';

export default function CreateOrganization(){
    const navigate = useNavigate();

    //special params for redirecting
    const [searchParams] = useSearchParams();
    const jumpTo = searchParams.get('to');
    const projectID = searchParams.get('projectID');
    const orgID = searchParams.get('orgID');

    //context
    const { setOrganizationDetails } = useOrganizations();

    //page meta
    //const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);

    //scroll to errors automatically
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    //set up config for DynamicForm
    const formConfig = useMemo(() => {
        return organizationConfig();
    }, []);


    //redirect on cancel
    const handleCancel = () => {
        navigate(`/organizations`)
    }

    //handle submission
    const handleSubmit = async(data, createAnother) => {
        setErrors([]);
        try{
            console.log('submitting data...')
            setSaving(true);
            const response = await fetchWithAuth('/api/organizations/', {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                //redirect switchboard
                setOrganizationDetails(prev => [...prev, returnData]);
                if(createAnother){
                    navigate('/organizations/new')
                }
                else if(jumpTo == 'projects' && projectID && orgID){
                    navigate(`/projects/${projectID}/organizations/${orgID}?adding=true`)
                }
                else{
                    navigate(`/organizations/${returnData.id}`);
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
                        serverResponse.push(`${field}: ${returnData[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.']);
            console.error('Could not record organization: ', err);
        }
        finally{
            setSaving(false);
        }
    }

    //if(loading) return <Loading />
    return(
        <div className={styles.container}>
            <h1>New Organization</h1>
            <ReturnLink url={ jumpTo == 'projects' && projectID && orgID ? `/projects/${projectID}/organizations/${orgID}` : '/organizations'} display='Return to organizations overview' />
            {errors.length != 0 &&
            <div className={errorStyles.errors} ref={alertRef}>
                <ul>{errors.map((msg)=>
                    <li key={msg}>{msg}</li>)}
                </ul>
            </div>}
            <DynamicForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} onError={(e) => setErrors(e)} saving={saving} createAnother={true} />
        </div>
    )
}