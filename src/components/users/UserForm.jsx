import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm,  useWatch } from "react-hook-form";

import { useProfiles } from '../../contexts/ProfilesContext';
import { useAuth } from '../../contexts/UserAuth';

import fetchWithAuth from "../../../services/fetchWithAuth";

import Loading from '../reuseables/loading/Loading';
import FormSection from '../reuseables/forms/FormSection';
import Messages from '../reuseables/Messages';
import ReturnLink from '../reuseables/ReturnLink';
import ButtonLoading from '../reuseables/loading/ButtonLoading';
import OrganizationsIndex from '../organizations/OrganizationsIndex';
import ClientsIndex from '../projects/clients/ClientsIndex';

import styles from '../../styles/form.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import { BsDatabaseFillAdd } from "react-icons/bs";

export default function UserForm(){
    const navigate = useNavigate();
    
    //param to get indicator (blank if new)
    const { id } = useParams();
    //context
    const { profiles, setProfiles, profilesMeta, setProfilesMeta } = useProfiles();
    const { user } = useAuth();

    //existing values to start with
    const [existing, setExisting] = useState(null);

    //page meta
    const [loading, setLoading] = useState(true);
    const [submissionErrors, setSubmissionErrors] = useState([]);
    const [success, setSuccess] = useState([]);
    const [saving, setSaving] = useState(false);

    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (submissionErrors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [submissionErrors]);

    //fetch the meta
    useEffect(() => {
        const getMeta = async () => {
            if(Object.keys(profilesMeta).length !== 0){
                setLoading(false);
                return;
            }
            else{
                try{
                    console.log('fetching profiles meta...');
                    const response = await fetchWithAuth(`/api/profiles/users/meta/`);
                    const data = await response.json();
                    setProfilesMeta(data);
                }
                catch(err){
                    setSubmissionErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch profile model information: ', err);
                }
                finally{
                    setLoading(false);
                }
            }
        }
        getMeta();
    }, []);

    useEffect(() => {
        const getProfile = async () => {
            if(!id) return;
            const found = profiles.find(o => o.id.toString() === id.toString());
            if (found) {
                setExisting(found);
                return;
            }
            else{
                try{
                    console.log('fetching profile info...')
                    const response = await fetchWithAuth(`/api/profiles/users/${id}/`);
                    const data = await response.json();
                    setExisting(data)
                    setProfiles(prev => [...prev, data]);
                }
                catch(err){
                    setSubmissionErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch organizations: ', err)
                }
            }
        }
        getProfile();
    }, [id]);   

    //handle form submission
    const onSubmit = async(data, e) => {
        setSubmissionErrors([]);
        setSuccess([]);

        let sErrors = []
        //clear any hidden fields that may have been entered if switched from anon to not anon or vice versa
        if(data.role == 'client' && !data.client_id){
            sErrors.push('Please provide a client organization for this user.')
        }
        if(data.role != 'client' && !data.organization_id){
            sErrors.push('Organization is required.')
        }
        if(data.role != 'client'){
            data.client_id = null
        }
        data.organization_id = data?.organization_id?.id ?? null;
        data.client_id = data?.client?.id ?? null
        if(sErrors.length > 0){
            setSubmissionErrors(sErrors);
            return;
        }
        const action = e.nativeEvent.submitter.value;
        try{
            setSaving(true);
            console.log('submitting data...', data);
            const url = id ? `/api/profiles/users/${id}/` : '/api/users/create-user/';
            const response = await fetchWithAuth(url, {
                method: id ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setSuccess(['User created successfuly!']);
                setProfiles(prev => {
                    const others = prev.filter(r => r.id !== returnData.id);
                    return [...others, returnData];
                });
                if(action === 'create_another'){
                    setExisting(null);
                    reset();
                    navigate('/profiles/new');
                }
                else{
                    navigate(`/profiles/${returnData.id}`);
                }
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
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setSubmissionErrors(serverResponse)
            }
        }
        catch(err){
            setSubmissionErrors(['Something went wrong. Please try again later.']);
            console.error('Could not record indicator: ', err)
        }
        finally{
            setSaving(false);
        }
    }
    
    const defaultValues = useMemo(() => {
        return {
            username: existing?.username ?? '',
            password: '',
            confirm_password: '',

            organization_id: existing?.organization ?? null,
            client_id: existing?.client_organization ?? null,
            role: existing?.role ?? null,

            first_name: existing?.first_name ?? '',
            last_name: existing?.last_name ?? '',
        }
    }, [existing]);

    const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({ defaultValues });

    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    
    const password = watch("password");

    const selectedRole = useWatch({ control, name: 'role', defaultValue: null })
    const isClient = useMemo(() => {return selectedRole === 'client'}, [selectedRole])

    const username = [
        { name: 'username', label: "Username (Required)", type: "text", rules: { required: "Required" },
            tooltip: 'Make note of this. It will be required for login. This can be changed later.'
        }
    ]

    const pass = [
        { name: 'password', label: "Password (Required)", type: "password", rules: { required: "Required" },
             tooltip: 'Make note of this. It will be required for login. This can be changed later.'
        },
        { name: 'confirm_password', label: "Confirm Password (Required)", type: "password", rules: { 
            required: "Required",   validate: value => value === password || "Passwords do not match" },
            tooltip: 'This must match the first password EXACTLY.'
        },
    ]

    const basics = [
        { name: 'first_name', label: "First Name (Required)", type: "text", rules: { required: "Required" }},
        { name: 'last_name', label: "Last Name (Required)", type: "text", rules: { required: "Required" }},
        {name: 'email', label: 'Email', type: 'email',  rules: {pattern: {value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
            message: 'Please enter a valid email.'
        }}},
    ]

    const role = [
        {name: 'role', label: 'User Role (Required)', type: 'radio',
            options: profilesMeta?.roles,  rules: { required: "Required" },
            tooltip: `A user's role determines what they are allowed to do. WARNING: Please be cautious
            assigning users higher level roles (M&E Officer, Manager) as these users will have permission
            to alter existing data. BE VERY CAREFUL ASSIGNING SITE ADMINISTRATORS!! Site Administrators have 
            significant power to delete and alter data. Only assign this role to trusted staff!!!`
        },
    ]

    const organization= [
        { name: 'organization_id', label: "User Organization (Required)", type: "model", IndexComponent: OrganizationsIndex},
    ]

    const client = [
        { name: 'client_id', label: "Client Organization (Required)", type: "model", IndexComponent: ClientsIndex},
    ]
    

    if(loading || !profilesMeta?.roles) return <Loading />
    return(
        <div className={styles.form}>
            <ReturnLink url={id ? `/profiles/${id}` : '/profiles'} display={id ? 'Return to detail page' : 'Return to profiles overview'} />
            <h1>{id ? `Editing ${existing?.display_name}` : 'New User' }</h1>
            <Messages errors={submissionErrors} success={success} ref={alertRef} />
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormSection fields={username} control={control} header='Username' />
                {!id && <FormSection fields={pass} control={control} header='Password' />}
                <FormSection fields={basics} control={control} header='Basic Information'/>
                {selectedRole === 'admin' && <Messages warnings={['You are about to make this user an admin. Please be sure you trust this person. They will have power to edit and delete anything on the site.']} />}
                {user.role === 'admin' && <FormSection fields={role} control={control} header='User Role' />}
                {!isClient && <FormSection fields={organization} control={control} header='User Organization' />}
                {isClient && user.role === 'admin' && <FormSection fields={client} control={control} header='User Organization' />}

                {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    {!id && <button type="submit" value='create_another'><BsDatabaseFillAdd /> Save and Create Another</button>}
                    <Link to={id ? `/profiles/${id}` : '/profiles'}><button type="button">
                        <FcCancel /> Cancel
                    </button></Link>
                </div>}
                {saving && <ButtonLoading />}
            </form>
        </div>
    )
}