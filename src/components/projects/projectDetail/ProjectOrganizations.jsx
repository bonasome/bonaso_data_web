import React from 'react';
import { useEffect, useState } from "react";
import { useProjects } from '../../../contexts/ProjectsContext';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import { useAuth } from '../../../contexts/UserAuth';
import OrganizationIndex from '../../organizations/OrganizationsIndex';
import Tasks from '../../tasks/Tasks';
import styles from './projectDetail.module.css';
import errorStyles from '../../../styles/errors.module.css'

export function OrganizationsBar({ project, callback }){
    return(
        <div  className={styles.sidebar}>
            <h2>Project Organizations</h2>
            <button onClick={() => callback('add-organization')}>Add an Organization</button>
            {project?.organizations.length > 0 ? project.organizations.map((org) => (
                <div key={org.id} className={styles.card} onClick={() => callback('view-organization', org)}>
                    <h3>{org.name}</h3>
                </div>
            )):
            <p>This project doesn't have any organizations yet.</p>
            }
        </div>
    )
}

export function AddOrganization({ project }){
    const { setProjectDetails } = useProjects();
    const [projectOrgs, setProjectOrgs] = useState([]);

    useEffect(() => {
        if(project?.organizations.length > 0){
            const ids = project.organizations.map((org) => org.id)
            setProjectOrgs(ids)
        }
    }, [project])

    const addOrganization = async (org) => {
        console.log('adding indicator...')
            try{
                const response = await fetchWithAuth(`/api/manage/projects/${project.id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': "application/json",
                    },
                    body: JSON.stringify({
                        'organization_id': [org.id]
                    })
                });
                if(response.ok){
                    setProjectDetails(prevState =>
                        prevState.map(p =>
                        p.id === project.id
                            ? {
                                ...p,
                                organizations: [...(p.organizations || []), org],
                            }
                            : p
                        )
                    );
                    setProjectOrgs(prev => [...prev, org.id])
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
    return <OrganizationIndex blacklist={projectOrgs} callback={(org) => addOrganization(org)} />
}

export function OrganizationTasks({ project, organization }){
    const [orgTasks, setOrgTasks] = useState([])
    const [errors, setErrors] = useState([])
    const [warnings, setWarnings] = useState([])
    const [reload, setReload] = useState(1)
    const { user } = useAuth();

    const loadTasks = (data) => {
        setOrgTasks(data);
    }
    const handleDrop = async (e) => {
        if(!['meofficer', 'manager', 'admin'].includes(user.role)){return;}
        let taskWarnings = []
        let taskErrors = []
        e.preventDefault();
        const indicator = JSON.parse(e.dataTransfer.getData('application/json'));
        const forbidden = orgTasks.map((task) => task.indicator.id);
        if(forbidden.includes(indicator.id)){
            taskErrors.push('Cannot assign the same indicator to the same org twice!')
            setErrors(taskErrors);
            return;
        }
        if(indicator?.prerequisite && !forbidden.includes(indicator?.prerequisite?.id)){
            taskWarnings.push(`${indicator.prerequisite.name} is required for this task. Please make sure you add it.`)
        }
        try {
            console.log('assigning task...');
            const response = await fetchWithAuth(`/api/manage/tasks/`, {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'organization_id': organization.id,
                    'indicator_id': indicator.id,
                    'project_id': project.id
                })
            });
            const returnData = await response.json();
            if(response.ok){
                setOrgTasks(prev => [...prev, returnData])
                setReload(prev => prev + 1);
            }
            else{
                console.log(returnData);
            }
        }
        catch(err){
            console.error('Could not record respondent: ', err)
        }
        setWarnings(taskWarnings);
        setErrors(taskErrors);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Required to allow drop
    };

    return(
        <div>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {warnings.length != 0 && <div className={errorStyles.warnings}><ul>{warnings.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            
            <div className={styles.addTask}>
                <h3>Add Tasks</h3>
                <div className={styles.dropZone} onDrop={handleDrop} onDragOver={handleDragOver} style={{ border: '2px dashed gray', height: '100px', padding: '10px' }}>
                    <p>Drag an indicator from the sidebar to assign it to this organization.</p>
                </div>
            </div>
            <div className={styles.tasksContainer}>
                <Tasks className={styles.tasks} callback={loadTasks} update={reload} organization={organization} target={true}/>
            </div>
        </div>
    )
    
}

export function ViewOrganization({ project, organization }){
    return (
        <div>
            <h3>Viewing as {organization.name}</h3>
            {organization?.child_organizations.length > 0 && 
                <div>
                <h4>Child Organizations</h4>
                <ul>
                    {organization.child_organizations.map((org) => <li key={org.id}>{org.name}</li>)}
                </ul>
                </div>
            }
            <OrganizationTasks project={project} organization={organization} />
        </div>
    )
}