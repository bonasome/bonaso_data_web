import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useIndicators } from '../../contexts/IndicatorsContext';
import DynamicForm from '../reuseables/DynamicForm';
import { useParams } from 'react-router-dom';
import indicatorConfig from './indicatorConfig';
import styles from '../reuseables/dynamicForm.module.css';
import errorStyles from '../../styles/errors.module.css';
export default function EditIndicator(){
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [existing, setExisting] = useState(null)
    const { indicators, setIndicators, setIndicatorDetails, indicatorDetails, indicatorsMeta, setIndicatorsMeta } = useIndicators();
    const [indicatorIDs, setIndicatorIDs] = useState([]);
    const [indicatorNames, setIndicatorNames] = useState([]);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);


    useEffect(() => {

        const getIndicatorDetails = async () => {
            const found = indicatorDetails.find(o => o.id.toString() === id.toString());
            if (found) {
                setExisting(found);
                return;
            }
            else{
                try {
                    console.log('fetching indicator details...');
                    const response = await fetchWithAuth(`/api/indicators/${id}/`);
                    const data = await response.json();
                    console.log(data)
                    if(response.ok){
                        setIndicatorDetails(prev => [...prev, data]);
                        setExisting(data);
                    }
                    else{
                        navigate(`/not-found`);
                    }
                    
                } 
                catch (err) {
                    console.error('Failed to fetch indicator: ', err);
                } 
            }
        };
        getIndicatorDetails();

        const getIndicators = async () => {
            try{
                console.log('fetching model info...')
                const response = await fetchWithAuth(`/api/indicators/?search=${search}`);
                const data = await response.json();
                
                if(data.results.length > 0){
                    setIndicators(data.results);
                    const ids = data.results.map(o => o.id);
                    const names = data.results.map(o => o.name);
                    setIndicatorIDs(ids);
                    setIndicatorNames(names);
                }
                setIndicators(data.results);
            }
            catch(err){
                console.error('Failed to fetch indicators: ', err)
            }
        }
        getIndicators();
        const getMeta = async() => {
            if(Object.keys(indicatorsMeta).length != 0){
                setLoading(false);
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/indicators/meta/`);
                    const data = await response.json();
                    setIndicatorsMeta(data);
                    setLoading(false);
                }
                catch(err){
                    console.error('Failed to fetch indicators meta: ', err)
                    setLoading(false)
                }
            }
        }
        getMeta()
    }, [search])

    const formConfig = useMemo(() => {
        return indicatorConfig(indicatorIDs, indicatorNames, indicatorsMeta, (val) => setSearch(val), existing);
    }, [indicatorIDs, indicatorNames, indicatorsMeta, existing]);

    const handleCancel = () => {
        navigate(`/indicators/${id}`)
    }

    const handleSubmit = async(data) => {
        if(!Array.isArray(data.subcategory_names)) data.subcategory_names = []
        if(typeof data?.prerequisite_id === 'object' && data.prerequisite_id?.id) data.prerequisite_id = data.prerequisite_id.id
        if(data.match_subcategories) data.subcategory_names = []
        const names = data.subcategory_names
        let commas = []
        names.forEach(n => {
            if(n.name.includes(',') || n.name.includes(':')) commas.push(`Subcategory names cannot include commas or colons. Please fix subcategory "${n.value}"`);
        })
        if(commas.length > 0){
            setErrors(commas);
            return;
        }
        console.log('submitting data...', data)
        try{
            setSaving(true);
            const response = await fetchWithAuth(`/api/indicators/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setIndicatorDetails(prev => {
                    const others = prev.filter(r => r.id !== returnData.id);
                    return [...others, returnData];
                });
                navigate(`/indicators/${returnData.id}`);
            }
            else{
                const serverResponse = []
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${returnData[field]}`);
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
            <h1>Editing Indicator {existing?.code}: {existing?.name}</h1>
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