import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../contexts/UserAuth";
import { useEvents } from "../../contexts/EventsContext";

import fetchWithAuth from "../../../services/fetchWithAuth";
import prettyDates from "../../../services/prettyDates";
import cleanLabels from "../../../services/cleanLabels";
import { favorite, checkFavorited } from "../../../services/favorite";

import Loading from "../reuseables/loading/Loading";
import SimpleSelect from "../reuseables/inputs/SimpleSelect";
import Counts from "./Counts";
import ConfirmDelete from "../reuseables/ConfirmDelete";
import ButtonHover from "../reuseables/inputs/ButtonHover";
import Messages from '../reuseables/Messages';
import UpdateRecord from '../reuseables/meta/UpdateRecord';
import ReturnLink from '../reuseables/ReturnLink';

import styles from './eventDetail.module.css'

import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { IoIosStar, IoIosStarOutline, IoIosArrowDropup, IoIosArrowDropdownCircle } from "react-icons/io";

export default function EventDetail(){
    const navigate = useNavigate();

    //event id param
    const { id } = useParams();
    //context
    const { user } = useAuth();
    const { eventDetails, setEventDetails } = useEvents();
    //event details
    const [event, setEvent] = useState(null);
    
    //control page sections
    const [showDetails, setShowDetails] = useState(true);
    const [showOrgs, setShowOrgs] = useState(false);
    const [showTasks, setShowTasks] = useState(false);

    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [favorited, setFavorited] = useState(false);
    const [del, setDel] = useState(false);

    const [breakdowns, setBreakdowns] = useState(null);

    const [eventCounts, setEventCounts] = useState([]);
    const [newCount, setNewCount] = useState(false);
    const [newTask, setNewTask] = useState(null);
    
    const [countsSearch, setCountsSearch] = useState('');

    //check favorite status
    useEffect(() => {
        const checkFavStatus = async() => {
            if(!event?.id) return;
            const isFavorited = await checkFavorited('events.event', event.id)
            setFavorited(isFavorited)
        }
        checkFavStatus()
    }, [event])

    //scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    //get event details
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
                    }
                    else{
                        navigate('/not-found')
                    }
                } 
                catch (err) {
                    setErrors(['Something went wrong. Please try again later.'])
                    console.error('Failed to fetch event: ', err);
                } 
            }
        };
        getEventDetails();
    }, [id]);

    //get a meta list of demograpohic breakdown categories
    useEffect(() => {
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
    }, [])

    //get event counts
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

    //initial load of event counts
    useEffect(() => {
        const initialLoad = async () => {
            await getEventCounts();
        }
        initialLoad();
    }, [breakdowns]);

    //convert tasks to a map for easier conversion to tables
    const prepareCounts = (data) => {
        const map = {}
        data.forEach(d => {
            map[d.task.id] = map[d.task.id] || {}
            map[d.task.id][d.id] = d;
        })
        return map
    }

    //delete an event
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
                    } 
                    else {
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

   
    //handle cancelling a newly created count
    const handleCancel = () => {
        setNewCount(false)
        setNewTask(null)
    }
    const hasPerm = useMemo(() => {
        if(user.role === 'admin') return true;
        if(user.organiation_id === event.host.id && ['meofficer', 'manager'].includes(user.role)) return true;
        return false; 
    }, [event, user]);

    //create a list of tasks that do not have counts that are available for creation
    const filteredTasks = useMemo(() => {
        const countKeys = Object.keys(eventCounts);
        return event?.tasks?.filter((t) => !countKeys.includes(t.id.toString())) ?? [];
    }, [event])
    console.log(eventCounts)
    if(loading || !event || !breakdowns) return <Loading />
    return(
        <div>
            {del && <ConfirmDelete name={event?.name} statusWarning={'You will not be allowed to delete this event if it has counts associated with it.'} onConfirm={() => deleteEvent()} onCancel={() => setDel(false)} /> }
            <div className={styles.segment}>
                <ReturnLink url={'/events'} display='Return to events overview' />
                <h1>{event?.name}</h1>
                <Messages errors={errors} />
                <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowDetails(!showDetails)}>
                        <h3 style={{ textAlign: 'start'}}>Details</h3>
                        {showDetails ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                    {showDetails && <div>
                        <h3>Host: {event?.host ? event.host.name : 'No host'}</h3>
                        <i>{prettyDates(event.start)} to {prettyDates(event.end)}, {event.location} ({cleanLabels(event?.status)})</i>
                        <h3>Description</h3>
                        {event.description ? <p>{event.description}</p> : <p>No description.</p>}
                        <div style={{ display: 'flex', flexDirection: 'row'}}>
                            {favorited ? <ButtonHover callback={() => {favorite('events.event', event.id, true); setFavorited(false)}} noHover={<IoIosStar />} hover={'Unfavorite'} />:
                                <ButtonHover callback={() => {favorite('events.event', event.id); setFavorited(true)}} noHover={<IoIosStarOutline />} hover={'Favorite'} />}
                            {hasPerm && <Link to={`/events/${event.id}/edit`}><ButtonHover noHover={<ImPencil />} hover={'Edit Details'} /> </Link>}
                            {hasPerm && <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Event'} forDelete={true}/>}
                        </div>
                        <UpdateRecord created_by={event.created_by} created_at={event.created_at}
                            updated_by={event.updated_by} updated_at={event.updated_at} />
                    </div>}
                </div>
                
                <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowOrgs(!showOrgs)}>
                        <h3 style={{ textAlign: 'start'}}>Particpating Organizatons</h3>
                        {showOrgs ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                    {showOrgs && <div>
                        {event.organizations.length > 0 ? 
                            event.organizations.map((org) =>  (
                                <div className={styles.card}>
                                    <Link to={`/organizations/${org.id}`}> <h3>{org.name}</h3></Link>
                                </div>
                            )) : <p>No other participating organizations.</p>
                        }
                    </div>}
                </div>

                <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowTasks(!showTasks)}>
                        <h3 style={{ textAlign: 'start'}}>Linked Tasks</h3>
                        {showTasks ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                    {showTasks && <div>
                       {event.tasks.length > 0 ? 
                            event.tasks.map((task) =>  (
                                <div className={styles.card}>
                                    <Link to={`/projects/${task.project.id}/organizations/${task.organization.id}`}> <h3>{task.indicator.name} for {task.organization.name}</h3></Link>
                                </div>
                            )) : <p>No tasks yet.</p>
                        }
                    </div>}
                </div>
            </div>
            <div className={styles.segment}>
                <h2>Counts</h2>

                {event?.start && new Date(event.start) <= new Date() && <div className={styles.segment}>
                    <h2>Select a task to start adding counts.</h2>
                    {filteredTasks.length > 0 ? <SimpleSelect name={'task'} label={'Select a Task'} 
                        optionValues={filteredTasks.map((t) => (t.id))} 
                        optionLabels={filteredTasks.map((t) => (t.indicator.name + ' ' + t.organization.name))} 
                        callback={(val) => {setNewTask(val); if(val != '') setNewCount(true)}} 
                        value = {newTask}
                    /> : <p>No tasks left! Either edit your existing counts or add a new task.</p>}
                </div>}

                {event?.event_date && new Date(event.event_date) > new Date() && <p>Looking to add counts? You cannot add counts for events in the future.</p>}
                
                 {newCount && newTask !== '' && <Counts onSave={() => getEventCounts()} onCancel={() => handleCancel()} 
                    breakdownOptions={breakdowns} event={event} task={event.tasks.find(t => t.id == newTask)} />}

                {eventCounts && Object.keys(eventCounts).length > 0 && <div> 
                    <input type='text' value={countsSearch} onChange={(e) => setCountsSearch(e.target.value)} />
                    {Object.keys(eventCounts)?.length > 0 && Object.keys(eventCounts).map((c) => {
                        const taskId = parseInt(c);
                        const task = event.tasks.find(t => t.id === taskId);
                        if (!task) return null;
                        if(countsSearch =='' || task.organization.name.toLowerCase().includes(countsSearch.toLowerCase()) || task.indicator.name.toLowerCase().includes(countsSearch.toLowerCase())){
                            return (
                                <Counts
                                    key={taskId}
                                    onCancel={handleCancel}
                                    event={event}
                                    breakdownOptions={breakdowns}
                                    task={task}
                                    onSave={getEventCounts}
                                    onDelete={getEventCounts}
                                    existing={eventCounts[taskId]}
                                />
                            );
                        }
                        return null;
                    })}
                </div>}
            </div>
            <div className={styles.spacer}>
                <p></p>
            </div>
        </div>
    )
}