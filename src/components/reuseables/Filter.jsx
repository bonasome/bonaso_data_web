import React from 'react';
import styles from '../../styles/filters.module.css';
import { useEffect, useState, useRef } from 'react';
import SimpleSelect from './inputs/SimpleSelect';
import Checkbox from './inputs/Checkbox';
import { FaFilter } from "react-icons/fa6";
import ButtonHover from '../reuseables/inputs/ButtonHover';
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import cleanLabels from '../../../services/cleanLabels';

export default function Filter({ onFilterChange, initial, schema }){
    const [filters, setFilters] = useState(initial || {})
    const [showFilters, setShowFilters] = useState(false);

    const containerRef = useRef(null);

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
        onFilterChange(filters);
    }, [filters]);

    const handleChange = () =>{
        onFilterChange(filters);
    }
    const clearFilters = () => {
        setFilters(initial);
        onFilterChange(initial);
    }

    
    if(!initial || !schema ) return <ComponentLoading />
    return (
        <div className={styles.filterContainer} ref={containerRef}>
            <ButtonHover callback={() => setShowFilters(!showFilters)} noHover={<FaFilter />} hover={'Filter Results'} />
            {showFilters && (
                <div className={styles.filters}>
                        {schema.map((field) => {
                            //get label or default to name (name is required)
                            const label = field?.label ?? cleanLabels(field.name);
                            if(field.type === 'select'){
                                return <SimpleSelect key={field.name} name={field.name} label={label} 
                                    optionValues={field.constructors.values} optionLabels={field.constructors.labels}
                                    callback={(val) => setFilters(prev => ({...prev, [field.name]: val}))}
                                    search={field.constructors.search} searchCallback={field.constructors.searchCallback}
                                    value={filters[field.name]}
                                />
                            } 
                            if(field.type === 'date'){
                                return(
                                    <div key={field.name}>
                                        <label htmlFor={field.name}>{label}</label>
                                        <input type='date' id={field.name} 
                                            onChange={(e) => setFilters(prev => ({...prev, [field.name]: e.target.value}))} 
                                            value={filters[field.name]} 
                                        />
                                    </div>
                                )
                            }
                        })}
                    <button onClick={()=>clearFilters()}>Clear</button>
                </div>
            )}
        </div>
    );
}
