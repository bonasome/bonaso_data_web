import React from 'react';
import { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth'
import { useIndicators } from '../../contexts/IndicatorsContext';

import { initial, filterConfig } from './filterConfig';
import fetchWithAuth from '../../../services/fetchWithAuth';

import IndexViewWrapper from '../reuseables/IndexView';
import Loading from '../reuseables/loading/Loading';
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import Filter from '../reuseables/Filter';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import Messages from '../reuseables/Messages';

import styles from '../../styles/indexView.module.css'
import errorStyles from '../../styles/errors.module.css';

import { MdAddToPhotos } from "react-icons/md";
import { ImPencil } from 'react-icons/im';
import { GiJumpAcross } from "react-icons/gi";

function IndicatorCard({ indicator, callback = null, callbackText }) {
    //context
    const { user } = useAuth();
    const { indicatorDetails, setIndicatorDetails } = useIndicators();
    //state that stores the actual full indicator object, not just the highlights passed from the index query
    const [active, setActive] = useState(null);

    //card meta
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [errors, setErrors] = useState([]);

    //on click, expand the card and fetch the details
    const handleClick = async () => {
        const willExpand = !expanded;
        setExpanded(willExpand);

        if (!willExpand) return;
        //try fetching from context
        const found = indicatorDetails.find(ind => ind.id === indicator.id);
        if (found) {
            setActive(found);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await fetchWithAuth(`/api/indicators/${indicator.id}/`);
            const data = await response.json();
            setIndicatorDetails(prev => [...prev, data]);
            setActive(data);
        } 
        catch (err) {
            console.error('Failed to fetch indicators: ', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setLoading(false);
        }
    };

    return (
        <div className={expanded ? styles.expandedCard : styles.card} onClick={handleClick}>
            {(!callback && user.role == 'admin') ? <Link to={`/indicators/${indicator.id}`} style={{display:'flex', width:"fit-content"}}><h2>{indicator.display_name}</h2></Link> : <h2>{indicator.display_name}</h2>}
            {callback && (
                <button type="button" onClick={(e) => { e.stopPropagation(); callback(indicator); }}>
                    {callbackText}
                </button>
            )}
            {expanded && loading && <ComponentLoading />}
            {expanded && active && (
                <div>
                    {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                    {active.description ? <p>{active.description}</p> : <p><i>No description.</i></p>}
                    {active.prerequisites?.length > 0 && <div>
                        <p>Prerequisites: </p>
                        <ul>
                            {active.prerequisites.map((p) => (<li>{p.display_name}</li>))}
                        </ul>
                    </div>}
                    {!callback && user.role =='admin' && <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <Link to={`/indicators/${indicator.id}`}>
                            <ButtonHover noHover={<GiJumpAcross />} hover={'Go to Page'} />
                        </Link>
                        <Link to={`/indicators/${indicator.id}/edit`}>
                            <ButtonHover noHover={<ImPencil />} hover={'Edit Details'} />
                        </Link>
                    </div>}
                </div>
            )}
        </div>
    );
}

export default function IndicatorsIndex({ callback=null, callbackText='Add Indicator', includeParams=[], excludeParams=[], updateTrigger=null, blacklist=[], }){
    /*
    Callback: A function that can pass the details of a specific entry to another component. Useful for model selects.
    Callback Text: Text to display on callback button.
    Update Trigger: Update the query in the event that a param changes (add or remove entries).
    */
    
    //contexts
    const { user } = useAuth();
    const { indicators, setIndicators, indicatorsMeta, setIndicatorsMeta } = useIndicators();

    //page meta
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);

    //information for indexing
    const [filters, setFilters] = useState(initial);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0); //total number of entries for calculating number of pages

    //ref to scroll to errors automatically
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);
    
    //retrieve the meta
    useEffect(() => {
        const getMeta = async() => {
            try {
                console.log('fetching meta...')
                const url = `/api/indicators/meta/`;
                console.log(url)
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setIndicatorsMeta(data);
                setLoading(false);
            } 
            catch (err) {
                setErrors(['Something went wrong. Plese try again later.'])
                console.error('Failed to fetch projects: ', err)
                setLoading(false)
            }
        }
        getMeta();
    }, []);

    const params = useMemo(() => {
        //sepereate from filters, these are passed as params

        const allowedFields = ['project', 'organization'];
        const include = includeParams?.filter(p => allowedFields.includes(p?.field))
        ?.map(p => `&${p?.field}=${p?.value}`)
        .join('') ?? '';

        const exclude = excludeParams?.filter(p => allowedFields.includes(p?.field))
        ?.map(p => `&exclude_${p?.field}=${p?.value}`)
        .join('') ?? '';

        return include + exclude

    }, [includeParams, excludeParams]);

    //load the list of indicators, refresh on search/filter/page changes
    useEffect(() => {
        const loadIndicators = async () => {
            try {
                console.log('fetching indicators...');
                //append any filter query
                const filterQuery = 
                    (filters.status ? `&status=${filters.status}` : '') +
                    (filters.indicator_type ? `&indicator_type=${filters.indicator_type}` : '');

                const url = `/api/indicators/?search=${search}&page=${page}` + filterQuery + params;
                console.log(url)
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                setIndicators(data.results);
            } 
            catch (err) {
                console.error(err);
                setErrors(['Something went wrong. Please try again later.']);
            }
        };
        loadIndicators();
    }, [page, search, filters, updateTrigger, params]);

    const filteredIndicators = indicators?.filter(ind => !blacklist.includes(ind.id));

    if(loading || !indicators) return callback ? <ComponentLoading /> : <Loading /> //on callback don't show full load
    return(
        <div className={styles.index}>
            {!callback && <h1>{user.role == 'admin' ? 'All Indicators' : 'My Indicators'}</h1>} 
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} 
                filter={<Filter onFilterChange={(inputs) => {setFilters(inputs); setPage(1);}} 
                initial={initial} config={filterConfig(indicatorsMeta, user)} 
            />}>
                {['admin'].includes(user.role) && 
                <Link to='/indicators/new'><button><MdAddToPhotos />  Create a New Indicator</button></Link>} 
                <Messages errors={errors} ref={alertRef} />
                {filteredIndicators.length === 0 ? 
                    <p>No indicators match your criteria.</p> :
                    filteredIndicators.map(ind => (
                        <IndicatorCard key={ind.id} indicator={ind} callback={callback ? (indicator)=> callback(indicator) : null} callbackText={callbackText} />)
                    )
                }
            </IndexViewWrapper>
        </div>
    )
}