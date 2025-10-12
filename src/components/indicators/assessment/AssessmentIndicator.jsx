import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm,  useWatch, FormProvider } from "react-hook-form";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import theme from '../../../../theme/theme';
import fetchWithAuth from "../../../../services/fetchWithAuth";

import Loading from '../../reuseables/loading/Loading';
import FormSection from '../../reuseables/forms/FormSection';
import Messages from '../../reuseables/Messages';
import ReturnLink from '../../reuseables/ReturnLink';
import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import OrganizationsIndex from '../../organizations/OrganizationsIndex';
import SimpleDynamicRows from '../../reuseables/inputs/SimpleDynamicRows';
import styles from '../../../styles/form.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import ComponentLoading from '../../reuseables/loading/ComponentLoading';
import LogicBuilder from './LogicBuilder';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import { ImPencil } from 'react-icons/im';
import { FaTrashAlt } from 'react-icons/fa';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import { BsArrowBarDown, BsArrowBarUp } from 'react-icons/bs';


export default function AssessmentIndicator({ meta, assessment, onUpdate, existing=null, onCancel=null}){
    /*
    Form for editing/creating project deadlines. Requires a URL param for the related project (id) and 
    accepts an optional deadlineID URL param for when editing an existing value. 
    */

    //page meta
    const [editing, setEditing] = useState(existing ? false : true);
    const [del, setDel] = useState(false);
    const [submissionErrors, setSubmissionErrors] = useState([]);
    const [saving, setSaving] = useState(false);

     const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id:existing?.id });
     
    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (submissionErrors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [submissionErrors]);  


    //delete the organization
    const handleDelete = async() => {
        if(!existing?.id) return;
        try {
            console.log('deleting organization...');
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
            console.error('Failed to delete organization:', err);
        }
        finally{
            setDel(false);
        }
    } 

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
        let submitErrors = []
        setSubmissionErrors([]);

        data.assessment_id = assessment.id; //set the related project based on the URL param
        const ref = rowRefs.current['options_data'];
        if (ref?.current?.collect) {
            const collected = ref.current.collect();
            if (collected === null) {
                submitErrors.push(`Please double check your options.`);
            } 
            else {
                data['options_data'] = collected;
            }
        }
        console.log(data);
        if(data.type != 'multi' && data.type != 'single' && !data.match_options){
            data.options_data = []
        }
        if(!data.include_logic){
            data.logic_data = {};
        }
        if(submitErrors.length > 0){
            setSubmissionErrors(submitErrors);
            return;
        }
        try{
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
    
    //set default values
    const defaultValues = useMemo(() => {
        return {
            name: existing?.name ?? '',
            required: existing?.required ?? true,
            type: existing?.type ?? 'text',
            match_options: existing?.match_options ?? null,
            options_data: existing?.options_data ?? [],
            include_logic: existing?.logic?.conditions?.length > 0 ?? false,
            logic_data: {
                group_operator: existing?.logic?.group_operator ?? "AND",
                conditions: existing?.logic?.conditions ?? [],  
            }
        }
    }, [existing]);

    //helper ref to manage subcategories, since SimpleDynamicRows is not an RHF input
    const rowRefs = useRef({});
    if (!rowRefs.current['options_data']) {
        rowRefs.current['options_data'] = React.createRef();
    }

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
    const type = useWatch({ control, name: 'type', defaultValue: 'text' });
    const usingMatched = useWatch({ control, name: 'match_options', defaultValue: false });
    const usingLogic= useWatch({ control, name: 'include_logic', defaultValue: false });
    const basics = [
        { name: 'name', label: 'Name (Required)', type: "textarea", rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} },
            placeholder: "Give this deadline a short snappy name so that people know what's due...",
        },
        { name: 'required', label: "Required", type: "checkbox",
            placeholder: "Any additional information that will help people understand this deadline..."
        },
        { name: 'type', label: "Type", type: "radio", options: meta?.type, rules: { required: "Required" }}, 
    ]
    const match = [
        { name: 'match_options_id', label: "Match Options", type: "select",
            options: assessment.indicators.map((ind) => ({value: ind.id, label: ind.name}))
        },
    ]
    const logic = [
        { name: 'include_logic', label: "Add logic", type: "checkbox",
        },
    ]

    if(!meta?.type) return <ComponentLoading />
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        margin: 40,
        padding: 8,
        backgroundColor: theme.colors.bonasoDarkAccent,
    };
    if(!editing && existing){
        return (
            <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
                <Messages errors={submissionErrors} ref={alertRef} />
                {del && <ConfirmDelete onCancel={() => setDel(false)} onConfirm={handleDelete} name={'this indicator'} />}
                {!editing && (existing ? <div>
                    <p>{existing?.order + 1}. {existing?.name}</p>
                    <i>{existing?.type}</i>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover='Edit Indicator' />
                        <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover='Delete Indicator' forDelete={true} />
                    </div>
                    <button onClick={() => reorder(existing.order - 1)}><BsArrowBarUp fontSize={20}/></button>
                    <button onClick={() => reorder(existing.order + 1)}><BsArrowBarDown fontSize={20}/></button>
                </div> : <ComponentLoading />)}
            </div>
        )
    }
    else {
        return(
            <div className={styles.form}>
                <h2>{existing ? `Editing ${existing.name}` : 'New Indicator'}</h2>
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit, onError)}>
                        <FormSection fields={basics} control={control} header='Basic Information'/>
                        {(type=='single' || type=='multi') && assessment.indicators.length > 0 && 
                            <FormSection fields={match} control={control} header='Match Options'/>}
                        {(type=='single' || type=='multi') && !usingMatched && 
                            <SimpleDynamicRows ref={rowRefs.current['options_data']} label={'Options'}
                                tooltip={`Enter the name of each option. You may add or remove rows using the buttons. 
                                    ${existing ? ' If you are trying to remove an option from an existing question, mark it as deprecated.' : '' }`}
                                existing={existing?.options ?? []} header={'Options'}/>
                        }
                        <FormSection fields={logic} control={control} header='Logic'/>
                        {usingLogic && <LogicBuilder control={control} meta={meta} order={existing?.order ?? assessment.indicators.length} assessment={assessment} />}
                        {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                            <button type="submit" value='normal'><IoIosSave /> Save</button>
                            <button type="button" onClick={() => {existing ? setEditing(false) : onCancel()}}><FcCancel /> Cancel</button>
                        </div>}
                        {saving && <ButtonLoading />}
                    </form>
                </FormProvider>
        </div>
    )}
}