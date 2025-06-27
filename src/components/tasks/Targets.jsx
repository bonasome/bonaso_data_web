import React, { useState, useEffect } from "react";
import fetchWithAuth from '../../../services/fetchWithAuth';
import IndexViewWrapper from "../reuseables/IndexView";
import { useAuth } from '../../contexts/UserAuth'
import SimpleSelect from "../reuseables/SimpleSelect";
import errorStyles from '../../styles/errors.module.css';
import styles from './tasks.module.css';
import prettyDates from '../../../services/prettyDates';
import ConfirmDelete from "../reuseables/ConfirmDelete";

export function Target({ target, task, tasks, onUpdate, onDelete }){
    const { user } = useAuth();
    const [success, setSuccess] = useState('')
    const[currentTarget, setCurrentTarget] = useState(target);
    const [editing, setEditing] = useState(false)
    const [related, setRelated] = useState(null);
    const [del, setDel] = useState(false);
    const [errors, setErrors] = useState([]);

    useEffect(() => {
        console.log('current', currentTarget)
        if (currentTarget?.related_to) {
            const related = tasks.find(t => t.id === currentTarget.related_to.id);
            setRelated(related || null);
        }
    }, [currentTarget, tasks]);


    const onComplete = (data) => {
        setSuccess('Target Saved!');
        setEditing(false);
        setCurrentTarget(data);
        onUpdate(data)
    }
    const deleteTarget = async() => {
        try {
            console.log('deleting targets...');
            const response = await fetchWithAuth(`/api/manage/targets/${target.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setSuccess('Target deleted.')
                onDelete(target.id);
                setErrors([]);
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
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            console.error('Failed to delete target:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        setDel(false)

    }

    return(
        <div className={styles.target} onClick={(e) => e.stopPropagation()}>
            {success && <div className={errorStyles.success}>{success}</div>}
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {del && 
                <ConfirmDelete 
                    name={'Target for ' + task.indicator.name + 'for '+ task.organization.name}  
                    onConfirm={() => deleteTarget()} onCancel={() => setDel(false)} 
                    allowEasy={true}
            />}
            {editing ? 
                <TargetEdit task={task} tasks={tasks} onUpdate={onComplete} existing={currentTarget} /> :
                <p>{prettyDates(currentTarget.start)} - {prettyDates(currentTarget.end)}: <b>{currentTarget.amount ? currentTarget.amount : currentTarget.percentage_of_related + '% of ' + related?.indicator.name}</b> </p>
            }
            <div>
                {user.role == 'admin' && <button className={styles.cancel} onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit Target'}</button>}
                {user.role == 'admin' && <button className={styles.cancel} onClick={() => setDel(true)}>Delete Target</button>}
            </div>
        </div>
    )
}

export function TargetEdit({ task, tasks, onUpdate, existing }){
    const { user } = useAuth();
    const [taskNames, setTaskNames] = useState([]);
    const [errors, setErrors] = useState([])
    const [taskIDs, setTaskIDs] = useState([])
    const [asPercentage, setAsPercentage] = useState(false)

    console.log(existing)
    const [targetInfo, setTargetInfo] = useState({
        task_id: task.id,
        amount: existing ? existing?.amount : '',
        start: existing ? existing?.start : '',
        end: existing ? existing?.end : '',
        related_to_id: existing ? existing?.related_to?.id : '',
        percentage_of_related: existing ? existing?.percentage_of_related : ''
    })
    const [targetID, setTargetID] = useState(existing ? existing.id : '')
    useEffect(() => {
        const ids = tasks.filter(t => t.id != task.id && t.organization == task.organization).map((t) => t.id)
        const names = tasks.filter(t => t.id != task.id && t.organization == task.organization).map((t) => (t.indicator.code + ': ' + t.indicator.name))
        setTaskIDs(ids)
        setTaskNames(names)
        existing ? setTargetID(existing.id) : setTargetID('')
        if (existing && existing?.percentage_of_related) {
            setAsPercentage(true);
        }
    }, [tasks, existing, task])


    const onSubmit = async() => {
        let submissionErrors = []
        let submission = targetInfo
        if (asPercentage) {
            setTargetInfo(prev => ({
                ...prev,
                amount: null
            }));
            submission.amount = null;
            if(submission.percentage_of_related == '' || submission.related_to_id == ''
                || !submission.related_to_id || !submission.percentage_of_related
            ){
                submissionErrors.push('Target requires a related task and a percentage.')
            }
        } 
        else {
            setTargetInfo(prev => ({
                ...prev,
                percentage_of_related: null,
                related_to_id: null
            }));
            submission.percentage_of_related = null;
            submission.related_to_id = null;
            if(submission.amount == '' || !submission.amount){
                submissionErrors.push('Target requires an amount.')
            }
        }
        if(!targetInfo.start || !targetInfo.end){
            submissionErrors.push('Target requires start and end date.')
        }

        if(targetInfo.start > targetInfo.end){
            submissionErrors.push('Start date must be before end date.')
        }
        if(submissionErrors.length > 0){
            setErrors(submissionErrors);
            return;
        }
        setErrors([])

        try{
            //console.log('submitting target...', submission)
            const url = existing ? `/api/manage/targets/${targetID}/` : `/api/manage/targets/`;
            const response = await fetchWithAuth(url, {
                method: existing ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(submission)
            });
            const returnData = await response.json();
            if(response.ok){
                onUpdate(returnData)
                setErrors([]);
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
                        serverResponse.push(`${field}: ${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record respondent: ', err)
        }
    }
    if(!user.role == 'admin') return(<p>You do not have permission to perform this action.</p>)
    return(
        <div onClick={(e) => e.stopPropagation()}>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <div className={styles.dates}>
                <label htmlFor='start'>Start</label>
                <input id='start' name='start' type='date' value={targetInfo.start} onChange={(e) => setTargetInfo(prev => ({...prev, start: e.target.value}))} required={true}/>
                <label htmlFor='end'>End</label>
                <input id='end' name='end' type='date' value={targetInfo.end} onChange={(e) => setTargetInfo(prev => ({...prev, end: e.target.value}))} required={true}/>
            </div>
            <div className={styles.checkbox}>
                <input id='as_percentage' name='as_percentage' type='checkbox' checked={asPercentage} onChange={(e) => setAsPercentage(e.target.checked)} />
                <label htmlFor='as_percentage'>Measure as a percentage?</label>
            </div>
            {!asPercentage && 
                <div>
                    <label htmlFor='amount'>Amount</label>
                    <input id='amount' name='amount' type='number' value={targetInfo.amount !== null && targetInfo.amount !== undefined ? String(targetInfo.amount) : ''} onChange={(e) => setTargetInfo(prev => ({...prev, amount: e.target.value}))} required={true}/>
                    </div>
            }
            {asPercentage && 
                <div>
                    <SimpleSelect name={'task_id'} label={'Related Task'} optionValues={taskIDs} optionLabels={taskNames} defaultOption={existing ? targetInfo.related_to_id : ''} callback={(val) => setTargetInfo(prev => ({...prev, related_to_id: val}))} required={true}/>
                    <label htmlFor='percentage'>Percentage of Task</label>
                    <input id='percentage' name='percentage' type='number' min='0' max='100' value={targetInfo.percentage_of_related || ''} onChange={(e) => setTargetInfo(prev => ({...prev, percentage_of_related: e.target.value}))} required={true}/>
                </div>
            }
            <button onClick={()=>onSubmit()}>Save</button>
        </div>
    )
    
}