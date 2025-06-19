import React from 'react';
import { useEffect, useState } from "react";
import { useProjects } from '../../../contexts/ProjectsContext';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import { useAuth } from '../../../contexts/UserAuth';
import IndicatorsIndex from '../../indicators/IndicatorsIndex';
import styles from './projectDetail.module.css';

function IndicatorCard({ indicator, callback }){
    const handleDragStart = (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(indicator));
    };

    return(
        <div className={styles.card} draggable onDragStart={handleDragStart} onClick={() => callback('view-indicator', indicator)}>
            <h3>{indicator.code}: {indicator.name}</h3>
        </div>
    )
}

export function IndicatorsBar({ project, callback }){
    return(
        <div  className={styles.sidebar}>
            <h2>Project Indicators</h2>
            <button onClick={() => callback('add-indicator')}>Add an Indicator</button>
            {project?.indicators.length > 0 ? project.indicators.map((ind) => (
                <IndicatorCard key={ind.id} indicator={ind} callback={callback}/>
            )) :
            <p>This project doesn't have any indicators yet.</p>
            }
        </div>
    )
}


export function AddIndicator({ project }){
    const { setProjectDetails } = useProjects();

    const [projectIndicators, setProjectIndicators] = useState([]);
    console.log(project)
    useEffect(() => {
        if(project?.indicators.length > 0){
            const ids = project.indicators.map((ind) => ind.id)
            setProjectIndicators(ids)
        }
    }, [project])
    console.log(projectIndicators)
    const addIndicator = async (ind) => {
        console.log('adding indicator...', ind)
        try{
            const response = await fetchWithAuth(`/api/manage/projects/${project.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'indicator_id': [ind.id]
                })
            });
            if(response.ok){
                setProjectDetails(prevState =>
                    prevState.map(p =>
                    p.id === project.id
                        ? {
                            ...p,
                            indicators: [...(p.indicators || []), ind],
                        }
                        : p
                    )
                );
                setProjectIndicators(prev => [...prev, ind.id]);
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
    return <IndicatorsIndex blacklist={projectIndicators} callback={(ind) => addIndicator(ind)} />
}


export function ViewIndicator({ project, indicator }){
    const {user} = useAuth();
    return (
        <div>
            <h3>{indicator.code}: {indicator.name}</h3>
            <h5>In project {project.name}</h5>
            <p>{indicator.description}</p>
            <p>Eventually, we'll add data related to the indicator based on interactions linked to the project.org</p>
            {user.role =='admin' && <p>Admins will see a component here related to general indicators</p>}
            {['meofficer, manager'].includes(user.role) && <p>Organizations will see a component here related to their tasks</p>}
        </div>
    )
}