import React, { useState, useEffect, useRef, useMemo } from "react";

import { useIndicators } from "../../contexts/IndicatorsContext";

import fetchWithAuth from '../../../services/fetchWithAuth';

import IndexViewWrapper from "../reuseables/IndexView";
import ConfirmDelete from "../reuseables/ConfirmDelete";
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import ButtonHover from "../reuseables/inputs/ButtonHover";

import styles from './tasks.module.css';
import errorStyles from '../../styles/errors.module.css';

import { FaTrashAlt } from "react-icons/fa";

//card that holds task details
function TaskCard({ task, isDraggable = false, canDelete=false, onDelete=null, callback=null, callbackText, onError, meta }) {
    //comp meta
    const [errors, setErrors] = useState([]);
    const [del, setDel] = useState(false);
    const [expanded, setExpanded] = useState(false);

    //(for interactions) if this card should be draggable, mark it as such
    const handleDragStart = (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(task));
    };

    //pass errors up to parent if they arrise
    useEffect(() => {
        if(errors.length > 0){
            onError(errors);
        } 
    }, [errors]);

    //delete this task
    const removeTask = async() => {
        setErrors([]);
        try {
            console.log('deleting task...');
            const response = await fetchWithAuth(`/api/manage/tasks/${task.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onDelete(task.id)
            } 
            else {
                let data = {};
                try {
                    data = await response.json();
                } 
                catch {
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
            console.error('Failed to delete organization:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setDel(false)
        }

    }
    //helper function that converts db values to labels
    const getLabelFromValue = (field, value) => {
        if(!meta) return value
        const match = meta[field]?.find(range => range.value === value);
        return match ? match.label : value;
    };
    //return delete seperately, since the card hover messes with the modal
    if(del){
        return(
            <div>
                {del && <div className={styles.backdrop}></div>}
                {del && 
                    <ConfirmDelete 
                        name={'Task ' + task.indicator.name + ' for' + task.organization.name } 
                        statusWarning={'If this task has any interactions associated with it, you will not be able to delete it.'} 
                        onConfirm={() => removeTask()} onCancel={() => setDel(false)} 
                />}
            </div>
        )

    }

    return (
        <div className={styles.card} onClick={() => setExpanded(!expanded)} 
            draggable={isDraggable} onDragStart={isDraggable ? handleDragStart : undefined}
        >
            <h3>{task.display_name}</h3>

            {callback && <button onClick={(e) => {callback(task); e.stopPropagation()}} type="button">
                {callbackText}
            </button>}
            
            {expanded && (
                <div>
                    <p><strong>Indicator Description:</strong> {task.indicator.description ? task.indicator.description : 'No description.'}</p>

                    <p>{task.indicator.description}</p>
                    <p><i>Data Type: {getLabelFromValue('indicator_types', task.indicator.indicator_type)}</i></p>
                    {task.indicator.prerequisites.length > 0 && <div>
                        <p>Prerequisites: </p>
                        <ul>
                            {task.indicator.prerequisites.map((p) => (<li>{p.display_name}</li>))}
                        </ul>
                    </div>}
                    
                    {task.indicator.subcategories && task.indicator.subcategories.length > 0 && <div>
                        <p>Subcategories:</p>
                        <ul>
                            {task.indicator.subcategories.map((cat, index) => (
                                <li key={index}>{cat.name}</li>
                            ))}
                        </ul>
                    </div>}

                    {task.indicator.require_numeric && <p><i>Requires a Number</i></p>}

                    {canDelete && <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Remove Task'} forDelete={true} />}
                </div>
            )}
        </div>
    );
}

//task index view
export default function Tasks({ includeParams=[], excludeParams=[], isDraggable=false, blacklist=[], 
    canDelete=false, updateTrigger=null, callback=null, callbackText='Add Task', onError=[], onSuccess=null 
}) {
    const { indicatorsMeta, setIndicatorsMeta } = useIndicators();

    //the tasks themselves (usually not pulled in very large numbers)
    const [ tasks, setTasks ] = useState([]);
    //index helpers
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);

    //page meta
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('')
    const [errors, setErrors] = useState([]);
    
    //in the event that this is used in another component, allow the parent to pass errors to this directly
    useEffect(() => {
        if(onError.length > 0) setErrors(onError);
    }, [onError])

    //scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    const params = useMemo(() => {
        const allowedFields = ['organization', 'project', 'event', 'indicator_type'];
        //these are not filters, they are passed as params for use during callbacks
        const include = includeParams?.filter(p => allowedFields.includes(p?.field))
        ?.map(p => `&${p?.field}=${p?.value}`)
        .join('') ?? '';

        const exclude = excludeParams?.filter(p => allowedFields.includes(p?.field))
        ?.map(p => `&exclude_${p?.field}=${p?.value}`)
        .join('') ?? '';

        return include + exclude;
    }, [includeParams, excludeParams]);

    //get a list of the tasks
    useEffect(() => {
        const getTasks = async () => {
            try {
                console.log('fetching tasks...');
                //run the filters
                const url = `/api/manage/tasks/?search=${search}&page=${page}` + params;
                const response = await fetchWithAuth(url);
                const data = await response.json();

                setTasks(data.results);
                setEntries(data.count); 
            } 
            catch (err) {
                console.error('Failed to delete organization:', err);
                setErrors(['Something went wrong. Please try again later.'])
            } 
            finally {
                setLoading(false);
            }
        };
        getTasks();
    }, [search, page, params, updateTrigger]); //run on param changes or on parent request

    useEffect(() => {
        const getMeta = async () => {
            try {
                console.log('fetching meta...');
                //run the filters
                const url = `/api/indicators/meta/`;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setIndicatorsMeta(data)
            } 
            catch (err) {
                console.error('Failed to get meta:', err);
                setErrors(['Something went wrong. Please try again later.'])
            } 
            finally {
                setLoading(false);
            }
        };
        getMeta();
    }, []);

    //update the tasks when one is deleted, triggering a parent update if necessary
    const updateTasks = (id) => {
        const updated = tasks.filter(t => t.id !=id)
        setTasks(updated);
        updateTrigger();
        setSuccess('Task removed.');
    }

    //filter out blacklisted tasks (used for hiding tasks already added to interactions)
    const filteredTasks = tasks?.filter(t => !blacklist.includes(t.id)) ?? []

    if(loading) return <ComponentLoading />
    return (
        <div className={styles.tasks}>
            {onSuccess && <div className={errorStyles.success}>{onSuccess}</div>}
            {success !== '' && <div className={errorStyles.success}>{success}</div>}
            {errors.length != 0 && <div ref={alertRef} className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            
            <p><i>Search your tasks by name, organization, or project.</i></p>
            
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries}>
                {filteredTasks?.length > 0 ? filteredTasks.map((task) => (
                    <TaskCard task={task} key={task.id} tasks={tasks} 
                        isDraggable={isDraggable} canDelete={canDelete} onDelete={(id) => updateTasks(id)} 
                        callback={callback} callbackText={callbackText} onError={(e) => (setErrors(e))} meta={indicatorsMeta}
                    />
                )) : <p>No tasks yet.</p>}
            </IndexViewWrapper>
        </div>
    );
}