import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/UserAuth';
import Loading from '../reuseables/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useOrganizations } from '../../contexts/OrganizationsContext';
import styles from '../reuseables/dynamicForm.module.css';
import organizationConfig from './organizationConfig';
import errorStyles from '../../styles/errors.module.css';

export default function CreateOrganization(){
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { organizations, setOrganizations, setOrganizationDetails } = useOrganizations();
    const [orgIDs, setOrgIDs] = useState([]);
    const [orgNames, setOrgNames] = useState([]);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);

    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    useEffect(() => {
            const getOrganizations = async () => {
                try{
                    console.log('fetching organizations...')
                    const response = await fetchWithAuth(`/api/organizations/?search=${search}`);
                    const data = await response.json();
                    setOrganizations(data.results);
                    if(organizations.length > 0){
                        const ids = organizations.map((o) => o.id);
                        const names= organizations.map((o)=> o.name);
                        setOrgIDs(ids);
                        setOrgNames(names);
                    }
                    setLoading(false)
                }
                catch(err){
                    console.error('Failed to fetch organizations: ', err)
                    setLoading(false)
                }
            }
            getOrganizations();
    }, [search])

    const formConfig = useMemo(() => {
        return organizationConfig(orgIDs, orgNames, (val) => setSearch(val), user.role);
    }, [orgIDs, orgNames]);

    const handleCancel = () => {
        navigate(`/organizations`)
    }

    const handleSubmit = async(data) => {
        console.log('submitting data...')
        setErrors([]);
        if(user.role !== 'admin' && data.parent_organization_id == ''){
            setErrors(['This organization must a child of you or one of your parent organizations.'])
            return;
        }
        try{
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
                setOrganizationDetails(prev => [...prev, returnData])
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
            setSaving(false)
        }
    }

    if(loading) return <Loading />

    return(
        <div className={styles.container}>
            <h1>New Organization</h1>
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