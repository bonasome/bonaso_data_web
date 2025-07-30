import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import { useIndicators } from '../../contexts/IndicatorsContext';

import fetchWithAuth from "../../../services/fetchWithAuth";
import indicatorConfig from './indicatorConfig';

import Loading from '../reuseables/loading/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import ReturnLink from '../reuseables/ReturnLink';

import styles from '../reuseables/dynamicForm.module.css';
import errorStyles from '../../styles/errors.module.css';

export default function EditIndicator(){
    const navigate = useNavigate();

    //param to get indicator
    const { id } = useParams();
    //context
    const { setIndicatorDetails, indicatorDetails, indicatorsMeta, setIndicatorsMeta } = useIndicators();

    //existing values to start with
    const [existing, setExisting] = useState(null);

    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);

    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    console.log(existing)
    //
    useEffect(() => {
        const getIndicatorDetail = async () => {
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
                    setErrors(['Something went wrong. Please try again later.'])
                } 
            }
        };
        getIndicatorDetail();
        //fetch the meta
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
    }, [id]);


    //set up the form config for DynamicForm
    const formConfig = useMemo(() => {
        return indicatorConfig(indicatorsMeta, existing);
    }, [indicatorsMeta, existing]);


    //redirect on cancel
    const handleCancel = () => {
        navigate(`/indicators/${id}`)
    }

    //handle form submission
    const handleSubmit = async(data) => {
        if(!Array.isArray(data.subcategory_names)) data.subcategory_names = [];

        //prerequisites sends objects by default, so map just the ids
        if(data.prerequisite_ids.length > 0) {
            data.prerequisite_ids = data.prerequisite_ids.map(pre => (pre.id))
        }
        if(data.governs_attribute === '') data.governs_attribute = null //set this to null
        if(data.match_subcategories) data.subcategory_names = []; //oin case the user start typing then the field hid
        
        //prevent forbidden chars from appearing in subcat names
        const names = data.subcategory_names
        let commas = []
        names.forEach(n => {
            if(n.name.includes(',') || n.name.includes(':')) commas.push(`Subcategory names cannot include commas or colons. Please fix subcategory "${n.value}"`);
        })
        if(commas.length > 0){
            setErrors(commas);
            return;
        }
        try{
            setSaving(true);
            console.log('submitting data...', data)
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

    if(loading || !existing) return <Loading />
    return(
        <div className={styles.container}>
            <ReturnLink url={`/indicators/${existing?.id}`} display='Return to indicator page' />
            <h1>Editing Indicator {existing?.code}: {existing?.name}</h1>
            {errors.length != 0 && <div className={errorStyles.errors} ref={alertRef}>
                <ul>{errors.map((msg)=>
                    <li key={msg}>{msg}</li>)}
                </ul>
            </div>}
            <DynamicForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} onError={(e) => setErrors(e)} saving={saving} />
        </div>
    )
}