import React from 'react';
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useIndicators } from '../../contexts/IndicatorsContext';
import IndicatorForm from './IndicatorForm';
import indicatorConfig from './indicatorConfig';


export default function CreateIndicator(){
    const navigate = useNavigate();
    const [formConfig, setFormConfig] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { indicators, setIndicators, setIndicatorDetails } = useIndicators();
    const [indicatorIDs, setIndicatorIDs] = useState([]);
    const [indicatorNames, setIndicatorNames] = useState([]);

    useEffect(() => {
        const getIndicators = async () => {
            if(Object.keys(indicators).length != 0){
                const ids = indicators.map((o) => o.id);
                const names= indicators.map((o)=> o.name);
                setIndicatorIDs(ids);
                setIndicatorNames(names);
                setLoading(false)
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/indicators/`);
                    const data = await response.json();
                    if(indicators.length > 0){
                        const ids = indicators.map((o) => o.id);
                        const names= indicators.map((o)=> o.name);
                        setIndicatorIDs(ids);
                        setIndicatorNames(names);
                    }
                    setIndicators(data.results);
                    setLoading(false)
                }
                catch(err){
                    console.error('Failed to fetch indicators: ', err)
                    setLoading(false)
                }
            }
        }
        getIndicators();
    }, [indicators])

    useEffect(() => {
        setFormConfig(indicatorConfig(indicatorIDs, indicatorNames))
    }, [indicatorNames, indicatorIDs])

    const handleCancel = () => {
        navigate('/indicators')
    }

    const handleSubmit = async(data) => {
        console.log('submitting data...', data)
        try{
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
                const data = await response.json();
                console.log(data);
            }
        }
        catch(err){
            console.error('Could not record indicator: ', err)
        }
    }

    if(loading) return <Loading />

    return(
        <div>
            <h1>New Indicator</h1>
            <IndicatorForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} errors={errors} />
        </div>
    )
}