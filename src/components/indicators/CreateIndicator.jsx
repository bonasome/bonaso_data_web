import React from 'react';
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from 'react-router-dom';

import { useIndicators } from '../../contexts/IndicatorsContext';

import fetchWithAuth from "../../../services/fetchWithAuth";
import indicatorConfig from './indicatorConfig';

import Loading from '../reuseables/loading/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import ReturnLink from '../reuseables/ReturnLink';

import styles from '../reuseables/dynamicForm.module.css';
import errorStyles from '../../styles/errors.module.css';

export default function CreateIndicator(){
    const navigate = useNavigate();

    //context
    const { setIndicatorDetails, indicatorsMeta, setIndicatorsMeta } = useIndicators();

    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);

    //ref to autoscroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    //fetch the meta
    useEffect(() => {
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
                }
                catch(err){
                    setErrors(['Something went wrong. Please try again later.'])
                    console.error('Failed to fetch indicators meta: ', err)
                }
                finally{
                    setLoading(false);
                }
            }
        }
        getMeta()
    }, []);


    //set up the form config
    const formConfig = useMemo(() => {
        return indicatorConfig(indicatorsMeta);
    }, [indicatorsMeta]);


    //on cancel redirect to index
    const handleCancel = () => {
        navigate('/indicators')
    }

    //handle submitted form
    const handleSubmit = async(data, createAnother) => {
        //prevent commas/colons since these characters are proected for subcats
        const names = data.subcategory_data || []
        let commas = []
        names.forEach(n => {
            if(n.name.includes(',') || n.name.includes(':')) commas.push(`Subcategory names cannot include commas or colons. Please fix ${n.value}`);
        })
        if(commas.length > 0){
            setErrors(commas);
            return;
        }
        //the model select by default returns an object, so parse the ids
        if(data.prerequisite_ids.length > 0) {
            data.prerequisite_ids = data.prerequisite_ids.map(pre => (pre.id))
        }
        try{
            console.log('submitting data...', data);
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
                //allow users to jump to create another, but by default go to detail page
                setIndicatorDetails(prev => [...prev, returnData])
                if(createAnother){
                    navigate('/indicators/new')
                }
                else{
                    navigate(`/indicators/${returnData.id}`);
                }
                
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
            <ReturnLink url={'/indicators'} display='Return to indicators overview' />
            <h1>New Indicator</h1>

            {errors.length != 0 &&
            <div className={errorStyles.errors} ref={alertRef}>
                <ul>{errors.map((msg)=>
                    <li key={msg}>{msg}</li>)}
                </ul>
            </div>}
            
            <DynamicForm config={formConfig} onSubmit={handleSubmit} 
                onCancel={handleCancel} onError={(e) => setErrors(e)} saving={saving} 
                createAnother={true} 
            />
        </div>
    )
}