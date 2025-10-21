import React from 'react';
import { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from 'react-router-dom';

import { useIndicators } from '../../contexts/IndicatorsContext';
import { useAuth } from '../../contexts/UserAuth';

import fetchWithAuth from '../../../services/fetchWithAuth';

import Loading from '../reuseables/loading/Loading';
import ConfirmDelete from '../reuseables/ConfirmDelete';
import UpdateRecord from '../reuseables/meta/UpdateRecord';
import ReturnLink from '../reuseables/ReturnLink';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import Messages from '../reuseables/Messages';

import styles from './indicatorDetail.module.css';

import { ImPencil } from 'react-icons/im';
import { FaTrashAlt } from 'react-icons/fa';

export default function IndicatorDetail(){
    /*
    Detail component for the indicator. Takes an ID param in the URL.
    */
    const navigate = useNavigate();
    const { id } = useParams(); //indicator id from url

    //context
    const { user } = useAuth();
    const { setIndicatorDetails, indicatorsMeta, setIndicatorsMeta } = useIndicators();
    
    const[indicator, setIndicator] = useState(null); //detail of the indicator
    
    //page meta
    const[loading, setLoading] = useState(true)
    const [del, setDel] = useState(false);
    const [errors, setErrors] = useState([]);

    //for creating a list of projects this indicator is in
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    //get details from server    
    useEffect(() => {
        //get indicator information
        const getIndicatorDetails = async () => {
            try {
                console.log('fetching indicator details...');
                const response = await fetchWithAuth(`/api/indicators/manage/${id}/`);
                const data = await response.json();
                if(response.ok){
                    //update the context
                    setIndicatorDetails(prev => [...prev, data]);
                    setIndicator(data);
                }
                else{
                    //if a bad ID is provided, navigate to 404
                    navigate('/not-found')
                }
                
            } 
            catch (err) {
                setErrors(['Something went wrong. Please try again later.']);
                console.error('Failed to fetch indicator: ', err);
            } 
        };
        getIndicatorDetails();
        
        //get the meta
        const getMeta = async() => {
            if(Object.keys(indicatorsMeta).length != 0){
                setLoading(false);
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/indicators/manage/meta/`);
                    const data = await response.json();
                    setIndicatorsMeta(data);
                    setLoading(false);
                }
                catch(err){
                    setErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch indicators meta: ', err);
                    setLoading(false);
                }
            }
        }
        getMeta()

    }, [id]);

    //get a list of projects that this indicator is in
    useEffect(() => {
        const getProjects = async () => {
            if(!indicator) return;
            try {
                console.log('fetching projects...');
                const url = indicator.category == 'assessment' ? `/api/manage/projects/?assessment=${indicator.assessment.id}` : `/api/manage/projects/?indicator=${indicator.id}`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setProjects(data.results);
            } 
            catch (err) {
                setErrors(['Something went wrong. Please try again later.']);
                console.error('Failed to fetch related projects: ', err);
            } 
        };
        getProjects();
    }, [indicator]);

    //get a list of tasks this indicator is a part of (and therefore also a list of organizations)
    useEffect(() => {
        const getOrgs = async () => {
            if(!indicator) return;
            try {
                console.log('fetching organizations...');
                const url = indicator.category == 'assessment' ? `/api/manage/tasks/?assessment=${indicator.assessment.id}` : `/api/manage/tasks/?indicator=${indicator.id}`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setTasks(data.results);
            } 
            catch (err) {
                setErrors(['Something went wrong. Please try again later.']);
                console.error('Failed to fetch related organizations: ', err);
            } 
        };
        getOrgs();
    }, [indicator]);

    //function to delete indicator
    const deleteIndicator = async() => {
        if(indicator.category == 'assessment') return;
        try {
            console.log('deleting indicator...');
            const response = await fetchWithAuth(`/api/indicators/manage/${id}/`, {
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
        finally{
            setDel(false);
        }
        
    } 

    //helper function that converts db values to labels
    const getLabelFromValue = (field, value) => {
        if(!indicatorsMeta) return null
        const match = indicatorsMeta[field]?.find(range => range.value === value);
        return match ? match.label : null;
    };

    if (loading) return <Loading />
    return(
        <div className={styles.container}>
            {del && <ConfirmDelete name={indicator?.display_name} statusWarning={'We advise against deleting indicators. Instead, please consider setting its status as "deprecated".'} onConfirm={() => deleteIndicator()} onCancel={() => setDel(false)} />}
            
            <div className={styles.section}>
                <ReturnLink url={'/indicators'} display='Return to indicators overview' />
                <h1>{indicator?.display_name}</h1>
                <Messages errors={errors} />
                
                {indicator?.description ? <p><strong>Description:</strong><i> {indicator.description}</i></p> : <p><i>No Description</i></p>}
                
                {indicator?.category == 'assessment' ? <Link to={`/indicators/assessments/${indicator?.assessment?.id}`}><h4>In assessment {indicator.assessment.name}</h4></Link> : 
                    <p><strong>Category:</strong> {getLabelFromValue('category',indicator?.category)}</p>}
                
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <Link to={indicator?.category == 'assessment' ? `/indicators/assessments/${indicator?.assessment?.id}` : `/indicators/${id}/edit`}><ButtonHover noHover={<ImPencil />} hover={'Edit Details'} /></Link>
                    {!del && indicator?.category != 'assessment' && <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt /> } hover={'Delete Indicator'} forDelete={true} />}
                </div>
                <UpdateRecord created_by={indicator?.created_by} updated_by={indicator?.updated_by}
                    created_at={indicator?.created_at} updated_at={indicator?.updated_at} /> 
            </div>
            
            <div className={styles.section}>
                <h2>In projects</h2>
                {projects && projects.length > 0 && projects.map((p) =>(
                    <div key={p.id} className={styles.card}>
                        <Link to={`/projects/${p.id}`}><h3>{p.name}</h3></Link>
                    </div>
                ))}
                {!projects || projects.length === 0 && <p><i>This indicator is not in any projects.</i></p>}
            </div>
            <div className={styles.section}>
                <h2>Assigned to Organizations</h2>
                {tasks && tasks.length > 0 && tasks.map((t) =>(
                    <div key={t.id} className={styles.card}>
                        <Link to={`/projects/${t.project.id}/organization/${t.organization.id}`}><h3>Assigned to {t.organization.name} in project {t.project.name}</h3></Link>
                    </div>
                ))}
                {!projects || projects.length === 0 && <p><i>This indicator is not in any projects.</i></p>}
            </div>
            <div className={styles.spacer}></div>
        </div>
    )
}