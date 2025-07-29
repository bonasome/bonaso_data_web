import React from 'react';
import styles from '../../styles/filters.module.css';
import { useEffect, useState, useRef } from 'react';
import SimpleSelect from './inputs/SimpleSelect';
import Checkbox from './inputs/Checkbox';
import { FaFilter } from "react-icons/fa6";
import ButtonHover from '../reuseables/inputs/ButtonHover';
import ComponentLoading from '../reuseables/loading/ComponentLoading';


export default function Filter({ onFilterChange, initial, schema }){
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState(initial || {})
    const [showFilters, setShowFilters] = useState(false);
    const [errors, setErrors] = useState([])
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
                            if(field.type === 'select'){
                                return <SimpleSelect key={field.name} name={field.name} label={field.label} 
                                    optionValues={field.constructors.values} optionLabels={field.constructors.labels}
                                    callback={(val) => setFilters(prev => ({...prev, [field.name]: val}))}
                                    value={filters[field.name]}
                                />
                            } 
                            if(field.type === 'date'){
                                return(
                                    <div key={field.name}>
                                        <label htmlFor={field.name}></label>
                                        <input type='date' id={field.name} callback={(e) => setFilters(prev => ({...prev, [field.name]: e.target.value}))} value={filters[field.name]} />
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
