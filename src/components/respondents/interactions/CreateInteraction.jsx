import React from 'react';
import { useState, useEffect, useRef } from "react";
import fetchWithAuth from '../../../../services/fetchWithAuth';
import SimpleSelect from '../../reuseables/SimpleSelect';
import errorStyles from '../../../styles/errors.module.css';
import { useInteractions } from '../../../contexts/InteractionsContext';
import { useAuth } from '../../../contexts/UserAuth';
//wow, this component is a lot, we definately need to test it
//also figure out how to manage edits



function InteractionTask({ tasks, rows, interactions, id, onParentSubmit, onTaskChange, onRemove }){
    const[errors, setErrors] = useState([]);
    const [warnings, setWarnings] = useState([]);

    const [task, setTask] = useState(null);
    const [taskValues, setTaskValues] = useState([]);
    const [taskLabels, setTaskLabels] = useState([]);
    const [availableSubcats, setAvailableSubcats] = useState([]);
    const [subcats, setSubcats] = useState([]);
    const [number, setNumber] = useState('');
    const [allowedSubcats, setAllowedSubcats] = useState([]);

    useEffect(() => {
        if(id) {
            const found = tasks.find(t => t.id.toString() === id.toString());
            setTask(found || null);
        }
    }, [id, tasks]);

    useEffect(() => {
        const priorTasks = rows.map((row) => row.id);
        const taskList = task ? tasks : tasks.filter(t => !priorTasks.includes(t.id.toString()));
        setTaskLabels(taskList.map(t => `${t.indicator.code} ${t.indicator.name}`));
        setTaskValues(taskList.map(t => t.id));
    }, [tasks, rows, task]);

    useEffect(() => {
        if (!task) return;
        const taskWarnings = [];
        const taskErrors = [];
        const priorRows = rows.filter(row => row.id !== task.id.toString());
        const priorTasks = priorRows.map((row) => row.id);
        if (priorTasks.includes(task.id.toString())) {
            taskErrors.push('This indicator cannot be in an interaction twice.');
        }

        if (task?.indicator?.prerequisite) {
            const prereq = task.indicator.prerequisite;
            const requiredTask = tasks.find(t => t.indicator.id === prereq.id);
            let isValid = false;
            if (priorTasks.includes(requiredTask?.id?.toString())) {
                isValid = true;
            } 
            else if (interactions?.length > 0) {
                const validPastInt = interactions.find(inter => inter?.task_detail?.indicator?.id === prereq.id);
                if (validPastInt) {
                    isValid = true;
                    if (validPastInt?.subcategories) {
                        const interSubcats = validPastInt.subcategories.map(t => t.name);
                        setAllowedSubcats(interSubcats);
                    }
                }
            }
            if (!isValid) {
                taskErrors.push(
                    `This indicator requires this respondent to have been ${prereq.name}, however, we could not find a prior record of this interaction.`
                );
            }
        }

        if (interactions?.length > 0) {
            const pastInt = interactions.filter(inter => inter?.task_detail?.indicator?.id === task.indicator.id);
            const now = new Date();
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(now.getMonth() - 1);

            const tooRecent = pastInt.filter(
                inter => new Date(inter?.interaction_date) >= oneMonthAgo
            );

            if (tooRecent.length > 0) {
                taskWarnings.push(
                    'This respondent has had this interaction in the last month. Please be sure you are not double recording.'
                );
            }
        }
        if (task?.indicator?.subcategories?.length > 0) {
            const subcatNames = task.indicator.subcategories.map(t => t.name);
            setAvailableSubcats(subcatNames);
        }
        setWarnings(taskWarnings);
        setErrors(taskErrors);
    }, [task, interactions, rows, tasks]);

    useEffect(() => {
        onParentSubmit(() => {
            if (!task || errors.length > 0) return { error: true };
            return {
                task: task.id,
                subcategory_names: subcats,
                numeric_component: number || null,
            };
        });
    }, [task, subcats, number, onParentSubmit, errors]);
    
    return(
        <div>
                {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                {warnings.length != 0 && <div className={errorStyles.warnings}><ul>{warnings.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                {tasks && taskValues && taskLabels && 
                    <label htmlFor='task'>Select a task
                        <select value={task?.id || ''} id='task' onChange={(e) => onTaskChange(e.target.value)}>
                            <option value=''>-----</option>
                            {taskValues.map((val, index) => 
                                (<option key={val} value={val}>{taskLabels[index]}</option>))}
                        </select>
                    </label>
                }
                {availableSubcats.length>0 &&
                    <SimpleSelect name='subcategories' label='Subcategories' 
                        optionValues={availableSubcats} 
                        multiple={true}
                        callback={(val) => setSubcats(val)} 
                    />
                }
                {task?.indicator?.require_numeric && 
                    <div>
                        <label htmlFor='number'>Enter a number.</label>
                        <input type='number' min="0" id='number' name='number' onChange={(e)=>setNumber(e.target.value)} />
                    </div>
                }
                <button type="button" onClick={onRemove}>Remove This Task</button>
        </div>
    )
}

export default function CreateInteraction({ id, tasks, interactions, onFinish }){
    const [interactionDate, setInteractionDate] = useState('');
    const [rows, setRows] = useState([{ key: Date.now().toString(), id: '' }]);
    const { setInteractions } = useInteractions();
    const { user } = useAuth();
    const childRefs = useRef([]);
    //tasks: [{task: id, number: null, subcat: []}]
    //submit --> for task in tasks --> interactions.push{date:date, task:task.id, number: task.number||null, subcate:task.subcat||null}
    
    const [errors, setErrors] = useState([])
    
    const handleSubmit = async(e) => {
        e.preventDefault();
        const submissionErrors = []

        const allTaskData = rows.map(row => {
            const fn = childRefs.current[row.key];
            return fn ? fn() : null;
        });

        
        if(interactionDate=='' || isNaN(Date.parse(interactionDate)) || new Date(interactionDate) > new Date()){
            submissionErrors.push('Interaction date must be a valid date and may not be in the future.');
        }
        if (allTaskData.some(data => !data || data.error)) {
            submissionErrors.push('One or more tasks are invalid. Please resolve the errors.');
        }
        if(submissionErrors.length > 0){
            setErrors(submissionErrors);
            return;
        }
        try{
            console.log('submitting data...',)
            const url = `/api/record/interactions/batch/`; 
            const response = await fetchWithAuth(url, {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'respondent': id,
                    'interaction_date': interactionDate,
                    'tasks': allTaskData,
                })
            });
            const returnData = await response.json();
            if(response.ok){
                let interactions = []

                allTaskData.forEach((task) => {
                    interactions.push({
                        'interaction_date': interactionDate,
                        'task_detail': task,
                        'subcategories': task.subcategories,
                        'numeric_component': task.numeric_component,
                        'respondent': id,
                        'created_by': user.id
                    })
                })
                setInteractions(prev => [...prev, interactions]);
                setErrors([]);
                onFinish()
            }
            else{
                console.log(returnData);
            }
        }
        catch(err){
            console.error('Could not record respondent: ', err)
        }
    }
    const removeRow = (id) => {
        setRows(prev => prev.filter(row => row !== id));
    };

    return(
        <div>
            <form onSubmit={handleSubmit}>
                {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                <label htmlFor='interaction_date'>Date</label>
                <input type='date' name='interaction_date' id='interaction_date' value={interactionDate} onChange={(e)=>setInteractionDate(e.target.value)}/>
                {rows.map((row, index) => (
                    <InteractionTask 
                        key={row.key} 
                        tasks={tasks} 
                        interactions={interactions}
                        id={row.id}
                        index={index}
                        rows = {rows}
                        onTaskChange={(taskID)=>
                            setRows(prev => {
                                const newRows = [...prev];
                                newRows[index] = { ...newRows[index], id: taskID };
                                return newRows;
                            })
                        }
                        onParentSubmit={fn => childRefs.current[row.key] = fn}
                        onRemove = {() => removeRow(row)}
                    />
                ))}
                <button type='button' onClick={()=>setRows(prev => [...prev, {key: Date.now().toString(), id: ''}])}>Add a task.</button>
                <button type='submit'>Save Interaction</button>
            </form>
        </div>
    )
}