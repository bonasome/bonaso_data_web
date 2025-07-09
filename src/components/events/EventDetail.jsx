import { Link, useParams } from "react-router-dom"
import { useEvents } from "../../contexts/EventsContext";
import { useState, useEffect, useMemo, useRef } from "react";
import Loading from "../reuseables/Loading";
import fetchWithAuth from "../../../services/fetchWithAuth";
import prettyDates from "../../../services/prettyDates";
import Tasks from "../tasks/Tasks";
import OrganizationsIndex from "../organizations/OrganizationsIndex";
import errorStyles from '../../styles/errors.module.css';
import Checkbox from "../reuseables/Checkbox";
import styles from './eventDetail.module.css'
function Counts({ event, breakdownOptions, task, eventOrgs, eventTasks }) {

    const [breakdowns, setBreakdowns] = useState({
        sex: false,
        age_range: false,
        citizenship: false,
        status: false,
        age_range: false,
        kp_type: false,
        disability_type: false,
        hiv_status: false,
        pregnant: false,
        subcategories: false,
    });
    
    const [breakdownSplits, setBreakdownSplits] = useState({
        sex: {values: breakdownOptions.sex, labels: breakdownOptions.sex_labels, col: 5},
        age_range: {values: breakdownOptions.age_range, labels: breakdownOptions.age_range_labels, col: 0},
        citizenship: {values: breakdownOptions.citizenship, labels: breakdownOptions.citizenship_labels, col: 6},
        status: {values: breakdownOptions.status, labels: breakdownOptions.status_labels, col: 4},
        kp_type: {values: breakdownOptions.kp_type, labels: breakdownOptions.kp_type_labels, col: 1},
        disability_type: {values: breakdownOptions.disability_type, labels: breakdownOptions.disability_type_labels, col: 2},
        hiv_status: {values: [true, false], labels: ['HIV Positive', 'HIV Negative'], col: 7},
        pregnant: {values: [true, false], labels: ['Pregnant', 'Not Pregnant'], col: 8},
        subcategories: {values: [], labels: [], col: 3}
    })
    useEffect(() => {
        if(task?.indicator.subcategories.length > 0){
            setBreakdowns(prev => ({...prev, subcategories: true}))
            setBreakdownSplits(prev => ({...prev, subcategories: {values: task.indicator.subcategories.map((c) => c.id), labels: task.indicator.subcategories.map((c) => c.name)}}))
        }
    }, [task]);

    const [active, setActive] = useState(0);
    useEffect(() => {
        const activeSplits = Object.entries(breakdownSplits)
            .filter(([key]) => breakdowns[key])
            .sort(([, a], [, b]) => a.col - b.col);
        setActive(activeSplits)
    }, [breakdowns])
    console.log(active)
    return(
        <div>
            <h2>Counts for {task?.indicator.name}</h2>
            <div className={styles.choices}>
                {Object.keys(breakdowns).map((b) => {
                    if(b == 'subcategories') return
                    return <Checkbox key={b}
                        label={(b.charAt(0).toUpperCase() + b.slice(1)).replace('_', ' ')} 
                        name={b} checked={breakdowns[b]} 
                        callback={(c) => setBreakdowns(prev => ({...prev, [b]: c}))} 
                    />
                })}
            </div>
            <div>
                {active.length === 0 && 
                    <div>
                        <label htmlFor="count">Count</label>
                        <input id="count" type="number" />
                    </div>
                }
                {active.length === 1 &&
                    active[0][1].labels.map((b) => (
                        <div>
                            <label htmlFor={b}>{b}</label>
                            <input id={b} type="number" />
                        </div>
                    ))
                }
                {
                    active.length > 1 &&
                    <table>
                        <thead>
                            <tr>
                                {active.map((a, index) => {if(index===0) {return} else {return <td>{a[0]}</td>}})}
                                {active[0][1].labels.map((c) => (<td>{c}</td>))}
                            </tr>
                        </thead>

                        <tbody> 
                            {active.map((a, index) => {if(index===0){return}
                            else{
                                a[1].labels.map((o) => (
                                    <tr>
                                        
                                    </tr>
                                ))
                            }
                        })}
                        </tbody>
                    </table>
                }
            </div>
        </div>
    )
}

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
                        console.log(data)
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
                        console.log(data)
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

    const taskIDs = useMemo(() => {return eventTasks.map((t) => t.id)}, [eventTasks])
    const orgIDs = useMemo(() => {return eventOrgs.map((o) => o.id)}, [eventOrgs])

    if(loading) return <Loading />
    return(
        <div>
            <h1>{event?.name}</h1>
            <Link to={`/events/${id}/edit`}><button>Edit Details</button></Link>
            <p>Issa me, Mario</p>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <div>
                <button onClick={() => {setAddingOrg(!addingOrg); setAddingTask(false)}}>{addingOrg ? 'Done' : 'Add an Organization'}</button>
                <button onClick={() => {setAddingTask(!addingTask); setAddingOrg(false)}}>{addingTask ? 'Done' : 'Add an Task'}</button>
            </div>
            <div>
                <h2>Organizations</h2>
                {eventOrgs.length > 0 ? 
                    eventOrgs.map((org) =>  (
                        <div style={{ display: 'flex', flexDirection: 'row'}}>
                            <Link to={`/organizations/${org.id}`}> <h3>{org.name}</h3></Link>
                            <button onClick={() => removeOrg(org.id)}>Remove</button>
                        </div>
                    )) : <p>No organizations yet.</p>
                }
            </div>
            <div>
                {eventTasks.length > 0 ? 
                    eventTasks.map((task) =>  (
                        <div style={{ display: 'flex', flexDirection: 'row'}}>
                            <Link to={`/projects/${task.project.id}`}> <h3>{task.indicator.name}</h3></Link>
                            <button onClick={() => removeTask(task.id)}>Remove</button>
                        </div>
                    )) : <p>No tasks yet.</p>
                }
            </div>
            {addingOrg && <OrganizationsIndex callback={(org) => addOrganization(org)} blacklist={orgIDs}/>}
            {addingTask && <Tasks addCallback={(t) => addTask(t)} blacklist={taskIDs}/>}
            <Counts breakdownOptions={breakdowns} event={event} eventOrgs={eventOrgs} eventTasks={eventTasks} task={eventTasks[0]}/>
        </div>
    )
}