import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";

import { useProjects } from "../../contexts/ProjectsContext";
import { useAuth } from "../../contexts/UserAuth";

import fetchWithAuth from "../../../services/fetchWithAuth";

import Tasks from "../tasks/Tasks";
import ButtonHover from '../reuseables/inputs/ButtonHover';
import Loading from "../reuseables/loading/Loading";
import ConfirmDelete from "../reuseables/ConfirmDelete";
import NarrativeReportDownload from '../narrativeReports/NarrativeReportDownload';
import Targets from "./targets/Targets";
import Messages from '../reuseables/Messages';
import ReturnLink from '../reuseables/ReturnLink';
import { AssignTask, AssignChild } from './AssignModals'; 
import styles from './projectDetail.module.css';

import { FaAngleDoubleUp } from "react-icons/fa";
import { BsFillBuildingsFill } from "react-icons/bs";
import { MdAssignmentAdd } from "react-icons/md";
import { IoIosArrowDropup, IoIosArrowDropdownCircle, IoIosRemoveCircle } from "react-icons/io";

//page for viewing project+organization specific information (tasks, view children, set targets)
export default function ProjectOrganization(){
    const navigate = useNavigate();

    //params, id=project id, orgID=organization id
    const { id, orgID } = useParams();
    //context
    const { user } = useAuth();
    const {projectDetails, setProjectDetails} = useProjects();
    
    //project/organization details
    const [project, setProject] = useState();
    const [loading, setLoading] = useState();

    //page meta
    const [taskSuccess, setTaskSuccess] = useState([]);
    const [coSuccess, setCOSuccess] = useState([]);
    const [errors, setErrors] = useState([]);
    const [del, setDel] = useState(false);
    const [updateTasks, setUpdateTasks] = useState(0);//trigger to call tasks again
    
    //contorl visibility of index components for adding
    const [addingTask, setAddingTask] = useState(false); //adding a task
    const [addingChildOrg, setAddingChildOrg] = useState(false); //adding a subgrantee

    //controls which sections are visible
    const [showTasks, setShowTasks] = useState(false);
    const [showChildOrgs, setShowChildOrgs] = useState(false);
    const [showTargets, setShowTargets] = useState(false);
    const [showFiles,setShowFiles] = useState(false);
    
    //see if redirected from a create view and if so automatically put subgrantees into view
    const [searchParams] = useSearchParams();
    const startAdding = searchParams.get('adding');

    useEffect(() => {
        if(startAdding && startAdding.toString() == 'true'){
            setAddingChildOrg(true);
            setShowChildOrgs(true);
        }
    }, [startAdding]);

    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);
    
    //get project details
    const fetchProject = async () => {
        try {
            console.log('fetching project details...');
            const response = await fetchWithAuth(`/api/manage/projects/${id}/`);
            const data = await response.json();
            if(response.ok){
                setProjectDetails(prev => [...prev, data]);
                setProject(data);
            }
            else{
                navigate(`/not-found`);
            }
            
        } 
        catch (err) {
            console.error('Failed to fetch project: ', err);
            setErrors(['Something went wrong. Please try again later.']);
            
        } 
        finally{
            setLoading(false);
        }
    }

    //get project once on load
    useEffect(() => {
        const getProjectDetails = async () => {
            await fetchProject()
        };
        getProjectDetails();
    }, [id]);

    //find this organization from the project and pull its parent org if applicable
    //server sends in a nested fromat going parent --> children
    const organization = useMemo(() => {
        if (!project || !project.organizations || project.organizations.length === 0) return null;

        let org = project.organizations.find(org => org.id == orgID);

        if (org) return org;
        for (const parentOrg of project.organizations) {
            const child = parentOrg.children?.find(childOrg => childOrg.id == orgID);
            if (child) return child;
        }

        return null;
    }, [project, orgID]);

    //contorl certain components visibility. parents can contorl children and admins can contorl all
    //orgs cannot control their own page
    const hasPerm = useMemo(() => {
        if(!user || !organization) return false
        if(user.role === 'client') return false;
        if(user.role === 'admin') return true;
        if(organization?.parent?.id && user.organization_id == organization?.parent?.id) return true
        return false
    }, [user, organization]);

    //function for admins to make a child org a main project member
    const promoteChild = async () => {
        setErrors([]);
        try {
            console.log('promoting subgrantee...');
            const response = await fetchWithAuth(`/api/manage/projects/${id}/promote-org/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'organization_id': orgID,
                })
            });
            
            if(response.ok){
                await fetchProject()
            }
            else{
                const returnData = await response.json();
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
            console.error('Could not promote child: ', err);
            setErrors(['Something went wrong. Please try again later.']);
        }
    }

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
                navigate(`/projects/${id}`);
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

    if(loading || !project || !organization) return <Loading />
    return(
        <div className={styles.container}>
            
            {del && <ConfirmDelete name={'this organization from this project'} onConfirm={() => removeOrg()} onCancel={() => setDel(false)} />}

            <div className={styles.segment}>
                <ReturnLink url={`/projects/${id}`} display='Return to projects overview' /> 
                {organization.parent && <ReturnLink url={`/projects/${id}/organizations/${organization.parent?.id}`} display='Return to parent organization' />}   
                <h1>Viewing Page for {organization.name} for {project.name}</h1>
                <Messages errors={errors} />
            </div>

            <div className={styles.segment}>
                
                <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowTasks(!showTasks)}>
                        <h2 style={{ textAlign: 'start'}}>Tasks for {organization.name}</h2>
                        {showTasks ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                    {showTasks && <div style={{ margin: 40}}>
                        {hasPerm && <ButtonHover noHover={<MdAssignmentAdd />} hover={'Assign New Task(s)'} callback={() => setAddingTask(true)} />}
                        {addingTask && <AssignTask project={project} organization={organization} 
                            onSave={(data) => {
                                setUpdateTasks(prev => prev+=1); setTaskSuccess([`Successfuly assigned ${data.created.length} new tasks to ${organization.name}!`])
                            }} 
                            onClose={() => setAddingTask(false)}
                        />}
                        <Messages success={taskSuccess} />
                        <Tasks includeParams={[{field: 'organization', value: orgID}, {field: 'project', value: id}]} 
                            canDelete={hasPerm} updateTrigger={updateTasks}
                        />
                    </div>}
                </div>
                
                <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowTargets(!showTargets)}>
                        <h2 style={{ textAlign: 'start'}}>Targets for {organization.name}</h2>
                        {showTargets ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                    {showTargets && <div style={{ margin: 40}}>
                        <Targets organization={organization} project={project} />
                    </div>}
                </div>

                {!organization?.parent && <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowChildOrgs(!showChildOrgs)}>
                        <h2 style={{ textAlign: 'start'}}>Subgrantees</h2>
                        {showChildOrgs ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                    {showChildOrgs && <div style={{ margin: 20}}>
                        <Messages success={coSuccess} />
                        {((!organization.parent && user.organization_id===organization.id) || user.role === 'admin') && <ButtonHover noHover={<BsFillBuildingsFill />} hover={'Assign New Subgrantee(s)'} callback={() => setAddingChildOrg(true)} />}
                        {addingChildOrg && <AssignChild project={project} organization={organization} 
                            onSave={(data) => {fetchProject(); setCOSuccess(
                                [`Successfuly assigned ${data.added.length} new subgrantees. 
                                    ${data.reassigned.length > 0 ? `Reassigned ${data.reassigned.length} organizations.` : ''}`]
                            )}} onClose={() => setAddingChildOrg(false)}/>}
                        {organization.children.map((org) => (<div className={styles.orgCard}>
                            <Link to={`/projects/${id}/organizations/${org.id}`}><h3>{org.name}</h3></Link>
                        </div>))}
                        {organization.children.length === 0 && <p>No subgrantees yet.</p>}
                    </div>}
                </div>}

                <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowFiles(!showFiles)}>
                        <h2 style={{ textAlign: 'start'}}>File Uploads</h2>
                        {showFiles ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                    {showFiles && <div>
                        <NarrativeReportDownload project={project} organization={organization} />
                    </div>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    {user.role == 'admin' && organization.parent && <ButtonHover callback={() => promoteChild()} noHover={<FaAngleDoubleUp />} hover={'Promote to Coordinator'} />}
                    {hasPerm && <ButtonHover callback={() => setDel(true)} noHover={<IoIosRemoveCircle />} hover={'Remove Organization from Project'} forDelete={true} />}
                </div>
            </div>
        </div>
    )
}