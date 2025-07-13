import React from 'react';
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useIndicators } from '../../contexts/IndicatorsContext';
import DynamicForm from '../reuseables/DynamicForm';
import indicatorConfig from './indicatorConfig';
import styles from '../reuseables/dynamicForm.module.css';
import errorStyles from '../../styles/errors.module.css';
export default function CreateIndicator(){
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { indicators, setIndicators, setIndicatorDetails, indicatorsMeta, setIndicatorsMeta } = useIndicators();
    const [indicatorIDs, setIndicatorIDs] = useState([]);
    const [indicatorNames, setIndicatorNames] = useState([]);
    const [search, setSearch] = useState('')
    const [saving, setSaving] = useState(false);

    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    useEffect(() => {
        const getMeta = async() => {
            if(Object.keys(indicatorsMeta).length != 0){
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/indicators/meta/`);
                    const data = await response.json();
                    setIndicatorsMeta(data);
                }
                catch(err){
                    console.error('Failed to fetch indicators meta: ', err)
                }
            }
        }
        getMeta()

        const getIndicators = async () => {
            try {
                console.log('fetching indicators info...');
                const response = await fetchWithAuth(`/api/indicators/?search=${search}`);
                const data = await response.json();
                setIndicators(data.results);
                const ids = data.results.map(o => o.id);
                const names = data.results.map(o => o.name);
                setIndicatorIDs(ids);
                setIndicatorNames(names);
                setLoading(false);
            } 
            catch (err) {
                console.error('Failed to fetch indicators: ', err);
                setLoading(false);
            }
        };
        getIndicators();
    }, [search]);

    const formConfig = useMemo(() => {
        return indicatorConfig(indicatorIDs, indicatorNames, indicatorsMeta, (val) => setSearch(val));
    }, [indicatorIDs, indicatorNames, indicatorsMeta]);

    const handleCancel = () => {
        navigate('/indicators')
    }

    const handleSubmit = async(data) => {
        const names = data.subcategory_names
        let commas = []
        names.forEach(n => {
            if(n.name.includes(',') || n.name.includes(':')) commas.push(`Subcategory names cannot include commas or colons. Please fix ${n.value}`);
        })
        if(commas.length > 0){
            setErrors(commas);
            return;
        }
        console.log('submitting data...')
        try{
            setSaving(true);
            const response = await fetchWithAuth('/api/indicators/', {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setIndicatorDetails(prev => [...prev, returnData])
                navigate(`/indicators/${returnData.id}`);
            }
            else{
                const serverResponse = []
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${field}: ${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record indicator: ', err)
        }
        finally{
            setSaving(false);
        }
    }

    if(loading) return <Loading />

    return(
        <div className={styles.container}>
            <h1>New Indicator</h1>
            {errors.length != 0 &&
                <div className={errorStyles.errors} ref={alertRef}>
                    <ul>{errors.map((msg)=>
                        <li key={msg}>{msg}</li>)}
                    </ul>
                </div>}
            <DynamicForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} onError={(e) => setErrors(e)} saving={saving} />
        </div>
    )
}