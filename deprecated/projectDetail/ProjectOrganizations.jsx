import React from 'react';
import { useEffect, useState, useCallback } from "react";
import { useProjects } from '../../../contexts/ProjectsContext';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import { useAuth } from '../../../contexts/UserAuth';
import OrganizationIndex from '../../organizations/OrganizationsIndex';
import Tasks from '../../tasks/Tasks';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import styles from './projectDetail.module.css';
import errorStyles from '../../../styles/errors.module.css'
import NarrativeReportDownload from '../../narrativeReports/NarrativeReportDownload';
import { BiSolidShow } from "react-icons/bi";
import { BiSolidHide } from "react-icons/bi";
import useWindowWidth from '../../../../services/useWindowWidth';
import { Link } from 'react-router-dom';
import IndicatorChart from '../../reuseables/charts/IndicatorChart';

export function OrganizationsBar({ project, callback, visChange, activeOrganization }){
    const[sbVisible, setSBVisible] = useState(true);
    const [search, setSearch] = useState('');
    const width = useWindowWidth();
    const filtered = project?.organizations?.length > 0 ? project.organizations.filter(o => o.name.toLowerCase().includes(search.toLowerCase())) : []
    return(
        <div  className={styles.sidebarLeft}>
            {sbVisible && <div>
                <h2>Project Organizations</h2>
                <button onClick={() => callback('add-organization')}>Add an Organization</button>
                {project?.organizations.length > 0 && 
                    <div>
                        <label htmlFor='search'>Search</label>
                        <input id='search' type='text' value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                }
                {project?.organizations.length > 0 ? filtered.map((org) => (
                    <div key={org.id} className={org.id == activeOrganization?.id ? styles.activeCard : styles.card} onClick={() => callback('view-organization', org)}>
                        <h3>{org.name}</h3>
                    </div>
                )):
                <p>This project doesn't have any organizations yet.</p>
                }
            </div>}
            {width > 500 && <div className={styles.toggle} onClick={() => {setSBVisible(!sbVisible); visChange(!sbVisible)}}>
                {sbVisible ? <BiSolidHide /> : <BiSolidShow />}
            </div>}
        </div>
    )
}

export function AddOrganization({ project }){
    const { setProjectDetails } = useProjects();
    const [projectOrgs, setProjectOrgs] = useState([]);
    const [errors, setErrors] = useState([]);

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
                    setProjectOrgs(prev => [...prev, org.id]);
                    setErrors([]);
                }
                else{
                    const data = await response.json();
                    let serverResponse = [];
                    for (const field in data) {
                        if (Array.isArray(data[field])) {
                            data[field].forEach(msg => {
                                serverResponse.push(`${field}: ${msg}`);
                            });
                        } 
                        else {
                        serverResponse.push(`${field}: ${data[field]}`);
                        }
                    }
                    setErrors(serverResponse);
                }
            }
            catch(err){
                console.error('Failed to remove indicator:', err);
                setErrors(['Something went wrong. Please try again later.'])
            }
    }
    return (
        <div>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <OrganizationIndex excludeProject={project.id} excludeProjectTrigger={projectOrgs} callback={(org) => addOrganization(org)} />
        </div>
    )
    
}

