import { useEffect, useState } from "react"
import fetchWithAuth from "../../../services/fetchWithAuth";
import styles from './respondents.module.css';
import { useAuth } from "../../contexts/UserAuth";
import Checkbox from '../reuseables/Checkbox'
import SimpleSelect from '../reuseables/SimpleSelect';
//way future idea, add favorites
function RespondentCard({ respondent, handleClick }){
    return(
        <div className={styles.card} onClick={() => handleClick(respondent.id)}>
            {respondent.is_anonymous ? 
                <h4>Anonymous: {respondent.uuid} ({respondent.sex})</h4> :
                <h4>{respondent.first_name} {respondent.last_name} ({respondent.sex})</h4>
            }
            <h5>{respondent.village}, {respondent.district}</h5>
        </div>
    )
}

function RespondentList({ handleClick }){
    const [respondents, setRespondents] = useState([]);
    const [searchValue, setSearchValue] = useState('')
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const getRespondents = async() => {
            try{
                const response = await fetchWithAuth(`respondents/api/get-list/`);
                const data = await response.json();
                setRespondents(data.results);
                setLoading(false);
            }
            catch(err){
                console.error('Failed to fetch respondents: ', err)
                setLoading(false)
            }
        }
        getRespondents();
    }, [])
    if(loading) return <p>Loading...</p>
    return(
        <div className={styles.respondentList}>
            <input type='text' onChange={(e)=>setSearchValue(e.target.value)} placeholder={"hint: you can search comments you may have left on a respondent if you're stuck."} />
            {respondents.map((respondent) => {
                const fname = (respondent.first_name || '').toLowerCase();
                const lname = (respondent.last_name || '').toLowerCase();
                const uuid = (respondent.uuid || '').toLowerCase();
                const comments = (respondent.uuid || '').toLowerCase();
                const search = searchValue.toLowerCase();
                if(search == '' || fname.includes(search) || lname.includes(search) || uuid.includes(search) || comments.includes(search)){
                    return <RespondentCard key={respondent.id} respondent={respondent} handleClick={handleClick} />
                }
            })}
        </div>
    )
}

function RespondentDetail({ id }){
    const [respondent, setRespondent] = useState({});
    const [loading, setLoading] = useState(true);
    const [options, setOptions] = useState({
        sexOptions: [],
        sexLabels: [],
        kpOptions: [],
        kpLabels: [],
        ageRangeOptions: [],
        ageRangeLabels: [],
        districtOptions: [],
        districtLabels: [],
    });
    
    const [labels, setLabels] = useState({})
    const { user } = useAuth();
    useEffect(() => {
        const getRespondent = async() =>{
            if(!id){
                setRespondent(null);
                return;
            }
            try{
                const response = await fetchWithAuth(`respondents/api/get/${id}/`);
                const data = await response.json();
                setRespondent(data);
            }
            catch(err){
                console.error('Failed to fetch respondents: ', err);
            }
        }
        getRespondent();

        const getOptions = async() => {
            try{
                const response = await fetchWithAuth(`respondents/api/get-model-info/`);
                const data = await response.json();
                setOptions({
                    sexOptions: data.values.sex,
                    sexLabels: data.labels.sex,
                    kpOptions: data.values.kp,
                    kpLabels: data.labels.kp,
                    ageRangeOptions: data.values.age_range,
                    ageRangeLabels: data.labels.age_range,
                    districtOptions: data.values.district,
                    districtLabels: data.labels.district,
                });
                setLoading(false);
            }
            catch(err){
                console.warn('Failed to get options from server: ', err);
                setLoading(false);
            }
        }
        getOptions();
    }, [id])

    useEffect(() => {
        const createLabels = () => {
            if(!respondent || !options) return;
            const sexIndex = options.sexOptions.indexOf(respondent.sex);
            const ageRangeIndex = options.ageRangeOptions.indexOf(respondent.age_range);
            const districtIndex = options.districtOptions.indexOf(respondent.district);
            let kps = []
            if(respondent.kp_status){
                respondent.kp_status.forEach(kp => {
                    const kpIndex = options.kpOptions.indexOf(kp)
                    kps.push(options.kpLabels[kpIndex])
                });
            }
            setLabels({
                district: options.districtLabels[districtIndex],
                ageRange: options.ageRangeLabels[ageRangeIndex],
                sex: options.sexLabels[sexIndex],
                kp: kps,
            })
        }
        createLabels();
    }, [respondent, options])

    if(loading) return <p>Loading...</p>
    if(!id || !respondent) return <p>Click to view a respondent...</p>
    return(
        <div className={styles.details}>
            <h4>Viewing...</h4>
            {respondent.is_anonymous ? <h2>Anonymous Respondent {respondent.uuid}</h2> :
            <h2>{respondent.first_name} {respondent.last_name} </h2>}
            <p>{labels.sex}, {labels.ageRange}</p>
            <p>{respondent.ward && respondent.ward+','} {respondent.village}, {labels.district}</p>
            {labels.kp.length > 0 && 
                <ul> 
                    {labels.kp.map((kp) => <li key={kp}>{kp}</li>)}
                </ul>
            }
            {respondent.hiv_status == true && <p>HIV Status: {respondent.hiv_status}</p>}
            {respondent.pregnancy == true && <p>Pregnant Since: {respondent.pregnancy_began} </p>}
            {user.role == 'admin' && <button>Delete Respondent</button>}
        </div>
    )
}

