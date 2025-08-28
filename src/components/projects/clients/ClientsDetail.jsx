import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

import { useProjects } from '../../../contexts/ProjectsContext';

import fetchWithAuth from '../../../../services/fetchWithAuth';


import UpdateRecord from '../../reuseables/meta/UpdateRecord';
import Loading from '../../reuseables/loading/Loading';
import Messages from '../../reuseables/Messages';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import CreateClientModal from './CreateClientModal';
import ReturnLink from '../../reuseables/ReturnLink';
import ButtonHover from '../../reuseables/inputs/ButtonHover';

import styles from './clientDetail.module.css';

import { FaTrashAlt } from 'react-icons/fa';
import { ImPencil } from 'react-icons/im';
import { HiUserAdd } from "react-icons/hi";
import { IoBulbSharp } from "react-icons/io5";

export default function ClientDetail(){
    /*
    Page that displays detail about a client, given an ID URL param. 
    */
    const navigate = useNavigate();
    //client id from url params
    const { id } = useParams();
    //context
    const {clients, setClients } = useProjects();
    //client details
    const [client, setClient] = useState(null);
    //related objects
    const [projects, setProjects] = useState([]); //to show projects
    const [profiles, setProfiles] = useState([]); //to show users
    const [loading, setLoading] = useState(true);
   
    //page meta
    const [editing, setEditing] = useState(false);
    const [errors, setErrors] = useState([]);
    const [del, setDel] = useState(false);

    //get basic information about the cluent
    useEffect(() => {
        const getClient = async () => {
            //try context first
            const found = clients.find(p => p.id.toString() === id.toString());
            if (found) {
                setClient(found);
                return;
            }
            else{
                try {
                    console.log('fetching client details...');
                    const response = await fetchWithAuth(`/api/manage/clients/${id}/`);
                    const data = await response.json();
                    if(response.ok){
                        setClients(prev => [...prev, data]);
                        setClient(data);
                    }
                    else{
                        navigate('/not-found')
                    }
                    
                } 
                catch (err) {
                    setErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch indicator: ', err);
                } 
            }
        };
        getClient();
    }, []);

    //load replated projects/users associated with this client
    useEffect(() => {
        const loadProjects = async () => {
            try {
                const url = `/api/manage/projects/?client=${id}`;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setProjects(data.results);
            } 
            catch (err) {
                setErrors(['Something went wrong. Please try again later.']);
                console.error('Failed to fetch projects: ', err)
            }
        };
        loadProjects();

        const loadProfiles = async () => {
            try {
                const url = `/api/profiles/users/?client_organization=${id}&is_active=true`;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setProfiles(data.results);
            } 
            catch (err) {
                setErrors(['Something went wrong. Please try again later.']);
                console.error('Failed to fetch projects: ', err)
            }
            finally{
                setLoading(false);
            }
        };
        loadProfiles();
    }, [client]);

    //delete the client
    const deleteClient = async() => {
        try {
            console.log('deleting client...');
            const response = await fetchWithAuth(`/api/manage/clients/${id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                navigate('/clients');
            } 
            else {
            let data = {};
                try {
                    data = await response.json();
                } 
                catch {
                    // no JSON body or invalid JSON
                    data = { detail: 'Unknown error occurred' };
                }
                const serverResponse = [];
                for (const field in data) {
                    if (Array.isArray(data[field])) {
                        data[field].forEach(msg => {
                            serverResponse.push(`${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Failed to delete indicator:', err);
        }
        finally{
            setDel(false);
        }
        
    } 

    if(loading || !client) return <Loading />
    return(
        <div className={styles.container}>
            {del && <ConfirmDelete name='client' onConfirm={() => deleteClient()} onCancel={() => setDel(false)} />}

            <div className={styles.segment}>
                <ReturnLink url={'/clients'} display={'Return to clients overview'} />
                <h1>{client?.name}</h1>
                <Messages errors={errors} />
                {client?.full_name && <h3><i>{client.full_name}</i></h3>}
                <h3>Description</h3>
                {client?.description ? <p>{client.description}</p> : <p>No description</p>}
                {editing && <CreateClientModal onUpdate={(data) => setClient(data)} onCancel={() => setEditing(false)} existing={client} />}
                <div style={{ display: 'flex', flexDirection: 'row'}}>
                    <ButtonHover callback = {() => setEditing(true)} noHover={<ImPencil />} hover={'Edit Details'} />
                    <ButtonHover callback = {() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Client'} forDelete={true} />
                </div>
                <UpdateRecord created_by={client.created_by} created_at={client.created_at} updated_by={client.updated_by} updated_at={client.updated_at} />
            </div>

            <div className={styles.segment}>
                <h2>Projects</h2>

                {projects?.length > 0 && projects.map((p) => (<div className={styles.card}>
                    <Link to={`/projects/${p.id}`}><h3>{p.name}</h3></Link>
                </div>))}

                {projects?.length === 0 && <div>
                    <p>This client does not have any projects.</p>
                    <Link to={'/projects/new'}><button><IoBulbSharp /> Create a new one!</button></Link>
                </div>}
            </div>

            <div className={styles.segment}>
                <h2>Users</h2>

                {profiles?.length > 0 ? profiles.map((p) => (
                    <div className={styles.card}>
                        <Link to={`/profiles/${p.id}`}><h3>{p.first_name} {p.last_name}</h3></Link>
                    </div>)) :
                    <div>
                        <p>This client does not have any active users.</p>
                        <Link to={'/profiles/new'}><button><HiUserAdd /> Add one!</button></Link>
                    </div>
                }
            </div>
        </div>
    )
}