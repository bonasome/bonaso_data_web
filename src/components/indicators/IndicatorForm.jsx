import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm,  useWatch } from "react-hook-form";

import { useIndicators } from '../../contexts/IndicatorsContext';

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

export default function IndicatorForm(){
    /*
    Form that allows a user to create/edit an indicator. This is only meant to be used for standalone 
    indicoats. Assessment category indicators should be edited using their assessment page. 
    An optional ID param can be passed in the URL which will cause the form to try and fetch details from
     the server. 
    */
    const navigate = useNavigate();
    
    //param to get indicator (blank if creating)
    const { id } = useParams();

    //context
    const { setIndicatorDetails, indicatorDetails, indicatorsMeta, setIndicatorsMeta } = useIndicators();

    //existing value if editing
    const [existing, setExisting] = useState(null);

    //page meta
    const [loading, setLoading] = useState(true);
    const [submissionErrors, setSubmissionErrors] = useState([]);
    const [success, setSuccess] = useState([]);
    const [saving, setSaving] = useState(false);

    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if ((submissionErrors.length > 0 || success.length > 0) && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [submissionErrors, success]);

    //fetch the meta
    useEffect(() => {
        const getMeta = async() => {
            if(Object.keys(indicatorsMeta).length != 0){
                setLoading(false);
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/indicators/manage/meta/`);
                    const data = await response.json();
                    setIndicatorsMeta(data);
                    setLoading(false);
                }
                catch(err){
                    console.error('Failed to fetch indicators meta: ', err)
                    setLoading(false)
                }
            }
        }
        getMeta();
    }, []);

    //get the existing details if an id is found in the params
    useEffect(() => {
        const getIndicatorDetail = async () => {
            if(!id) return; //if no id, do nothing
            //first check the context
            const found = indicatorDetails.find(o => o.id.toString() === id.toString());
            if (found) {
                setExisting(found);
                return;
            }
            else{
                try {
                    console.log('fetching indicator details...');
                    const response = await fetchWithAuth(`/api/indicators/${id}/`);
                    const data = await response.json();
                    if(response.ok){
                        //update the context
                        setIndicatorDetails(prev => [...prev, data]);
                        setExisting(data);
                    }
                    else{
                        //if a bad ID is provided, navigate to 404
                        navigate(`/not-found`);
                    }
                } 
                catch (err) {
                    console.error('Failed to fetch indicator: ', err);
                    setSubmissionErrors(['Something went wrong. Please try again later.'])
                } 
            }
        };
        getIndicatorDetail();
    }, [id]);   

    //handle form submission
    const onSubmit = async(data, e) => {
        setSubmissionErrors([]);
        setSuccess([]);
        const action = e.nativeEvent.submitter.value; //set the action depending on what button was clicked
        try{
            setSaving(true);
            console.log('submitting data...', data);
            const url = id ? `/api/indicators/manage/${id}/` : `/api/indicators/manage/`
            const response = await fetchWithAuth(url, {
                method: id ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setSuccess(['Indicator created successfuly!']);
                setIndicatorDetails(prev => {
                    const others = prev.filter(r => r.id !== returnData.id);
                    return [...others, returnData];
                });
                //depending on the action, navigate to the correct page
                if(action === 'create_another'){
                    setExisting(null);
                    reset();
                    navigate('/indicators/new');
                }
                else{
                    navigate(`/indicators/${returnData.id}`);
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
                setSubmissionErrors(serverResponse); //show the user any errors
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
    
    //set default values
    const defaultValues = useMemo(() => {
        return {
            name: existing?.name ?? '',
            description: existing?.description ?? '',

            category: existing?.category ?? null,
        }
    }, [existing]);

    //construct RHF form variables
    const { register, control, handleSubmit, reset, setFocus, watch, formState: { errors } } = useForm({ defaultValues });

    //scroll to field errors
    const onError = (errors) => {
        const firstError = Object.keys(errors)[0];
        if (firstError) {
            setFocus(firstError); // sets cursor into the field
            // scroll the element into view smoothly
            const field = document.querySelector(`[name="${firstError}"]`);
            if (field && field.scrollIntoView) {
            field.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    };

    //try to set default values once existing loads
    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    const cat = useWatch({ control, name: 'category', defaultValue: 'misc' });

    const basicInfo = [
        { name: "name", label: "Indicator Name (Required)", type: "text", rules: { required: "Required", 
                maxLength: { value: 255, message: 'Maximum length is 255 characters.'} },
            tooltip: 'Give this indicator a short name that will allow anyone on the site to easily identify what data it tracks.',
            placeholder: 'Tested for HIV, Received Treatement for STIs...'    
        },
        { name: "description", label: "Indicator Description", type: "textarea", 
            tooltip: `Add any information that may help people understand what this indicator tracks, when it should be used,
            or what its objectives are.`
         },
         { name: "category", label: "Indicator Type (Required)", type: "radio", options: indicatorsMeta?.category.filter(c => (c.value != 'assessment')),
             rules: { required: "Required" }, tooltip: `This will determine what type of data this indicator collects.
             "social media" indicators will be linked to social posts, "number of events" will be linked to events, "organizations capacitated"
             will be linked to participating organizations at events, and "other" can be collected using an aggregate.` },
    ]
    const allowAggies = [
        { name: 'allow_aggregate', label: 'Allow for Aggregates Reporting', type: "checkbox",
            tooltip: 'Do you want to allow people to collect data about this indicator in aggregate format?'
        },
    ]



    if(loading || !indicatorsMeta?.category) return <Loading />
    return(
        <div className={styles.form}>
            <ReturnLink url={id ? `/indicators/${id}` : '/indicators'} display={id ? 'Return to detail page' : 'Return to indicators overview'} />
            <h1>{id ? `Editing ${existing?.display_name}` : 'New Indicator' }</h1>
            <p>
                Fill in the fields below to create a new standalone indicator from a template. These types of
                indicators are meant to track things like social media posts, events, or one-off metrics.
            </p>
            <p>If you want this indicator to record data about and be linked to specific people, create an assessment instead.</p>
            <Messages errors={submissionErrors} success={success} ref={alertRef} />
            
            <form onSubmit={handleSubmit(onSubmit, onError)}>
                <FormSection fields={basicInfo} control={control} header={'Basic Information'} />
                {['misc'].includes(cat) && <FormSection fields={allowAggies} control={control} header='Aggregates'/> }
                {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    {!id && <button type="submit" value='create_another'><BsDatabaseFillAdd /> Save and Create Another</button>}
                    <Link to={id ? `/indicators/${id}` : '/indicators'}><button type="button">
                        <FcCancel /> Cancel
                    </button></Link>
                </div>}
                {saving && <ButtonLoading />}
            </form>
        </div>
    )
}