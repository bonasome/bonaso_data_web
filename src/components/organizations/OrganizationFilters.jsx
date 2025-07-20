import React from 'react';
import styles from '../../styles/filters.module.css';
import errorStyles from '../../styles/errors.module.css'
import { useEffect, useState, useRef, useMemo } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import SimpleSelect from '../reuseables/SimpleSelect';
import { FaFilter } from "react-icons/fa6";
import { useProjects } from '../../contexts/ProjectsContext';
import { useOrganizations } from '../../contexts/OrganizationsContext';
import ComponentLoading from '../reuseables/ComponentLoading';
import { useIndicators } from '../../contexts/IndicatorsContext';

export default function OrganizationFilters({ onFilterChange }){
    const { projects, setProjects } = useProjects();
    const [ organizations, setOrganizations ] = useState();
    const { indicators, setIndicators } = useIndicators();

    const [selectTools, setSelectTools] = useState({});
    const [projectSearch, setProjectSearch] = useState('');
    const [orgSearch, setOrgSearch] = useState('');
    const [indicatorSearch, setIndicatorSearch] = useState('')
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        indicator: '',
        parent_organization: '',
        project: '',
    })
    const [showFilters, setShowFilters] = useState(false);
    const [errors, setErrors] = useState([])

    const containerRef = useRef(null);

    useEffect(() => {
        const getProjects = async() => {
            try{
                console.log('fetching projects...')
                const response = await fetchWithAuth(`/api/manage/projects/?search=${projectSearch}`);
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
                const response = await fetchWithAuth(`/api/organizations/?search=${orgSearch}`);
                const data = await response.json();
                setOrganizations(data.results)
            }
            catch(err){
                console.error('Failed to fetch projects: ', err);
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
            }
            catch(err){
                console.error('Failed to fetch projects: ', err);
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
    },[])

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
    const handleChange = () =>{
        onFilterChange(filters);
    }
    const clearFilters = () => {
        setFilters({
            indicator: '',
            parent_organization: '',
            project: '',
        });
        onFilterChange({
            indicator: '',
            parent_organization: '',
            project: '',
        });
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
                    <SimpleSelect
                        name='parent_org'
                        label='Parent Organization'
                        optionValues={selectTools.orgs.ids} value={filters.parent_organization}
                        optionLabels={selectTools.orgs.names} search={true}
                        searchCallback={(val) => setOrgSearch(val)}
                        callback={(val) => setFilters(prev => ({...prev, parent_organization: val}))}
                    />

                    <SimpleSelect
                        name='project'
                        label='Project' searchCallback={(val) => setProjectSearch(val)}
                        optionValues={selectTools.projects.ids} value={filters.project}
                        optionLabels={selectTools.projects.names} search={true}
                        callback={(val) => setFilters(prev => ({...prev, project: val}))}
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
