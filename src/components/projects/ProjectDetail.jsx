import React from 'react';
import { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import { useProjects } from '../../contexts/ProjectsContext';
import fetchWithAuth from '../../../services/fetchWithAuth';
import prettyDates from '../../../services/prettyDates';
import Loading from '../reuseables/Loading';
import { useAuth } from '../../contexts/UserAuth';
import { Link } from 'react-router-dom';
import styles from './projectDetail.module.css';
import errorStyles from '../../styles/errors.module.css';
import { useNavigate } from 'react-router-dom';
import ConfirmDelete from '../reuseables/ConfirmDelete';
import { favorite, checkFavorited } from '../../../services/favorite';
import ButtonHover from '../reuseables/ButtonHover';
import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { IoMdReturnLeft, IoIosStar, IoIosStarOutline, IoIosSave, IoIosArrowDropup, IoIosArrowDropdownCircle } from "react-icons/io";
import ButtonLoading from '../reuseables/ButtonLoading';
import { FaCirclePlus } from "react-icons/fa6";
import OrganizationsIndex from '../organizations/OrganizationsIndex';

function ProjectOrgCard({ org, project }){
    const [expanded, setExpanded] = useState(false);
    if(org.children.length === 0){ return(
        <div>
            <Link to={`/projects/${project.id}/organizations/${org.id}`}><h3>{org.name}</h3></Link>
        </div>
    )}
    return(
        <div>
            <div className={styles.toggleDropdown} onClick={() => setExpanded(!expanded)}>
                <h3 style={{ textAlign: 'start'}}><Link to={`/projects/${project.id}/organizations/${org.id}`}><h3>{org.name}</h3></Link></h3>
                {expanded ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
            </div>
            {expanded && <div>
                {org.children.map((co) => (<ProjectOrgCard key={co.id} org={co} project={project} />))}
            </div>}
        </div>
    )
}

export default function ProjectDetail(){
    const { user } = useAuth()
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [del, setDel] = useState(false);
    const [errors, setErrors] = useState([]);
    const { projectDetails, setProjectDetails } = useProjects();
    const [project, setProject] = useState();
    const [activities, setActivities] = useState();
    const [favorited, setFavorited] = useState(false);

    const [showDetails, setShowDetails] = useState(true);
    const [showActivities, setShowActivities] = useState(false);
    const [showOrgs, setShowOrgs] = useState(false);
    const [addingOrgs, setAddingOrgs] = useState(false);

    useEffect(() => {
        const checkFavStatus = async() => {
            if(!project?.id) return;
            const isFavorited = await checkFavorited('project', project.id)
            setFavorited(isFavorited)
        }
        checkFavStatus()
    }, [project])
    
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
            setLoading(false)
        } 
    }
    const fetchProjectActivities = async () => {
        try {
            console.log('fetching project activities...');
            const response = await fetchWithAuth(`/api/manage/activities/?project=${id}`);
            const data = await response.json();
            if(response.ok){
                setActivities(data.results);
                console.log(data.results)
            }
            else{
                navigate(`/not-found`);
            }
            
        } 
        catch (err) {
            console.error('Failed to fetch project: ', err);
        } 
    }

    useEffect(() => {
        const getProjectDetails = async () => {
        const found = projectDetails.find(p => p.id.toString() === id.toString());
            if (found) {
                setProject(found);
                setLoading(false);
                return;
            }
            else{
                await fetchProject()
            }
        };
        getProjectDetails();
    }, [id]);
    
    useEffect(() => {
        const loadActivities = async () => {
            await fetchProjectActivities();
        }
        loadActivities()
    }, [id]);

    const addOrg = async (org) => {
        setErrors([])
       try{
        console.log('adding organization...')
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
                await fetchProject();
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
    console.log(project)
    if(loading || !project) return <Loading />
    return(
        <div className={styles.container}>
            {del && 
                <ConfirmDelete 
                    name={project.name} 
                    statusWarning={'If this project is active or has any tasks associated with it, you will not be allowed to delete it.'} 
                    onConfirm={() => deleteProject()} onCancel={() => setDel(false)} 
            />}

            <Link to={'/projects'} className={styles.return}>
                <IoMdReturnLeft className={styles.returnIcon} />
                <p>Return to projects overview</p>   
            </Link>
            <div className={styles.projectHeader}>
                <h1>{project.name}</h1>
            </div>

            <div className={styles.segment}>
                <div className={styles.toggleDropdown} onClick={() => setShowDetails(!showDetails)}>
                    <h3 style={{ textAlign: 'start'}}>Show Project Details</h3>
                    {showDetails ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                    <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                </div>
                    
                {showDetails && <div style={{ paddingLeft: '3vh', paddingRight: '3vh'}}>
                    <i>Lasts from {prettyDates(project.start)} to {prettyDates(project.end)} {user.role =='admin' && '('+project.status+')'} </i>
                    {project?.client && <h4>From <Link to={`/clients/${project.client.id}`}>{project.client.name}</Link></h4>}
                    <h5>Project Description</h5>
                    <p>{project.description}</p>
                    {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                    <div style={{ display: 'flex', flexDirection: 'row'}}>
                        {favorited && <ButtonHover callback={() => {setFavorited(false); favorite('project', project.id, true)}} noHover={<IoIosStar />} hover={'Unfavorite'} /> }
                        {!favorited && <ButtonHover callback={() => {setFavorited(true); favorite('project', project.id)}} noHover={<IoIosStarOutline />} hover={'Favorite'} /> }
                        {user.role == 'admin' && <Link to={`/projects/${project.id}/edit`}><ButtonHover noHover={<ImPencil />} hover={'Edit Project'} /></Link>}
                        {user.role == 'admin' && !del && <ButtonHover  callback={() => setDel(true)} forDelete={true} noHover={<FaTrashAlt />} hover={'Delete Project'}/>}
                        {del && <ButtonLoading forDelete={true} />}
                    </div>
                </div>}
            </div>

            <div className={styles.segment}>
                <div className={styles.toggleDropdown} onClick={() => setShowActivities(!showActivities)}>
                    <h3 style={{ textAlign: 'start'}}>Show Activities</h3>
                    {showActivities ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                    <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                </div>
                    
                {showActivities && <div style={{ paddingLeft: '3vh', paddingRight: '3vh'}}>
                    <Link to={`/projects/${project.id}/activities/new`}><ButtonHover  noHover={<FaCirclePlus />} hover={'New Activity'} /></Link>
                    {!activities || activities.length === 0 && <p>No activities yet. Be the first to make one!</p>}
                    {activities && activities.length > 0 && 
                        activities.map((act) => (<div>
                            <h3>{act.name}</h3>
                            <Link to={`/projects/${project.id}/activities/${act.id}/edit`}><ButtonHover noHover={<ImPencil />} hover={'Edit Event'} /></Link>
                        </div>))
                    }
                </div>}
            </div>

            <div className={styles.segment}>
                <div className={styles.toggleDropdown} onClick={() => setShowOrgs(!showOrgs)}>
                    <h3 style={{ textAlign: 'start'}}>Show Organizations</h3>
                    {showOrgs ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                    <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                </div>
                    
                {showOrgs && <div style={{ paddingLeft: '3vh', paddingRight: '3vh'}}>
                    {!addingOrgs && <ButtonHover callback={() => setAddingOrgs(true)} noHover={<FaCirclePlus />} hover={'Add an Organization'} />}
                    {addingOrgs && <ButtonHover callback={() => setAddingOrgs(false)} noHover={<FaCirclePlus />} hover={'Done'} />}
                    {addingOrgs && <OrganizationsIndex callback={(org) => addOrg(org)} callbackText='Add to Project' />}
                    {project.organizations.map((org) => (
                        <ProjectOrgCard key={org.id} org={org} project={project} />
                    ))}
                </div>}
            </div>
            
            {!['client'].includes(user.role) && <Link to={`/projects/${project.id}/narrative-reports/upload`} ><button>Upload a Narrative Report for this Project</button></Link>}
        </div>
    )
}