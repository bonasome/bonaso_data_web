import React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth'
import { useEvents } from '../../contexts/EventsContext';

import fetchWithAuth from '../../../services/fetchWithAuth';
import prettyDates from '../../../services/prettyDates';
import cleanLabels from '../../../services/cleanLabels';
import { filterConfig, initial } from './filterConfig';

import IndexViewWrapper from '../reuseables/IndexView';
import Loading from '../reuseables/loading/Loading';
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import Filter from '../reuseables/Filter';
import Messages from '../reuseables/Messages';
import ButtonHover from '../reuseables/inputs/ButtonHover';

import styles from '../../styles/indexView.module.css';

import { MdOutlineEvent } from "react-icons/md";
import { ImPencil } from 'react-icons/im';
import { GiJumpAcross } from 'react-icons/gi';

function EventCard({ event, callback=null, callbackText='Select Event' }) {
    /*
    A helper component that displays details about an event. Is expandable, and on expansion will fetch additional
    details from the server.
    - event (object): the event this card displays information about
    - callback (function, optional): a callback function that allows information about this event to be selected and 
        passed to another component (passed down from the EventIndex Component).
    - callbackText (string, optional): text to display on the button that triggers the callback function (passed 
        down from the EventIndex Component)
    */

    //context
    const { user } = useAuth(); //for managing perms
    const { eventDetails, setEventDetails } = useEvents();
    //added details about the event currently being viewed
    const [active, setActive] = useState(null);
    //card meta
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    
    //load additional details from the server on click, since the index component uses a list serializer
    const handleClick = async () => {
        const willExpand = !expanded;
        setExpanded(willExpand);
        if (!willExpand) return;
        const found = eventDetails.find(e => e.id === event.id);
        if (found) {
            setActive(found);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await fetchWithAuth(`/api/activities/events/${event.id}/`);
            const data = await response.json();
            setEventDetails(prev => [...prev, data]);
            setActive(data);
        } 
        catch (err) {
            console.error('Failed to fetch event: ', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setLoading(false);
        }
    };

    return (
        <div className={expanded ? styles.expandedCard : styles.card} onClick={handleClick}>
            {callback ? <h2>{event.name}</h2> : <Link to={`/events/${event.id}`} style={{display:'flex', width:"fit-content"}}><h2>{event.name}</h2></Link>}
            {callback && <button onClick={() => callback(active)}>{callbackText}</button>}
            {expanded && loading && <ComponentLoading />}
            {expanded && active && (
                <div>
                    <Messages errors={errors} />
                    <h3>{cleanLabels(active.event_type)} {active.host && `hosted by ${active.host.name}`}</h3>
                    <p>{active.description}</p>
                    <p>{active.start == active.end ? prettyDates(active.end) : `From ${prettyDates(active.start)} to ${prettyDates(active.end)}`} at {active.location}</p>
                    {!['client'].includes(user.role) && !callback && <div style={{ display: 'flex', flexDirection: 'row'}}>
                        <Link to={`/events/${event.id}`}>
                            <ButtonHover noHover={<GiJumpAcross />} hover='Go to detail page' />
                        </Link>
                        <Link to={`/events/${event.id}/edit`}>
                            <ButtonHover noHover={<ImPencil />} hover='Edit details' />
                        </Link>
                    </div>}
                </div>
            )}
        </div>
    );
}

export default function EventsIndex({ callback=null, callbackText='Select Event'}){
    /**
    Index view that displays a list of events (paginated and searchable). Can be used either as a standalone page
    or can be used with other components to select an event instance.
    - callback (function, optional): a callback function that allows information about an event to be selected and 
        passed to another component
    - callbackText (string, optional): text to display on the button that triggers the callback function 
    */
    //context
    const { user } = useAuth();
    const { events, setEvents, eventsMeta, setEventsMeta } = useEvents();

    //index helpers
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const [filters, setFilters] = useState(initial);
    const [orgs, setOrgs] = useState([]); //for filters
    const [orgSearch, setOrgSearch] = useState(''); //for searching orgs select

    //page meta
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    
    //get events meta
    useEffect(() => {
        const getEventsMeta = async () => {
            if(Object.keys(eventsMeta).length !== 0){
                setLoading(false)
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/activities/events/meta/`);
                    const data = await response.json();
                    setEventsMeta(data);
                }
                catch(err){
                    setErrors(['Something went wrong, Please try again later.']);
                    console.error('Failed to fetch events meta: ', err);
                }
                finally{
                    setLoading(false);
                }
            }
        }
        getEventsMeta();
    }, []);

    //load events
    useEffect(() => {
        const loadEvents = async () => {
            try {
                //construct filter params from filters object
                const filterQuery = 
                    (filters.start ? `&start=${filters.start}` : '') + 
                    (filters.end ? `&end=${filters.end}` : '') + 
                    (filters.host ? `&host=${filters.host}` : '') +
                    (filters.status ? `&status=${filters.status}` : '') + 
                    (filters.type ? `&event_type=${filters.type}` : '');
                
                const url = `/api/activities/events/?search=${search}&page=${page}` + filterQuery;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count); //set the total number of entries so pages can be calculated
                setEvents(data.results);
                setLoading(false);
            } 
            catch (err) {
                setErrors(['Something went wrong, Please try again later.']);
                console.error('Failed to fetch events: ', err);
                setLoading(false)
            }
        };
        loadEvents();
    }, [page, search, filters]);

    //get orgs (for host filter)
    useEffect(() => {
        const loadOrgs = async () => {
            try {
                const url = `/api/organizations/?search=${search}`;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setOrgs(data.results);
            } 
            catch (err) {
                console.error('Failed to fetch organizations: ', err)
                setErrors(['Something went wrong, Please try again later.']);
            }
            finally {
                setLoading(false);
            }
        };
        loadOrgs();
    }, [orgSearch]);

    if(loading) return <Loading />
    return(
        <div className={styles.index}>
            <h1>{user.role == 'admin' ? 'All Events' : 'My Events'}</h1> 
            <Messages errors={errors} />
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} filter={<Filter 
                onFilterChange={setFilters} config={filterConfig(eventsMeta, orgs, (s) => setOrgSearch(s))} initial={initial}  
            />}>
                {!['client'].includes(user.role) && <Link to='/events/new'><button> <MdOutlineEvent /> Create a New Event</button></Link>}
                {events?.length === 0 ? 
                    <p>No events match your criteria.</p> :
                    events?.map(ind => (
                        <EventCard key={ind.id} event={ind} callback={callback} callbackText={callbackText} />)
                    )
                }
            </IndexViewWrapper>
        </div>
    )
}