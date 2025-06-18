import React from 'react';
import { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import { useIndicators } from '../../contexts/IndicatorsContext';
import fetchWithAuth from '../../../services/fetchWithAuth';
import Loading from '../reuseables/Loading';
import { useAuth } from '../../contexts/UserAuth';
import { Link } from 'react-router-dom';

export default function IndicatorDetail(){
    const { id } = useParams();
    const[loading, setLoading] = useState(true)
    const { indicatorDetails, setIndicatorDetails } = useIndicators();
    const[activeIndicator, setActiveIndicator] = useState(null);
    useEffect(() => {
        const getIndicatorDetails = async () => {
        const found = indicatorDetails.find(p => p.id.toString() === id.toString());
            if (found) {
                setActiveIndicator(found);
                setLoading(false);
                return;
            }
            else{
                try {
                    console.log('fetching indicator details...');
                    const response = await fetchWithAuth(`/api/indicators/${id}/`);
                    const data = await response.json();
                    setIndicatorDetails(prev => [...prev, data]);
                    setActiveIndicator(data);
                    setLoading(false);
                } 
                catch (err) {
                    console.error('Failed to fetch indicator: ', err);
                    setLoading(false)
                } 
            }
        };
        getIndicatorDetails();
    }, [id, indicatorDetails, setIndicatorDetails])
    if (loading) return <Loading />
    return(
        <div>
            <h1>{activeIndicator.code}: {activeIndicator.name}</h1>
            <p>{activeIndicator.description}</p>
            <p>
                You got me, there's not much here yet. Eventually this should include a list of projects,
                organizations, targets, and interactions related to this indicator, allowing admins to have a 
                centralized place to track this information. 
            </p>
        </div>
    )
}