import React from 'react';
import { useEffect, useState, useRef } from 'react';

import cleanLabels from '../../../services/cleanLabels';

import Select from './inputs/Select';
import ComponentLoading from '../reuseables/loading/ComponentLoading';

import styles from '../../styles/filters.module.css';

import { FaFilter } from "react-icons/fa6";

//reuseable filter component that takes a schema and passes an object with selected items
export default function Filter({ onFilterChange, initial, config }){
    /*
    A filter component that can be used with an index component to take user inputs and convert them to an
    object a parent component can convert to URL params. 
    - onFilterChange (function): what to do when the user selects new filters
    - initial (object): initial/default values to use on load/clear
    - config (function): returns a list of field objects that tell the filter what inputs to construct
    */

    const [filters, setFilters] = useState(initial || {}) //object that stores filter values
    const [showFilters, setShowFilters] = useState(false); //determines visibility

    //close on a click outside the filter box
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

    //run callback on change
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
            <button onClick={() => setShowFilters(!showFilters)} aria-label='showfilter'><FaFilter /></button>
            {showFilters && (
                <div className={styles.filters}>
                        {config.map((field) => {
                            //get label or default to name (name is required)
                            const label = field?.label ?? cleanLabels(field.name);
                            if(field.type === 'select'){
                                return <Select key={field.name} name={field.name} label={label} 
                                    options={field.constructors.options}
                                    onChange={(val) => setFilters(prev => ({...prev, [field.name]: val}))}
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
                    <button type="button" onClick={()=>clearFilters()}>Clear</button>
                </div>
            )}
        </div>
    );
}
