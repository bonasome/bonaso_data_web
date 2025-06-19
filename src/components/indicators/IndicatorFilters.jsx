import React from 'react';
import styles from '../../styles/filters.module.css';
import errorStyles from '../../styles/errors.module.css'
import { useEffect, useState, useRef } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import SimpleSelect from '../reuseables/SimpleSelect';
import { FaFilter } from "react-icons/fa6";
import { useProjects } from '../../contexts/ProjectsContext';

export default function IndicatorFilters({ onFilterChange, indicators=[] }){
    const { projects, setProjects } = useProjects();
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        project: null,
        prereq: null,
    })
    const [showFilters, setShowFilters] = useState(false);
    const [errors, setErrors] = useState([])
    const containerRef = useRef(null);

    useEffect(() => {
        const getProjects = async() => {
            if (projects.length !== 0) return;
            try{
                console.log('fetching projects info...')
                const response = await fetchWithAuth(`/api/manage/projects/`);
                const data = await response.json();
                setProjects(data.results);
                setLoading(false);
            }
            catch(err){
                console.error('Failed to fetch projects: ', err)
                setLoading(false)
            }
        }
        getProjects();
        
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [])
    
    const projectIDs = useMemo(() => projects.map(p => p.id), [projects]);
    const projectNames = useMemo(() => projects.map(p => p.name), [projects]);

    const indicatorIDs = useMemo(() => indicators.map(ind => ind.id), [indicators]);
    const indicatorNames = useMemo(
        () => indicators.map(ind => `${ind.code}: ${ind.name}`),
        [indicators]
    );
        /*
    useEffect(() => {
        if(projects.length !== 0){
            const projectIDs = projects.map((p) => p.id);
            const projectNames= projects.map((p)=> p.name);
            setProjectIDs(projectIDs);
            setProjectNames(projectNames);
        }
        if(indicators.length != 0){
            const indIDs = indicators.map((ind) => ind.id);
            const indNames = indicators.map((ind) => (ind.code + ': '+ ind.name));
            setIndicatorIDs(indIDs)
            setIndicatorNames(indNames)
        }
    }, [indicators])
    */
    const handleChange = () =>{
        onFilterChange(filters);
    }

    if(loading) return <p>Loading...</p>
    return (
        <div className={styles.filterContainer} ref={containerRef}>
            <button onClick={() => setShowFilters(!showFilters)}>
                <FaFilter />
            </button>
            {showFilters && (
                <div className={styles.filters}>
                    {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                    <SimpleSelect
                        name='prereq'
                        optionValues={indicatorIDs}
                        optionLabels={indicatorNames} search={true}
                        callback={(val) => setFilters(prev => ({...prev, prereq: val}))}
                    />
                    <SimpleSelect
                        name='project'
                        optionValues={projectIDs}
                        optionLabels={projectNames} search={true}
                        callback={(val) => setFilters(prev => ({...prev, project: val}))}
                    />
                    <button onClick={()=>handleChange()}>Apply</button>
                </div>
            )}
        </div>
    );
}
