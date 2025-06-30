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
import styles from './indicatorDetail.module.css';
import IndicatorChart from '../reuseables/charts/IndicatorChart';
import Checkbox from '../reuseables/Checkbox';
import { IoMdReturnLeft } from "react-icons/io";

export default function IndicatorDetail(){
    const { user } = useAuth();
    const { id } = useParams();
    const[loading, setLoading] = useState(true)
    const { indicatorDetails, setIndicatorDetails } = useIndicators();
    const[activeIndicator, setActiveIndicator] = useState(null);
    const [projects, setProjects] = useState([]);
    const [showTargets, setShowTargets] = useState(false);
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
                    console.log(data)
                    setIndicatorDetails(prev => [...prev, data]);
                    setActiveIndicator(data);
                } 
                catch (err) {
                    console.error('Failed to fetch indicator: ', err);
                } 
            }
        };
        getIndicatorDetails();

    }, [id, indicatorDetails, setIndicatorDetails]);

    useEffect(() => {
        const getProjects = async () => {
            if(!activeIndicator) return;
            try {
                console.log('fetching projects...');
                const response = await fetchWithAuth(`/api/manage/projects/?indicators=${activeIndicator.id}`);
                const data = await response.json();
                setProjects(data.results);
                setLoading(false);
            } 
            catch (err) {
                setErrors(['Something went wrong. Please try again later.'])
                console.error('Failed to fetch indicator: ', err);
                setLoading(false)
            } 
        };
        getProjects();
    }, [activeIndicator])

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
        <div className={styles.container}>
            {del && <ConfirmDelete name={activeIndicator.name} statusWarning={'We advise against deleting indicators. Instead, please consider setting its status as "deprecated".'} onConfirm={() => deleteIndicator()} onCancel={() => setDel(false)} />}
            <Link to={'/indicators'} className={styles.return}>
                <IoMdReturnLeft className={styles.returnIcon} />
                <p>Return to indicators overview</p>   
            </Link>
            <div className={styles.section}>
                <h1>{activeIndicator.code}: {activeIndicator.name}</h1>
                {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                <p>{activeIndicator.description}</p>
                {activeIndicator.subcategories.length > 0 && 
                    <ul>
                        {activeIndicator.subcategories.map((cat) => (
                            <li key={cat.id}>{cat.name}</li>
                        ))}
                    </ul>
                }
                <p><i>{activeIndicator.status}</i></p>
                <Link to={`/indicators/${id}/edit`}><button>Edit Details</button></Link>
                {user.role == 'admin' && <button className={errorStyles.deleteButton} onClick={() => setDel(true)} >Delete Indicator</button>}
                {user.role == 'admin' && 
                    <div>
                        <p><i>Created by: {activeIndicator.created_by?.first_name} {activeIndicator.created_by?.last_name} at {new Date(activeIndicator.created_at).toLocaleString()}</i></p>
                        {activeIndicator.updated_by && activeIndicator.updated_by && <p><i>Updated by: {activeIndicator.updated_by?.first_name} {activeIndicator.updated_by?.last_name} at {new Date(activeIndicator.updated_at).toLocaleString()}</i></p>}
                    </div>
                } 
            </div>
            {activeIndicator.status != 'Planned' && <div className={styles.section}>
                <h2>Performance Over Time</h2>
                <Checkbox label='Show Targets?' name="targets" checked={showTargets} callback={(c) => setShowTargets(c)} />
                <IndicatorChart indicator={activeIndicator} showTargets={showTargets}/>
            </div>}
            
            
            <div className={styles.section}>
                <h2>In projects</h2>
                {projects.length > 0 && projects.map((p) =>(
                    <div className={styles.card}>
                        <Link to={`/projects/${p.id}`}><h3>{p.name}</h3></Link>
                    </div>
                ))}
                {projects.length === 0 && <p><i>This indicator is not in any projects.</i></p>}
            </div>
            <div className={styles.spacer}></div>
        </div>
    )
}