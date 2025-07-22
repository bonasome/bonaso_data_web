import React, { useState, useEffect, useRef } from "react";
import fetchWithAuth from '../../../services/fetchWithAuth';
import IndexViewWrapper from "../reuseables/IndexView";
import { useAuth } from '../../contexts/UserAuth'
import styles from './tasks.module.css';
import errorStyles from '../../styles/errors.module.css';
import ConfirmDelete from "../reuseables/ConfirmDelete";
import ComponentLoading from '../reuseables/ComponentLoading';
import ButtonLoading from "../reuseables/ButtonLoading";

function TaskCard({ task, isDraggable = false, addCallback=null, canDelete=false, onDelete=null, addCallbackText, onError }) {
    const [errors, setErrors] = useState([]);
    const [del, setDel] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const { user } = useAuth();

    const handleDragStart = (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(task));
    };

    useEffect(() => {
        if(errors.length > 0){
            onError(errors);
        } 
    }, [errors]);

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
        <div className={styles.card} onClick={() => setExpanded(!expanded)} draggable={isDraggable} onDragStart={isDraggable ? handleDragStart : undefined}>
            <h3>{task.indicator.code}: {task.indicator.name}</h3>
            {addCallback && <button onClick={() => addCallback(task)}>{addCallbackText}</button>}
            {expanded && (
                <div>
                    <p><i>{task.organization.name}</i></p>
                    <p><i>{task.project.name}</i></p>
                    <p>{task.indicator.description}</p>
                    {task.indicator.prerequisites.length > 0 && <div>
                        <p>Prerequisites: </p>
                        <ul>
                            {task.indicator.prerequisites.map((p) => (<li>{p.code}: {p.name}</li>))}
                        </ul>
                    </div>}
                    {task.indicator.subcategories && task.indicator.subcategories.length > 0 && (
                        <div>
                            <p>Subcategories:</p>
                            <ul>
                                {task.indicator.subcategories.map((cat, index) => (
                                    <li key={index}>{cat.name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {task.indicator.require_numeric && <p>Requires Number</p>}
                    {canDelete && <button onClick={() => setDel(true)}>Remove Task</button>}
                </div>
            )}
        </div>
    );
}

export default function Tasks({ callback, update=null, organizationID=null, projectID=null, isDraggable=false, blacklist=[], canDelete=false, updateTrigger=null, addCallback=null, addCallbackText='Add Task', type=null, event=null, onError=[], onSuccess=null }) {
    const [loading, setLoading] = useState(true);
    const [ tasks, setTasks ] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const [success, setSuccess] = useState('')
    const [errors, setErrors] = useState([]);

    useEffect(() => {
        if(onError.length > 0) setErrors(onError);
    }, [onError])

    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    useEffect(() => {
        const getTasks = async () => {
            try {
                console.log('fetching tasks...');
                const includeOrg = organizationID ? `&organization=${organizationID}` : ''
                const includeProject = projectID ? `&project=${projectID}` : ''
                const includeType = type ? `&indicator_type=${type}` : ''
                const includeEvent = event ? `&event=${event}` : '';
                const url = `/api/manage/tasks/?search=${search}&page=${page}` + includeOrg + includeProject + includeType + includeEvent
                console.log(url)
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setTasks(data.results);
                setEntries(data.count); 
                if(callback){
                    callback(data.results)
                }
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

    }, [search, page, update, organizationID, projectID, updateTrigger]);

    const updateTasks = (id) => {
        const updated = tasks.filter(t => t.id !=id)
        setTasks(updated);
        updateTrigger();
        setSuccess('Task removed.');
    }
    const filteredTasks = tasks.filter(t => !blacklist.includes(t.id))
    if(loading) return <ComponentLoading />
    return (
        <div className={styles.tasks}>
            {onSuccess && <div className={errorStyles.success}>{onSuccess}</div>}
            {success !== '' && <div className={errorStyles.success}>{success}</div>}
            {errors.length != 0 && <div ref={alertRef} className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <p><i>Search your tasks by name, organization, or project.</i></p>
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries}>
            {tasks.length > 0 ? filteredTasks.map((task) => (
                <TaskCard task={task} key={task.id} tasks={tasks} isDraggable={isDraggable} canDelete={canDelete} onDelete={(id) => updateTasks(id)} addCallback={addCallback} addCallbackText={addCallbackText} onError={(e) => (setErrors(e))} />
            )) : <p>No tasks yet.</p>}
            </IndexViewWrapper>
        </div>
    );
}