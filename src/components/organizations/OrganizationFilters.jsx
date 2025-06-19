import React from 'react';
import styles from '../../styles/filters.module.css';
import errorStyles from '../../styles/errors.module.css'
import { useEffect, useState, useRef } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import SimpleSelect from '../reuseables/SimpleSelect';
import { FaFilter } from "react-icons/fa6";
import { useProjects } from '../../contexts/ProjectsContext';

export default function OrganizationFilters({ onFilterChange, organizations=[] }){
    const { projects, setProjects } = useProjects();
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        parent_organization: null,
        project: null,
    })
    const [orgIDs, setOrgIDs] = useState([]);
    const [orgNames, setOrgNames] = useState([]);
    const [projectIDs, setProjectIDs] = useState([]);
    const [projectNames, setProjectNames] = useState([]);
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
    
    useEffect(() => {
        if (projects.length !== 0) {
            const ids = projects.map(p => p.id);
            const names = projects.map(p => p.name);

            // Prevent infinite loop by checking shallow equality
            if (JSON.stringify(ids) !== JSON.stringify(projectIDs)) setProjectIDs(ids);
            if (JSON.stringify(names) !== JSON.stringify(projectNames)) setProjectNames(names);
        }

        if (organizations.length !== 0) {
            const ids = organizations.map(o => o.id);
            const names = organizations.map(o => o.name);

            if (JSON.stringify(ids) !== JSON.stringify(orgIDs)) setOrgIDs(ids);
            if (JSON.stringify(names) !== JSON.stringify(orgNames)) setOrgNames(names);
        }
    }, [projects, organizations]);
    
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
                        name='parent_org'
                        label='Parent Organization'
                        optionValues={orgIDs}
                        optionLabels={orgNames} search={true}
                        callback={(val) => setFilters(prev => ({...prev, parent_organization: val}))}
                    />
                    <SimpleSelect
                        name='project'
                        label='Project'
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
