import React from 'react';
import { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import { useOrganizations } from '../../contexts/OrganizationsContext';
import fetchWithAuth from '../../../services/fetchWithAuth';
import Loading from '../reuseables/Loading';
import { useAuth } from '../../contexts/UserAuth';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import errorStyles from '../../styles/errors.module.css';
import ConfirmDelete from '../reuseables/ConfirmDelete';
import styles from './organizationDetail.module.css';
import { IoMdReturnLeft } from "react-icons/io";
import ButtonLoading from '../reuseables/ButtonLoading';

export default function OrganizationDetail(){
    const { user } = useAuth();
    const { id } = useParams();
    const[loading, setLoading] = useState(true)
    const { organizationDetails, setOrganizationDetails } = useOrganizations();
    const[activeOrganization, setActiveOrganization] = useState(null);
    const [projects, setProjects] = useState([]);
    const [errors, setErrors] = useState([]);
    const [del, setDel] = useState(false);

    const navigate = useNavigate();
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
                        setLoading(false);
                    }
                    else{
                        navigate(`/not-found`);
                    }
                    
                } 
                catch (err) {
                    console.error('Failed to fetch organization: ', err);
                    setLoading(false)
                } 
            }
        };
        getOrganizationDetails();
    }, [id, organizationDetails, setOrganizationDetails])

    useEffect(() => {
            const getProjects = async () => {
                if(!activeOrganization) return;
                try {
                    console.log('fetching projects...');
                    const response = await fetchWithAuth(`/api/manage/projects/?organizations=${activeOrganization.id}`);
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
        }, [activeOrganization])

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



    if (loading) return <Loading />
    return(
        <div className={styles.container}>
            {del && <ConfirmDelete name={activeOrganization.name} statusWarning={'We advise against deleting organizations. If this organization has any active users associated with it, you will not be able to delete it.'} onConfirm={() => deleteOrganization()} onCancel={() => setDel(false)} />}
            <Link to={'/organizations'} className={styles.return}>
                <IoMdReturnLeft className={styles.returnIcon} />
                <p>Return to organizations overview</p>   
            </Link>
            <div className={styles.section}>
                <h1>{activeOrganization?.name}</h1>
                {activeOrganization.full_name && <i>Full Name: {activeOrganization.full_name}</i>}
                {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                    {user.role == 'admin' && 
                        <div>
                            <p><i>Created by: {activeOrganization.created_by?.first_name} {activeOrganization.created_by?.last_name} at {new Date(activeOrganization.created_at).toLocaleString()}</i></p>
                            {activeOrganization.updated_by && activeOrganization.updated_by && <p><i>Updated by: {activeOrganization.updated_by?.first_name} {activeOrganization.updated_by?.last_name} at {new Date(activeOrganization.updated_at).toLocaleString()}</i></p>}
                        </div>
                    } 
                <div style={{ paddingTop: 15 }}>
                    <Link to={`/organizations/${id}/edit`}><button>Edit Details</button></Link>
                    {user.role == 'admin' && !del && <button className={errorStyles.deleteButton} onClick={() => setDel(true)} >Delete Organization</button>}
                    {del && <ButtonLoading forDelete={true} /> }
                </div>
            </div>
            <div className={styles.section}>
                <h2>Projects</h2>
                {projects.length > 0 && projects.map((p) =>(
                    <div className={styles.card}>
                        <Link to={`/projects/${p.id}`}><h3>{p.name}</h3></Link>
                    </div>
                ))}
                {projects.length === 0 && <p><i>This organization is not in any projects.</i></p>}
            </div>
            <div className={styles.section}>
                <h2>Details</h2>
                <div className={styles.card}>
                    <h3>Address</h3>
                    <p>{activeOrganization.office_address ? activeOrganization.office_address : 'No address on record'}</p>
                </div>
                <div className={styles.card}>
                    <h3>Office Contacts</h3>
                    <p>Phone: {activeOrganization.office_phone ? activeOrganization.office_phone : 'No phone number on record'}</p>
                    <p>Email: {activeOrganization.office_email ? activeOrganization.office_email : 'No email on record'}</p>
                </div>
                <div className={styles.card}>
                    <h3>{activeOrganization.executive_director ? activeOrganization.executive_director : 'No Executive Director on Record'}</h3>
                    <p>Phone: {activeOrganization.ed_phone ? activeOrganization.ed_phone : 'No phone number on record'}</p>
                    <p>Email: {activeOrganization.ed_email ? activeOrganization.ed_email : 'No email on record'}</p>
                </div>
            </div>
            <div className={styles.spacer}></div>
        </div>
    )
}