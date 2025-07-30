import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Loading from '../reuseables/loading/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useOrganizations } from '../../contexts/OrganizationsContext';
import { useParams } from 'react-router-dom';
import styles from '../reuseables/dynamicForm.module.css';
import organizationConfig from './organizationConfig';
import { useAuth } from '../../contexts/UserAuth';
import errorStyles from '../../styles/errors.module.css';
import ReturnLink from '../reuseables/ReturnLink';

export default function EditOrganization(){
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { organizationDetails, setOrganizationDetails } = useOrganizations();
    const [existing, setExisting] = useState({})
    const [orgIDs, setOrgIDs] = useState([]);
    const [orgNames, setOrgNames] = useState([]);
    const [saving, setSaving] = useState(false);

    //scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    //fetch existing details
    useEffect(() => {
        const getOrganizationDetails = async () => {
            const found = organizationDetails.find((o) => o?.id?.toString?.() === id?.toString?.());
            if (found) {
                setExisting(found);
                setLoading(false);
                return;
            }
            else{
                try {
                    console.log('fetching organization details...');
                    const response = await fetchWithAuth(`/api/organizations/${id}/`);
                    const data = await response.json();
                    if(response.ok){
                        setOrganizationDetails(prev => [...prev, data]);
                        setExisting(data);
                        setLoading(false);
                    }
                    else{
                        navigate(`/not-found`);
                    }
                    
                } 
                catch (err) {
                    console.error('Failed to fetch organization: ', err);
                    setErrors(['Something went wrong. Please try again later']);
                    setLoading(false);
                } 
            }
        };
        getOrganizationDetails();
    }, [id])

    //setup form config with existing data
    const formConfig = useMemo(() => {
        return organizationConfig(existing);
    }, [orgIDs, orgNames, existing]);
    
    //redirect to detail page
    const handleCancel = () => {
        navigate(`/organizations/${id}`)
    }

    //handle submission
    const handleSubmit = async(data) => {
        try{
            setSaving(true);
            console.log('submitting data...');
            const response = await fetchWithAuth(`/api/organizations/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setOrganizationDetails(prev => {
                    const others = prev.filter(r => r.id !== returnData.id);
                    return [...others, returnData];
                });
                navigate(`/organizations/${returnData.id}`);
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
            console.error('Could not record organization: ', err)
        }
        finally{
            setSaving(false);
        }
    }

    if(loading) return <Loading />
    return(
        <div className={styles.container}>
            <h1>Editing Details for Organization {organizationDetails.name}</h1>
            <ReturnLink url={`/organizations/${id}`} display={'Return to organization page'} />
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