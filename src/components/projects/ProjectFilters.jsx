import React from 'react';
import styles from '../../styles/filters.module.css';
import errorStyles from '../../styles/errors.module.css'
import { useEffect, useState, useRef } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth'
import SimpleSelect from '../reuseables/inputs/SimpleSelect';
import { FaFilter } from "react-icons/fa6";
import { useProjects } from '../../contexts/ProjectsContext';
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import { useIndicators } from '../../contexts/IndicatorsContext';
import { useOrganizations } from '../../contexts/OrganizationsContext';

export default function ProjectFilters({ onFilterChange }){
    const { user } = useAuth()
    const { projectsMeta, setProjectsMeta } = useProjects();
    const { indicators, setIndicators} = useIndicators();
    const { organizations, setOrganizations } = useOrganizations();
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        start: '',
        end: '',
        client: '',
        status: '',
        organization: '',
    });
    const [orgSearch, setOrgSearch] = useState('');
    const [indicatorSearch, setIndicatorSearch] = useState('')
    const [selectTools, setSelectTools] = useState({});
    const [showFilters, setShowFilters] = useState(false);
    const [errors, setErrors] = useState([])
    const containerRef = useRef(null);

    useEffect(() => {
        const getProjectMeta = async () => {
            if(Object.keys(projectsMeta).length !== 0){
                setLoading(false)
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/manage/projects/meta/`);
                    const data = await response.json();
                    setProjectsMeta(data);
                    setLoading(false);
                }
                catch(err){
                    console.error('Failed to fetch projects: ', err)
                    setLoading(false)
                }

            }
        }
        getProjectMeta();
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

        const clientIDs = projectsMeta?.clients?.map((c) => c.id);
        const clientNames= projectsMeta?.clients?.map((c)=> c.name);

        const indIDs = indicators?.map((ind) => (ind.id));
        const indNames = indicators?.map((ind) => (`${ind.code}: ${ind.name}`));
        setSelectTools({
            orgs: {
            names: orgNames,
            ids: orgIDs
            },
            clients: {
            names: clientNames,
            ids: clientIDs
            },  
            indicators: {
                names: indNames,
                ids: indIDs
            }
        })
    }, [projectsMeta, organizations, indicators]);

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
            client: '',
            status: '',
            organization: '',
        });
        onFilterChange({
            start: '',
            end: '',
            client: '',
            status: '',
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
                    {user.role === 'admin' && (
                        <SimpleSelect
                            name='status'
                            optionValues={projectsMeta.statuses}
                            callback={(val) => setFilters(prev => ({...prev, status: val}))}
                        />
                    )}
                    {!['clients'].includes(user.role) && <SimpleSelect
                        name='client'
                        optionValues={selectTools.clients.ids} value={filters.client}
                        optionLabels={selectTools.clients.names} search={true}
                        callback={(val) => setFilters(prev => ({...prev, client: val}))}
                    />}
                    <SimpleSelect
                        name='organization'
                        label='Organization' searchCallback={(val) => setOrgSearch(val)}
                        optionValues={selectTools.orgs.ids} value={filters.organization}
                        optionLabels={selectTools.orgs.names} search={true}
                        callback={(val) => setFilters(prev => ({...prev, organization: val}))}
                    />
                    <button onClick={()=>handleChange()}>Apply</button>
                    <button onClick={()=>clearFilters()}>Clear</button>
                </div>
            )}
        </div>
    );
}
