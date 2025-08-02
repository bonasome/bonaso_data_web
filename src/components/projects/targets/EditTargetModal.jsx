import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm,  useWatch } from "react-hook-form";

import { useAuth } from '../../../contexts/UserAuth';

import fetchWithAuth from '../../../../services/fetchWithAuth';
import { tryMatchDates, getMonthDatesStr, getQuarterDatesStr, getWindowsBetween } from '../../../../services/dateHelpers';
import prettyDates from '../../../../services/prettyDates';

import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import Messages from '../../reuseables/Messages';
import Tasks from '../../tasks/Tasks';
import FormSection from '../../reuseables/forms/FormSection';
import styles from './targets.module.css';
import modalStyles from '../../../styles/modals.module.css';

import { PiTargetBold } from "react-icons/pi";
import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { IoIosSave } from "react-icons/io";
import { FcCancel } from "react-icons/fc";

export function EditTargetModal({ onUpdate, onCancel, project, organization,  existing=null,  }){
    const [saving, setSaving] = useState(false);
    const [submissionErrors, setSubmissionErrors] = useState([]);

    const handleDates = (data) => {
        if(data.date_type === 'quarter'){
            return getQuarterDatesStr(data.quarter, project);
        }
        if(data.date_type === 'month'){
            return getMonthDatesStr(data.month, project);
        }
        return {start: data.start, end: data.end}
    }

    const onSubmit = async(data) => {
        let submissionErrors = []
        if (asP) {
            data.amount = null
            data.related_to_id = data.related_to_id.id
        } 
        else {
            data.percentage_of_related = null;
            data.related_to_id = null;
        }
        const {start, end} = handleDates(data);
        data.start = start
        data.end = end
        data.task_id = data.task_id.id
        try{
            setSaving(true);
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
                onUpdate();
                onCancel();

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
            console.error('Could not record respondent: ', err)
        }
        finally{
            setSaving(false);
        }
    }

    const { monthOptions, quarterOptions } = useMemo(() => {
        if(!project) return {monthOptions: [], quarterOptions: []};
        const options = getWindowsBetween(project.start, project.end)
        return { monthOptions: options.months, quarterOptions: options.quarters}
    }, [project]);

    const defaultValues = useMemo(() => {
        return {
            task_id: existing?.task ?? null,
            amount: existing?.amount ?? '',
            as_percentage: existing?.related_to?.id ?? false,
            related_to_id: existing?.related_to ?? null,
            percentage_of_related: existing?.percentage_of_related ?? '',
            
            date_type: existing ? tryMatchDates(existing?.start, existing?.end, project)?.type : null,
            quarter: existing ? tryMatchDates(existing?.start, existing?.end, project)?.value : null,
            month: existing ? tryMatchDates(existing?.start, existing?.end, project)?.value : null,

            start: existing?.start ?? '',
            end: existing?.end ?? '',

        }
    }, [existing]);

    const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({ defaultValues });

    const typeVal = useWatch({ control, name: 'date_type', defaultValue: tryMatchDates(existing?.start, existing?.end, project)?.type});

    const asP = watch('as_percentage')

    const task = [
        { name: 'task_id', label: 'Related Task', type: "model", IndexComponent: Tasks,
            labelField: 'display_name',  includeParams: [{field: 'organization', value: organization.id}]},
        
        { name: 'as_percentage', label: 'Measure as a Percentage of Another Task', type: "checkbox"},
    ]
    const amount = [
        { name: 'amount', label: 'Target Amount', type: "number", rules: { required: "Required" } },
    ]
    const relatedToTask = [
        { name: 'related_to_id', label: 'Select Related Task', type: "model", IndexComponent: Tasks, labelField: 'display_name',
            includeParams: [{field: 'organization', value: organization.id}]
        },
        { name: 'percentage_of_related', label: 'Percentage of Achievement of Related Task', type: "number", rules: { 
            min: { value: 1, message: "Must be at least 1" },
            max: { value: 100, message: "Cannot exceed 100" }
        }},
    ]

    const dateType = [
        { name: 'date_type', label: "Target Period (Select type)", type: "radio", rules: { required: "Required" },
            options: [{value: 'month', label: 'By Month'}, {value: 'quarter', label: 'By Quarter'}, {value: 'custom', label: 'Custom'}],
        },
    ]
    const quarter = [
        { name: 'quarter', label: "Select a Quarter", type: "radio", rules: { required: "Required" },
            options: quarterOptions?.map((q) => ({'value': q, 'label': q}))
        },
    ]
    const month = [
        { name: 'month', label: "Select a Month", type: "radio", rules: { required: "Required" },
            options: monthOptions?.map((month) => ({'value': month, 'label': month}))
        },
    ]
    const customDates = [
        { name: 'start', label: "Project Starts On", type: "date", rules: { required: "Required" }},

        { name: 'end', label: "Project Ends On", type: "date", rules: { required: "Required" ,
            validate: value => !start || value >= start || "This project cannot end before it starts."
        }},
    ]
    return(
        <div className={modalStyles.modal}>
            <h1>{existing ? `Editing Target` : 'New Target' }</h1>
            <Messages errors={submissionErrors} />
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormSection fields={task} control={control} />
                {!asP && <FormSection fields={amount} control={control} />}
                {asP && <FormSection fields={relatedToTask} control={control} />}

                <FormSection fields={dateType} control={control} />
                {typeVal === 'quarter' && <FormSection fields={quarter} control={control} />}
                {typeVal === 'month' && <FormSection fields={month} control={control} />}
                {typeVal === 'custom' && <FormSection fields={customDates} control={control} />}

                {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    <button type="button" onClick={() => onCancel()}><FcCancel /> Cancel</button>
                </div>}
                {saving && <ButtonLoading />}
            </form>
        </div>
    )
}
