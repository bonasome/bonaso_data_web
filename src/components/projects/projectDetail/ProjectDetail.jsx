import React from 'react';
import { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import { useProjects } from '../../../contexts/ProjectsContext';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import Loading from '../../reuseables/Loading';
import { useAuth } from '../../../contexts/UserAuth';
import { Link } from 'react-router-dom';
import styles from './projectDetail.module.css';
import { ViewIndicator, IndicatorsBar, AddIndicator } from './ProjectIndicators';
import { ViewOrganization, OrganizationsBar, AddOrganization, OrganizationTasks } from './ProjectOrganizations';


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
            <div className={styles.panel}>
                <h1 onClick={() => setType('project')} className={styles.projectHeader}>{activeProject.name}</h1>
                <ProjectViewSwitch project={activeProject} type={type} indicator={activeIndicator} organization={activeOrganization}/>
            </div>
            <IndicatorsBar project={activeProject} callback={(t, ind) => {setType(t); setActiveIndicator(ind)}}/>
        </div>
    )
}
