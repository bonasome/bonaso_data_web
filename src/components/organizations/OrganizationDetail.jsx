import React from 'react';
import { useEffect, useState } from "react";


import { useParams, Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth';
import { useOrganizations } from '../../contexts/OrganizationsContext';

import fetchWithAuth from '../../../services/fetchWithAuth';

import Loading from '../reuseables/loading/Loading';
import ConfirmDelete from '../reuseables/ConfirmDelete';
import ReturnLink from '../reuseables/ReturnLink';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import UpdateRecord from '../reuseables/meta/UpdateRecord';

import styles from './organizationDetail.module.css';
import errorStyles from '../../styles/errors.module.css';

import { ImPencil } from 'react-icons/im';
import { FaTrashAlt } from 'react-icons/fa';

export default function OrganizationDetail(){
    const navigate = useNavigate();
    //url param
    const { id } = useParams();
    //context
    const { user } = useAuth();
    const { organizationDetails, setOrganizationDetails } = useOrganizations();
    
    //page information
    const[organization, setActiveOrganization] = useState(null);
    const [projects, setProjects] = useState([]);

    //page meta
    const [errors, setErrors] = useState([]);
    const [del, setDel] = useState(false);
    const[loading, setLoading] = useState(true);

    //fetch organization details
    useEffect(() => {
        const getOrganizationDetails = async () => {
            const found = organizationDetails.find(p => p.id.toString() === id.toString());
            if (found) {
                setActiveOrganization(found);
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
                        setActiveOrganization(data);
                    }
                    else{
                        navigate(`/not-found`);
                    }
                    
                } 
                catch (err) {
                    setErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch organization: ', err);
                }
                finally{
                    setLoading(false);
                } 
            }
        };
        getOrganizationDetails();
    }, [id])

    //fetch related projects
    useEffect(() => {
        const getProjects = async () => {
            if(!organization) return;
            try {
                console.log('fetching projects...');
                const response = await fetchWithAuth(`/api/manage/projects/?organizations=${organization.id}`);
                const data = await response.json();
                setProjects(data.results);
                setLoading(false);
            } 
            catch (err) {
                setErrors(['Something went wrong. Please try again later.'])
                console.error('Failed to fetch projects: ', err);
                setLoading(false)
            } 
        };
        getProjects();
    }, [organization]);

    //delete an organization
    const deleteOrganization = async() => {
        try {
            console.log('deleting organization...');
            const response = await fetchWithAuth(`/api/organizations/${id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                navigate('/organizations');
            } 
            else {
                let data = {};
                try {
                    data = await response.json();
                } catch {
                    // no JSON body or invalid JSON
                    data = { detail: 'Unknown error occurred' };
                }

                const serverResponse = [];
                for (const field in data) {
                    if (Array.isArray(data[field])) {
                    data[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                    });
                    } else {
                    serverResponse.push(`${field}: ${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Failed to delete organization:', err);
        }
        finally{
            setDel(false);
        }
        
    } 

    if (loading || !organization) return <Loading />
    return(
        <div className={styles.container}>
            {del && <ConfirmDelete name={organization.name} statusWarning={'We advise against deleting organizations. If this organization has any active users associated with it, you will not be able to delete it.'} onConfirm={() => deleteOrganization()} onCancel={() => setDel(false)} />}
            
            <div className={styles.section}>
                <ReturnLink url={'/organizations'} display={'Return to organizations overview'} />
                <h1>{organization.name}</h1>
                {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}

                {organization.full_name && <h3>{organization.full_name}</h3>}
                {organization.description && <p>{organization.description}</p>}
                
                
                <UpdateRecord created_by={organization.created_by} created_at={organization.created_at} 
                    updated_by={organization.updated_by} updated_at={organization.updated_at}
                />
                
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <Link to={`/organizations/${id}/edit`}><ButtonHover noHover={<ImPencil />} hover={'Edit Details'} /></Link>
                    {user.role == 'admin' && !del && <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Organization'} forDelete={true} />}
                </div>
            </div>

            <div className={styles.section}>
                <h2>Projects</h2>
                {projects.length > 0 && projects.map((p) =>(
                    <div className={styles.card}>
                        <Link to={`/projects/${p.id}/organizations/${organization.id}`}><h3>{p.name}</h3></Link>
                    </div>
                ))}
                {projects.length === 0 && <p><i>This organization is not in any projects.</i></p>}
            </div>
            <div className={styles.section}>
                <h2>Details</h2>
                <div className={styles.card}>
                    <h3>Address</h3>
                    <p>{organization.office_address ? organization.office_address : 'No address on record'}</p>
                </div>
                <div className={styles.card}>
                    <h3>Office Contacts</h3>
                    <p>Phone: {organization.office_phone ? organization.office_phone : 'No phone number on record'}</p>
                    <p>Email: {organization.office_email ? organization.office_email : 'No email on record'}</p>
                </div>
                <div className={styles.card}>
                    <h3>{organization.executive_director ? organization.executive_director : 'No Executive Director on Record'}</h3>
                    <p>Phone: {organization.ed_phone ? organization.ed_phone : 'No phone number on record'}</p>
                    <p>Email: {organization.ed_email ? organization.ed_email : 'No email on record'}</p>
                </div>
            </div>
            <div className={styles.spacer}></div>
        </div>
    )
}