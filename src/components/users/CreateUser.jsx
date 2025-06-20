import { useEffect, useState, useMemo } from "react";
import { useAuth } from '../../contexts/UserAuth';
import fetchWithAuth from "../../../services/fetchWithAuth";
import userConfig from "./userConfig";
import UserForm from './UserForm'
import Loading from '../reuseables/Loading'
import { useNavigate } from "react-router-dom";


export default function CreateUser(){
    const { user } = useAuth();
    const navigate = useNavigate();
    const[loading, setLoading] = useState(true);
    const[orgIDs, setOrgIDs] = useState([]);
    const[orgNames, setOrgNames] = useState([]);
    const [roles, setRoles] = useState(['admin', 'manager', 'meofficer', 'data_collector', 'view_only', 'disable']);
    const[roleNames, setRoleNames] = useState(['Administrator', 'Manager', 'M&E Officer', 'Data Collector', 'View Only', 'SET AS INACTIVE'])
    const [errors, setErrors] = useState('')
    
    useEffect(() => {
        const getOrganizations = async () => {
            try{
                console.log('fetching model info...')
                const response = await fetchWithAuth(`/api/organizations/`);
                const data = await response.json();
                console.log(data.results)
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
    }, [])

    const formConfig = useMemo(() => {
        return userConfig(orgIDs, orgNames);
    }, [orgIDs, orgNames]);

    const handleCancel = () => {
            navigate('/profiles')
    }
    
    const handleSubmit = async(data) => {
        if(data.password != data.confirm_password){
            setErrors(['Passwords do not match.'])
            return;
        }
        console.log('submitting data...', data)
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
            <div>
                <h1>New User</h1>
                <UserForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} errors={errors} />
            </div>
        )
}