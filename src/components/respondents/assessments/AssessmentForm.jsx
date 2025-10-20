import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm,  useWatch, useController, useFormContext, FormProvider } from "react-hook-form";

import fetchWithAuth from "../../../../services/fetchWithAuth";
import { calcDefault, checkLogic } from './helpers';

import { useRespondents } from "../../../contexts/RespondentsContext";
import { useIndicators } from "../../../contexts/IndicatorsContext";

import Loading from "../../reuseables/loading/Loading";
import FormSection from "../../reuseables/forms/FormSection";
import ResponseField from "./ResponseField";

import ButtonLoading from "../../reuseables/loading/ButtonLoading";
import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import Messages from "../../reuseables/Messages";

import styles from '../../../styles/form.module.css';

export default function AssessmentForm(){
    const navigate = useNavigate();

    const { id, taskID, irID } = useParams();
    const { setAssessmentDetails } = useIndicators();
    const { setRespondentDetails} = useRespondents();

    const [assessment, setAssessment] = useState(null);
    const [respondent, setRespondent] = useState(null);
    const [existing, setExisting] = useState(null);

    const [submissionErrors, setSubmissionErrors] = useState([]);
    const [loading, setLoading] = useState(true);
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
        const getAssessmentDetail = async () => {
            try {
                console.log('fetching indicator details...');
                const response = await fetchWithAuth(`/api/manage/tasks/${taskID}/`);
                const data = await response.json();
                if(response.ok){
                    //update the context
                    setAssessmentDetails(prev => [...prev, data.assessment]);
                    setAssessment(data.assessment);
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
            finally {
                setLoading(false);
            }
        }
        getAssessmentDetail();
    }, [taskID]);

    useEffect(() => {
        const getInteraction = async () => {
            if(!irID) return;
            try {
                console.log('fetching indicator details...');
                const response = await fetchWithAuth(`/api/record/interactions/${irID}/`);
                const data = await response.json();
                if(response.ok){
                    //update the context
                    setExisting(data);
                }
                else{
                    //if a bad ID is provided, navigate to 404
                    navigate(`/not-found`);
                }
            } 
            catch (err) {
                console.error('Failed to fetch interaction: ', err);
                setSubmissionErrors(['Something went wrong. Please try again later.'])
            } 
            finally {
                setLoading(false);
            }
        }
        getInteraction();
    }, [irID]);

    useEffect(() => {
        const getRespondentDetails = async () => {
            try {
                console.log('fetching respondent details...');
                const response = await fetchWithAuth(`/api/record/respondents/${id}/`);
                const data = await response.json();
                if(response.ok){
                    setRespondentDetails(prev => [...prev, data]);
                    setRespondent(data);
                }
                else{
                    navigate(`/not-found`);
                }
                
            } 
            catch (err) {
                console.error('Failed to fetch respondent: ', err);
                setSubmissionErrors(['Something went wrong. Please try again later.']);
            } 
        };
        getRespondentDetails();
    }, [id])

    const onSubmit = async (data) => {
        data.respondent_id = id;
        data.task_id = taskID;
        try{
            setSaving(true);
            console.log('submitting data...', data);
            const url = existing?.id ? `/api/record/interactions/${existing?.id}/` : `/api/record/interactions/`;
            const response = await fetchWithAuth(url, {
                method: existing?.id ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                //use action to redirect to the correct page
                navigate(`/respondents/${id}`);
            }
            else{
                const serverResponse = [];
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
            console.error('Could not record interaction: ', err)
        }
        finally{
            setSaving(false);
        }
    }
    
    const defaultValues = useMemo(() => {
        return {
            interaction_date: existing?.interaction_date ?? '',
            interaction_location: existing?.interaction_location ?? '',
            response_data: calcDefault(assessment, existing),
            comments: existing?.comments ?? '',
        }
    }, [existing]);

    const methods = useForm({ defaultValues });
    const { register, unregister, control, handleSubmit, reset, watch, setFocus, getValues, setValue, formState: { errors } } = methods;
    
    //scroll to errors
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

    //load existing values once existing loads, if provided
    useEffect(() => {
        if (assessment) {
            const defaults = {
                interaction_date: existing?.interaction_date ?? '',
                interaction_location: existing?.interaction_location ?? '',
                response_data: calcDefault(assessment, existing),
                comments: existing?.comments ?? '',
            };
            reset(defaults);
        }
    }, [assessment, existing, reset]);

    


    const date = watch("interaction_date");
    const loc = watch("interaction_location");

    const responseInfo = useWatch({ control, name: "response_data" });
    
    const visibilityMap = useMemo(() => {
        if(!assessment || !respondent) return {};
        const map = {}
        assessment.indicators.forEach((ind) => {
             const logic = ind.logic;
            //no logic, always return true
            if(!logic?.conditions || logic?.conditions?.length == 0) map[ind.id] = true;
            else if(ind.logic.group_operator == 'AND'){
                map[ind.id] = logic.conditions.every(c => (checkLogic(c, responseInfo, assessment, respondent)))
            }
            //must be an OR
            else{
                map[ind.id] =  logic.conditions.some(c => (checkLogic(c, responseInfo, assessment, respondent)))
            }
        });
        return map;
    }, [responseInfo]);
    console.log(assessment)
    console.log(responseInfo, visibilityMap)
    useEffect(() => {
        if (!assessment || !respondent) return;
        assessment.indicators.forEach(ind => {
            if (!visibilityMap[ind.id]) {
                const currentValue = responseInfo?.[ind.id]?.value;
                // ✅ Only unregister/reset if there’s actually data
                if (currentValue !== undefined) {
                    setValue(`response_data.${ind.id}`, {}, { shouldDirty: false });
                    unregister(`response_data.${ind.id}.value`);
                }
            }
        });
    }, [visibilityMap, unregister, assessment, respondent]);

     const optionsMap = useMemo(() => {
        if(!assessment) return {};
        const map = {}
        assessment.indicators.forEach((ind) => {
            if(['boolean'].includes(ind.type)){
                map[ind.id] = [{value: true, label: 'Yes'}, {value: false, label: 'No'}];
                return;
            }
            else if(!['single', 'multi'].includes(ind.type)){
                map[ind.id] = [] //keep each value in map as an array to avoid issues down the line
                return;
            }
            let opts = ind?.options?.map((o) => ({value: o.id, label: o.name})) ?? [];
            if(ind.allow_none) opts.push({value: 'none', label: 'None of the above'})
            if(ind.match_options){
                const valid = responseInfo?.[ind.match_options]?.value;
                opts = opts.filter(o => (valid?.includes(o?.value) || o?.value == 'none'));
            }
            map[ind.id] = opts
        })
        return map
    }, [assessment, responseInfo]);
        
    useEffect(() => {
        if(!assessment || !optionsMap) return;
        assessment.indicators.forEach((ind) => {
            const options = optionsMap[ind.id]
            if (!['single', 'multi'].includes(ind.type)) return;
            if (!options || options.length === 0) return;

            const val = getValues(`response_data.${ind.id}.value`);
            const valid_ids = options.map(p => p.value);

            if (ind.type === 'multi') {
                const valArray = Array.isArray(val) ? val : [];
                const filtered = valArray.filter(v => valid_ids.includes(v));
                if (JSON.stringify(valArray) !== JSON.stringify(filtered)) {
                    setValue(`response_data.${ind.id}.value`, filtered);
                }
            }
            if (ind.type === 'single') {
                const useVal = valid_ids.includes(val) ? val : null;
                if (JSON.stringify(val) !== JSON.stringify(useVal)) {
                    setValue(`response_data.${ind.id}.value`, useVal);
                }
            }
        });
    }, [optionsMap]);

    const basics = [
        { name: 'interaction_date', label: 'Date of Interaction', type: "date", rules: { required: "Required", },
            tooltip: 'Give it a memorable name.',
        },
        { name: 'interaction_location', label: "Location of Interaction", type: "text", rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} },
                placeholder: 'A brief overview, the purpose, objectives, anything...'
        },
    ]
    const comments = [
        { name: 'comments', label: 'Comments/Notes', type: 'textarea', placeholder: 'Any additional notes that may be helpful to remember' }
    ]


    const visibleInds = (assessment && respondent && visibilityMap) ? assessment.indicators.filter(ind => (visibilityMap[ind.id])) : [];
    if(loading || !respondent || !assessment) return <Loading />
    return(
        <div className={styles.form}>
            <h1>{assessment.name} Assessment for {respondent.display_name}</h1>
            <Messages errors={submissionErrors} ref={alertRef} />

            {visibleInds?.length > 0 && <FormProvider {...methods} >
            <form onSubmit={handleSubmit(onSubmit, onError)}>
                <FormSection control={control} fields={basics} header={'Date & Location'} />

                {assessment.indicators.sort((a, b) => a.order-b.order).map((ind) => (
                    <ResponseField indicator={ind} shouldShow={visibilityMap[ind.id]} options={optionsMap[ind.id]} />
                ))}
                <FormSection control={control} fields={comments} />
                {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    <Link to={id ? `/respondents/${id}` : '/respondents'}><button type="button">
                        <FcCancel /> Cancel
                    </button></Link>
                </div>}
                {saving && <ButtonLoading />}
            </form>
            </FormProvider>}
            {!visibleInds || visibleInds.length == 0 && <Messages warnings={['This respondent is not eligible for this assessment.']} />}
        </div>
    )
}