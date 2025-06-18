import React from 'react';
import { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import { useProjects } from '../../contexts/ProjectsContext';
import fetchWithAuth from '../../../services/fetchWithAuth';
import Loading from '../reuseables/Loading';
import { useAuth } from '../../contexts/UserAuth';
import { Link } from 'react-router-dom';
import styles from './projectDetail.module.css';
import IndicatorIndex from '../indicators/IndicatorsIndex';
import OrganizationIndex from '../organizations/OrganizationsIndex';
function OrganizationsBar({ project, callback }){
    return(
        <div  className={styles.orgsBar}>
            <h2>Project Organizations</h2>
            <button onClick={() => callback('add-organization')}>Add an Organization</button>
            {project?.organizations.length > 0 ? project.organizations.map((org) => (
                <div key={org.id}  onClick={(org) => callback('view-organization', org)}>
                    <h3>{org.name}</h3>
                </div>
            )):
            <p>This project doesn't have any organizations yet.</p>
            }
        </div>
    )
}

function IndicatorsBar({ project, callback }){
    return(
        <div  className={styles.indBar}>
            <h2>Project Indicators</h2>
            <button onClick={() => callback('add-indicator')}>Add an Indicator</button>
            {project?.indicators.length > 0 ? project.indicators.map((ind) => (
                <div key={ind.id} onClick={(ind) => callback('view-indicator', ind)}>
                    <h3>{ind.code}: {ind.name}</h3>
                </div>
            )) :
            <p>This project doesn't have any indicators yet.</p>
            }
        </div>
    )
}


function AddIndicator({ project }){
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
    return <IndicatorIndex blacklist={projectIndicators} callback={(ind) => addIndicator(ind)} />
}

function AddOrganization({ project }){
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

function ViewIndicator({ project, indicator }){
    return (
        <div>
            <h3>{indicator.code}: {indicator.name}</h3>
            <h5>In project {project.name}</h5>
            <p>{indicator.description}</p>
            <p>Eventually, we'll add data related to the indicator based on interactions linked to the project.org</p>
        </div>
    )
}

function ViewOrganization({ project, organization }){
    return (
        <div>
            <h3>{organization.name}</h3>
            <button>Add a task for {organization.name} in {project.name}</button>
        </div>
    )
}

function ProjectInfo({ project }){
    const { user } = useAuth();
    return(
        <div>
            <i>Lasts from {project.start} to {project.end} {user.role =='admin' && '('+project.status+')'} </i>
            {project?.client && <h4>From {project.client.name}</h4>}
            <h5>Project Description</h5>
            <p>{project.description}</p>
            {user.role == 'admin' && <Link to={`/projects/${project.id}/edit`}><button>Edit Details</button></Link>}
        </div>
    )
}


function ProjectViewSwitch({ project, type, indicator=null, organization=null }) {
    if(type=='add-indicator') return <AddIndicator project={project} />
    if(type=='view-indicator' && indicator) return <ViewIndicator project={project} indicator = {indicator} />
    if(type == 'add-organization') return <AddOrganization project={project}  />
    if(type=='view-organization' && organization) return <ViewOrganization project={project} organization = {organization} />
    if(!type || type == 'project') return <ProjectInfo project={project} />
}

export default function ProjectDetail(){
    const { id } = useParams();
    const { projectDetails, setProjectDetails } = useProjects();
    const[activeProject, setActiveProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeIndicator, setActiveIndicator] = useState(null);
    const [activeOrganization, setActiveOrganization] = useState(null);

    const [type, setType ] = useState('project');

    useEffect(() => {
        const getProjectDetails = async () => {
        const found = projectDetails.find(p => p.id.toString() === id.toString());
            if (found) {
                setActiveProject(found);
                setLoading(false);
                return;
            }
            else{
                try {
                    console.log('fetching project details...');
                    const response = await fetchWithAuth(`/api/manage/projects/${id}/`);
                    const data = await response.json();
                    setProjectDetails(prev => [...prev, data]);
                    setActiveProject(data);
                    setLoading(false);
                } 
                catch (err) {
                    console.error('Failed to fetch project: ', err);
                    setLoading(false)
                } 
            }
        };
        getProjectDetails();
    }, [id, projectDetails, activeIndicator, activeOrganization])

    if(loading) return <Loading /> 
    return(
        <div className={styles.projectDetails}>
            <OrganizationsBar project={activeProject} callback={(t, org) => {setType(t); setActiveOrganization(org)}}/>
            <div>
                <h2>{activeProject.name}</h2>
                <ProjectViewSwitch project={activeProject} type={type} indicator={activeIndicator} organization={activeOrganization}/>
            </div>
            <IndicatorsBar project={activeProject} callback={(t, ind) => {setType(t); setActiveIndicator(ind)}}/>
            
        </div>
    )
}