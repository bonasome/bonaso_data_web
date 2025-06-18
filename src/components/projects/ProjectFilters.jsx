import React from 'react';
import styles from '../../styles/filters.module.css';
import errorStyles from '../../styles/errors.module.css'
import { useEffect, useState, useRef } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth'
import SimpleSelect from '../reuseables/SimpleSelect';
import { FaFilter } from "react-icons/fa6";
import { useProjects } from '../../contexts/ProjectsContext';

export default function ProjectFilters({ onFilterChange }){
    const { user } = useAuth()
    const { projectsMeta, setProjectsMeta } = useProjects();
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        start: null,
        end: null,
        client:null,
        status: null,
    })
    const [clientIDs, setClientIDs] = useState([]);
    const [clientNames, setClientNames] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [errors, setErrors] = useState([])
    const containerRef = useRef(null);

    useEffect(() => {
        const getProjectMeta = async () => {
            if(Object.keys(projectsMeta).length !== 0){
                if(projectsMeta.clients){
                    const clientIDs = projectsMeta.clients.map((c) => c.id);
                    const clientNames= projectsMeta.clients.map((c)=> c.name);
                    setClientIDs(clientIDs);
                    setClientNames(clientNames);
                }
                setLoading(false)
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/manage/projects/meta/`);
                    const data = await response.json();
                    setProjectsMeta(data);
                    if(data.clients){
                        const clientIDs = data.clients.map((c) => c.id);
                        const clientNames= data.clients.map((c)=> c.name);
                        setClientIDs(clientIDs);
                        setClientNames(clientNames);
                    }
                    setLoading(false);
                }
                catch(err){
                    console.error('Failed to fetch projects: ', err)
                    setLoading(false)
                }

            }
        }
        getProjectMeta();
        
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [projectsMeta, setProjectsMeta])
    
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
    if(loading) return <p>Loading...</p>
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
                        <input id='lowDate' type='date' onChange={(e) => setFilters(prev => ({...prev, start: e.target.value}))} />
                        <label htmlFor='highDate'>Ends before:</label>
                        <input id='highDate' type='date' onChange={(e) => setFilters(prev => ({...prev, end: e.target.value}))} />
                    </div>
                    {user.role === 'admin' && (
                        <SimpleSelect
                            name='status'
                            optionValues={projectsMeta.statuses}
                            callback={(val) => setFilters(prev => ({...prev, status: val}))}
                        />
                    )}
                    <SimpleSelect
                        name='client'
                        optionValues={clientIDs}
                        optionLabels={clientNames}
                        callback={(val) => setFilters(prev => ({...prev, client: val}))}
                    />
                    <button onClick={()=>handleChange()}>Apply</button>
                </div>
            )}
        </div>
    );
}
