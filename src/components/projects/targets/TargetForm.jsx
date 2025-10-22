import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm,  useWatch } from "react-hook-form";

import fetchWithAuth from '../../../../services/fetchWithAuth';
import { tryMatchDates, getMonthDatesStr, getQuarterDatesStr, getWindowsBetween } from '../../../../services/dateHelpers';
import prettyDates from '../../../../services/prettyDates';

import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import Messages from '../../reuseables/Messages';
import Tasks from '../../tasks/Tasks';
import FormSection from '../../reuseables/forms/FormSection';
import styles from '../../../styles/form.module.css';

import { BsDatabaseFillAdd } from "react-icons/bs";
import { IoIosSave } from "react-icons/io";
import { FcCancel } from "react-icons/fc";
import IndicatorsIndex from '../../indicators/IndicatorsIndex';

export default function TargetModal(){
    /*
    Modal that is used for creating or editing a target.
    */
   const navigate = useNavigate();
    const { id, orgID, targetID } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState([]);
    const [submissionErrors, setSubmissionErrors] = useState([]);
    const [project, setProject] = useState(null);
    const [existing, setExisting] = useState(null);
    
    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if ((submissionErrors.length > 0 || success.length > 0) && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [submissionErrors, success]);

     //get project once on load
    useEffect(() => {
        const fetchProject = async () => {
            try {
                console.log('fetching project details...');
                const response = await fetchWithAuth(`/api/manage/projects/${id}/`);
                const data = await response.json();
                if(response.ok){
                    setProject(data);
                }
                else{
                    navigate(`/not-found`);
                }
                
            } 
            catch (err) {
                console.error('Failed to fetch project: ', err);
                setSubmissionErrors(['Something went wrong. Please try again later.']);
                
            } 
            finally{
                setLoading(false);
            }
        }
        fetchProject()
    }, [id]);
    
    useEffect(() => {
        const fetchTarget = async () => {
            if(!targetID) return;
            try {
                console.log('fetching target details...');
                const response = await fetchWithAuth(`/api/manage/targets/${targetID}/`);
                const data = await response.json();
                if(response.ok){
                    console.log(data)
                    setExisting(data);
                }
                else{
                    navigate(`/not-found`);
                }
            } 
            catch (err) {
                console.error('Failed to fetch project: ', err);
                setSubmissionErrors(['Something went wrong. Please try again later.']);
                
            }
        }
        fetchTarget()
    }, [targetID]);


    //helper function that converts a selected date/month string to a start and end date
    //will trim to project dates if necessary
    const handleDates = (data) => {
        if(data.date_type === 'quarter'){
            return getQuarterDatesStr(data.quarter, project);
        }
        if(data.date_type === 'month'){
            return getMonthDatesStr(data.month, project);
        }
        return {start: data.start, end: data.end}
    }

    //handle submission
    const onSubmit = async(data, e) => {
        //clear away potentially stale/leftover valies
        data.organization_id = orgID;
        data.project_id = id;
        if (asP) {
            data.amount = null
            data.related_to_id = data.related_to_id.id; //backend expects the ID only
        } 
        else {
            data.percentage_of_related = null;
            data.related_to_id = null;
        }
        const {start, end} = handleDates(data);
        data.start = start;
        data.end = end;
        data.indicator_id = data.indicator_id.id; //backend expects the ID only
        try{
            setSaving(true);
            const action = e.nativeEvent.submitter.value;
            console.log('submitting target...', data)
            const url = existing ? `/api/manage/targets/${existing.id}/` : `/api/manage/targets/`;
            const response = await fetchWithAuth(url, {
                method: existing ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setSuccess(['Target created successfuly!']);
                if(action === 'create_another'){
                    setExisting(null);
                    reset();
                    navigate(`/projects/${id}/organizations/${orgID}/targets/new`);
                }
                else{
                    navigate(`/projects/${id}/organizations/${orgID}`);
                }
            }
            else{
                const serverResponse = []
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
                setSubmissionErrors(serverResponse)
            }
        }
        catch(err){
            setSubmissionErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record target: ', err)
        }
        finally{
            setSaving(false);
        }
    }

    //get a list of all valid months/quarters occuring within the provided project
    const { monthOptions, quarterOptions } = useMemo(() => {
        if(!project) return {monthOptions: [], quarterOptions: []};
        const options = getWindowsBetween(project.start, project.end)
        return { monthOptions: options.months, quarterOptions: options.quarters}
    }, [project]);

    //set default values
    const defaultValues = useMemo(() => {
        return {
            indicator_id: existing?.indicator ?? null,
            amount: existing?.amount ?? '',
            as_percentage: existing?.related_to?.id ?? false,
            related_to_id: existing?.related_to ?? null,
            percentage_of_related: existing?.percentage_of_related ?? '',
            
            //the backend will just pass start/end, so these functions will try to figure out of those dates
            //match a quarter/month
            date_type: existing ? tryMatchDates(existing?.start, existing?.end, project)?.type : null,
            quarter: existing ? tryMatchDates(existing?.start, existing?.end, project)?.value : null,
            month: existing ? tryMatchDates(existing?.start, existing?.end, project)?.value : null,

            start: existing?.start ?? '',
            end: existing?.end ?? '',

        }
    }, [existing]);

    //construct RHF variables
    const { register, control, handleSubmit, reset, watch, setFocus, formState: { errors } } = useForm({ defaultValues });

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


    //load existing values once existing loads, if provided
    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    const targetInd = useWatch({ control, name: 'indicator_id', defaultValue: null}); //use so that a user cannot select the same task for related to
    //get if this is custom/by quarter/by month
    const typeVal = useWatch({ control, name: 'date_type', defaultValue: tryMatchDates(existing?.start, existing?.end, project)?.type});
    //check if this target is measured as a percentage or as a raw number
    const asP = watch('as_percentage');

    const indicator= [
        { name: 'indicator_id', label: 'For Indicator (Required)', type: "model", IndexComponent: IndicatorsIndex, rules: { required: "Required" },
            labelField: 'display_name',  includeParams: [{field: 'organization', value: orgID}, {field: 'project', value: id}]},
    ]
    const asRelated = [
        { name: 'as_percentage', label: 'Measure as a Percentage of Another Indicator', type: "checkbox", 
            tooltip: `Instead of setting this target as a number, you can set it based on the organization's
            achievement of another task (for example, 100% of all positive results are referred for further treatment).`
        },
    ]
    //only show is as related is not checked
    const amount = [
        { name: 'amount', label: 'Target Amount (Required)', type: "number", rules: { required: "Required" },
            placeholder: 'ex. 99...',
        },
    ]
    //only show if as related is checked
    const relatedToInd = [
        { name: 'related_to_id', label: 'Select Related Indicator (Required)', type: "model", IndexComponent: IndicatorsIndex, labelField: 'display_name', rules: { required: "Required" },
            includeParams: [{field: 'organization', value: orgID}, {field: 'project', value: id}], blacklist: [targetInd?.id],
            tooltip: `This is the task whose achievement should set the target for the task selected above.`
        },
        { name: 'percentage_of_related', label: 'Percentage of Achievement of Related Indicator (Required)', type: "number", rules: { required: "Required",
            min: { value: 1, message: "Must be at least 1" },
            max: { value: 100, message: "Cannot exceed 100" }, 
            }, placeholder: 'ex. 100...', tooltip: 'What percentage of acheivement for the related task should be the target (between 0 and 100)?'
        },
    ]
    //select the type of date range to display for start/end
    const dateType = [
        { name: 'date_type', label: "Target Period (Select type) (Required)", type: "radio", rules: { required: "Required" },
            options: [{value: 'month', label: 'By Month'}, {value: 'quarter', label: 'By Quarter'}, {value: 'custom', label: 'Custom'}],
            tooltip: `Select a period type for this target. You can choose to set by quarter, by month, or set a custom range.`
        },
    ]
    //if quarter, display a list of valid quarters for the project
    const quarter = [
        { name: 'quarter', label: "Select a Quarter (Required)", type: "radio", rules: { required: "Required" },
            options: quarterOptions?.map((q) => ({'value': q, 'label': q}))
        },
    ]
    //if month, display a list of valid months for the project
    const month = [
        { name: 'month', label: "Select a Month (Required)", type: "radio", rules: { required: "Required" },
            options: monthOptions?.map((month) => ({'value': month, 'label': month}))
        },
    ]
    //else display start/end input
    const customDates = [
        { name: 'start', label: "Target Starts On (Required)", type: "date", rules: { required: "Required" }},

        { name: 'end', label: "Target Ends On (Required)", type: "date", rules: { required: "Required" }},
    ]
    return(
        <div className={styles.form}>
            <h2>{existing ? `Editing Target` : 'New Target' }</h2>
            <Messages errors={submissionErrors} success={success} ref={alertRef} />
            <form onSubmit={handleSubmit(onSubmit, onError)}>
                <FormSection fields={indicator} control={control} header={'Target For'}/>
                <FormSection fields={asRelated} control={control} header={'Measure as Percentage?'} />
                {!asP && <FormSection fields={amount} control={control} />}
                {asP && <FormSection fields={relatedToInd} control={control} />}

                <FormSection fields={dateType} control={control} />
                {typeVal === 'quarter' && <FormSection fields={quarter} control={control} />}
                {typeVal === 'month' && <FormSection fields={month} control={control} />}
                {typeVal === 'custom' && <FormSection fields={customDates} control={control} />}

               {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    {!targetID && <button type="submit" value='create_another'><BsDatabaseFillAdd /> Save and Create Another</button>}
                    <Link to={`/projects/${id}/organizations/${orgID}`}><button type="button">
                        <FcCancel /> Cancel
                    </button></Link>
                </div>}
                {saving && <ButtonLoading />}
            </form>
        </div>
    )
}
