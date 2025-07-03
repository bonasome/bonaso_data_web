import React, { useState, useEffect } from "react";
import fetchWithAuth from '../../../services/fetchWithAuth';
import IndexViewWrapper from "../reuseables/IndexView";
import { useAuth } from '../../contexts/UserAuth'
import { Target, TargetEdit } from './Targets';
import styles from './tasks.module.css';
import errorStyles from '../../styles/errors.module.css';
import ConfirmDelete from "../reuseables/ConfirmDelete";

function TaskCard({ task, tasks, isDraggable = false, addCallback=null, canDelete=false, onDelete=null }) {
    const [errors, setErrors] = useState([]);
    const [del, setDel] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [targets, setTargets] = useState([]);
    const [addingTarget, setAddingTarget] = useState(false);
    const { user } = useAuth();

    const handleDragStart = (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(task));
    };

    useEffect(() => {
        setTargets(task.targets)
    }, [task])

    const onUpdate = (data) => {
        const index = targets.findIndex(item => item.id === data.id);
        if (index !== -1) {
            const updated = [...targets];
            updated[index] = data;
            setTargets(updated);
        } 
        else {
            setTargets([...targets, data]);
        }
        setAddingTarget(false);
    }
    const checkTargets = (id) => {
        const updated = targets.filter((t) => t.id != id);
        setTargets(updated)

    }

    const removeTask = async() => {
        try {
            console.log('deleting organization...');
            const response = await fetchWithAuth(`/api/manage/tasks/${task.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onDelete(task.id)
                setErrors([]);
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
        setDel(false)

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
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <h3>{task.indicator.code}: {task.indicator.name}</h3>
            {expanded && (
                <div>
                    <p><i>{task.organization.name}</i></p>
                    <p><i>{task.project.name}</i></p>
                    <p>{task.indicator.description}</p>
                    <p>{task.indicator.prerequisite && `Prerequisite Task: ${task.indicator.prerequisite.code +': '+ task.indicator.prerequisite.name }`}</p>

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
                    <p>{task.indicator.require_numeric ? 'Requires Number' : ''}</p>
                    {isDraggable && <button onClick={() => addCallback(task)}>Add to Interaction</button>}
                    {targets && targets.length > 0 && <h3>Targets:</h3>}
                    {targets && targets.length > 0 && targets.map((t) => (
                        <Target key={t.id} target={t} task={task} tasks={tasks} onUpdate={(data) => onUpdate(data)} onDelete={(id) => checkTargets(id)}/>
                        ))
                    }
                    {targets && addingTarget && user.role == 'admin' && <TargetEdit task={task} tasks={tasks} onUpdate={onUpdate} />}
                    {targets && user.role == 'admin' && <button onClick={(e) => {e.stopPropagation(); setAddingTarget(!addingTarget)}}>{addingTarget ? 'Cancel' : 'Add Target'}</button> }
                    {canDelete && (user.role == 'admin' || task?.organization?.parent_organization?.id == user.organization_id) && <button className={errorStyles.deleteButton} onClick={()=> setDel(true)}>Remove Task</button> }
                </div>
            )}
        </div>
    );
}

export default function Tasks({ callback, update=null, target=false, organization=null, project=null, isDraggable=false, blacklist=[], canDelete=false, addCallback=null }) {
    const [loading, setLoading] = useState(true);
    const [ tasks, setTasks ] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const [success, setSuccess] = useState('')
    const [errors, setErrors] = useState([]);
    useEffect(() => {
        const getTasks = async () => {
            try {
                console.log('fetching respondent details...');
                const includeOrg = organization ? `&organization=${organization.id}` : ''
                const includeTargets = target ? `&include_targets=true` : ''
                const includeProject = project ? `&project=${project.id}` : ''
                const url = `/api/manage/tasks/?search=${search}` + includeTargets + includeOrg + includeProject
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setTasks(data.results);
                setEntries(data.count); 
                if (page === 1) {
                    setTasks(data.results);
                } 
                else {
                    setTasks(prev => [...prev, ...data.results]);
                }
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

    }, [search, page, update, organization]);

    const updateTasks = (id) => {
        const updated = tasks.filter(t => t.id !=id)
        setTasks(updated);
        setSuccess('Task removed.')
    }
    const filteredTasks = tasks.filter(t => !blacklist.includes(t.id))
    if (loading) return <p>Loading...</p>;
    return (
        <div className={styles.tasks}>
            {success && <div className={errorStyles.success}>{success}</div>}
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <h2>Tasks</h2>
            <p><i>Search your tasks by name, organization, or project.</i></p>
            <IndexViewWrapper onSearchChange={setSearch} onPageChange={setPage} entries={entries}>
            {tasks.length > 0 ? filteredTasks.map((task) => (
                <TaskCard task={task} key={task.id} target={target} tasks={tasks} isDraggable={isDraggable} canDelete={canDelete} onDelete={(id) => updateTasks(id)} addCallback={addCallback}/>
            )) : <p>No tasks yet.</p>}
            </IndexViewWrapper>
        </div>
    );
}