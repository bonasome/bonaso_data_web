import React from 'react';
import styles from '../../styles/filters.module.css';
import errorStyles from '../../styles/errors.module.css'
import { useEffect, useState, useRef, useMemo } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import SimpleSelect from '../reuseables/inputs/SimpleSelect';
import { FaFilter } from "react-icons/fa6";
import { useProjects } from '../../contexts/ProjectsContext';
import {useOrganizations } from '../../contexts/OrganizationsContext';
import { useIndicators } from '../../contexts/IndicatorsContext';
import ComponentLoading from '../reuseables/loading/ComponentLoading';

export default function IndicatorFilters({ onFilterChange }){
    const { projects, setProjects } = useProjects();
    const { organizations, setOrganizations } = useOrganizations();
    const { indicatorsMeta, setIndicatorsMeta } = useIndicators();
    const [projectSearch, setProjectSearch] = useState('');
    const [orgSearch, setOrgSearch] = useState('');
    const [selectTools, setSelectTools] = useState({});
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        project: '',
        organization: '',
        status: '',
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
            }
            catch(err){
                console.error('Failed to fetch projects: ', err);
            }
        }
        getOrganizations();
    }, [orgSearch])
    
    useEffect(() => {
        const getMeta = async() => {
            if(Object.keys(indicatorsMeta).length != 0){
                setLoading(false);
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/indicators/meta/`);
                    const data = await response.json();
                    setIndicatorsMeta(data);
                    setLoading(false);
                }
                catch(err){
                    console.error('Failed to fetch indicators meta: ', err)
                    setLoading(false)
                }
            }
        }
        getMeta()
    }, []);

    useEffect(() => {
        const orgIDs = organizations?.map((o) => (o.id));
        const orgNames = organizations?.map((o) => (o.name))
        const pIDs = projects?.map((p) => (p.id))
        const pNames = projects?.map((p) => (p.name))
        setSelectTools({
            orgs: {
                names: orgNames,
                ids: orgIDs
            },
            projects: {
                names: pNames,
                ids: pIDs
            }
        })
    }, [projects, organizations]);

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
        setFilters({
            project: '',
            organization: '',
            status: '',
        });
        onFilterChange({
            project: '',
            organization: '',
            status: '',
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
                        name='status'
                        optionValues={indicatorsMeta.statuses}
                        optionLabels={indicatorsMeta.statuses} value={filters.status}
                        callback={(val) => setFilters(prev => ({...prev, status: val}))}
                    />
                    <button onClick={()=>handleChange()}>Apply</button>
                    <button onClick={()=>clearFilters()}>Clear</button>
                </div>
            )}
        </div>
    );
}
