import React from 'react';
import { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import { useIndicators } from '../../contexts/IndicatorsContext';
import fetchWithAuth from '../../../services/fetchWithAuth';
import Loading from '../reuseables/Loading';
import { useAuth } from '../../contexts/UserAuth';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import errorStyles from '../../styles/errors.module.css';
import ConfirmDelete from '../reuseables/ConfirmDelete';

export default function IndicatorDetail(){
    const { user } = useAuth();
    const { id } = useParams();
    const[loading, setLoading] = useState(true)
    const { indicatorDetails, setIndicatorDetails } = useIndicators();
    const[activeIndicator, setActiveIndicator] = useState(null);
    const [errors, setErrors] = useState([]);
    const [del, setDel] = useState(false);

    const navigate = useNavigate();
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

    const deleteIndicator = async() => {
        try {
            console.log('deleting indicator...');
            const response = await fetchWithAuth(`/api/indicators/${id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
            // No need to parse JSON — just navigate away
            navigate('/indicators');
            } 
            else {
            let data = {};
                try {
                    data = await response.json();
                } catch {
                    // no JSON body or invalid JSON
                    data = { detail: 'Unknown error occurred' };
                }

                const serverResponse = [];
                for (const field in data) {
                    if (Array.isArray(data[field])) {
                    data[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                    });
                    } else {
                    serverResponse.push(`${field}: ${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Failed to delete indicator:', err);
        }
        setDel(false);
    } 



    if (loading) return <Loading />
    return(
        <div>
            {del && <ConfirmDelete name={activeIndicator.name} statusWarning={'We advise against deleting indicators. Instead, please consider setting its status as "deprecated".'} onConfirm={() => deleteIndicator()} onCancel={() => setDel(false)} />}
            <h1>{activeIndicator.code}: {activeIndicator.name}</h1>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <p>{activeIndicator.description}</p>
            <i>{activeIndicator.status}</i>
            <p>
                You got me, there's not much here yet. Eventually this should include a list of projects,
                organizations, targets, and interactions related to this indicator, allowing admins to have a 
                centralized place to track this information. 
            </p>
            <Link to={`/indicators/${id}/edit`}><button>Edit Details</button></Link>
            {user.role == 'admin' && <button className={errorStyles.deleteButton} onClick={() => setDel(true)} >Delete Indicator</button>}
        </div>
    )
}