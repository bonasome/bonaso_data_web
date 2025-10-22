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
    /*
    This component displays a page that gives project details that are specific to an organization.
    It takes an id URL param to identify the project and an orgID param to identify the organization.
    */
    const navigate = useNavigate();

    //params, id=project id, orgID=organization id
    const { id, orgID } = useParams();
    //context
    const { user } = useAuth();
    const { setProjectDetails } = useProjects();
    
    //project  details
    const [project, setProject] = useState();

    //page meta
    const [taskSuccess, setTaskSuccess] = useState([]);
    const [coSuccess, setCOSuccess] = useState([]);
    const [errors, setErrors] = useState([]);
    const [del, setDel] = useState(false);
    const [loading, setLoading] = useState();
    const [updateTasks, setUpdateTasks] = useState(0);//trigger to call tasks list again
    
    //contorl visibility of index components for adding
    const [addingIndTask, setAddingIndTask] = useState(false); //user is adding a standalone indicator task
    const [addingAssTask, setAddingAssTask] = useState(false); //user is adding an assessment task (these are seperated for clarity)
    const [addingChildOrg, setAddingChildOrg] = useState(false); //user is adding a subgrantee

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

    //check permissions for certain actions. parent orgs can contorl children and admins can contorl all
    //orgs cannot add tasks/targets for their own page, only children
    //assumes everyone on this page is either meofficer/manager, client, or admin
    const hasPerm = useMemo(() => {
        if(!user || !organization) return false
        if(user.role === 'client') return false;
        if(user.role === 'admin') return true;
        if(organization?.parent?.id && user.organization_id == organization?.parent?.id) return true
        return false
    }, [user, organization]);

    //function for admins to make a child org a top-level project member
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

    //remove this organization from the project
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
                {hasPerm && <ReturnLink url={`/projects/${id}/organizations/${organization.parent?.id}`} display='Return to parent organization' />}   
                <h1>Viewing Page for {organization.name} for {project.name}</h1>
                {organization?.parent?.id && <h3><i>Subgrantee of {organization.parent.name}</i></h3>}
                <Messages errors={errors} />
            </div>

            <div className={styles.segment}>
                
                <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowTasks(!showTasks)}>
                        <h2 style={{ textAlign: 'start'}}>Tasks for {organization.name}</h2>
                        {showTasks ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>

                    {showTasks && <div style={{ margin: '4vh'}}>
                        {hasPerm && !addingAssTask && !addingIndTask && <button onClick={() => setAddingAssTask(true)}><MdAssignmentAdd /> Assign New Assessment(s)</button>}
                        {addingAssTask && <AssignTask project={project} type={'assessment'} organization={organization} 
                            onUpdate={(data) => {
                                setUpdateTasks(prev => prev+=1); setTaskSuccess([`Successfully assigned ${data.created.length} new tasks to ${organization.name}!`])
                            }} 
                            onClose={() => setAddingAssTask(false)}
                        />}

                        {hasPerm && !addingIndTask && !addingAssTask && <button onClick={() => setAddingIndTask(true)}><MdAssignmentAdd /> Assign New Standalone Indicator(s)</button>}
                        {addingIndTask && <AssignTask project={project} type={'indicator'} organization={organization} 
                            onUpdate={(data) => {
                                setUpdateTasks(prev => prev+=1); setTaskSuccess([`Successfully assigned ${data.created.length} new tasks to ${organization.name}!`])
                            }} 
                            onClose={() => setAddingIndTask(false)}
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
                    {showTargets && <div style={{ margin: '4vh'}}>
                        <p><i>Search for targets by indicator or project.</i></p>
                        <Targets organization={organization} project={project} />
                    </div>}
                </div>

                {!organization?.parent && <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowChildOrgs(!showChildOrgs)}>
                        <h2 style={{ textAlign: 'start'}}>Subgrantees</h2>
                        {showChildOrgs ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                    {showChildOrgs && <div style={{ margin: '4vh'}}>
                        <Messages success={coSuccess} />
                        {((!organization.parent && user.organization_id===organization.id) || user.role === 'admin') && !addingChildOrg && <button onClick={() => setAddingChildOrg(true)}><BsFillBuildingsFill /> Assign New Subgrantee(s)</button>}
                        {addingChildOrg && <AssignChild project={project} organization={organization} 
                            onUpdate={(data) => {fetchProject(); setCOSuccess(
                                [`Successfully assigned ${data.added.length} new subgrantees. 
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