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
    const navigate = useNavigate();
    //indicator id from url
    const { id } = useParams();

    //context
    const { user } = useAuth();
    const { setIndicatorDetails, indicatorsMeta, setIndicatorsMeta } = useIndicators();
    
    //detail of the current indicator
    const[indicator, setIndicator] = useState(null);
    
    //page meta
    const[loading, setLoading] = useState(true)
    const [del, setDel] = useState(false);
    const [errors, setErrors] = useState([]);

    //list of projects this indicator is in
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    //get details from server    
    useEffect(() => {
        //get indicator information
        const getIndicatorDetails = async () => {
            try {
                console.log('fetching indicator details...');
                const response = await fetchWithAuth(`/api/indicators/${id}/`);
                const data = await response.json();
                if(response.ok){
                    setIndicatorDetails(prev => [...prev, data]);
                    setIndicator(data);
                }
                else{
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
                    const response = await fetchWithAuth(`/api/indicators/meta/`);
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

    useEffect(() => {
        //get a list of projects
        const getProjects = async () => {
            if(!indicator) return;
            try {
                console.log('fetching projects...');
                const response = await fetchWithAuth(`/api/manage/projects/?indicator=${indicator.id}`);
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

    useEffect(() => {
        //get a list of projects
        const getOrgs = async () => {
            if(!indicator) return;
            try {
                console.log('fetching organizations...');
                const response = await fetchWithAuth(`/api/manage/tasks/?indicator=${indicator.id}`);
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
                
                <p>{indicator?.description ? indicator.description : 'No description yet.'}</p>

                <p><i>
                    {getLabelFromValue('statuses',indicator?.status)}, {getLabelFromValue('indicator_types',indicator?.indicator_type)}
                    {indicator?.require_numeric && ', Requires a number'} 
                    {indicator?.allow_repeat && '(Allows Repeats)'}
                </i></p>

                {indicator?.prerequisites?.length > 0 && <div>
                    <p>Prerequisites: </p>
                    <ul>
                        {indicator.prerequisites.map((p) => (<li>{p.display_name}</li>))}
                    </ul>
                </div>}

                {indicator?.required_attributes.length > 0 && <div>
                    <p>Requires Special Respondent Attributes:</p>
                    <ul>{indicator.required_attributes?.map((a) => (<li key={a.name}>{getLabelFromValue('required_attributes', a.name)}</li>))}</ul>
                </div>}

                {indicator?.governs_attribute && <p><i>Controls Respondent Attribute: {getLabelFromValue('required_attributes', indicator.governs_attribute)}</i></p> }
                
                {indicator?.subcategories.length > 0 && <div>
                    {indicator.match_subcategories_to ? <h4>Subcategories (matched with {indicator.prerequisites.find(p => p.id === indicator.match_subcategories_to)?.display_name ?? 'Unknown'})</h4> : 
                    <h4>Subcategories</h4>}
                    <ul>
                        {indicator.subcategories.map((cat) => (
                            <li key={cat.id}>{cat.name}</li>
                        ))}
                    </ul>
                </div>}
                
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <Link to={`/indicators/${id}/edit`}><ButtonHover noHover={<ImPencil />} hover={'Edit Details'} /></Link>
                    {!del && <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt /> } hover={'Delete Indicator'} forDelete={true} />}
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
                        <Link to={`/projects/${t.project.id}/organization/${t.organization.id}`}><h3>{t.display_name}</h3></Link>
                    </div>
                ))}
                {!projects || projects.length === 0 && <p><i>This indicator is not in any projects.</i></p>}
            </div>
            <div className={styles.spacer}></div>
        </div>
    )
}