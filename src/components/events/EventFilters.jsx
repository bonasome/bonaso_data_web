import React from 'react';
import styles from '../../styles/filters.module.css';
import errorStyles from '../../styles/errors.module.css'
import { useEffect, useState, useRef } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth'
import SimpleSelect from '../reuseables/inputs/SimpleSelect';
import { FaFilter } from "react-icons/fa6";
import { useEvents } from '../../contexts/EventsContext';
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import { useIndicators } from '../../contexts/IndicatorsContext';
import { useOrganizations } from '../../contexts/OrganizationsContext';

export default function ProjectFilters({ onFilterChange }){
    const { user } = useAuth()
    const { eventsMeta, setEventsMeta } = useEvents();
    const { indicators, setIndicators} = useIndicators();
    const { organizations, setOrganizations } = useOrganizations();
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        start: '',
        end: '',
        type: '',
        indicator: '',
        organization: '',
    });
    const [orgSearch, setOrgSearch] = useState('');
    const [indicatorSearch, setIndicatorSearch] = useState('')
    const [selectTools, setSelectTools] = useState({});
    const [showFilters, setShowFilters] = useState(false);
    const [errors, setErrors] = useState([])
    const containerRef = useRef(null);

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
                    setLoading(false);
                }
                catch(err){
                    console.error('Failed to fetch projects: ', err)
                    setLoading(false)
                }

            }
        }
        getEventsMeta();
    }, [])
    
    useEffect(() => {
        const getOrganizations = async () => {
            try{
                console.log('fetching organizations...')
                const response = await fetchWithAuth(`/api/organizations/?search=${orgSearch}`);
                const data = await response.json();
                setOrganizations(data.results)
                setLoading(false)
            }
            catch(err){
                console.error('Failed to fetch projects: ', err);
                setLoading(false)
            }
        }
        getOrganizations();
    }, [orgSearch]);

    useEffect(() => {
        const getIndicators = async () => {
            try{
                console.log('fetching indicators...')
                const response = await fetchWithAuth(`/api/indicators/?search=${indicatorSearch}`);
                const data = await response.json();
                setIndicators(data.results)
                setLoading(false)
            }
            catch(err){
                console.error('Failed to fetch projects: ', err);
                setLoading(false)
            }
        }
        getIndicators();
    }, [indicatorSearch]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [])

    useEffect(() => {
        const orgIDs = organizations?.map((o) => (o.id));
        const orgNames = organizations?.map((o) => (o.name));

        const indIDs = indicators?.map((ind) => (ind.id));
        const indNames = indicators?.map((ind) => (`${ind.code}: ${ind.name}`));
        setSelectTools({
            orgs: {
                names: orgNames,
                ids: orgIDs
            },
            indicators: {
                names: indNames,
                ids: indIDs
            }
        })
    }, [organizations, indicators]);

    const handleChange = () =>{
        if(filters.start && filters.end){
            const startDate = new Date(filters.start);
            const endDate = new Date(filters.end);
            if(startDate > endDate || endDate < startDate){
                setErrors(['Start Date must be before end date.'])
                return;
            }
        }
        setErrors([])
        onFilterChange(filters);
    }
    const clearFilters = () => {
        setFilters({
            start: '',
            end: '',
            type: '',
            indicator: '',
            organization: '',
        });
        onFilterChange({
            start: '',
            end: '',
            type: '',
            indicator: '',
            organization: '',
        })
    }
    if(loading) return <ComponentLoading />
    return (
        <div className={styles.filterContainer} ref={containerRef}>
            <button onClick={() => setShowFilters(!showFilters)}>
                <FaFilter />
            </button>
            {showFilters && (
                <div className={styles.filters}>
                    {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                    <div className={styles.range}>
                        <label htmlFor='lowDate'>Begins after:</label>
                        <input id='lowDate' type='date' value={filters.start} onChange={(e) => setFilters(prev => ({...prev, start: e.target.value}))} />
                        <label htmlFor='highDate'>Ends before:</label>
                        <input id='highDate' type='date' value={filters.end} onChange={(e) => setFilters(prev => ({...prev, end: e.target.value}))} />
                    </div>
                    <SimpleSelect
                        name='type'
                        optionValues={eventsMeta.event_types} value={filters.type}
                        callback={(val) => setFilters(prev => ({...prev, type: val}))}
                    />
                    <SimpleSelect
                        name='organization'
                        label='Organization' searchCallback={(val) => setOrgSearch(val)}
                        optionValues={selectTools.orgs.ids} value={filters.organization}
                        optionLabels={selectTools.orgs.names} search={true}
                        callback={(val) => setFilters(prev => ({...prev, organization: val}))}
                    />
                    <SimpleSelect
                        name='indicator'
                        label='Indicator' searchCallback={(val) => setIndicatorSearch(val)}
                        optionValues={selectTools.indicators.ids} value={filters.indicator}
                        optionLabels={selectTools.indicators.names} search={true}
                        callback={(val) => setFilters(prev => ({...prev, indicator: val}))}
                    />
                    <button onClick={()=>handleChange()}>Apply</button>
                    <button onClick={()=>clearFilters()}>Clear</button>
                </div>
            )}
        </div>
    );
}
