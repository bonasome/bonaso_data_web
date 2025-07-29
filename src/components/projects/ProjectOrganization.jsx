import Tasks from "../tasks/Tasks";
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useProjects } from "../../contexts/ProjectsContext";
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useAuth } from "../../contexts/UserAuth";
import IndicatorsIndex from "../indicators/IndicatorsIndex";
import { MdAssignmentAdd } from "react-icons/md";
import { IoMdReturnLeft, IoIosArrowDropup, IoIosArrowDropdownCircle, IoIosRemoveCircle } from "react-icons/io";
import { IoCheckboxSharp } from "react-icons/io5";
import { FaCirclePlus } from "react-icons/fa6";
import ButtonHover from '../reuseables/inputs/ButtonHover';
import styles from './projectDetail.module.css';
import Loading from "../reuseables/loading/Loading";
import ConfirmDelete from "../reuseables/ConfirmDelete";
import errorStyles from '../../styles/errors.module.css';
import { useNavigate, Link } from "react-router-dom";
import OrganizationsIndex from "../organizations/OrganizationsIndex";
import { FaAngleDoubleUp } from "react-icons/fa";
import NarrativeReportDownload from '../narrativeReports/NarrativeReportDownload';
import Targets from "./targets/Targets";


export default function ProjectOrganization(){
    const { id, orgID } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const {projectDetails, setProjectDetails} = useProjects();
    const [project, setProject] = useState();
    const [loading, setLoading] = useState();
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState(false);
    const [adding, setAdding] = useState(false);
    const [showTasks, setShowTasks] = useState(false);
    const [showChildOrgs, setShowChildOrgs] = useState(false);
    const [showTargets, setShowTargets] = useState(false);
    const [showFiles,setShowFiles] = useState(false);
    const [updateTasks, setUpdateTasks] = useState(0);
    const [del, setDel] = useState(false);
    
    const [addingChildOrg, setAddingChildOrg] = useState(false);

    const [searchParams] = useSearchParams();
    const startAdding = searchParams.get('adding');

    useEffect(() => {
        if(startAdding && startAdding.toString() == 'true'){
            setAddingChildOrg(true);
            setShowChildOrgs(true);
        }
    }, [startAdding]);
    console.log(startAdding)
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);
    
    
    
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

    const hasPerm = useMemo(() => {
        if(!user || !organization) return false
        if(user.role === 'admin') return true;
        if(user.organization_id == organization?.parent?.id) return true
        return false
    }, [user, organization]);

    console.log(organization)
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
            console.error('Could not record respondent: ', err)
        }
    }
    const assignChild = async (org) => {
        setSuccess(false);
        setErrors([]);
        try {
            console.log('assigning subgrantee...');
            const response = await fetchWithAuth(`/api/manage/projects/${id}/assign-subgrantee/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'parent_id': orgID,
                    'child_id': org.id,
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
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record respondent: ', err)
        }
    } 

    const addTask = async (indicator) => {
        setSuccess(false);
        setErrors([]);
        try {
            console.log('assigning task...');
            const response = await fetchWithAuth(`/api/manage/tasks/`, {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'organization_id': orgID,
                    'indicator_id': indicator.id,
                    'project_id': id,
                })
            });
            const returnData = await response.json();
            if(response.ok){
                setUpdateTasks(prev => prev + 1);
                setSuccess(true);
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
            <Link to={`/projects/${id}`} className={styles.return}>
                <IoMdReturnLeft className={styles.returnIcon} />
                <p>Return to projects overview</p>   
            </Link>
            {organization.parent && <Link to={`/projects/${id}/organizations/${organization.parent?.id}`} className={styles.return}>
                <IoMdReturnLeft className={styles.returnIcon} />
                <p>Return to parent organization</p>   
            </Link>}

            <div className={styles.segment}>
                <h1>Viewing Page for {organization.name} for {project.name}</h1>
                {errors.length != 0 && <div ref={alertRef} className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            </div>

            <div className={styles.segment}>
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

                <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowChildOrgs(!showChildOrgs)}>
                        <h2 style={{ textAlign: 'start'}}>Subgrantees</h2>
                        {showChildOrgs ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                    {showChildOrgs && <div style={{ margin: 20}}>
                        {!addingChildOrg && ((user.organization_id == organization.id && !organization.parent) || user.role == 'admin') && <ButtonHover noHover={<FaCirclePlus />} hover={'Add Subgrantee'} callback={() => setAddingChildOrg(true)}/>}
                        {addingChildOrg && <ButtonHover noHover={<IoCheckboxSharp />} hover={'Done'} callback={() => setAddingChildOrg(false)}/>}
                        
                        {addingChildOrg && <OrganizationsIndex 
                            callback={(org) => assignChild(org)} callbackText="Assign as Subgrantee" 
                            projAdd={project.id} addRedirect={{to: 'projects', projectID: project.id, orgID: organization.id }}
                        />}
                        
                        {organization.children.map((org) => (<div className={styles.orgCard}>
                            <Link to={`/projects/${id}/organizations/${org.id}`}><h3>{org.name}</h3></Link>
                        </div>))}
                        {organization.children.length === 0 && <p>No subgrantees yet.</p>}
                    </div>}
                </div>

                <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowTasks(!showTasks)}>
                        <h2 style={{ textAlign: 'start'}}>Tasks for {organization.name}</h2>
                        {showTasks ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                    {showTasks && <div style={{ margin: 40}}>
                        {hasPerm && <div >
                            {!adding && <ButtonHover callback={() => setAdding(true)} noHover={<MdAssignmentAdd />} hover={'Assign a New Task'} />}
                            {adding && <ButtonHover callback={() => setAdding(false)} noHover={<IoCheckboxSharp />} hover={'Done'} />}
                        </div>}
                        {adding && <IndicatorsIndex callback={(ind) => addTask(ind)} callbackText={'Assign as Task'} excludeOrg={orgID} excludeProject={id} updateTrigger={updateTasks} />}
                        <Tasks organizationID={orgID} projectID={id} canDelete={hasPerm} updateTrigger={() => setUpdateTasks(prev => prev += 1)} onRemove={() => setUpdateTasks(prev => prev+=1)}/>
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
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    {user.role == 'admin' && organization.parent && <ButtonHover callback={() => promoteChild()} noHover={<FaAngleDoubleUp />} hover={'Promote to Coordinator'} />}
                    {hasPerm && <ButtonHover callback={() => setDel(true)} noHover={<IoIosRemoveCircle />} hover={'Remove Organization from Project'} forDelete={true} />}
                </div>
            </div>
        </div>
    )
}