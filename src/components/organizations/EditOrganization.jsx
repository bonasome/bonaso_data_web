import React from 'react';
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useOrganizations } from '../../contexts/OrganizationsContext';
import { useParams } from 'react-router-dom';
import OrganizationForm from './OrganizationForm';
import styles from '../reuseables/dynamicForm.module.css';
import organizationConfig from './organizationConfig';
import { useAuth } from '../../contexts/UserAuth';
export default function EditOrganization(){
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { organizations, setOrganizations, organizationDetails, setOrganizationDetails } = useOrganizations();
    const [existing, setExisting] = useState({})
    const [orgIDs, setOrgIDs] = useState([]);
    const [orgNames, setOrgNames] = useState([]);
    const [search, setSearch] = useState('')

    useEffect(() => {
        const getOrganizations = async () => {
            try{
                console.log('fetching organizations...')
                const response = await fetchWithAuth(`/api/organizations/?search=${search}`);
                const data = await response.json();
                if(organizations.length > 0){
                    const ids = organizations.filter(o => o.id.toString() != id.toString()).map((o) => o.id);
                    const names= organizations.filter(o => o.id.toString() != id.toString()).map((o)=> o.name);
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
        getOrganizations();
        
        const getOrganizationDetails = async () => {
            setLoading(true);
            const found = organizationDetails.find(
                (o) => o?.id?.toString?.() === id?.toString?.()
            );
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
                    setLoading(false);
                } 
            }
        };
        getOrganizationDetails();

    }, [id, search])

    const formConfig = useMemo(() => {
            return organizationConfig(orgIDs, orgNames, (val) => setSearch(val), user.role, existing);
        }, [orgIDs, orgNames, existing]);

    const handleCancel = () => {
        navigate(`/organizations/${id}`)
    }

    const handleSubmit = async(data) => {
        console.log('submitting data...')
        try{
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
            console.error('Could not record organization: ', err)
        }
    }

    if(loading) return <Loading />

    return(
        <div className={styles.container}>
            <h1>Editing Details for Organization {organizationDetails.name}</h1>
            <OrganizationForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} errors={errors} />
        </div>
    )
}