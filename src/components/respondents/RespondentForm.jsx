import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm,  useWatch } from "react-hook-form";

import { useRespondents } from '../../contexts/RespondentsContext';

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

export default function RespondentForm(){
    const navigate = useNavigate();
    
    //param to get indicator (blank if new)
    const { id } = useParams();
    //context
    const { respondentsMeta, setRespondentsMeta, setRespondentDetails } = useRespondents();

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
            if(Object.keys(respondentsMeta).length !== 0){
                setLoading(false);
                return;
            }
            else{
                try{
                    console.log('fetching respondents meta...');
                    const response = await fetchWithAuth(`/api/record/respondents/meta/`);
                    const data = await response.json();
                    setRespondentsMeta(data);
                }
                catch(err){
                    setSubmissionErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch respondent model information: ', err);
                }
                finally{
                    setLoading(false);
                }
            }
        }
        getMeta();
    }, []);

    useEffect(() => {
         const getRespondentDetails = async () => {
            if(!id) return;
            try {
                console.log('fetching respondent details...');
                const response = await fetchWithAuth(`/api/record/respondents/${id}/`);
                const data = await response.json();
                if(response.ok){
                    setRespondentDetails(prev => [...prev, data]);
                    setExisting(data);
                    
                }
                else{
                    navigate(`/not-found`);
                }
            } 
            catch (err) {
                setSubmissionErrors(['Something went wrong. Please try again later.'])
                console.error('Failed to fetch respondent: ', err);
            } 
        };
        getRespondentDetails();
    }, [id]);   

    //handle form submission
    const onSubmit = async(data, e) => {
        setSubmissionErrors([]);
        setSuccess([]);

        let sErrors = []
        //clear any hidden fields that may have been entered if switched from anon to not anon or vice versa
        if(data.is_anonymous == ''){
            data.is_anonymous = false
        }
        if(data.is_anonymous){
            data.first_name = null,
            data.last_name = null,
            data.dob = null,
            data.ward = null,
            data.email = null,
            data.phone_number = null,
            data.id_no = null
        }
        else if(!data.is_anonymous){
            data.age_range = null;
            if(data.dob && isNaN(Date.parse(data.dob)) || new Date(data.dob) > new Date()){
                sErrors.push('Date of birth must be a valid date and may not be in the future.');
            }
        }
        if(sErrors.length > 0){
            setSubmissionErrors(sErrors);
            return;
        }
        const action = e.nativeEvent.submitter.value;
        try{
            setSaving(true);
            console.log('submitting data...', data);
            const url = id ? `/api/record/respondents/${id}/` : `/api/record/respondents/`;
            const response = await fetchWithAuth(url, {
                method: id ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setSuccess(['Respondent created successfuly!']);
                setRespondentDetails(prev => {
                    const others = prev.filter(r => r.id !== returnData.id);
                    return [...others, returnData];
                });
                if(action === 'create_another'){
                    setExisting(null);
                    reset();
                    navigate('/respondents/new');
                }
                else{
                    navigate(`/respondents/${returnData.id}`);
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
            setSubmissionErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record indicator: ', err)
        }
        finally{
            setSaving(false);
        }
    }
    
    const defaultValues = useMemo(() => {
        return {
            is_anonymous: existing?.is_anonymous ?? false,

            id_no: existing?.id_no ?? '',
            first_name: existing?.first_name ?? '',
            last_name: existing?.last_name ?? '',

            sex: existing?.sex ?? null,
            age_range: existing?.age_range ?? null,
            dob: existing?.dob ?? '',

            ward: existing?.ward ?? '',
            village: existing?.village ?? '',
            district: existing?.district ?? null,
            citizenship: existing?.citizenship ?? 'Motswana',

            special_attribute_names: existing?.special_attribute?.map((a) => (a.name)) ?? [],
            kp_status_names: existing?.kp_status?.map((kp) => (kp.name)) ?? [],
            disability_status_names: existing?.disability_status?.map((d) => (d.name)) ?? [],
            
            required_attribute_names: existing?.required_attributes?.map((a) => (a.name)) ?? [],
            governs_attribute: existing?.governs_attribute ?? null,
            
            email: existing?.email ?? '',
            phone_number: existing?.phone_number ?? '',
        }
    }, [existing]);

    const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({ defaultValues });

    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    

    const anon = useWatch({ control, name: 'is_anonymous', defaultValue: false })

    const isAnon = [
        { name: 'is_anonymous', label: "Does this respondent wish to remain anonymous", 
            type: "checkbox"}
    ]
    const notAnonBasic= [
        { name: 'id_no', label: "Omang/ID/Passport Number", type: "text", rules: { required: "Required" } },
        {name: 'first_name', label: 'First Name (Include Middle Name if Applicable)', type: 'text',
            rules: { required: "Required" } },
        {name: 'last_name', label: 'Last Name', type: 'text',  rules: { required: "Required" } },  
        {name: 'dob', label: 'Date of Birth', type: 'date',  rules: { required: "Required" } },
    ]
    const basics = [
        {name: 'sex', label: 'Sex', type: 'radio', options: respondentsMeta?.sexs,  rules: { required: "Required" }}
    ]
    const anonBasic = [
        {name: 'age_range', label: 'Respondent Age Range', type: 'radio',
            options: respondentsMeta?.age_ranges,  rules: { required: "Required" } },
    ]
    const geo = [
        {name: 'ward', label: 'Ward', type: 'text'},
        {name: 'village', label: 'Village/Town/City (Primary Residence)', type: 'text',  rules: { required: "Required" } },
        {name: 'district', label: 'District', type: 'radio',  rules: { required: "Required" },
            options: respondentsMeta?.districts},
        {name: 'citizenship', label: 'Citizenship/Nationality', type: 'text',  rules: { required: "Required" } },
    ]
    const special = [
        {name: 'kp_status_names', label: 'Key Population Status', type: 'multiselect',  
            options: respondentsMeta?.kp_types},
        {name: 'disability_status_names', label: 'Disability Status', type: 'multiselect',  
            options: respondentsMeta?.disability_types},
        {name: 'special_attribute_names', label: 'Other Special Status', type: 'multiselect',  
            options: respondentsMeta?.special_attributes?.filter(a => (!['PLWHIV', 'KP', 'PWD'].includes(a.value)))},
    ]
    const contact = [
        {name: 'email', label: 'Email', type: 'email',  rules: {pattern: {value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
            message: 'Please enter a valid email.'
        }}},
        {name: 'phone_number', label: 'Phone Number', type: 'text' },
    ]


    if(loading || !respondentsMeta?.sexs) return <Loading />
    return(
        <div className={styles.form}>
            <ReturnLink url={id ? `/respondents/${id}` : '/respondents'} display={id ? 'Return to detail page' : 'Return to respondents overview'} />
            <h1>{id ? `Editing ${existing?.display_name}` : 'New Respondent' }</h1>
            <Messages errors={submissionErrors} success={success} ref={alertRef} />
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormSection fields={isAnon} control={control} />
                {anon && <FormSection fields={anonBasic} control={control} />}
                {!anon && <FormSection fields={notAnonBasic} control={control} />}
                <FormSection fields={basics} control={control} />
                <FormSection fields={geo} control={control} />
                <FormSection fields={special} control={control} />
                {!anon && <FormSection fields={contact} control={control} /> }

                {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    {!id && <button type="submit" value='create_another'><BsDatabaseFillAdd /> Save and Create Another</button>}
                    <Link to={id ? `/respondents/${id}` : '/respondents'}><button type="button">
                        <FcCancel /> Cancel
                    </button></Link>
                </div>}
                {saving && <ButtonLoading />}
            </form>
        </div>
    )
}