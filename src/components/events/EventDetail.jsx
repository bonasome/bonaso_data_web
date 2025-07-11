import { Link, useParams } from "react-router-dom"
import { useEvents } from "../../contexts/EventsContext";
import { useState, useEffect, useMemo, useRef } from "react";
import Loading from "../reuseables/Loading";
import fetchWithAuth from "../../../services/fetchWithAuth";
import prettyDates from "../../../services/prettyDates";
import Tasks from "../tasks/Tasks";
import OrganizationsIndex from "../organizations/OrganizationsIndex";
import errorStyles from '../../styles/errors.module.css';
import styles from './eventDetail.module.css'
import SimpleSelect from "../reuseables/SimpleSelect";
import Counts from "./Counts";

export default function EventDetail(){
    const { id } = useParams()
    const [event, setEvent] = useState(null);
    const { eventDetails, setEventDetails } = useEvents();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [addingTask, setAddingTask] = useState(false);
    const [addingOrg, setAddingOrg] = useState(false);
    const [eventOrgs, setEventOrgs] = useState([]);
    const [eventTasks, setEventTasks] = useState([]);
    const [breakdowns, setBreakdowns] = useState(null);
    const [eventCounts, setEventCounts] = useState([]);
    const [newCount, setNewCount] = useState(false);
    const [newTask, setNewTask] = useState(null);
    const [_, forceUpdate] = useState(0);
     useEffect(() => {
        const getEventDetails = async () => {
            const found = eventDetails.find(e => e.id.toString() === id.toString());
            if (found) {
                setEvent(found);
                return;
            }
            else{
                try {
                    console.log('fetching event details...');
                    const response = await fetchWithAuth(`/api/activities/events/${id}/`);
                    const data = await response.json();
                    if(response.ok){
                        setEventDetails(prev => [...prev, data]);
                        setEvent(data);
                        setEventOrgs(data.organizations);
                        setEventTasks(data.tasks);
                    }
                    else{
                        navigate('/not-found')
                    }
                    
                } 
                catch (err) {
                    console.error('Failed to fetch event: ', err);
                } 
            }
        };
        getEventDetails();

        const getEventCounts = async () => {
            const found = eventDetails.find(e => e.id.toString() === id.toString());
            if (found) {
                setEvent(found);
                return;
            }
            else{
                try {
                    console.log('fetching event details...');
                    const response = await fetchWithAuth(`/api/activities/events/${id}/get-counts/`);
                    const data = await response.json();
                    if(response.ok){
                        setEventCounts(prepareCounts(data))
                    }
                    else{
                        navigate('/not-found')
                    }
                    
                } 
                catch (err) {
                    console.error('Failed to fetch event: ', err);
                } 
            }
        };
        getEventCounts();

        const getEventBreakdowns = async () => {
            const found = eventDetails.find(e => e.id.toString() === id.toString());
            if (found) {
                setEvent(found);
                setLoading(false);
                return;
            }
            else{
                try {
                    console.log('fetching event details...');
                    const response = await fetchWithAuth(`/api/activities/events/breakdowns-meta/`);
                    const data = await response.json();
                    if(response.ok){
                        setBreakdowns(data)
                    }
                } 
                catch (err) {
                    console.error('Failed to fetch event: ', err);
                } 
                finally{
                    setLoading(false);
                }
            }
        }
        getEventBreakdowns();
    }, [id]);

    const prepareCounts = (data) => {
        const map = {}
        data.forEach(d => {
            map[d.task] = map[d.task] || {}
            map[d.task][d.id] = d;
        })
        return map
    }

    const addOrganization = async (org) => {
        console.log('adding indicator...')
            try{
                const response = await fetchWithAuth(`/api/activities/events/${id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': "application/json",
                    },
                    body: JSON.stringify({
                        'organization_id': [org.id]
                    })
                });
                if(response.ok){
                    setEventDetails(prevState =>
                        prevState.map(e =>
                        e.id === id
                            ? {
                                ...e,
                                organizations: [...(e.organizations || []), org],
                            }
                            : e
                        )
                    );
                    setErrors([]);
                    setEventOrgs(prev => [...prev, task])
                }
                else{
                    const data = await response.json();
                    let serverResponse = [];
                    for (const field in data) {
                        if (Array.isArray(data[field])) {
                            data[field].forEach(msg => {
                                serverResponse.push(`${field}: ${msg}`);
                            });
                        } 
                        else {
                        serverResponse.push(`${field}: ${data[field]}`);
                        }
                    }
                    setErrors(serverResponse);
                }
            }
            catch(err){
                console.error('Failed to add organization:', err);
                setErrors(['Something went wrong. Please try again later.'])
            }
    }
    const addTask = async (task) => {
        console.log('adding indicator...')
            console.log(task.id)
            try{
                const response = await fetchWithAuth(`/api/activities/events/${id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': "application/json",
                    },
                    body: JSON.stringify({
                        'task_id': [task.id]
                    })
                });
                if(response.ok){
                    setEventDetails(prevState =>
                        prevState.map(e =>
                        e.id === id
                            ? {
                                ...e,
                                tasks: [...(e.tasks || []), task],
                            }
                            : e
                        )
                    );
                    setEventTasks(prev => [...prev, task])
                    setErrors([]);
                }
                else{
                    const data = await response.json();
                    let serverResponse = [];
                    for (const field in data) {
                        if (Array.isArray(data[field])) {
                            data[field].forEach(msg => {
                                serverResponse.push(`${field}: ${msg}`);
                            });
                        } 
                        else {
                        serverResponse.push(`${field}: ${data[field]}`);
                        }
                    }
                    setErrors(serverResponse);
                }
            }
            catch(err){
                console.error('Failed to add task:', err);
                setErrors(['Something went wrong. Please try again later.'])
            }
    }
    const removeOrg = async(orgID) => {
        setErrors([])
        try {
            console.log('removingorganization...');
            const response = await fetchWithAuth(`/api/activities/events/${id}/remove-organization/${orgID}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setEventDetails(prevState =>
                    prevState.map(e =>
                    e.id === event.id
                        ? {
                            ...e,
                            organizations: e.organizations.filter(org => org.id != orgID),
                        }
                        : e
                    )
                );
                setEventOrgs(prev => prev.filter(org => org.id != orgID))
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
    }
    const removeTask = async(taskID) => {
        setErrors([])
        try {
            console.log('removing task...');
            const response = await fetchWithAuth(`/api/activities/events/${id}/remove-task/${taskID}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setEventDetails(prevState =>
                    prevState.map(e =>
                    e.id === event.id
                        ? {
                            ...e,
                            tasks: e.tasks.filter(task => task.id != taskID),
                        }
                        : e
                    )
                );
                setEventTasks(prev => prev.filter(task => task.id != taskID))
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
            console.error('Failed to delete task:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
    }

    const handleChange = () => {
        
        const getEventCounts = async () => {
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            await sleep(1000);
            try {
                console.log('fetching event details...');
                const response = await fetchWithAuth(`/api/activities/events/${id}/get-counts/`);
                const data = await response.json();
                if(response.ok){
                    setNewCount(false);
                    setNewTask(null);
                    console.log()
                    setEventCounts(prepareCounts(data))
                    
                }
                else{
                    navigate('/not-found')
                }
                
            } 
            catch (err) {
                console.error('Failed to fetch event: ', err);
            } 
        };
        getEventCounts();
    }
    const handleCancel = () => {
        setNewCount(false)
        setNewTask(null)
    }
    const taskIDs = useMemo(() => {return eventTasks.map((t) => t.id)}, [eventTasks])
    const orgIDs = useMemo(() => {return eventOrgs.map((o) => o.id)}, [eventOrgs])

    const filterTasks = useMemo(() => {
        const countKeys = Object.keys(eventCounts);
        return eventTasks.filter((t) => !countKeys.includes(t.id.toString()));
    }, [eventCounts])
    console.log(eventCounts)
    if(loading) return <Loading />
    return(
        <div>
            <div className={styles.segment}>
                <h1>{event?.name}</h1>
                <h2>Details</h2>
                <h3>{prettyDates(event?.event_date)}, {event?.location} </h3>
                <h3>Host: {event?.host ? event.host.name : 'No host'}</h3>
                <h3>Description</h3>
                <p>{event?.description}</p>
                <Link to={`/events/${id}/edit`}><button>Edit Details</button></Link>
            </div>
            <div className={styles.segment}>
                {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                <div>
                    <h2>Organizations</h2>
                    <button onClick={() => {setAddingOrg(!addingOrg); setAddingTask(false)}}>{addingOrg ? 'Done' : 'Add an Organization'}</button>
                    {eventOrgs.length > 0 ? 
                        eventOrgs.map((org) =>  (
                            <div className={styles.card}>
                                <Link to={`/organizations/${org.id}`}> <h3>{org.name}</h3></Link>
                                <button className={errorStyles.deleteButton} onClick={() => removeOrg(org.id)}>Remove</button>
                            </div>
                        )) : <p>No organizations yet.</p>
                    }
                </div>
                <div>
                    <h2>Tasks</h2>
                    <button onClick={() => {setAddingTask(!addingTask); setAddingOrg(false)}}>{addingTask ? 'Done' : 'Add an Task'}</button>
                    {eventTasks.length > 0 ? 
                        eventTasks.map((task) =>  (
                            <div className={styles.card}>
                                <Link to={`/projects/${task.project.id}`}> <h3>{task.indicator.name} for {task.organization.name}</h3></Link>
                                <button className={errorStyles.deleteButton} onClick={() => removeTask(task.id)}>Remove</button>
                            </div>
                        )) : <p>No tasks yet.</p>
                    }
                </div>
            </div>
            <div className={styles.segment}>
                <h2>Select a task to start adding counts.</h2>
                {eventTasks.length > 0 && <SimpleSelect name={'task'} label={'Select a Task'} 
                    optionValues={filterTasks.map((t) => (t.id))} 
                    optionLabels={filterTasks.map((t) => (t.indicator.name + ' ' + t.organization.name))} 
                    callback={(val) => {setNewTask(val); if(val != '') setNewCount(true)}} 
                    value = {newTask}
                />}
            </div>

            {newCount && newTask !== '' && <Counts onSave={() => handleChange()} onCancel={() => handleCancel()} breakdownOptions={breakdowns} event={event} task={eventTasks.find(t => t.id == newTask)} />}
            {addingOrg && <OrganizationsIndex callback={(org) => addOrganization(org)} blacklist={orgIDs}/>}
            {addingTask && <Tasks addCallback={(t) => addTask(t)} blacklist={taskIDs}/>}
            {eventCounts && Object.keys(eventCounts)?.length > 0 && Object.keys(eventCounts).map((c) => {
                const taskId = parseInt(c);
                const task = eventTasks.find(t => t.id === taskId);
                return (
                    <Counts
                    key={taskId}
                    onCancel={handleCancel}
                    event={event}
                    breakdownOptions={breakdowns}
                    task={task}
                    onSave={handleChange}
                    onDelete={handleChange}
                    existing={eventCounts[taskId]}
                    />
                );
                })
        }
        </div>
    )
}