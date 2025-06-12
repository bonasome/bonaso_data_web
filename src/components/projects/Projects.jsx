import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import styles from './projects.module.css';
import SimpleSelect from '../reuseables/SimpleSelect';

import { IndicatorCard, IndicatorDetail, IndicatorsList, ProjectIndicators } from '../indicators/Indicators';
import { ProjectOrgs, OrgsList, OrgDetail } from '../organizations/OrganizationComponents';


function SelectProject({ handleChange }){
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState(null);
    const [options, setOptions] = useState({
        projectValues: [],
        projectLabels: [],
    })

    useEffect(() => {
        const getProjects = async() => {
            try{
                const response = await fetchWithAuth(`projects/api/get-list/`);
                const data = await response.json();
                setProjects(data.results);
            }
            catch(err){
                console.error('Failed to fetch indicators: ', err)
            }
        }
        getProjects();
    }, [])

    useEffect(() => {
        const loadProjectOptions = () => {
            if(!projects || projects.length == 0) return;
            const labels = projects.map((proj) => proj.name);
            const values = projects.map((proj) => proj.id);

            setOptions({
                projectValues: values,
                projectLabels: labels,
            })
            setLoading(false)
        }
        loadProjectOptions();
    }, [projects])

    const selectProject = (id) => {
        if(id == ''){
            return null;
        }
        let setProject = projects.filter(proj => proj.id == id);
        if(setProject.length > 0){
            setProject = setProject[0];
        }
        handleChange(setProject);
    }
    if(loading) return <p>Loading...</p>
    return(
        <div className={styles.projectSelect}>
            <SimpleSelect name={'project'} label={'Select a Project'} optionValues={options.projectValues} optionLabels={options.projectLabels} nullOption={true} search={true} callback={(event) => selectProject(event.target.value)}/>
        </div>
    )
}

function ManageIndicators({ project, existing=null }){
    const [messages, setMessages] = useState([])
    const addIndicator = async(indID) => {
        try{
            
            const response = await fetchWithAuth('projects/api/add-indicator/', {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({'indicator': indID, 'project': project.id})
            });
            const data = await response.json();
            setMessages(data.message);
        }
        catch(err){
            console.error('Could not record project: ', err)
        }
    }
    if(!project) return <p>Please select a project</p>
    return(
        <div>
            {messages && <ul>{messages.map((msg)=><li key={msg}>{msg}</li>)}</ul>}
            <IndicatorsList addClick={(val) => addIndicator(val)} existing={existing} />
        </div>
        
    )
}

function ManageOrgs({ project }){
    const [messages, setMessages] = useState([])
    const addOrg = async(orgID) => {
        try{
            const response = await fetchWithAuth('projects/api/add-org/', {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({'organization': orgID, 'project': project.id})
            });
            const data = await response.json();
            setMessages(data.message);
        }
        catch(err){
            console.error('Could not record project: ', err)
        }
    }
    if(!project) return <p>Please select a project</p>
    return(
        <div>
            {messages && <ul>{messages.map((msg)=><li key={msg}>{msg}</li>)}</ul>}
            <OrgsList addClick={(val) => addOrg(val)} />
        </div>
    )
}

