import React from 'react';
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/UserAuth';
import Loading from '../reuseables/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useOrganizations } from '../../contexts/OrganizationsContext';
import OrganizationForm from './OrganizationForm';
import styles from '../reuseables/dynamicForm.module.css';
import organizationConfig from './organizationConfig';


export default function CreateOrganization(){
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formConfig, setFormConfig] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { organizations, setOrganizations, setOrganizationDetails } = useOrganizations();
    const [orgIDs, setOrgIDs] = useState([]);
    const [orgNames, setOrgNames] = useState([]);

    useEffect(() => {
        const getOrganizations = async () => {
            if(typeof organizations === Object && Object.keys(organizations).length != 0){
                const ids = organizations.map((o) => o.id);
                const names= organizations.map((o)=> o.name);
                setOrgIDs(ids);
                setOrgNames(names);
                setLoading(false)
                return;
            }
            else{
                try{
                    console.log('fetching organizations...')
                    const response = await fetchWithAuth(`/api/organizations/`);
                    const data = await response.json();
                    console.log(data)
                    if(organizations.length > 0){
                        const ids = organizations.map((o) => o.id);
                        const names= organizations.map((o)=> o.name);
                        setOrgIDs(ids);
                        setOrgNames(names);
                    }
                    setOrganizations(data.results);
                    setLoading(false)
                }
                catch(err){
                    console.error('Failed to fetch organizations: ', err)
                    setLoading(false)
                }
            }
        }
        getOrganizations();
    }, [])

    
    useEffect(() => {
        setFormConfig(organizationConfig(orgIDs, orgNames))
    }, [orgNames, orgIDs])

    const handleCancel = () => {
        navigate(`/organizations`)
    }

    const handleSubmit = async(data) => {
        console.log('submitting data...', data)
        if(user.role !== 'admin' && data.parent_organization_id == ''){
            setErrors(['This organization must a child of you or one of your parent organizations.'])
            return;
        }
        try{
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
    }

    if(loading) return <Loading />

    return(
        <div className={styles.container}>
            <h1>New Organization</h1>
            <OrganizationForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} errors={errors} />
        </div>
    )
}