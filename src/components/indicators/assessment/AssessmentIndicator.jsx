import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm,  useWatch, FormProvider } from "react-hook-form";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import theme from '../../../../theme/theme';
import fetchWithAuth from "../../../../services/fetchWithAuth";

import FormSection from '../../reuseables/forms/FormSection';
import Messages from '../../reuseables/Messages';
import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import LogicBuilder from './LogicBuilder';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import ComponentLoading from '../../reuseables/loading/ComponentLoading';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import OptionsBuilder from './OptionsBuilder';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import { ImPencil } from 'react-icons/im';
import { FaTrashAlt } from 'react-icons/fa';
import { BsArrowBarDown, BsArrowBarUp } from 'react-icons/bs';



export default function AssessmentIndicator({ meta, assessment, onUpdate, existing=null, onCancel=null}){
    /*
    Form for editing an indicator from within an assessment. Should be used for any indicator in the assessment
    category. 
    - meta (object): model information
    - assessment (object): information about the assessment this indicator is in
    - onUpdate(function): call the api again when edited/deleted
    - onCancel(function): stop editing
    */

    const [editing, setEditing] = useState(existing ? false : true); //on create set as true, should not be false if there is no existing
    const [expanded, setExpanded] = useState(false); //if non-editing card is expanded or not
    
    //page meta
    const [del, setDel] = useState(false);
    const [submissionErrors, setSubmissionErrors] = useState([]);
    const [saving, setSaving] = useState(false);

    //for drag and drop reordering
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id:existing?.id });
     
    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (submissionErrors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [submissionErrors]);  


    //delete the indicator from the assessment
    const handleDelete = async() => {
        if(!existing?.id) return;
        try {
            console.log('deleting indicator...');
            const response = await fetchWithAuth(`/api/indicators/manage/${existing?.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onUpdate();
            } 
            else {
                let data = {};
                try {
                    data = await response.json();
                } catch {
                    // no JSON body or invalid JSON
                    data = { detail: 'Unknown error occurred' };
                }

                const serverResponse = [];
                for (const field in data) {
                    if (Array.isArray(data[field])) {
                    data[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                    });
                    } else {
                    serverResponse.push(`${field}: ${data[field]}`);
                    }
                }
                setSubmissionErrors(serverResponse);
            }
        } 
        catch (err) {
            setSubmissionErrors(['Something went wrong. Please try again later.'])
            console.error('Failed to delete indicator:', err);
        }
        finally{
            setDel(false);
        }
    } 

    //helper function that pings the api when a reorder is requested (from drag and drop or buttons)
    const reorder = async(pos) => {
        if(!existing) return;
        if(pos < 0 || pos >= assessment.indicators.length){
            setSubmissionErrors(['Cannot shift this position.'])
            return;
        }
        try{
            console.log('submitting data...', pos);
            const url = `/api/indicators/manage/${existing.id}/change-order/`;
            const response = await fetchWithAuth(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({position: pos})
            });
            const returnData = await response.json();
            if(response.ok){
                onUpdate();
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
    }

    //handle form submission
    const onSubmit = async(data, e) => {
        let errs = []
        data.assessment_id = assessment.id; //set the related project based on the URL param
        //wipe any option related data if the type does not allow for custom options (to clear stale states)
        if(['text'].includes(data.type)) data.allow_aggregate = false;
        if(!['multi', 'single', 'multint'].includes(data.type)){
            data.options_data = [];
        }
        if(data.options_data?.length > 0){
            data.options_data.forEach(o => {
                if(['', 'none', 'any', 'all'].includes(o.name.toLowerCase())) errs.push(`"${o.name}" is not a valid option name.`)
            })
        }
        //wipe match_options data if the data type isn't multi (indicating a stale state)
        if(data.type != 'multi') data.match_options_id = null;
        //wipe any options that were included if match options was selected
        if(data.type == 'multi' && data.match_options_id) data.options_data = [];
        //wipe any stale logic data if the user chose to not include logic
        if(!data.include_logic || data.logic_data?.conditions?.length == 0){
            data.logic_data = {};
        }
        if(data.include_logic && data?.logic_data?.conditions?.length > 0){
            for(let i=0; i < data?.logic_data?.conditions?.length; i++){
                let c = data.logic_data.conditions[i];
                //since we collect condition type under value_option for better UI, here we need to parse that out again
                if(['any', 'none', 'all'].includes(c.value_option)){
                    data.logic_data.conditions[i].condition_type = c.value_option;
                    data.logic_data.conditions[i].value_option = null;
                }
                //remove value_option/condition of the source indicator is not of the correct type
                if(data.logic_data.conditions[i].condition_type && !['single', 'multi'].includes(assessment.indicators.find(i => (i.id == c.source_indicator)).type)){
                    data.logic_data.conditions[i].condition_type = null
                    data.logic_data.conditions[i].value_option = null
                }
            }
        }
        if(errs.length > 0){
            console.log(errs)
            setSubmissionErrors(errs);
            return;
        }

        //set category automatically
        data.category = 'assessment';
        try{
            setSubmissionErrors([]);
            setSaving(true);
            console.log('submitting data...', data);
            const url = existing ? `/api/indicators/manage/${existing.id}/` : `/api/indicators/manage/`;
            const response = await fetchWithAuth(url, {
                method: existing ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setEditing(false);
                onUpdate(returnData);
            }
            else{
                const serverResponse = [];
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
                console.log(serverResponse)
                setSubmissionErrors(serverResponse);
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
    console.log(submissionErrors);

    //set default values
    const defaultValues = useMemo(() => {
        return {
            name: existing?.name ?? '',
            description: existing?.description ?? '',
            required: existing?.required ?? true,
            type: existing?.type ?? 'boolean',
            match_options_id: existing?.match_options ?? null,
            options_data: existing?.options ?? [{name: ''}],
            allow_none: existing?.allow_none ?? false,
            allow_aggregate: existing?.allow_aggregate ?? true,
            include_logic: existing?.logic?.conditions?.length > 0 ?? false,
            logic_data: {
                group_operator: existing?.logic?.group_operator ?? "AND",
                conditions: existing?.logic?.conditions?.map((c) => {
                    if(c.condition_type) c.value_option = c.condition_type;
                    return c;
                }) ?? [],  
            }
        }
    }, [existing]);

    //construct RHF variables
    const methods = useForm({ defaultValues });
    const { register, control, handleSubmit, reset, watch, setFocus, formState: { errors } } = methods;

    //scroll to field errors on submission
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

    //wait for existing to load and then set the default values
    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    //wathces to help with logic
    const type = useWatch({ control, name: 'type', defaultValue: 'boolean' });
    const usingMatched = useWatch({ control, name: 'match_options_id', defaultValue: false });
    const usingLogic= useWatch({ control, name: 'include_logic', defaultValue: false });

    const aggiesVal = useMemo(() => {
        if(!type) return false
        return ['multi', 'multint', 'integer', 'boolean', 'single'].includes(type);
    }, [type]);
    const usingAggies = useWatch({ control, name: 'allow_aggregate', defaultValue: aggiesVal});

    //fields
    const basics = [
        { name: 'name', label: 'Name (Required)', type: "text", rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} },
            placeholder: "Write a simple name that tells people what they are supposed to collect...",
            tooltip: `This name will be displayed to data collectors, so make sure it is clear what data they 
            are supposed to collect or what they are supposed to ask the patient.`
        },
        { name: 'required', label: "Required", type: "checkbox",
            tooltip: 'Only select this if every single patient/respondent should answer this question.'
        },
        { name: 'type', label: "Type", type: "radio", options: meta?.type, rules: { required: "Required" },
            tooltip: `Open Answer: Allow any text as an answer. \nNumber: Allow any number. \nSingle Select: User selects one option
            from a predefined list. \nMultiselect: User selects as many options as apply from a predefined list.
            \nYes/No: Allow a yes or a no. \nNumbers by Category: Define a list of options, with each option taking a number.`
        }, 
        { name: 'description', label: 'Description', type: 'textarea', 
            placeholder: 'Any information that might help people understand what data this is collecting',
            tooltip: 'This will be displayed as a tooltip when data collectors are filling out this assessment.'
        }
    ]
    const allowAggies = [
        { name: 'allow_aggregate', label: 'Allow for Aggregates Reporting', type: "checkbox",
            tooltip: 'Also allow users to enter data for this indicator in aggregated tables.'
        },
    ]
    const match = [
        { name: 'match_options_id', label: "Match Options", type: "select",
            options: assessment.indicators.filter(ind => (ind.type == 'multi')).map((ind) => ({value: ind.id, label: ind.name})),
            tooltip: `This indicator will have the same options as the indicator selected here, and will automatically limit
            what options a person can select for this indicator based on what was options were selected for the other indicator.`
        },
    ]
    const noneOption = [
        { name: 'allow_none', label: 'Add "None" option', type: "checkbox",
            tooltip: `Allow users to select "None of the above".`
         },
    ]
    const logic = [
        { name: 'include_logic', label: "Add logic", type: "checkbox",
            tooltip: 'Only show this indicator depending on responses to previous indicators or collected patient information.'
        },
    ]

    //helper function that converts db values to labels
    const getLabelFromValue = (field, value) => {
        if(!meta) return null
        const match = meta[field]?.find(range => range.value === value);
        return match ? match.label : null;
    };

    //if there's no meta options won't load properly
    if(!meta?.type) return <ComponentLoading />
    //for drag and drop
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        margin: 40,
        padding: 20,
        backgroundColor: theme.colors.bonasoUberDarkAccent,
    };

    const order = existing?.order ?? assessment.indicators.length

    //return a expandable card if not editing and something exists
    if(!editing && existing){
        return (
            <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
                <Messages errors={submissionErrors} ref={alertRef} />
                {del && <ConfirmDelete onCancel={() => setDel(false)} onConfirm={handleDelete} name={'this indicator'} />}
                {!editing && (existing ? <div>
                    <div style={{ display: 'flex', flexDirection: 'row'}}>
                        <div>
                            <div onClick={() => setExpanded(!expanded)}>
                            <h3>{existing?.order + 1}. {existing?.name} {existing?.required ? '*' : ''}</h3>
                            <i>{getLabelFromValue('type', existing?.type)} {existing?.allow_aggregate ? '(Σ)' : ''}</i>
                            </div>
                            {expanded && <div style={{ paddingTop: '1vh'}}>
                                {existing?.description ? <p>Description: {existing.description}</p> : <p><i>No description</i></p>}
                                {existing?.options?.length > 0 && <div>
                                    <ul>
                                        {existing.options.map((o) => (<li>{o.name}</li>))}
                                    </ul>
                                </div>}
                                {existing?.logic?.conditions?.length > 0 && <div>
                                    <i>Visible if...</i>
                                    <ul>
                                        {existing?.logic?.conditions?.map((c) => {
                                            console.log(c)
                                            let source = ''
                                            let val = '';
                                            let ind = null;
                                            
                                            if(c.source_type == 'assessment') ind = assessment.indicators.find((ind) => (ind.id == c.source_indicator))
                                            let operator = c.condition_type ? 'Is' : getLabelFromValue('operators', c.operator)
                                            if(c.condition_type) val = getLabelFromValue('condition_types', c.condition_type)
                                            else if(ind && ['multi', 'single'].includes(ind.type)) val = ind.options.find((o) => (o.id == c.value_option)).name;
                                            else if(ind && ['boolean'].includes(ind.type)) val = c.value_boolean ? 'Yes' : 'No'
                                            else if(meta.respondent_choices?.[c?.respondent_field]) val = meta.respondent_choices?.[c?.respondent_field].find(f => f.value == c.value_text)?.label;
                                            else val = c.value_text;
                                            if(c.source_type == 'respondent') source = `Respondent's ${getLabelFromValue('respondent_fields', c.respondent_field)}`;
                                            else if(c.source_type == 'assessment') source = `${ind.order+1}. ${ind.name}`
                                            return(<li><strong>{source}</strong> <i>{operator}</i> <strong>{val}</strong></li>)
                                        })}
                                    </ul>
                                </div>}
                                <div style={{ display: 'flex', flexDirection: 'row' }}>
                                    <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover='Edit Indicator' />
                                    <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover='Delete Indicator' forDelete={true} />
                                </div>
                            </div>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 'auto'}}>
                            <button onClick={() => reorder(existing.order - 1)}><BsArrowBarUp fontSize={20}/></button>
                            <button onClick={() => reorder(existing.order + 1)}><BsArrowBarDown fontSize={20}/></button>
                        </div>
                    </div>
                </div> : <ComponentLoading />)}
            </div>
        )
    }
    //if editing or creating, return a form
    else {
        return(
            <div style={{ padding: '2vh', borderBottom: '4px solid white'}}>
                <h2>{existing ? `Editing ${existing.order+1} ${existing.name}` : `${assessment.indicators.length + 1}. New Indicator`}</h2>
                <Messages errors={submissionErrors} ref={alertRef} />
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit, onError)}>
                        <FormSection fields={basics} control={control}/>
                        {['single', 'multi', 'multint', 'integer', 'boolean'].includes(type) && 
                             <FormSection fields={allowAggies} control={control} header='Aggregates'/>}
                        {type=='multi' && assessment.indicators.filter((i => (i.order < order && i.type == 'multi'))).length > 0 && 
                            <FormSection fields={match} control={control} header='Match Options'/>}
                        {['single', 'multi', 'multint'].includes(type) && !usingMatched && 
                            <OptionsBuilder />
                        }
                        {['single', 'multi'].includes(type) && <FormSection control={control} fields={noneOption} header={'Add None Option?'} />}
                        <FormSection fields={logic} control={control} header='Logic'/>
                        {usingLogic && <LogicBuilder control={control} meta={meta} order={existing?.order ?? assessment.indicators.length} assessment={assessment} />}
                        {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                            <button type="submit" value='normal'><IoIosSave /> Save</button>
                            {/* If this is an edit, cancel just sets editing false, if creating, it will call the onCancel prop */}
                            <button type="button" onClick={() => {existing ? setEditing(false) : onCancel()}}><FcCancel /> Cancel</button>
                        </div>}
                        {saving && <ButtonLoading />}
                    </form>
                </FormProvider>
        </div>
    )}
}