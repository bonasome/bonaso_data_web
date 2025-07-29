import React from 'react';
import styles from '../../styles/indexView.module.css'
import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth'
import IndexViewWrapper from '../reuseables/IndexView';
import Loading from '../reuseables/loading/Loading';
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import { useEvents } from '../../contexts/EventsContext';
import { Link } from 'react-router-dom';
import EventFilters from './EventFilters';
import prettyDates from '../../../services/prettyDates';
function EventCard({ event }) {
    const [loading, setLoading] = useState(false);
    const { eventDetails, setEventDetails } = useEvents();
    const [active, setActive] = useState(null);
    const [expanded, setExpanded] = useState(false);
    
    const handleClick = async () => {
        const willExpand = !expanded;
        setExpanded(willExpand);

        if (!willExpand) return;

        const found = eventDetails.find(e => e.id === event.id);
        if (found) {
            setActive(found);
            return;
        }

        try {
            setLoading(true);
            const response = await fetchWithAuth(`/api/activities/events/${event.id}/`);
            const data = await response.json();
            setEventDetails(prev => [...prev, data]);
            setActive(data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch event: ', err);
            setLoading(false);
        }
    };

    return (
        <div
            className={expanded ? styles.expandedCard : styles.card}
            onClick={handleClick}
        >
            <Link to={`/events/${event.id}`} style={{display:'flex', width:"fit-content"}}><h2>{event.name}</h2></Link>
            {expanded && loading && <ComponentLoading />}
            {expanded && active && (
                <>
                    <h3>{active.event_type} {active.host && `hosted by ${active.host.name}`}</h3>
                    <p>{active.description}</p>
                    <p>{active.event_date && (new Date(active.event_date) > new Date() ? 'Occurs on' : 'Occured on')} {prettyDates(active.event_date)} at {active.location}</p>
                    <Link to={`/events/${event.id}`}>
                        <button onClick={(e) => e.stopPropagation()}>View Details</button>
                    </Link>
                    <Link to={`/events/${event.id}/edit`}>
                        <button onClick={(e) => e.stopPropagation()}>Edit Details</button>
                    </Link>
                </>
            )}
        </div>
    );
}

export default function EventsIndex(){
    const { user } = useAuth()
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const { events, setEvents } = useEvents();
    const [loading, setLoading] = useState(true);
    const [orgFilter, setOrgFilter] = useState('');
    const [indFilter, setIndFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [startFilter, setStartFilter] = useState('');
    const [endFilter, setEndFilter] = useState('')

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const filterQuery = 
                    (startFilter ? `&start=${startFilter}` : '') + 
                    (endFilter ? `&end=${endFilter}` : '') + 
                    (orgFilter ? `&organization=${orgFilter}` : '') +
                    (indFilter ? `&indicator=${indFilter}` : '') + 
                    (typeFilter ? `&event_type=${typeFilter}` : '');
                
                const url = `/api/activities/events/?search=${search}&page=${page}` + filterQuery;
                console.log(url)
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                setEvents(data.results);
                setLoading(false);
            } 
            catch (err) {
                console.error('Failed to fetch projects: ', err)
                setLoading(false)
            }
        };
        loadEvents();
    }, [page, search, orgFilter, indFilter, typeFilter, startFilter, endFilter]);

    const setFilters = (filters) => {
        setOrgFilter(filters.organization);
        setIndFilter(filters.indicator);
        setTypeFilter(filters.type);
        setStartFilter(filters.start);
        setEndFilter(filters.end);
        setPage(1);
    }

    if(loading) return <Loading />
    return(
        <div className={styles.index}>
            <h1>{user.role == 'admin' ? 'All Events' : 'My Events'}</h1> 
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} filter={<EventFilters onFilterChange={setFilters} />} >
                {['meofficer', 'manager', 'admin'].includes(user.role) && 
                <Link to='/events/new'><button>Create a New Event</button></Link>} 
                {events?.length === 0 ? 
                    <p>No events match your criteria.</p> :
                    events?.map(ind => (
                        <EventCard key={ind.id}event={ind} />)
                    )
                }
            </IndexViewWrapper>
        </div>
    )
}