function TasksList({ handleClick }) {
    const [loading, setLoading] = useState(true)
    const [tasks, setTasks] = useState([]);
    useEffect(() => {
        const getTasks = async() => {
            try{
                const response = await fetchWithAuth(`projects/api/my-tasks`);
                const data = await response.json();
                setTasks(data);
                setLoading(false);
            }
            catch(err){
                console.error('Failed to fetch organizations: ', err)
                setLoading(false)
            }
        }
        getTasks();
    }, [])
    function ProjectTasks({ project }){
        return(
            <div>
                {project.indicators.map((indicator) => {
                    return(
                        <div key={indicator.id} onClick={() => handleClick(indicator.id, indicator.task)}>
                            <h4>{indicator.code}: {indicator.name}</h4>
                        </div>
                    )
                })}
            </div>
        )
    }
    if(loading) return <p>Loading...</p>
    if(tasks.projects.length == 0){
        return(
            <p>You have no tasks. Good work!</p>
        )
    }
     return(
        <div className={styles.tasks}>
            <h2>Your Tasks</h2>
            {tasks.projects.map((project)=> {
                return <ProjectTasks project={project} key={project.id}/>
            })}
        </div>
    )
}

function TaskDetail({ id, taskID, respondent }){
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [edit, setEdit] = useState(false);
    const [interactionDate, setInteractionDate] = useState('');
    const [taskCategories, setTaskCategories] = useState([]);
    const [preReqVals, setPreReqVals] = useState([]);
    const [preReqLabs, setPreReqLabs] = useState([]);
    const [preReqInteraction, setPreReqInteraction] = useState(null)

    const [messages, setMessages] = useState([])
    useEffect(() => {
        const getRespondent = async() =>{
            if(!id){
                setTask(null);
                return;
            }
            try{
                const response = await fetchWithAuth(`indicators/api/get/${id}/${respondent}/`);
                const data = await response.json();
                setTask(data);
                console.log(data)
                setLoading(false)
            }
            catch(err){
                console.error('Failed to fetch respondents: ', err);
                setLoading(false)
            }
        }
        getRespondent();
    }, [id])

    useEffect(() => {
        const setPreReqs = () => {
            if(!task) return
            if(!task.indicator.prerequisite) return
            const interactions = task.indicator.prerequisite.prerequisite_interactions
            let vals = interactions.map(interaction => interaction.id);
            let labs = interactions.map(interaction => interaction.date);
            setPreReqVals(vals);
            setPreReqLabs(labs);
        }
        setPreReqs();
    }, [task])

    const handleCheck = (e) => {
        const val = e.target.value;
        const checked = e.target.checked;
        let existing = taskCategories;
        if(checked){
            existing.push(val);
        }
        else{
            if(existing.includes(val)){
                existing.filter(item => item != val);
            }
        }
        setTaskCategories(existing);
    }
    const addInteraction = async() => {
        const regex = /^\d{4}-\d{1,2}-\d{1,2}$/;
        if (!regex.test(interactionDate) || interactionDate == ''){
            setMessages(['Please enter a valid date.'])
            return;
        }
        if(task.indicator.options.length > 0 && taskCategories == 0){
            setMessages(['You must select at least one subcategory for this task.'])
            return;
        }
        if(task.indicator.prerequisite && !preReqInteraction){
            setMessages(['This field requires you to select a prerequisite interaction.']);
            return;
        }
        try{
            const response = await fetchWithAuth('respondents/api/new-interaction/', {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'task': taskID,
                    'respondent': respondent,
                    'date': interactionDate,
                    'categories': taskCategories,
                    'prerequisite': preReqInteraction,
                })
            });
            const data = await response.json();
            setMessages(data.message);
            if(data.status == 'success'){
                setEdit(false);
            }
            
        }
        catch(err){
            console.error('Could not record project: ', err)
        }
    }
    
    if(loading) return <p>Loading...</p>
    console.log(task)
    return(
        <div >
            {messages && <ul>{messages.map((msg)=><li key={msg}>{msg}</li>)}</ul>}
            <p>{task.indicator.code}: {task.indicator.name}</p>
            <button onClick={()=>setEdit(!edit)}> 
                {edit ? 'Cancel' : 'Record New Interaction For This Task/Resondent'}
            </button>
            <p>{task.indicator.description}</p>
            {edit && 
                <div>
                    <label>Date of Interaction</label>
                    <input type='date' onChange={(e) => setInteractionDate(e.target.value)} /> 
                    <button onClick={()=>addInteraction()}>Save</button>
                </div>
            }
            {task.indicator.options && !edit && <ul>{task.indicator.options.map((option) => {
                    return <li key={option.code}>{option.name}</li>
            })}</ul>}
            {task.indicator.prerequisite && !edit &&
                <h3>
                    THIS TASK REQUIRES THAT "{task.indicator.prerequisite.code}: {task.indicator.prerequisite.name + '" '}
                    IS COMPLETED FIRST.
                </h3>
            }
            {task.indicator.prerequisite && edit &&
                <div>
                    <h3>Select a prerequisite task:</h3>
                    <SimpleSelect name={'prerequisiteInteraction'} label={'Select an accompanying interaction'} optionValues={preReqVals} optionLabels={preReqLabs} callback={(e) => setPreReqInteraction(e.target.value)} />
                </div>
            }
            {task.indicator.options && edit && 
                task.indicator.options.map((option) => {
                    return <Checkbox key={option.id} name={option.id} value={option.id} label={option.name} callback={(e) => handleCheck(e)} />
                })
            }

            {task.indicator.interactions && !edit &&
                <div>
                    <h4>Previous Interactions Based on this Task</h4>
                    <ul>{task.indicator.interactions.map((interaction) => {
                        return <li key={interaction.id}>
                            {interaction.date} {interaction.organization && 'by ' + 
                            interaction.organization} {interaction.category_name && '(' + 
                            interaction.category_name + ')'} {interaction.prerequisite && '(Tied to ' + 
                            interaction.prerequisite.code + ' ' + interaction.prerequisite.date +')'}
                            
                            </li>
                    })}
                    </ul>
                </div>}
        </div>
    )
}

