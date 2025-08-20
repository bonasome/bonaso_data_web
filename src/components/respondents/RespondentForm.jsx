import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm,  useWatch } from "react-hook-form";
import countries from 'world-countries';

import { useRespondents } from '../../contexts/RespondentsContext';

import fetchWithAuth from "../../../services/fetchWithAuth";

import Loading from '../reuseables/loading/Loading';
import FormSection from '../reuseables/forms/FormSection';
import Messages from '../reuseables/Messages';
import ReturnLink from '../reuseables/ReturnLink';
import ButtonLoading from '../reuseables/loading/ButtonLoading';

import styles from '../../styles/form.module.css';
import modalStyles from '../../styles/modals.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import { BsDatabaseFillAdd } from "react-icons/bs";

function PrivacyModal({ onClose }){
    return(
        <div className={modalStyles.modal}>
            <h2>Privacy Notice</h2>
            <p>
                You are about to collect and enter sensitive information about a person into our system.
                <strong>Please make sure that you have this person's (or their gauardian/caretaker's) express 
                permission before recording any sensitive information. </strong>
                If this person does not consent to provide sensitive information, you may mark them as anonymous.
            </p>
            <button onClick={onClose}>I understand, and will only record data I have express consent to collect.</button>
        </div>
    )
}

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
    const [privacyModal, setPrivacyModal] = useState(false);
    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (submissionErrors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [submissionErrors]);

    useEffect(() => {
        setPrivacyModal(existing ? false : true)
    }, [existing]);

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
            age_range: existing?.age_range ?? '',
            dob: existing?.dob ?? '',
            
            plot_no: existing?.plot_no ?? '',
            ward: existing?.ward ?? '',
            village: existing?.village ?? '',
            district: existing?.district ?? '',
            citizenship: existing?.citizenship ?? 'BW',

            special_attribute_names: existing?.special_attribute?.map((a) => (a.name)) ?? [],
            kp_status_names: existing?.kp_status?.map((kp) => (kp.name)) ?? [],
            disability_status_names: existing?.disability_status?.map((d) => (d.name)) ?? [],
            
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

    const citOptions = countries.map(c => ({
        label: c.name.common,
        value: c.cca2
    }));    

    const anon = useWatch({ control, name: 'is_anonymous', defaultValue: false })

    const isAnon = [
        { name: 'is_anonymous', label: "Does this respondent wish to remain anonymous", 
            type: "checkbox", tooltip: `We encourage respondents to provide us with as much information as possible
            so that we can better assist them, but we recognize that not every respondent wants to provide this information.
            As such, you can mark a respondent as anonymous, in which case they will not have to give an personally identifying information.`
        }
    ]
    const notAnonBasic= [
        { name: 'id_no', label: "Omang/ID/Passport Number (Required)", type: "text", rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} } },
        {name: 'first_name', label: 'First Name (Include Middle Name if Applicable) (Required)', type: 'text',
            rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} } },
        {name: 'last_name', label: 'Last Name (Required)', type: 'text',  rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} } },  
        {name: 'dob', label: 'Date of Birth (Required)', type: 'date',  rules: { required: "Required" } },
    ]
    const basics = [
        {name: 'sex', label: 'Sex (Required)', type: 'radio', options: respondentsMeta?.sexs,  rules: { required: "Required" },
            tooltip: 'Please provide the sex/gender that this person currently identifies as, or select "Non-Binary".'
        }
    ]
    const anonBasic = [
        {name: 'age_range', label: 'Respondent Age Range (Required)', type: 'select',
            options: respondentsMeta?.age_ranges,  rules: { required: "Required" } },
    ]
    const address = [
        {name: 'plot_no', label: 'Plot Number (or description)', type: 'text', 
            tooltip: 'If you may visit this person again, you may want to record some information about where they live.'
        },
        {name: 'ward', label: 'Kgotlana/Ward', type: 'text', rules: {maxLength: { value: 255, message: 'Maximum length is 255 characters.'}},},
    ]
    const geo = [
        {name: 'village', label: 'Village/Town/City (Primary Residence) (Required)', type: 'text',  rules: { required: "Required",
            maxLength: { value: 255, message: 'Maximum length is 255 characters.'},
         },
            tooltip: 'Please provide the village, town, or city that best describes where this person currently resides.'
        },
        {name: 'district', label: 'District (Required)', type: 'select',  rules: { required: "Required" },
            options: respondentsMeta?.districts, 
            tooltip: 'Please provide the district where this person currently resides.'
        },
        {name: 'citizenship', label: 'Citizenship/Nationality (Required)', type: 'select',  rules: { required: "Required" },
            options: citOptions, search: true
        },
    ]
    const special = [
        {name: 'kp_status_names', label: 'Key Population Status (Select all that apply)', type: 'multiselect',  
            options: respondentsMeta?.kp_types},
        {name: 'disability_status_names', label: 'Disability Status (Select all that apply)', type: 'multiselect',  
            options: respondentsMeta?.disability_types},
        {name: 'special_attribute_names', label: 'Other Special Status (Select all that apply)', type: 'multiselect',  
            options: respondentsMeta?.special_attributes?.filter(a => (!['PLWHIV', 'KP', 'PWD'].includes(a.value)))},
    ]
    const contact = [
        {name: 'email', label: 'Email', type: 'email',  rules: {pattern: {value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
            message: 'Please enter a valid email.',
        }, maxLength: { value: 255, message: 'Maximum length is 255 characters.'}}, 
        tooltip: 'This information is not used by the system, but you may want to record it for your own records.'},
        {name: 'phone_number', label: 'Phone Number', type: 'text', tooltip: 'This information is not used by the system, but you may want to record it for your own records.',
            rules: {maxLength: { value: 255, message: 'Maximum length is 255 characters.'}},
         },
    ]


    if(loading || !respondentsMeta?.sexs) return <Loading />
    return(
        <div className={styles.form}>
            {privacyModal && <PrivacyModal onClose={() => setPrivacyModal(false)} />}
            <ReturnLink url={id ? `/respondents/${id}` : '/respondents'} display={id ? 'Return to detail page' : 'Return to respondents overview'} />
            <h1>{id ? `Editing ${existing?.display_name}` : 'New Respondent' }</h1>
            <Messages errors={submissionErrors} success={success} ref={alertRef} />
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormSection fields={isAnon} control={control} header={'Respondent Anonymity'} />
                {anon && <FormSection fields={anonBasic} control={control} header='Basic Information' />}
                {!anon && <FormSection fields={notAnonBasic} control={control} header='Basic Information' />}
                <FormSection fields={basics} control={control} header='Sex' />
                {!anon && <FormSection fields={address} control={control} header='Address'/>}
                <FormSection fields={geo} control={control} header='Geographic Information'/>
                <FormSection fields={special} control={control} header='Additional Information'/>
                {!anon && <FormSection fields={contact} control={control} header='Contact Information'/> }
                <p><i>You can record HIV Status and Pregnancy information on the respondent detail page after submitting.</i></p>
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