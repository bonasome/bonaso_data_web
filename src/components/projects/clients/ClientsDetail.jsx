import { useEffect, useState, useMemo } from 'react';
import { useProjects } from '../../../contexts/ProjectsContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DynamicForm from '../../reuseables/DynamicForm';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import styles from './clientDetail.module.css';
import Loading from '../../reuseables/Loading';
import errorStyles from '../../../styles/errors.module.css';
import { useProfiles } from '../../../contexts/ProfilesContext';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import { useAuth } from '../../../contexts/UserAuth';
import ButtonLoading from '../../reuseables/ButtonLoading';

export default function ClientDetail(){
    const {clients, setClients } = useProjects();
    const [projects, setProjects] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState(null);
    const { id } = useParams();
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState([]);
    const [del, setDel] = useState(false);
    const [saving, setSaving] = useState(false);

    const navigate = useNavigate();
    useEffect(() => {
        const getClient = async () => {
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
                        console.error('Failed to fetch indicator: ', err);
                    } 
                }
            };
            getClient();
    }, []);

    useEffect(() => {
        const loadProjects = async () => {
                try {
                    const url = `/api/manage/projects/?client=${id}`;
                    const response = await fetchWithAuth(url);
                    const data = await response.json();
                    setProjects(data.results);
                } 
                catch (err) {
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
                    setLoading(false);
                } 
                catch (err) {
                    console.error('Failed to fetch projects: ', err)
                    setLoading(false)
                }
            };
            loadProfiles();
    }, [client])
    
    useEffect(() => {
        if(!client) return;
        setFormData({
            'name': client.name,
            'fullName': client.full_name
        })
    }, [client])

    const handleSubmit = async (data) => {
        setErrors([])
        try{
            setSaving(true);
            console.log('updating client information...')
            const response = await fetchWithAuth(`/api/manage/clients/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setClients(prev => {
                    const others = prev.filter(r => r.id !== returnData.id);
                    return [...others, returnData];
                });
                setClient(returnData);
                setEditing(false);
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
            console.error('Could not record indicator: ', err)
        }
        finally{
            setSaving(false);
        }
    }

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
                } catch {
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

    const formConfig = useMemo(() => {
        if(!client) return;
        return[
                {name: 'name', label: 'Client Name (Short)', type: 'text', required: true, value: client?.name},
                {name: 'full_name', label: 'Client Name (Full)', type: 'text', required: false, value: client?.full_name},
            ]
    }, [client]); 

    if(loading || !client) return <Loading />
    return(
        <div className={styles.container}>
            {del && <ConfirmDelete name='client' onConfirm={() => deleteClient()} onCancel={() => setDel(false)} />}
            <h1>{client?.name}</h1>
            <div className={styles.segment}>
                {client?.full_name && <h3><i>{client.full_name}</i></h3>}
                {errors.length > 0 && (
                    <div className={errorStyles.errors}>
                        <ul>{errors.map((msg) => <li key={msg}>{msg}</li>)}</ul>
                    </div>
                )}
                <div>
                    {!editing && <button onClick={() => setEditing(!editing)}>Edit Details</button>}
                    {user.role === 'admin' && !del && <button className={errorStyles.deleteButton} onClick = {() => setDel(true)}>Delete Client</button>}
                    {del && <ButtonLoading forDelete={true} />}
                </div>
                
                {editing && 
                    <div>
                        <DynamicForm config={formConfig} onSubmit={handleSubmit} onCancel={() => setEditing(false)} onError={(e) => setErrors(e)} saving={saving}/>
                    </div>
                }
                </div>
            <div className={styles.segment}>
                <h2>Projects</h2>
                {projects?.length > 0 && projects.map((p) => (
                    <div className={styles.card}>
                        <Link to={`/projects/${p.id}`}><h3>{p.name}</h3></Link>
                    </div>))
                }
                {projects?.length === 0 &&
                    <div>
                        <p>This client does not have any projects.</p>
                        <Link to={'/projects/new'}><button>Create a new one!</button></Link>
                    </div>
                }
            </div>
            <div className={styles.segment}>
                <h2>Users</h2>
                {profiles?.length > 0 ? profiles.map((p) => (
                    <div className={styles.card}>
                        <Link to={`/profiles/${p.id}`}><h3>{p.first_name} {p.last_name}</h3></Link>
                    </div>)) :
                    <div>
                        <p>This client does not have any active users.</p>
                        <Link to={'/profiles/new'}><button>Add one!</button></Link>
                    </div>
                }
            </div>
        </div>
    )
}