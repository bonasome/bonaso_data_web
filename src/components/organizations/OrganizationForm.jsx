import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm,  useWatch } from "react-hook-form";

import { useOrganizations } from '../../contexts/OrganizationsContext';

import fetchWithAuth from "../../../services/fetchWithAuth";

import Loading from '../reuseables/loading/Loading';
import FormSection from '../reuseables/forms/FormSection';
import Messages from '../reuseables/Messages';
import ReturnLink from '../reuseables/ReturnLink';
import ButtonLoading from '../reuseables/loading/ButtonLoading';

import styles from '../../styles/form.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import { BsDatabaseFillAdd } from "react-icons/bs";

export default function OrganizationForm(){
    const navigate = useNavigate();
    
    //param to get indicator (blank if new)
    const { id } = useParams();

    //special params for redirecting
    const [searchParams] = useSearchParams();
    const jumpTo = searchParams.get('to');
    const projectID = searchParams.get('projectID');
    const orgID = searchParams.get('orgID');

    //context
    const { organizationDetails, setOrganizationDetails } = useOrganizations();

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
        const getOrganizationDetails = async () => {
            if(!id) {
                setLoading(false);
                return;
            }
            const found = organizationDetails.find((o) => o?.id?.toString?.() === id?.toString?.());
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
                    if(response.ok){
                        setOrganizationDetails(prev => [...prev, data]);
                        setExisting(data);
                        setLoading(false);
                    }
                    else{
                        navigate(`/not-found`);
                    }
                    
                } 
                catch (err) {
                    console.error('Failed to fetch organization: ', err);
                    setSubmissionErrors(['Something went wrong. Please try again later']);
                    setLoading(false);
                } 
            }
        };
        getOrganizationDetails();
    }, [id]) 

    //handle form submission
    const onSubmit = async(data, e) => {
        setSubmissionErrors([]);
        setSuccess([]);

        let sErrors = []
        const action = e.nativeEvent.submitter.value;
        try{
            setSaving(true);
            console.log('submitting data...', data);
            const url = id ? `/api/organizations/${id}/` : '/api/organizations/';
            const response = await fetchWithAuth(url, {
                method: id ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setSuccess(['Organization created successfuly!']);
                setOrganizationDetails(prev => {
                    const others = prev.filter(r => r.id !== returnData.id);
                    return [...others, returnData];
                });
                if(jumpTo == 'projects' && projectID && orgID){
                    navigate(`/projects/${projectID}/organizations/${orgID}?adding=true`)
                }
                else if(action === 'create_another'){
                    setExisting(null);
                    reset();
                    navigate('/organizations/new');
                }
                else{
                    navigate(`/organizations/${returnData.id}`);
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
            console.error('Could not record organization: ', err)
        }
        finally{
            setSaving(false);
        }
    }
    
    const defaultValues = useMemo(() => {
        return {
            name: existing?.name ?? '',
            full_name: existing?.full_name ?? '',
            description: existing?.description ?? '',

            office_address: existing?.office_address ?? '',
            office_email: existing?.office_email ?? '',
            office_phone: existing?.office_phone ?? '',

            executive_director: existing?.executive_director ?? '',
            ed_email: existing?.ed_email ?? '',
            ed_phone: existing?.ed_phone ?? '',
        }
    }, [existing]);

    const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({ defaultValues });

    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    const basics = [
        { name: 'name', label: "Name (Abbreviation/Shorthand)", type: "text", rules: { required: "Required" }},
        { name: 'full_name', label: "Full Name", type: "textarea", },
        { name: 'description', label: "Organization Description", type: "textarea", },
    ]

    const office = [
        { name: 'office_address', label: "Office Physical Address", type: "text"},
        { name: 'office_email', label: "Office/Admin Email", type: "email", rules: {pattern: {value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
            message: 'Please enter a valid email.'
        }}},
        { name: 'office_phone', label: "Office Phone", type: "text", },
    ]

    const ed = [
        { name: 'executive_director', label: "Executive Director", type: "text"},
        { name: 'ed_email', label: "Executive Director's Email", type: "email", rules: {pattern: {value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
            message: 'Please enter a valid email.'
        }}},
        { name: 'ed_phone', label: "Executive Director's Phone", type: "text", },
    ]
    

    if(loading) return <Loading />
    return(
        <div className={styles.form}>
            <ReturnLink url={id ? `/organizations/${id}` : '/organizations'} display={id ? 'Return to detail page' : 'Return to organizations overview'} />
            <h1>{id ? `Editing ${existing?.display_name}` : 'New Organization' }</h1>
            <Messages errors={submissionErrors} success={success} ref={alertRef} />
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormSection fields={basics} control={control} />
                <FormSection fields={office} control={control} />
                <FormSection fields={ed} control={control} />

                {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    {!id && <button type="submit" value='create_another'><BsDatabaseFillAdd /> Save and Create Another</button>}
                    <Link to={id ? `/organizations/${id}` : '/organizations'}><button type="button">
                        <FcCancel /> Cancel
                    </button></Link>
                </div>}
                {saving && <ButtonLoading />}
            </form>
        </div>
    )
}