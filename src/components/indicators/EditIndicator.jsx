import React from 'react';
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useIndicators } from '../../contexts/IndicatorsContext';
import IndicatorForm from './IndicatorForm';
import { useParams } from 'react-router-dom';
import indicatorConfig from './indicatorConfig';
import styles from '../reuseables/dynamicForm.module.css';

export default function EditIndicator(){
    const navigate = useNavigate();
    const { id } = useParams();
    const [formConfig, setFormConfig] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [existing, setExisting] = useState(null)
    const { indicators, setIndicators, setIndicatorDetails, indicatorDetails, indicatorsMeta, setIndicatorsMeta } = useIndicators();
    const [indicatorIDs, setIndicatorIDs] = useState([]);
    const [indicatorNames, setIndicatorNames] = useState([]);

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
                    setIndicatorDetails(prev => [...prev, data]);
                    setExisting(data);
                } 
                catch (err) {
                    console.error('Failed to fetch indicator: ', err);
                } 
            }
        };
        getIndicatorDetails();

        const getIndicators = async () => {
            if(Object.keys(indicators).length != 0){
                const ids = indicators.filter(ind => ind.id.toString() != id.toString()).map((ind) => ind.id);
                const names= indicators.filter(ind => ind.id.toString() != id.toString()).map((ind)=> ind.name);
                setIndicatorIDs(ids);
                setIndicatorNames(names);
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/indicators/`);
                    const data = await response.json();
                    if(indicators.length > 0){
                        const ids = indicators.filter(ind => ind.id.toString() != id.toString()).map((ind) => ind.id);
                        const names= indicators.filter(ind => ind.id.toString() != id.toString()).map((ind)=> ind.name);
                        setIndicatorIDs(ids);
                        setIndicatorNames(names);
                    }
                    setIndicators(data.results);
                }
                catch(err){
                    console.error('Failed to fetch indicators: ', err)
                }
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
    }, [indicators])

    useEffect(() => {
        setFormConfig(indicatorConfig(indicatorIDs, indicatorNames, indicatorsMeta.statuses, existing))
    }, [indicatorNames, indicatorIDs, indicatorsMeta, existing])

    const handleCancel = () => {
        navigate(`/indicators/${id}`)
    }

    const handleSubmit = async(data) => {
        if(!Array.isArray(data.subcategory_names)) data.subcategory_names = []
        console.log('submitting data...', data)
        try{
            const response = await fetchWithAuth(`/api/indicators/${id}/`, {
                method: 'PATCH',
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
    }
    console.log(existing)
    if(loading) return <Loading />

    return(
        <div className={styles.container}>
            <h1>Editing Indicator {existing.code}: {existing.name}</h1>
            <IndicatorForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} errors={errors} />
        </div>
    )
}