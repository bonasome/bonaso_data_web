import { useEffect, useState, useMemo } from "react";
import { useAuth } from '../../contexts/UserAuth';
import fetchWithAuth from "../../../services/fetchWithAuth";
import userConfig from "./userConfig";
import DynamicForm from "../reuseables/DynamicForm";
import Loading from '../reuseables/Loading'
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import UserForm from './UserForm';

export default function EditUser(){
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const[loading, setLoading] = useState(true);
    const[orgIDs, setOrgIDs] = useState([]);
    const[orgNames, setOrgNames] = useState([]);
    const [errors, setErrors] = useState('')
    const [existing, setExisting] = useState(null)
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

        const getProfile = async () => {
            try{
                console.log('fetching model info...')
                const response = await fetchWithAuth(`/api/profiles/users/${id}`);
                const data = await response.json();
                setExisting(data)
                setLoading(false)
            }
            catch(err){
                console.error('Failed to fetch organizations: ', err)
                setLoading(false)
            }
        }
        getProfile()

    }, [])

    const formConfig = useMemo(() => {
        return userConfig(orgIDs, orgNames, existing);
    }, [orgIDs, orgNames, existing]);

    const handleCancel = () => {
        navigate(`/profiles/${id}`)
    }
    
    const handleSubmit = async(data) => {
        console.log('submitting data...', data)
        try{
            const response = await fetchWithAuth(`/api/profiles/users/${id}/`, {
                method: 'PATCH',
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
                setErrors(returnData.detail)
                console.log(returnData);
            }
        }
        catch(err){
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