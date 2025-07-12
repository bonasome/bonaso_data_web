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
import errorStyles from '../../../styles/errors.module.css';
import { useNavigate } from 'react-router-dom';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import { IoMdReturnLeft } from "react-icons/io";
import useWindowWidth from '../../../../services/useWindowWidth';
import prettyDates from '../../../../services/prettyDates';
import ButtonLoading from '../../reuseables/ButtonLoading';

function ProjectInfo({ project }){
    const navigate = useNavigate();
    const [errors, setErrors] = useState([]);
    const [del, setDel] = useState(false);

    const deleteProject = async() => {
        try {
            console.log('deleting organization...');
            const response = await fetchWithAuth(`/api/manage/projects/${project.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                navigate('/projects');
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
                    } 
                    else {
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
        finally{
            setDel(false);
        }
    } 

    const { user } = useAuth();
    return(
        <div className={styles.viewbox}>
            {del && 
                <ConfirmDelete 
                    name={project.name} 
                    statusWarning={'If this project is active or has any tasks associated with it, you will not be allowed to delete it.'} 
                    onConfirm={() => deleteProject()} onCancel={() => setDel(false)} 
            />}
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <i>Lasts from {prettyDates(project.start)} to {prettyDates(project.end)} {user.role =='admin' && '('+project.status+')'} </i>
            {project?.client && <h4>From <Link to={`/clients/${project.client.id}`}>{project.client.name}</Link></h4>}
            <h5>Project Description</h5>
            <p>{project.description}</p>
            {user.role == 'admin' && <Link to={`/projects/${project.id}/edit`}><button>Edit Details</button></Link>}
            {user.role == 'admin' && !del && <button className={errorStyles.deleteButton} onClick={()=> setDel(true)} >Delete</button>}
            {del && <ButtonLoading forDelete={true} />}
            {!['client'].includes(user.role) && <Link to={`/projects/${project.id}/narrative-reports/upload`} ><button>Upload a Narrative Report for this Project</button></Link>}
        </div>
    )
}

function ProjectViewSwitch({ project, type, onRemove, indicator=null, organization=null, setAddingTask, setViewingInd }) {
    if(type=='add-indicator') return <AddIndicator project={project} />
    if(type=='view-indicator' && indicator) return <ViewIndicator project={project} indicator = {indicator} onRemove={onRemove}/>
    if(type == 'add-organization') return <AddOrganization project={project}  />
    if(type=='view-organization' && organization) return <ViewOrganization project={project} organization = {organization} onRemove={onRemove} setAddingTask={setAddingTask} setViewingInd={setViewingInd}/>
    if(!type || type == 'project') return <ProjectInfo project={project} />
}

export default function ProjectDetail(){
    const { id } = useParams();
    const navigate = useNavigate();

    const { projectDetails, setProjectDetails } = useProjects();
    const[activeProject, setActiveProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeIndicator, setActiveIndicator] = useState(null);
    const [activeOrganization, setActiveOrganization] = useState(null);
    const [type, setType ] = useState('project');
    const[leftVisible, setLeftVisible] =useState(true);
    const [rightVisible, setRightVisible] = useState(true);
    const [addingTask, setAddingTask] = useState(() => () => {});
    const [viewingInd, setViewingInd] = useState(() => () => {});
    const width = useWindowWidth();

    const handleButtonAdd = (task) => {
        addingTask(task);
    };
    const handleButtonView = (indicator) => {
        viewingInd(indicator);
    };

    const getGridTemplate = () => {
        if(width < 500) return '100%'
        if (leftVisible && rightVisible) return '20% 60% 20%';
        if (leftVisible && !rightVisible) return '20% 75% 5%';
        if (!leftVisible && rightVisible) return '5% 75% 20%';
        return '5% 90% 5%';
    };
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
                    if(response.ok){
                        setProjectDetails(prev => [...prev, data]);
                        setActiveProject(data);
                        setLoading(false);
                    }
                    else{
                        navigate(`/not-found`);
                    }
                    
                } 
                catch (err) {
                    console.error('Failed to fetch project: ', err);
                    setLoading(false)
                } 
            }
        };
        getProjectDetails();
    }, [id, projectDetails, activeIndicator, activeOrganization])

    const switchActive = (viewType, data) => {
        setType(viewType)
        if(viewType === 'view-indicator'){
            setActiveOrganization(null);
            setActiveIndicator(data);
        } 
        else if(viewType === 'view-organization') {
            setActiveIndicator(null);
            setActiveOrganization(data);
        }
        else{
            setActiveIndicator(null);
            setActiveOrganization(null)
        }
    }

    if(loading) return <Loading /> 
    return(
        <div className={styles.projectDetails} style={{ gridTemplateColumns: getGridTemplate() }}>
            {width >= 500 && <OrganizationsBar project={activeProject} callback={(t, org) => switchActive(t, org)} visChange={(vis) => setLeftVisible(vis)} activeOrganization={activeOrganization}/>}
            <div className={styles.panel}>
                <Link to={'/projects'} className={styles.return}>
                    <IoMdReturnLeft className={styles.returnIcon} />
                    <p>Return to projects overview</p>   
                </Link>
                <Link><h1 onClick={() => switchActive('project', null)} className={styles.projectHeader}>{activeProject.name}</h1></Link>
                <ProjectViewSwitch project={activeProject} type={type} indicator={activeIndicator} organization={activeOrganization} onRemove={() => setType('project')} setAddingTask={setAddingTask} setViewingInd={setViewingInd}/>
            </div>
            <IndicatorsBar project={activeProject} callback={(t, ind) => switchActive(t, ind)} visChange={(vis) => setRightVisible(vis)} activeOrganization={activeOrganization} activeIndicator={activeIndicator} buttonAdd={handleButtonAdd} buttonViewChart={handleButtonView}/>
            {width <500 && <OrganizationsBar project={activeProject} callback={(t, org) => switchActive(t, org)} visChange={(vis) => setLeftVisible(vis)} activeOrganization={activeOrganization}/>}
        </div>
    )
}
