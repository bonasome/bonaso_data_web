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

export default function OrganizationDetail(){
    const { user } = useAuth();
    const { id } = useParams();
    const[loading, setLoading] = useState(true)
    const { organizationDetails, setOrganizationDetails } = useOrganizations();
    const[activeOrganization, setActiveOrganization] = useState(null);
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
                    console.log(data)
                    setOrganizationDetails(prev => [...prev, data]);
                    setActiveOrganization(data);
                    setLoading(false);
                } 
                catch (err) {
                    console.error('Failed to fetch organization: ', err);
                    setLoading(false)
                } 
            }
        };
        getOrganizationDetails();
    }, [id, organizationDetails, setOrganizationDetails])

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
        setDel(false);
    } 



    if (loading) return <Loading />
    return(
        <div>
            {del && <ConfirmDelete name={activeOrganization.name} statusWarning={'We advise against deleting organizations. If this organization has any active users associated with it, you will not be able to delete it.'} onConfirm={() => deleteOrganization()} onCancel={() => setDel(false)} />}
            <h1>{activeOrganization.name}</h1>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            { activeOrganization.parent_organization && <p>'Parent: {activeOrganization.parent_organization.name} </p>}
            {activeOrganization?.child_organizations.length > 0 && 
                <div><p>Child Organizations</p>
                    <ul>
                        {activeOrganization.child_organizations.map((o) => (<li key={o.id}>{o.name}</li>))} 
                    </ul>
                </div>}
            <i>{activeOrganization.status}</i>
            <p>
                You got me, there's not much here yet. Eventually this will have some information about targets/performance.
            </p>
            <Link to={`/organizations/${id}/edit`}><button>Edit Details</button></Link>
            {user.role == 'admin' && <button className={errorStyles.deleteButton} onClick={() => setDel(true)} >Delete Organization</button>}
        </div>
    )
}