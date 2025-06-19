import React from 'react';
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/UserAuth';
import Loading from '../reuseables/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useOrganizations } from '../../contexts/OrganizationsContext';
import OrganizationForm from './OrganizationForm';

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
            if(Object.keys(organizations).length != 0){
                const ids = organizations.map((o) => o.id);
                const names= organizations.map((o)=> o.name);
                setOrgIDs(ids);
                setOrgNames(names);
                setLoading(false)
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/organizations/`);
                    const data = await response.json();
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
    }, [organizations])

    
    useEffect(() => {
        setFormConfig([
            {name: 'name', label: 'Organization Name', type: 'text', required: true},
            {name: 'parent_organization_id', label: 'Parent Organization', type: 'select', label: 'Parent Organization',  required: false, 
                constructors: {
                    values: orgIDs,
                    labels: orgNames,
                    multiple: false,
            }},
            {name: 'office_address', label: 'Office Address', type: 'text', required: false},
            {name: 'office_email', label: 'Office Email', type: 'email', required: false},
            {name: 'office_phone', label:'Office Phone Number', type: 'text', required: false},
            {name: 'executive_director', label: 'Executive Director Name', type: 'text', required: false},
            {name: 'ed_email', label:"Executive Director's Email", type: 'email', required: false},
            {name: 'ed_phone', label: "Executive Director's Phone Number", type: 'text', required: false},
        ])
    }, [orgNames, orgIDs])

    const handleCancel = () => {
        navigate(`/organizations`)
    }

    const handleSubmit = async(data) => {
        console.log('submitting data...', data)
        if(user.role !== 'admin' && data.parent_organization.id == ''){
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
                console.log(returnData);
            }
        }
        catch(err){
            console.error('Could not record organization: ', err)
        }
    }

    if(loading) return <Loading />

    return(
        <div>
            <h1>New Organization</h1>
            <OrganizationForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} errors={errors} />
        </div>
    )
}