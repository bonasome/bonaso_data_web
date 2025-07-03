import React from 'react';
import styles from '../../styles/filters.module.css';
import errorStyles from '../../styles/errors.module.css'
import { useEffect, useState, useRef, useMemo } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import SimpleSelect from '../reuseables/SimpleSelect';
import { FaFilter } from "react-icons/fa6";
import Checkbox from '../reuseables/Checkbox';
import ComponentLoading from '../reuseables/ComponentLoading';

export default function ProfileFilters({ onFilterChange }){
    const [loading, setLoading] = useState(true);
    const [orgs, setOrgs] = useState([]);
    const [filters, setFilters] = useState({
        role: '',
        organization: '',
        inactive: false,
    })
    const [showFilters, setShowFilters] = useState(false);
    const containerRef = useRef(null);

    const fetchedRef = useRef(false);
    
    useEffect(() => {
        const getOrgs = async () => {
            if (fetchedRef.current) return;
            fetchedRef.current = true;

            try {
                console.log('fetching organizations info...');
                const response = await fetchWithAuth(`/api/organizations/`);
                const data = await response.json();
                setOrgs(data.results);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch projects: ', err);
                setLoading(false);
            }
        };
        getOrgs();

        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const orgIDs = useMemo(() => orgs.map(p => p?.id), [orgs]);
    const orgNames = useMemo(() => orgs.map(p => p?.name), [orgs]);
    const roleVals = ['data_collector', 'meofficer', 'manager', 'admin', 'view_only']
    const roleNames =  ['Data Collector', 'M&E Officer', 'Manager', 'Site Administrator', 'View Only/Uninitiated']

    const handleChange = () =>{
        onFilterChange(filters);
    }
    const clearFilter = () => {
        setFilters({
        role: '',
        organization: '',
        inactive: false,
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
                    <SimpleSelect
                        name='role'
                        defaultOption={''}
                        value={filters.role}
                        optionValues={roleVals}
                        optionLabels={roleNames}
                        callback={(val) => setFilters(prev => ({...prev, role: val}))}
                    />
                    <SimpleSelect
                        name='organization'
                        optionValues={orgIDs}
                        optionLabels={orgNames} search={true}
                        callback={(val) => setFilters(prev => ({...prev, organization: val}))}
                    />
                    <Checkbox label={'Inactive User'} checked={filters.inactive} name={'active'} callback={(checked) => setFilters(prev => ({...prev, inactive: checked}))}/>
                    <button onClick={()=>handleChange()}>Apply</button>
                    <button onClick={clearFilter}>Clear</button>
                </div>
            )}
        </div>
    );
}
