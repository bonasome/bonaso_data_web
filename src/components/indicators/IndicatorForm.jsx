import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm,  useWatch } from "react-hook-form";

import { useIndicators } from '../../contexts/IndicatorsContext';

import fetchWithAuth from "../../../services/fetchWithAuth";

import Loading from '../reuseables/loading/Loading';
import IndicatorsIndex from './IndicatorsIndex';
import FormSection from '../reuseables/forms/FormSection';
import SimpleDynamicRows from '../reuseables/inputs/SimpleDynamicRows';
import Messages from '../reuseables/Messages';
import ReturnLink from '../reuseables/ReturnLink';
import ButtonLoading from '../reuseables/loading/ButtonLoading';

import styles from '../../styles/form.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import { BsDatabaseFillAdd } from "react-icons/bs";

export default function IndicatorForm(){
    const navigate = useNavigate();
    
    //param to get indicator (blank if new)
    const { id } = useParams();

    //context
    const { setIndicatorDetails, indicatorDetails, indicatorsMeta, setIndicatorsMeta } = useIndicators();

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
        if ((submissionErrors.length > 0 || success.length > 0) && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [submissionErrors, success]);

    useEffect(() => {
        //fetch the meta
        const getMeta = async() => {
            if(Object.keys(indicatorsMeta).length != 0){
                setLoading(false);
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/indicators/meta/`);
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
            if(!id) return;
            
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
                        setIndicatorDetails(prev => [...prev, data]);
                        setExisting(data);
                    }
                    else{
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
        let sErrors = [] //store business logic errors caught before server

        //prerequisites sends objects by default, so map just the ids
        if(data.prerequisite_ids.length > 0) {
            data.prerequisite_ids = data.prerequisite_ids.map(pre => (pre.id))
        }
        //collect subcategories from the rows ref
        const ref = rowRefs.current['subcategory_data'];
        if (ref?.current?.collect) {
            const collected = ref.current.collect();
            if (collected === null) {
                sErrors.push(`Please double check your subcategories.`);
            } 
            else {
                data['subcategory_data'] = collected;
            }
        }
        
        //prevent forbidden chars from appearing in subcat names
        const names = data.subcategory_data
        let commas = []
        names.forEach(n => {
            if(n.name.includes(',') || n.name.includes(':')) commas.push(`Subcategory names cannot include commas or colons. Please fix subcategory "${n.value}"`);
        })
        if(commas.length > 0){
            sErrors.push('Subcategory names may not include commas or colons.')
        }
        if(sErrors.length > 0){
            setSubmissionErrors(sErrors);
            return;
        }
        //remove stale values possibly caused by switching types
        if(type !== 'respondent'){
            data.required_attribute_names = [];
            data.governs_attribute = null;
            data.require_numeric = false;
            data.allow_repeat = false;
        }
        //clear match
        if(!data?.prerequisite_ids || data?.prerequisite_ids?.length === 0){
            data.match_subcategories_to = null;
        }
        //clear data if using matched (only one is allowed, can't match and have custom)
        if(usingMatched){
            data.subcategory_data = [];
        }
        //clear subcat data if unchecked
        if(!requireSubcats){
            data.subcategory_data = [];
        }
        const action = e.nativeEvent.submitter.value;
        try{
            setSaving(true);
            console.log('submitting data...', data);
            const url = id ? `/api/indicators/${id}/` : `/api/indicators/`
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
            name: existing?.name ?? '',
            code: existing?.code ?? '',
            description: existing?.description ?? '',

            status: existing?.status ?? 'active',
            indicator_type: existing?.indicator_type ?? 'respondent',
            
            prerequisite_ids: existing?.prerequisites ?? [],
            match_subcategories_to: existing?.match_subcategories_to ?? null,
            
            required_attribute_names: existing?.required_attributes.map((a) => (a.name)) ?? [],
            governs_attribute: existing?.governs_attribute ?? null,
            
            allow_repeat: existing?.allow_repeat ?? false,
            require_numeric: existing?.require_numeric ?? false,

            require_subcategories: existing?.subcategories?.length > 0 ?? false,
            subcategory_data: existing?.subcategories ?? [],
        }
    }, [existing]);
    console.log(existing)
    const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({ defaultValues });

    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    

    const type = useWatch({ control, name: 'indicator_type', defaultValue: 'respondent' })
    const isRespondent = useMemo(() => {return type==='respondent'}, [type]);

    const prereqs = useWatch({ control, name: 'prerequisite_ids', defaultValue: [] });
    const usingMatched = useWatch({ control, name: 'match_subcategories_to', defaultValue: null });
    
    const requireSubcats = useWatch({ control, name: 'require_subcategories', defaultValue: false});

    const availableSubcats = useMemo(() => {
        return prereqs.filter((p) => (p?.subcategories || 0) > 0);
    }, [prereqs]);

    const rowRefs = useRef({});
    if (!rowRefs.current['subcategory_data']) {
        rowRefs.current['subcategory_data'] = React.createRef();
    }
    const basicInfo = [
        { name: "code", label: "Indicator Code (Required)", type: "text", rules: { required: "Required", 
                maxLength: { value: 10, message: 'Maximum length is 10 characters.'}
            },
            tooltip: 'The code is just an extra reference to help you when searching indicators.',
            placeholder: 'HIV100, NCD001...'
        },
        { name: "name", label: "Indicator Name (Required)", type: "text", rules: { required: "Required", 
                maxLength: { value: 255, message: 'Maximum length is 255 characters.'} },
            tooltip: 'HINT: This name will be seen by community health workers, so make sure its readable/understandable.',
            placeholder: 'Tested for HIV, Received Treatement for STIs...'    
        },
        { name: "description", label: "Indicator Description", type: "textarea", 
            tooltip: `Add any information that may help people understand what this indicator tracks, when it should be used,
            or what its objectives are.`
         },
        
    ]
    const meta = [
        { name: "status", label: "Status (Required)", type: "radio", options: indicatorsMeta?.statuses, 
            rules: { required: "Required" }, tooltip: 'This is just to help you categorize and filter indicators.' },
        { name: "indicator_type", label: "Indicator Type (Required)", type: "radio", options: indicatorsMeta?.indicator_types,
             rules: { required: "Required" }, tooltip: `The type determines what kind of data this indicator 
                is meant to collect. Trying to track social posts? Check social. 
                Tracking individual interactions with respondents? Select respondent.` },
    ]
    const respondent = [
        {name: 'allow_repeat', label: 'Allow repeat interactions (within 30 days)', type: 'checkbox',
            tooltip: `By default, our system will flag any occasion where a respondent has multiple interactions related
            to an indicator within a 30 day span (to prevent duplicates). Checking this box will disable that
            and allow for multiple, unflagged, interactions over a 30-day period.`
        },
        {name: 'require_numeric', label: 'Require a Number', type: 'checkbox',
            tooltip: `Should a community health worker be required to enter a number with interactions of this 
            indicator (i.e., number of condoms distributed)? NOTE: Can be combined with subcategories to get numeric inputs for each subcategory.`
        },
        {name: 'required_attribute_names', label: 'Required Respondent Attributes', type: 'multiselect',
            options: indicatorsMeta?.required_attributes, tooltip: `Does this respondent need to have a particular
            trait/attribute to be eligible for this indicator (person living with HIV, staff, etc.)?` },
        
        {name: 'governs_attribute', label: 'Controls Respondent Attribute', type: 'radio',
            options: indicatorsMeta?.required_attributes?.filter(a => a.value=='PLWHIV'), 
            tooltip: `As of now, only select an option if you want this indicator to automatically update a person's HIV status
            (example, "Tested Positive for HIV").`
        }
    ]
    const prerequisites = [
        {name: 'prerequisite_ids', label: 'Prerequisite Indicators', type: 'multimodel', 
            IndexComponent: IndicatorsIndex, tooltip: `Does this indicator require that a person has had an interaction
            related to another indicator (example: Screened for disease & Referred for further treatment of disease)?
            NOTE: If an interaction is had with this indicator, but not its prerequisities, the system will flag it.`
        } 
    ]
    const matchSubcats = [
        {name: 'match_subcategories_to', label: 'Match Subcategories with a Prerequisite?', type: 'radio', 
            options: availableSubcats, labelField: 'display_name', valueField: 'id',
            tooltip: `Select an indicator that you want this indicator's subcategories to match with exactly.`
        },
    ]

    const subcats = [
        {name: 'require_subcategories', label: 'Require Subcategories?', type: 'checkbox',
            tooltip: `Does this indicator have an "subcategories", or additional information that needs to be collected
            (example: HIV Messages, what types of HIV messages could this person be reached with?)?`
         },
    ]

    if(loading || !indicatorsMeta?.statuses) return <Loading />
    return(
        <div className={styles.form}>
            <ReturnLink url={id ? `/indicators/${id}` : '/indicators'} display={id ? 'Return to detail page' : 'Return to indicators overview'} />
            <h1>{id ? `Editing ${existing?.display_name}` : 'New Indicator' }</h1>
            <Messages errors={submissionErrors} success={success} ref={alertRef} />
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormSection fields={basicInfo} control={control} header={'Basic Information'} />
                <FormSection fields={meta} control={control} header={'Indicator Type/Status'} />
                {isRespondent && <FormSection fields={respondent} control={control} header={'Required Information for Collectors'} />}
                <FormSection fields={prerequisites} control={control} />
                {availableSubcats.length > 0 && <FormSection fields={matchSubcats} control={control} />}
                {!usingMatched && isRespondent && <FormSection fields={subcats} control={control} />}
                {requireSubcats && !usingMatched && 
                    <SimpleDynamicRows ref={rowRefs.current['subcategory_data']} label={'Subcategory Options'}
                        tooltip={`Enter the name of each subcategory. You may add or remove rows using the buttons. 
                            ${existing ? ' If you are trying to remove an option from an existing indicator, mark it as deprecated.' : '' }`}
                        existing={existing?.subcategories ?? []} header={'Subcategories'}/>}
                
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