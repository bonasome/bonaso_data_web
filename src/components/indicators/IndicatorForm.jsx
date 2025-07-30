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
        if (submissionErrors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [submissionErrors]);

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
        { name: "code", label: "Indicator Code", type: "text", rules: { required: "Required" } },
        { name: "name", label: "Indicator Name", type: "textarea", rules: { required: "Required" } },
        { name: "status", label: "Status", type: "radio", options: indicatorsMeta?.statuses, 
            rules: { required: "Required" } },
        { name: "indicator_type", label: "Indicator Type", type: "radio", options: indicatorsMeta?.indicator_types,
             rules: { required: "Required" } },
    ]
    const respondent = [
        {name: 'allow_repeat', label: 'Allow repeat interactions (within 30 days)', type: 'checkbox'},
        {name: 'require_numeric', label: 'Require a Number', type: 'checkbox'},
        {name: 'required_attribute_names', label: 'Respondent must be a:', type: 'multiselect',
            options: indicatorsMeta?.required_attributes },
        {name: 'governs_attribute', label: 'On Completion, Change Respondent to:', type: 'radio',
            options: indicatorsMeta?.required_attributes?.filter(a => a.value=='PLWHIV') }
    ]
    const prerequisites = [
        {name: 'prerequisite_ids', label: 'Prerequisite Indicators', type: 'multimodel', 
            IndexComponent: IndicatorsIndex},
    ]
    const matchSubcats = [
        {name: 'match_subcategories_to', label: 'Match Subcategories with a Prerequisite?', type: 'radio', 
            options: availableSubcats, labelField: 'display_name', valueField: 'id'},
    ]

    const subcats = [
        {name: 'require_subcategories', label: 'Require Subcategories?', type: 'checkbox' },
    ]

    if(loading || !indicatorsMeta?.statuses) return <Loading />
    return(
        <div>
            <ReturnLink url={id ? `/indicators/${id}` : '/indicators'} display={id ? 'Return to detail page' : 'Return to indicators overview'} />
            <h1>{id ? `Editing ${existing?.display_name}` : 'New Indicator' }</h1>
            <Messages errors={submissionErrors} success={success} ref={alertRef} />
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormSection fields={basicInfo} control={control} />
                {isRespondent && <FormSection fields={respondent} control={control} />}
                <FormSection fields={prerequisites} control={control} />
                {availableSubcats.length > 0 && <FormSection fields={matchSubcats} control={control} />}
                {!usingMatched && <FormSection fields={subcats} control={control} />}
                {requireSubcats && !usingMatched && <SimpleDynamicRows ref={rowRefs.current['subcategory_data']}
                     existing={existing?.subcategories ?? []} />}
                
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