function NewTask({ project, org, indicators, existing=null }){
    const [searchValue, setSearchValue] = useState('');
    const [messages, setMessages] = useState([]);

    const addTask = async(indicator) => {
        try{
            const response = await fetchWithAuth('projects/api/add-task/', {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({'organization': org.id, 'indicator': indicator.code, 'project': project.id})
            });
            const data = await response.json();
            setMessages(data.message);
        }
        catch(err){
            console.error('Could not record project: ', err)
        }
    }

    return(
        <div>
            {messages && <ul>{messages.map((msg)=><li key={msg}>{msg}</li>)}</ul>}
            <input type='text' onChange={(e)=> {setSearchValue(e.target.value)}} placeholder={'search an indicator by code, name, or description'} />
            {indicators.map((ind) => {
                if(existing.includes(ind.id)) return
                const search=searchValue.toLocaleLowerCase()
                const code = (ind.code || '').toLowerCase();
                const name = (ind.name || '').toLowerCase();
                const desc = (ind.description || '').toLowerCase();
                    if(search == '' || code.includes(search) || name.includes(search) || desc.includes(search) ){
                        return(
                            <div>
                                <IndicatorCard key={ind.code} indicator={ind} handleClick={null} />
                                <button onClick={()=> addTask(ind)}>Assign to {org.name}</button>
                            </div>
                        ) 

                    }
                }
            )}
        </div>
    )
}
function ProjectPane({ content, project, tasks, indicator=null, org=null, projectIndicators=null }) {
    const[toggle, setToggle] = useState(false);

    if(content == ''){
        return(
            <div>
                <p>Project Information would be here...</p>
            </div>
        )
    }
    if(content == 'manageIndicators'){
        const existing = projectIndicators.map(ind => ind.code);
        return(
            <div>
                <button>Create New Indicator</button>
                <ManageIndicators project={project} existing={existing}/>
            </div>
        )
    }
    if(content == 'manageOrgs'){
        return(
            <div>
                <button>Create New Organization</button>
                <ManageOrgs project={project} />
            </div>
        )
    }
    else if (content == 'indicatorDetail' && indicator){
        return <IndicatorDetail indicator={indicator} />
    }
    else if (content == 'orgDetail' && org){
        const orgTasks = tasks.filter(task => task.org == org.id);
        const orgIndIDs = orgTasks.map(task => task.indicator)
        const orgIndicators = projectIndicators.filter(ind => orgIndIDs.includes(ind.id));
        return(
            <div>
                <OrgDetail org={org} tasks={orgIndicators} />
                {toggle && <NewTask project={project} org={org} indicators={projectIndicators} existing={orgIndIDs} />}
                <button onClick={()=>setToggle(!toggle)}>Add an Indicator for this Organization</button>
            </div>
        )
    }
    else{
        return <p>Click the sidebar to start working...</p>
    }
}

function Project({ project }){
    const [loading, setLoading] = useState(true)
    const [content, setContent] = useState('')
    const[projectIndicators, setProjectIndicators] = useState([]);
    const [projectOrgs, setProjectOrgs] = useState([]);
    const [tasks, setTasks] = useState([])
    useEffect(() => {
            const getIndicators = async() => {
                if(!project) return;
                try{
                    const response = await fetchWithAuth(`projects/api/${project.id}/get-indicators/`);
                    const data = await response.json();
                    setProjectIndicators(data.results);
                    setLoading(false);
                }
                catch(err){
                    console.error('Failed to fetch indicators: ', err)
                    setLoading(false)
                }
            }
            getIndicators();

            const getTasks = async() =>{
                if(!project) return;
                try{
                    const response = await fetchWithAuth(`projects/api/${project.id}/get-tasks/`);
                    const data = await response.json();
                    setTasks(data.results);
                    setLoading(false);
                }
                catch(err){
                    console.error('Failed to fetch indicators: ', err)
                    setLoading(false)
                }
            }
            getTasks();
        }, [project])
    const [activeIndicator, setActiveIndicator] = useState(null);
    const [activeOrg, setActiveOrg] = useState(null);

    const handleMainPane = (type, val=null) => {
        if(type == 'manageIndicators'){
            setContent('manageIndicators');
            setActiveIndicator(null);
            setActiveOrg(null);
        }
        else if(type == 'manageOrgs'){
            setContent('manageOrgs');
            setActiveIndicator(null);
            setActiveOrg(null);
        }
        else if(type == 'indicatorDetail' && val){
            setContent('indicatorDetail');
            setActiveIndicator(val);
            setActiveOrg(null);
        }
        else if(type == 'orgDetail' && val){
            setContent('orgDetail');
            setActiveIndicator(null);
            setActiveOrg(val);
        }
    }

    if(project == null){
        return <p>Select a project to get started!</p>
    }
    return(
        <div className={styles.projectView}>
            <div className={styles.projectDetails}>
                <h2>{project.name}</h2>
                {project.client && <h4>For {project.client}</h4>}
                <h3>From {project.start} to {project.end}</h3>
                <p>Project Status: {project.status}</p>
            </div>
            <div className={styles.indicators}>
                <ProjectIndicators indicators={projectIndicators} handleClick={(type, val) => handleMainPane(type, val)} />
                <ProjectPane content={content} project={project} indicator={activeIndicator} org={activeOrg} tasks={tasks} projectIndicators={projectIndicators}/>
                <ProjectOrgs handleClick={(type, val) => handleMainPane(type, val)} project={project} />
            </div>
        </div>
    )
}


export default function Projects(){
    const [loading, setLoading] = useState(false);
    const [activeProject, setActiveProject] = useState(null);
    
    if(loading) return <p>Loading...</p>

    return(
        <div className={styles.projects}>
            <SelectProject handleChange={(proj) => setActiveProject(proj)}/>
            <Project project={activeProject} />
        </div>
    )
}