function MainPanel({ respondent, task, taskID }){
    if(!task && !respondent){
        return(
            <div className={styles.mainPanel}>
                <p>Choose a resondent to begin</p>
            </div>
        )
    }
    if(task && !respondent){
        return(
        <div className={styles.mainPanel}>
            <div></div>
            <div>
                <p>Choose a respondent to begin...</p>
                <p>{task.code}: {task.name}</p>
            </div>
        </div>
        )
    }
    if(respondent && !task){
        return(
            <div className={styles.mainPanel}>
                <RespondentDetail id={respondent} />
                <p>Select a task to begin...</p>
            </div>
        )
    }
    if(respondent && task){
        return(
            <div className={styles.mainPanel}>
                <RespondentDetail id={respondent} />
                <TaskDetail id={task} taskID={taskID} respondent={respondent} />
            </div>
        )
    }
        

}

function Respondents() {
    const [activeRespondent, setActiveRespondent] = useState(null)
    const [activeTask, setActiveTask] = useState(null)
    const [taskID, setTaskID] = useState(null)
    return (
        <div className={styles.respondents}>
            <RespondentList handleClick={(rID) => setActiveRespondent(rID)}/>
            <MainPanel respondent={activeRespondent} task={activeTask} taskID={taskID}/>
            <TasksList handleClick={(ind, task) => {{setActiveTask(ind)}; {setTaskID(task)}}}/>
        </div>
    )
}

export default Respondents