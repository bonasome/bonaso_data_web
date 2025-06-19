import React, { useState, useEffect } from "react";
import fetchWithAuth from '../../../services/fetchWithAuth';
import IndexViewWrapper from "../reuseables/IndexView";
import { useAuth } from '../../contexts/UserAuth'
import { Target, TargetEdit } from './Targets';
import styles from './tasks.module.css';

function TaskCard({ task, tasks, isDraggable = false }) {
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
        console.log(data)
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
    console.log(task)
    return (
        <div className={styles.card} onClick={() => setExpanded(!expanded)} draggable={isDraggable} onDragStart={isDraggable ? handleDragStart : undefined}>
            <h3>{task.indicator.code}: {task.indicator.name}</h3>
            {expanded && (
                <div>
                    <i>{task.organization.name}</i>
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
                    {targets && targets.length > 0 && <h3>Targets:</h3>}
                    {targets && targets.length > 0 && targets.map((t) => (
                        <Target key={t.id} target={t} task={task} tasks={tasks} onUpdate={(data) => onUpdate(data)}/>
                        ))
                    }
                    {targets && addingTarget && user.role == 'admin' && <TargetEdit task={task} tasks={tasks} onUpdate={onUpdate} />}
                    {targets && user.role == 'admin' && <button onClick={(e) => {e.stopPropagation(); setAddingTarget(!addingTarget)}}>{addingTarget ? 'Cancel' : 'Add Target'}</button> }
                </div>
            )}
        </div>
    );
}

export default function Tasks({ callback, update=null, target=false, organization=null, isDraggable=false, blacklist=[] }) {
    const [loading, setLoading] = useState(true);
    const [ tasks, setTasks ] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);

    useEffect(() => {
        const getTasks = async () => {
            try {
                console.log('fetching respondent details...');
                const includeOrg = organization ? `&organization=${organization.id}` : ''
                const includeTargets = target ? `&include_targets=true` : ''
                const url = `/api/manage/tasks/?search=${search}` + includeTargets + includeOrg
                console.log(url)
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
                console.error('Failed to fetch respondent: ', err);
            } 
            finally {
                setLoading(false);
            }
        };
        getTasks();

    }, [search, page, update, organization]);

    const filteredTasks = tasks.filter(t => !blacklist.includes(t.id))
    if (loading) return <p>Loading...</p>;
    return (
        <div className={styles.tasks}>
            <h2>Tasks</h2>
            <IndexViewWrapper onSearchChange={setSearch} onPageChange={setPage} entries={entries}>
            {tasks.length > 0 ? filteredTasks.map((task) => (
                <TaskCard task={task} key={task.id} target={target} tasks={tasks} isDraggable={isDraggable}/>
            )) : <p>No tasks yet.</p>}
            </IndexViewWrapper>
        </div>
    );
}