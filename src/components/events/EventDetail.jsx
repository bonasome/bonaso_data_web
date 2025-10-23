import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../contexts/UserAuth";
import { useEvents } from "../../contexts/EventsContext";

import fetchWithAuth from "../../../services/fetchWithAuth";
import prettyDates from "../../../services/prettyDates";
import cleanLabels from "../../../services/cleanLabels";
import { favorite, checkFavorited } from "../../../services/favorite";

import Loading from "../reuseables/loading/Loading";
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
    /*
    Component that displays detail about an event. Takes an id as a URL param to fetch the correct event. 
    */

    const navigate = useNavigate();

    //event id param
    const { id } = useParams();
    //context
    const { user } = useAuth();
    const { eventDetails, setEventDetails } = useEvents();
    
    const [event, setEvent] = useState(null); //event details

    //control page sections expansion
    const [showDetails, setShowDetails] = useState(true);
    const [showOrgs, setShowOrgs] = useState(false);
    const [showTasks, setShowTasks] = useState(false);

    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [favorited, setFavorited] = useState(false);
    const [del, setDel] = useState(false);


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
                setLoading(false)
                return;
            }
            else{
                try {
                    console.log('fetching event details...');
                    const response = await fetchWithAuth(`/api/activities/events/${id}/`);
                    const data = await response.json();
                    if(response.ok){
                        //update the context
                        setEventDetails(prev => [...prev, data]);
                        setEvent(data);
                    }
                    else{
                        //if a bad ID is provided, navigate to 404
                        navigate('/not-found')
                    }
                } 
                catch (err) {
                    setErrors(['Something went wrong. Please try again later.'])
                    console.error('Failed to fetch event: ', err);
                } 
                finally{
                    setLoading(false);
                }
            }
        };
        getEventDetails();
    }, [id]);

    //delete this event
    const deleteEvent = async() => {
        setErrors([])
        try {
            console.log('deleting event...');
            const response = await fetchWithAuth(`/api/activities/events/${id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                navigate('/events'); //on success, redirect to the index page
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
                setErrors(serverResponse); //display potential conflict messages
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

    //check if a user has permissions to edit event details
    const hasPerm = useMemo(() => {
        if(!event) return false
        if(user.role === 'admin') return true;
        if(user.organization_id === event.host.id && ['meofficer', 'manager'].includes(user.role)) return true;
        return false; 
    }, [event, user]);

    const projectsSet = event?.project?.id ? new Set([{name: event.project.name, id: event.project.id}]) : [
        ...new Map(event?.tasks?.map(t => [t.project.id, t.project])).values()
    ];
    const projects = [...projectsSet];
    if(loading || !event ) return <Loading />
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
                    {showDetails && <div className={styles.detail}>
                        <h3>Host: {event?.host ? event.host.name : 'No host'}</h3>
                        <h3>Category: {cleanLabels(event.event_type)}</h3>
                        <i>{prettyDates(event.start)} to {prettyDates(event.end)}, {event.location} ({cleanLabels(event?.status)})</i>
                        <h3>Description</h3>
                        {event.description ? <p>{event.description}</p> : <p>No description.</p>}
                        {projects.length == 1 && <h3>In project: <Link to={`/projects/${projects[0].id}`}>{projects[0].name}</Link></h3>}
                        {projects.length > 1 && <div>
                            <h3>In Projects:</h3>
                            <ul>{projects.map((p) => (
                               <li><Link to={`/projects/${p.id}`}>{p.name}</Link></li>
                            ))}</ul>
                        </div>}
                        <div style={{ display: 'flex', flexDirection: 'row'}}>
                            {favorited ? <ButtonHover callback={() => {favorite('events.event', event.id, true); setFavorited(false)}} noHover={<IoIosStar />} hover={'Unfavorite'} />:
                                <ButtonHover callback={() => {favorite('events.event', event.id); setFavorited(true)}} noHover={<IoIosStarOutline />} hover={'Favorite'} />}
                            {hasPerm && <Link to={`/events/${event.id}/edit`}><ButtonHover noHover={<ImPencil />} hover={'Edit Details'} /> </Link>}
                            {user.role == 'admin' && <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Event'} forDelete={true}/>}
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
                                    <Link to={`/projects/${task.project.id}/organizations/${task.organization.id}`}> <h3>{task.display_name}</h3></Link>
                                </div>
                            )) : <p>No tasks yet.</p>
                        }
                    </div>}
                </div>
            </div>
            
            <div className={styles.spacer}>
                <p></p>
            </div>
        </div>
    )
}