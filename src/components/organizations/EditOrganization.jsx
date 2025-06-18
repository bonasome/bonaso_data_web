import React from 'react';
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useOrganizations } from '../../contexts/OrganizationsContext';
import { useParams } from 'react-router-dom';
import OrganizationForm from './OrganizationForm';

export default function EditOrganization(){
    const navigate = useNavigate();
    const { id } = useParams();
    const [formConfig, setFormConfig] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { organizations, setOrganizations, organizationDetails, setOrganizationDetails } = useOrganizations();
    const [existing, setExisting] = useState({})
    const [orgIDs, setOrgIDs] = useState([]);
    const [orgNames, setOrgNames] = useState([]);

    useEffect(() => {
        const getOrganizations = async () => {
            if(Object.keys(organizations).length != 0){
                const ids = organizations.filter(o => o.id.toString() != id.toString()).map((o) => o.id);
                const names= organizations.filter(o => o.id.toString() != id.toString()).map((o)=> o.name);
                setOrgIDs(ids);
                setOrgNames(names);
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/organizations/`);
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
        }
        getOrganizations();
        
        const getOrganizationDetails = async () => {
            setLoading(true);
            const found = organizationDetails.find(o => o.id.toString() === id.toString());
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
                    setOrganizationDetails(prev => [...prev, data]);
                    setExisting(data);
                    setLoading(false);
                } 
                catch (err) {
                    console.error('Failed to fetch organization: ', err);
                    setLoading(false);
                } 
            }
        };
        getOrganizationDetails();

    }, [organizations, organizationDetails, id])

    useEffect(() => {
        console.log(existing)
        setFormConfig([
            {name: 'name', label: 'Organization Name', type: 'text', required: true, value: existing.name ? existing.name : ''},
            {name: 'parent_organization_id', label: 'Parent Organization', type: 'select', required: false, value: existing.parent_organization ? existing.parent_organization.id : '', 
                constructors: {
                    values: orgIDs,
                    labels: orgNames,
                    multiple: false,
            }},
            {name: 'office_address', label: 'Office Address', type: 'text', required: false, value: existing.office_address ? existing.office_address : ''},
            {name: 'office_email', label: 'Office Email', type: 'email', required: false, value: existing.office_email ? existing.office_email : ''},
            {name: 'office_phone',label:'Office Phone Number', type: 'text', required: false, value: existing.office_phone ? existing.office_phone : ''},
            {name: 'executive_director', label: 'Executive Director Name', type: 'text', required: false, value: existing.executive_director ? existing.executive_director : ''},
            {name: 'ed_email', label:"Executive Director's Email", type: 'email', required: false, value: existing.ed_email ? existing.ed_email : ''},
            {name: 'ed_phone', label: "Executive Director's Phone Number", type: 'text', required: false, value: existing.ed_phone ? existing.ed_phone : ''},
        ])
    }, [orgNames, orgIDs, existing])

    const handleCancel = () => {
        navigate(`/organizations/${id}`)
    }

    const handleSubmit = async(data) => {
        console.log('submitting data...', data)
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
                setOrganizationDetails(prev => [...prev, returnData])
                navigate(`/organizations/${returnData.id}`);
            }
            else{
                const data = await response.json();
                console.log(data);
            }
        }
        catch(err){
            console.error('Could not record organization: ', err)
        }
    }

    if(loading) return <Loading />

    return(
        <div>
            <h1>Editing Details for Organization {organizationDetails.name}</h1>
            <OrganizationForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} errors={errors} />
        </div>
    )
}