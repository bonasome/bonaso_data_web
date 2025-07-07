import { useEffect, useState, useMemo } from "react";
import { useAuth } from '../../contexts/UserAuth';
import fetchWithAuth from "../../../services/fetchWithAuth";
import userConfig from "./userConfig";
import UserForm from './UserForm'
import Loading from '../reuseables/Loading'
import { useNavigate } from "react-router-dom";
import styles from '../reuseables/dynamicForm.module.css';
import { useProfiles } from "../../contexts/ProfilesContext";
import { useProjects } from '../../contexts/ProjectsContext';

export default function CreateUser(){
    const { user } = useAuth();
    const navigate = useNavigate();
    const[loading, setLoading] = useState(true);
    const[orgIDs, setOrgIDs] = useState([]);
    const[orgNames, setOrgNames] = useState([]);
    const [search, setSearch] = useState('');
    const [errors, setErrors] = useState('');
    const [clientIDs, setClientIDs] = useState([]);
    const [clientNames, setClientNames] = useState([]);

    const { setProfiles, profilesMeta, setProfilesMeta } = useProfiles();
    const {projectsMeta, setProjectsMeta} = useProjects();
    useEffect(() => {
        const getMeta = async() => {
            if(Object.keys(profilesMeta).length != 0){
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/profiles/users/meta/`);
                    const data = await response.json();
                    setProfilesMeta(data);
                }
                catch(err){
                    console.error('Failed to fetch profiles meta: ', err)
                }
            }
        }
        getMeta()
        const getProjectMeta = async () => {
            if(Object.keys(projectsMeta).length != 0){
                if(projectsMeta.clients){
                    const clientIDs = projectsMeta.clients.map((c) => c.id);
                    const clientNames= projectsMeta.clients.map((c)=> c.name);
                    setClientIDs(clientIDs);
                    setClientNames(clientNames);
                }
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/manage/projects/meta/`);
                    const data = await response.json();
                    setProjectsMeta(data);
                    if(data.clients){
                        const clientIDs = data.clients.map((c) => c.id);
                        const clientNames= data.clients.map((c)=> c.name);
                        setClientIDs(clientIDs);
                        setClientNames(clientNames);
                    }
                }
                catch(err){
                    console.error('Failed to fetch projects: ', err)
                }
            }
        }
        getProjectMeta();
        const getOrganizations = async () => {
            try{
                console.log('fetching model info...')
                const response = await fetchWithAuth(`/api/organizations/?search=${search}`);
                const data = await response.json();
                const ids = data.results.map((o) => o.id);
                    const names= data.results.map((o)=> o.name);
                    setOrgIDs(ids);
                    setOrgNames(names);
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
        return userConfig(orgIDs, orgNames, clientIDs, clientNames, profilesMeta, (val) => setSearch(val));
    }, [orgIDs, orgNames, profilesMeta]);

    const handleCancel = () => {
            navigate('/profiles')
    }
    
    const handleSubmit = async(data) => {
        if(data.password != data.confirm_password){
            setErrors(['Passwords do not match.'])
            return;
        }
        console.log('submitting data...')
        try{
            const response = await fetchWithAuth('/api/users/create-user/', {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setProfiles(prev => [...prev, returnData])
                navigate(`/profiles/${returnData.id}`);
            }
            else{
                const serverResponse = []
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not create user: ', err)
        }
    }
    
        if(loading) return <Loading />
        return(
            <div className={styles.container}>
                <h1>New User</h1>
                <UserForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} errors={errors} />
            </div>
        )
}