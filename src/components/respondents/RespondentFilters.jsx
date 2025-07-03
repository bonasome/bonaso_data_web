import React from 'react';
import styles from '../../styles/filters.module.css';
import errorStyles from '../../styles/errors.module.css'
import { useEffect, useState, useRef } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth'
import SimpleSelect from '../reuseables/SimpleSelect';
import { FaFilter } from "react-icons/fa6";
import { useRespondents } from '../../contexts/RespondentsContext';
import ComponentLoading from '../reuseables/ComponentLoading';

export default function RespondentFilters({ onFilterChange }){
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        sex: null,
        district: null,
        age_range: null,
    })
    const {respondentsMeta, setRespondentsMeta} = useRespondents();
    const [showFilters, setShowFilters] = useState(false);
    const [errors, setErrors] = useState([])
    const containerRef = useRef(null);

    useEffect(() => {
        if(Object.keys(respondentsMeta).length !== 0){
            setLoading(false)
            return;
        }
        const getRespondentMeta = async () => {
            try{
                console.log('fetching respondents meta...');
                const response = await fetchWithAuth(`/api/record/respondents/meta/`);
                const data = await response.json();
                setRespondentsMeta(data);
                setLoading(false);
            }
            catch(err){
                console.error('Failed to fetch respondent model information: ', err)
                setLoading(false)
            }
        }
        getRespondentMeta();
        
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);

    }, [])
    
    const handleChange = () =>{
        onFilterChange(filters);
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
                        <SimpleSelect name='sex' optionValues={respondentsMeta.sexs} optionLabels={respondentsMeta.sex_labels} callback={(val) => setFilters(prev => ({...prev, sex: val}))} />
                        <SimpleSelect name='age_range' optionValues={respondentsMeta.age_ranges} optionLabels={respondentsMeta.age_range_labels} callback={(val) => setFilters(prev => ({...prev, age_range: val}))} />
                        <SimpleSelect name='district' optionValues={respondentsMeta.districts} optionLabels={respondentsMeta.district_labels} callback={(val) => setFilters(prev => ({...prev, district: val}))} />
                    <button onClick={()=>handleChange()}>Apply</button>
                </div>
            )}
        </div>
    );
}