export function OrganizationTasks({ project, organization, setAddingTask }){
    const width = useWindowWidth();

    const [orgTasks, setOrgTasks] = useState([]);
    const [errors, setErrors] = useState([]);
    const [reload, setReload] = useState(1);
    const [success, setSuccess] = useState('')
    const { user } = useAuth();
    const loadTasks = (data) => {
        setOrgTasks(data);
    }

    console.log(organization)
    const handleDrop = async(e) => {
        e.preventDefault();
        const indicator = JSON.parse(e.dataTransfer.getData('application/json'));
        handleAdd(indicator)
    }

    const handleAdd = useCallback(async (indicator) => {
        if(!['meofficer', 'manager', 'admin'].includes(user.role)){return;}
        setSuccess('')
        setErrors([])
        let taskErrors = []
        console.log(indicator, organization)
        const forbidden = orgTasks.map((task) => task.indicator.id);
        if(forbidden.includes(indicator.id)){
            taskErrors.push('Cannot assign the same indicator to the same org twice!')
            setErrors(taskErrors);
            return;
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
                setSuccess('Task added!')
            }
            else{
                let serverResponse = [];
                if(Array.isArray(returnData)){
                    setErrors(returnData);
                    return;
                }
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
                setErrors(serverResponse);
            }
        }
        catch(err){
            console.error('Could not record respondent: ', err)
        }
        setErrors(taskErrors);
    }, [organization, orgTasks, project, user]);

    useEffect(() => {
        setAddingTask(() => handleAdd)
    }, [handleAdd, setAddingTask])

    
    const handleDragOver = (e) => {
        e.preventDefault(); // Required to allow drop
    };

    return(
        <div>
            {!['client'].includes(user.role) && width > 768 && (user.role === 'admin' || user.organization_id === organization?.parent_organization?.id) && <div className={styles.addTask}>
                <h3>Add Tasks</h3>
                <div className={styles.dropZone} onDrop={handleDrop} onDragOver={handleDragOver} style={{ border: '2px dashed gray', height: '100px', padding: '10px' }}>
                    <p>Drag an indicator from the sidebar to assign it to this organization.</p>
                </div>
            </div>}
            <div className={styles.tasksContainer}>
                <Tasks className={styles.tasks} callback={loadTasks} update={reload} organizationID={organization.id} projectID={project.id} target={true} canDelete={true} onError={errors} onSuccess={success}/>
            </div>
        </div>
    )
    
}

export function OrganizationPerformance({ project, organization, setViewingInd }){
    const [indicator, setIndicator] = useState(null)
    const width = useWindowWidth();
    const {user} = useAuth();
    const handleDrop = async (e) => {
        e.preventDefault();
        const indicatorPackage = JSON.parse(e.dataTransfer.getData('application/json'));
        setIndicator(indicatorPackage)
    }
    useEffect(() => {
        setViewingInd(() => setIndicator)
    }, [setViewingInd])
    const handleDragOver = (e) => {
        e.preventDefault(); // Required to allow drop
    };
    return(
        <div className={styles.viewbox}>
            <h3>Performance for <Link to={`/organizations/${organization.id}`}>{organization.name}</Link> during {project.name}</h3>
            {indicator && <h4><i>{indicator.name}</i></h4>}
            {indicator && <IndicatorChart indicatorID={indicator.id} organizationID={organization.id} projectID={project.id} />}
            {width > 768 && <div className={styles.dropZone} onDrop={handleDrop} onDragOver={handleDragOver} style={{ border: '2px dashed gray', height: '100px', padding: '10px', marginBottom: '30px' }}>
                <p>Drag an indicator from the sidebar to view {organization.name}'s performance.</p>
            </div>}
             {!['client'].includes(user.role) && (user.role === 'admin' || user.organization_id === organization?.parent_organization?.id) &&
             <Link to={`/projects/${project.id}/targets/${organization.id}`}><button>View/Set Targets for {organization.name}</button></Link>}
        </div>
    )
}
export function ViewOrganization({ project, organization, onRemove, setAddingTask, setViewingInd }){
    const { user } = useAuth();
    const [errors, setErrors] = useState([]);
    const [del, setDel] = useState(false);
    const { setProjectDetails } = useProjects();

    const removeOrg = async() => {
        try {
            console.log('deleting organization...');
            const response = await fetchWithAuth(`/api/manage/projects/${project.id}/remove-organization/${organization.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setProjectDetails(prevState =>
                    prevState.map(p =>
                    p.id === project.id
                        ? {
                            ...p,
                            organizations: p.organizations.filter(org => org.id != organization.id),
                        }
                        : p
                    )
                );
                onRemove();
            } 
            else {
                let data = {};
                try {
                    data = await response.json();
                } 
                catch {
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
            console.error('Failed to delete organization:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        setDel(false)
    }

    return (
        <div>
            {del && 
                <ConfirmDelete 
                    name={organization.name + ' from project ' + project.name} 
                    statusWarning={'If there are any active tasks, you will be prevented from doing this.'} 
                    onConfirm={() => removeOrg()} onCancel={() => setDel(false)} 
            />}
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {project.status === 'Active' && <OrganizationPerformance project={project} organization={organization} setViewingInd={setViewingInd}/>}
            <NarrativeReportDownload project={project} organization={organization} />
            <OrganizationTasks project={project} organization={organization} setAddingTask={setAddingTask}/>
            {user.role == 'admin' && <button className={errorStyles.deleteButton} onClick={() => setDel(true)}>Remove Organization From Project</button>}
        </div>
    )
}