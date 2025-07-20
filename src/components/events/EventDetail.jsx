import { Link, useNavigate, useParams } from "react-router-dom"
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
import ConfirmDelete from "../reuseables/ConfirmDelete";
import ButtonLoading from '../reuseables/ButtonLoading';
import { useAuth } from "../../contexts/UserAuth";
import { IoMdReturnLeft } from "react-icons/io";
import cleanLabels from "../../../services/cleanLabels";
import { favorite, checkFavorited } from "../../../services/favorite";

export default function EventDetail(){
    const { user } = useAuth();
    const { id } = useParams()
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const { eventDetails, setEventDetails } = useEvents();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [taskErrors, setTaskErrors] = useState([]);
    const [addingTask, setAddingTask] = useState(false);
    const [addingOrg, setAddingOrg] = useState(false);
    const [eventOrgs, setEventOrgs] = useState([]);
    const [eventTasks, setEventTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [breakdowns, setBreakdowns] = useState(null);
    const [eventCounts, setEventCounts] = useState([]);
    const [newCount, setNewCount] = useState(false);
    const [newTask, setNewTask] = useState(null);
    const [del, setDel] = useState(false);
    const [countsSearch, setCountsSearch] = useState('');
    const [_, forceUpdate] = useState(0);
    const [favorited, setFavorited] = useState(false)

    useEffect(() => {
        const checkFavStatus = async() => {
            if(!event?.id) return;
            const isFavorited = await checkFavorited('event', event.id)
            setFavorited(isFavorited)
        }
        checkFavStatus()
    }, [event])


    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

     useEffect(() => {
        const getEventDetails = async () => {
            const found = eventDetails.find(e => e.id.toString() === id.toString());
            if (found) {
                setEvent(found);
                setEventTasks(found.tasks || []);
                setEventOrgs(found.organizations || []);
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
        const getEventBreakdowns = async () => {
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
        getEventBreakdowns();
    }, [id]);

    useEffect(() => {
        const getEventCounts = async () => {
            console.log(breakdowns)
            if(!breakdowns) return;
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
        };
        getEventCounts();
    }, [breakdowns])

    const prepareCounts = (data) => {
        const map = {}
        data.forEach(d => {
            map[d.task.id] = map[d.task.id] || {}
            map[d.task.id][d.id] = d;
        })
        return map
    }

    const deleteEvent = async() => {
        setErrors([])
        try {
            console.log('deleting event...');
            const response = await fetchWithAuth(`/api/activities/events/${id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                navigate('/events');
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
                        serverResponse.push(`${msg}`);
                    });
                    } else {
                    serverResponse.push(`${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            console.error('Failed to delete event:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setDel(false);
        }
    }

    const addOrganization = async (org) => {
        console.log('adding organization...')
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
                    setEventOrgs(prev => [...prev, org])
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
        console.log('adding task...')
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
                    setTaskErrors([]);
                }
                else{
                    const data = await response.json();
                    let serverResponse = [];
                    for (const field in data) {
                        if (Array.isArray(data[field])) {
                            data[field].forEach(msg => {
                                serverResponse.push(`${msg}`);
                            });
                        } 
                        else {
                        serverResponse.push(`${data[field]}`);
                        }
                    }
                    setTaskErrors(serverResponse);
                }
            }
            catch(err){
                console.error('Failed to add task:', err);
                setTaskErrors(['Something went wrong. Please try again later.'])
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
                setEventTasks([...eventTasks])
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

    
    useEffect(() => {
        const countKeys = Object.keys(eventCounts);
        setFilteredTasks(eventTasks.filter((t) => !countKeys.includes(t.id.toString())))
    }, [eventCounts, eventTasks])

    console.log(eventCounts)
    if(loading) return <Loading />
    return(
        <div>
            {del && <ConfirmDelete name={event?.name} statusWarning={'You will not be allowed to delete this event if it has counts associated with it.'} onConfirm={() => deleteEvent()} onCancel={() => setDel(false)} /> }
            <div className={styles.segment}>
                <Link to={'/events'} className={styles.return}>
                    <IoMdReturnLeft className={styles.returnIcon} />
                    <p>Return to events overview</p>   
                </Link>
                <h1>{event?.name}</h1>
                <h2>Details</h2>
                <h3>{prettyDates(event?.event_date)}, {event?.location} ({cleanLabels(event?.status)})</h3>
                <h3>Host: {event?.host ? event.host.name : 'No host'}</h3>
                <h3>Description</h3>
                <p>{event?.description}</p>
                <Link to={`/events/${id}/edit`}><button>Edit Details</button></Link>
                <button onClick={() => {favorite('event', event.id, favorited); setFavorited(!favorited)}}>{favorited ? 'Unfavorite Event' : 'Favorite Event'}</button>
                {user.role == 'admin' && !del && <button className={errorStyles.deleteButton} onClick= {() => setDel(true)}>Delete Event</button>}
                {del && <ButtonLoading forDelete={true} />}
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
                     {addingOrg && <div>
                        <OrganizationsIndex callback={(org) => addOrganization(org)} excludeEvent={id} excludeEventTrigger={eventOrgs} />
                    </div>}
                </div>
                <div>
                    <h2>Tasks</h2>
                    <button onClick={() => {setAddingTask(!addingTask); setAddingOrg(false)}}>{addingTask ? 'Done' : 'Add a Task'}</button>
                    {addingTask && <div>
                        <Tasks addCallback={(t) => addTask(t)} event={id} eventTrigger={eventTasks} onError={taskErrors}/>
                    </div>}
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
            {event?.event_date && new Date(event.event_date) <= new Date() && <div className={styles.segment}>
                <h2>Select a task to start adding counts.</h2>
                {filteredTasks.length > 0 ? <SimpleSelect name={'task'} label={'Select a Task'} 
                    optionValues={filteredTasks.map((t) => (t.id))} 
                    optionLabels={filteredTasks.map((t) => (t.indicator.name + ' ' + t.organization.name))} 
                    callback={(val) => {setNewTask(val); if(val != '') setNewCount(true)}} 
                    value = {newTask}
                /> : <p>No tasks left! Either edit your existing counts or add a new task.</p>}
            </div>}
            {event?.event_date && new Date(event.event_date) > new Date() && 
                <div className={styles.segment}><p>Looking to add counts? You cannot add counts for events in the future.</p></div>}
            {newCount && newTask !== '' && <Counts onSave={() => handleChange()} onCancel={() => handleCancel()} breakdownOptions={breakdowns} event={event} task={eventTasks.find(t => t.id == newTask)} />}
           
            
            {eventCounts && breakdowns &&
                <div className={styles.segment}> 
                    <input type='text' value={countsSearch} onChange={(e) => setCountsSearch(e.target.value)} />
                    {Object.keys(eventCounts)?.length > 0 && Object.keys(eventCounts).map((c) => {
                        const taskId = parseInt(c);
                        const task = eventTasks.find(t => t.id === taskId);
                        console.log(countsSearch, task)
                        if (!task) return null;
                        if(countsSearch =='' || task.organization.name.toLowerCase().includes(countsSearch.toLowerCase()) || task.indicator.name.toLowerCase().includes(countsSearch.toLowerCase())){
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
                        }
                        return null;
                    })}
                </div>
            }
            <div className={styles.spacer}>
                <p></p>
            </div>
        </div>
        
    )
}