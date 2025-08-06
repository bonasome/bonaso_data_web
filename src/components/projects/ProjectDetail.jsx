import React from 'react';
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth';
import { useProjects } from '../../contexts/ProjectsContext';

import fetchWithAuth from '../../../services/fetchWithAuth';
import prettyDates from '../../../services/prettyDates';
import { favorite, checkFavorited } from '../../../services/favorite';

import Loading from '../reuseables/loading/Loading';
import ButtonLoading from '../reuseables/loading/ButtonLoading';
import ConfirmDelete from '../reuseables/ConfirmDelete';
import Messages from '../reuseables/Messages';
import ReturnLink from '../reuseables/ReturnLink';
import UpdateRecord from '../reuseables/meta/UpdateRecord';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import AnnouncementsIndex from '../messages/announcements/AnnouncementsIndex';
import ProjectDeadlineIndex from './deadlines/ProjectDeadlineIndex';
import ProjectActivityIndex from './activities/ProjectActivityIndex';
import ProjectActivityFAGantt from './activities/ProjectActivityFAGantt';
import { AssignOrgToProject } from './AssignModals';

import styles from './projectDetail.module.css';

import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { IoIosStar, IoIosStarOutline,  IoIosArrowDropup, IoIosArrowDropdownCircle, IoIosCheckbox } from "react-icons/io";

import { BsFillBuildingsFill } from "react-icons/bs";

