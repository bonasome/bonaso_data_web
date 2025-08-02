import React from 'react';
import { useEffect, useState, useRef } from 'react';

import cleanLabels from '../../../services/cleanLabels';

import SimpleSelect from './inputs/SimpleSelect';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import ComponentLoading from '../reuseables/loading/ComponentLoading';

import styles from '../../styles/filters.module.css';

import { FaFilter } from "react-icons/fa6";

//reuseable filter component that takes a schema and passes an object with selected items
export default function Filter({ onFilterChange, initial, config }){
    const [filters, setFilters] = useState(initial || {})
    const [showFilters, setShowFilters] = useState(false); //determines visibility

    //hide on outside click
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

    //call callback on change
    useEffect(() => {
        onFilterChange(filters);
    }, [filters]);

    //reset to initial
    const clearFilters = () => {
        setFilters(initial);
        onFilterChange(initial);
    }

    if(!initial || !config ) return <ComponentLoading />
    return (
        <div className={styles.filterContainer} ref={containerRef}>
            <ButtonHover callback={() => setShowFilters(!showFilters)} noHover={<FaFilter />} hover={'Filter Results'} />
            {showFilters && (
                <div className={styles.filters}>
                        {config.map((field) => {
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
