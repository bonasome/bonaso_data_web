import React from 'react';
import styles from '../../../styles/filters.module.css';
import errorStyles from '../../../styles/errors.module.css'
import { useEffect, useState, useRef, useMemo } from 'react';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import SimpleSelect from '../../reuseables/SimpleSelect';
import { FaFilter } from "react-icons/fa6";
import { useProjects } from '../../../contexts/ProjectsContext';
import {useOrganizations } from '../../../contexts/OrganizationsContext';
import { useIndicators } from '../../../contexts/IndicatorsContext';
import ComponentLoading from '../../reuseables/ComponentLoading';

export default function FlaggedInteractionsFilters({ onFilterChange }){
    const { projects, setProjects } = useProjects();
    const { organizations, setOrganizations } = useOrganizations();
    const { indicators, setIndicators } = useIndicators();
    const [projectSearch, setProjectSearch] = useState('');
    const [orgSearch, setOrgSearch] = useState('');
    const [indicatorSearch, setIndicatorSearch] = useState('')
    const [selectTools, setSelectTools] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        project: '',
        organization: '',
        indicator: '',
        start: '',
        end: '',
    })
    const [showFilters, setShowFilters] = useState(false);
    const [errors, setErrors] = useState([])
    const containerRef = useRef(null);

    useEffect(() => {
        const getProjects = async() => {
            try{
                console.log('fetching projects...')
                const response = await fetchWithAuth(`/api/manage/projects/?${projectSearch}`);
                const data = await response.json();
                setProjects(data.results)
            }
            catch(err){
                console.error('Failed to fetch projects: ', err);
            }
        }
        getProjects();
    }, [projectSearch])

    useEffect(() => {
        const getOrganizations = async () => {
            try{
                console.log('fetching organizations...')
                const response = await fetchWithAuth(`/api/organizations/?${orgSearch}`);
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
    }, [orgSearch])

    useEffect(() => {
        const getIndicators = async () => {
            try{
                console.log('fetching organizations...')
                const response = await fetchWithAuth(`/api/indicators/?${indicatorSearch}`);
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
    }, [indicatorSearch])

    useEffect(() => {
        const orgIDs = organizations?.map((o) => (o.id));
        const orgNames = organizations?.map((o) => (o.name))
        const pIDs = projects?.map((p) => (p.id))
        const pNames = projects?.map((p) => (p.name))
        const indIDs = indicators?.map((ind) => (ind.id))
        const indNames = indicators?.map((ind) => (`${ind.code}: ${ind.name}`))
        setSelectTools({
            orgs: {
                names: orgNames,
                ids: orgIDs
            },
            projects: {
                names: pNames,
                ids: pIDs
            },
            indicators: {
                names: indNames,
                ids: indIDs
            }
        })
    }, [projects, organizations, indicators]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const handleChange = () =>{
        onFilterChange(filters);
    }
    const clearFilters = () => {
        onFilterChange({
        project: '',
        organization: '',
        indicator: '',
        start: '',
        end: '',
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
                        name='organizations'
                        optionValues={selectTools.orgs.ids} searchCallback={(val) => setOrgSearch(val)}
                        optionLabels={selectTools.orgs.names} search={true} value={filters.organization}
                        callback={(val) => setFilters(prev => ({...prev, organization: val}))}
                    />
                    <SimpleSelect
                        name='project' value={filters.project}
                        optionValues={selectTools.projects.ids} searchCallback={(val) => setProjectSearch(val)}
                        optionLabels={selectTools.projects.names} search={true}
                        callback={(val) => setFilters(prev => ({...prev, project: val}))}
                    />
                    <SimpleSelect
                        name='indicator' search={true}
                        optionValues={selectTools.indicators.ids} searchCallback={(val) => setIndicatorSearch(val)}
                        optionLabels={selectTools.indicators.name} value={filters.indicator}
                        callback={(val) => setFilters(prev => ({...prev, indicator: val}))}
                    />
                    <button onClick={()=>handleChange()}>Apply</button>
                    <button onClick={()=>clearFilters()}>Clear</button>
                </div>
            )}
        </div>
    );
}