//card to help manage project orgs
function ProjectOrgCard({ org, project }){
    //control expansion
    const [expanded, setExpanded] = useState(false);

    //return shorter version if no children
    if(org.children.length === 0){ return(
        <div className={styles.orgCard}>
            <Link to={`/projects/${project.id}/organizations/${org.id}`}><h3>{org.name}</h3></Link>
        </div>
    )}
    return(
        <div className={styles.infoCard}>
            <div onClick={() => setExpanded(!expanded)} style={{ display: 'flex', flexDirection: 'row'}}>
                <Link to={`/projects/${project.id}/organizations/${org.id}`}><h3>{org.name}</h3></Link>
                {expanded ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
            </div>

            {expanded && <div>
                {org.children.map((co) => (<div key={co.id} className={styles.orgCard2} > 
                    <Link to={`/projects/${project.id}/organizations/${co.id}`}><h4>{co.name}</h4></Link>
                </div>))}
            </div>}
        </div>
    )
}

//full detail page
export default function ProjectDetail(){
    const navigate = useNavigate();
    //project id
    const { id } = useParams();
    //context
    const { user } = useAuth();
    const { setProjectDetails } = useProjects();
    //details about the project and related content
    const [project, setProject] = useState();
    const [activities, setActivities] = useState([]);
    const [deadlines, setDeadlines] = useState([])
    //control adding orgaizations
    const [addingOrgs, setAddingOrgs] = useState(false);
    //control dropdowns
    const [showAnnouncements, setShowAnnouncements] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [showActivities, setShowActivities] = useState(false);
    const [showDeadlines, setShowDeadlines] = useState(false);
    const [showOrgs, setShowOrgs] = useState(false);
    //page meta
    const [loading, setLoading] = useState(false);
    const [del, setDel] = useState(false);
    const [errors, setErrors] = useState([]);
    const [favorited, setFavorited] = useState(false);

    //check if the project is favorited
    useEffect(() => {
        const checkFavStatus = async() => {
            if(!project?.id) return;
            const isFavorited = await checkFavorited('projects.project', project.id)
            setFavorited(isFavorited)
        }
        checkFavStatus();
    }, [project]);
    
    //function to get the project
    const fetchProject = async () => {
        try {
            console.log('fetching project details...');
            const response = await fetchWithAuth(`/api/manage/projects/${id}/`);
            const data = await response.json();
            if(response.ok){
                setProjectDetails(prev => [...prev, data]);
                setProject(data);
                setLoading(false);
            }
            else{
                navigate(`/not-found`);
            }
        } 
        catch (err) {
            console.error('Failed to fetch project: ', err);
            setErrors(['Something went wrong. Please try again later.']);
            setLoading(false)
        } 
    }

    //load project on init
    useEffect(() => {
        const getProjectDetails = async () => {
            await fetchProject()
        };
        getProjectDetails();
    }, [id]);

    //function to delete the project
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
            setErrors(['Something went wrong. Please try again later.']);
        }
        finally{
            setDel(false);
        }
    } 

    if(loading || !project) return <Loading />
    return(
        <div className={styles.container}>

            {del && 
                <ConfirmDelete 
                    name={project.name} 
                    statusWarning={'If this project is active or has any tasks associated with it, you will not be allowed to delete it.'} 
                    onConfirm={() => deleteProject()} onCancel={() => setDel(false)} 
            />}
            
            <div className={styles.projectHeader}>
                <ReturnLink url={'/projects'} display='Return to projects overview' />
                <h1>{project.name}</h1>
                <Messages errors={errors} />
            </div>

            <div className={styles.segment}>
                <h2>Project Roadmap</h2>
                <ProjectActivityFAGantt project={project} activities={activities} deadlines={deadlines}/> 
            </div>

            <div className={styles.segment}>
                <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowAnnouncements(!showAnnouncements)}>
                        <h3 style={{ textAlign: 'start'}}>Announcements</h3>
                        {showAnnouncements ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                    
                    {showAnnouncements && <div style={{ paddingLeft: '3vh', paddingRight: '3vh'}}>
                        <AnnouncementsIndex project={project} />
                    </div>}
                </div>

                <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowDetails(!showDetails)}>
                        <h3 style={{ textAlign: 'start'}}>Project Details</h3>
                        {showDetails ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                        
                    {showDetails && <div style={{ paddingLeft: '3vh', paddingRight: '3vh'}}>
                        <i>Lasts from {prettyDates(project.start)} to {prettyDates(project.end)} {user.role =='admin' && '('+project.status+')'} </i>
                        {project?.client && <h4>From <Link to={`/clients/${project.client.id}`}>{project.client.name}</Link></h4>}
                        <h4>Project Description</h4>
                        {project.description ? <p>{project.description}</p> : <p>No description yet.</p>}
                        <div style={{ display: 'flex', flexDirection: 'row'}}>
                            {favorited && <ButtonHover callback={() => {setFavorited(false); favorite('projects.project', project.id, true)}} noHover={<IoIosStar />} hover={'Unfavorite'} /> }
                            {!favorited && <ButtonHover callback={() => {setFavorited(true); favorite('projects.project', project.id)}} noHover={<IoIosStarOutline />} hover={'Favorite'} /> }
                            {user.role == 'admin' && <Link to={`/projects/${project.id}/edit`}><ButtonHover noHover={<ImPencil />} hover={'Edit Project'} /></Link>}
                            {user.role == 'admin' && !del && <ButtonHover  callback={() => setDel(true)} forDelete={true} noHover={<FaTrashAlt />} hover={'Delete Project'}/>}
                        </div>
                        <UpdateRecord created_at={project.created_at} created_by={project.created_by} updated_by={project.updated_by}
                            updated_at={project.updated_at}/>
                    </div>}
                </div>

                <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowActivities(!showActivities)}>
                        <h3 style={{ textAlign: 'start'}}>Activities</h3>
                        {showActivities ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                        
                    {showActivities && <div style={{ paddingLeft: '3vh', paddingRight: '3vh'}}>
                        <ProjectActivityIndex project={project} />
                    </div>}
                </div>
                
                <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowDeadlines(!showDeadlines)}>
                        <h3 style={{ textAlign: 'start'}}>Deadlines</h3>
                        {showDeadlines ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                        
                    {showDeadlines && <div style={{ paddingLeft: '3vh', paddingRight: '3vh'}}>
                        <ProjectDeadlineIndex project={project} />
                    </div>}
                </div>

                <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowOrgs(!showOrgs)}>
                        <h3 style={{ textAlign: 'start'}}>Organizations</h3>
                        {showOrgs ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                        
                    {showOrgs && <div style={{ paddingLeft: '3vh', paddingRight: '3vh'}}>
                        {!addingOrgs && user.role == 'admin' && 
                            <ButtonHover callback={() => setAddingOrgs(true)} noHover={<BsFillBuildingsFill />} hover={'Add an Organization'} />}
                        {addingOrgs && <button onClick={() => setAddingOrgs(false)}> <IoIosCheckbox /> Done </button>}
                        {addingOrgs && <AssignOrgToProject onSave={fetchProject} 
                            onClose={() => setAddingOrgs(false)} project={project}
                        />}
                        {project.organizations.map((org) => (
                            <ProjectOrgCard key={org.id} org={org} project={project} />
                        ))}
                    </div>}
                </div>
            </div>
        </div>
    )
}