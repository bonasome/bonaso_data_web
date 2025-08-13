import { useState, useEffect, useRef } from "react";

import { useInteractions} from '../../../contexts/InteractionsContext';

import fetchWithAuth from "../../../../services/fetchWithAuth";
import useWindowWidth from '../../../../services/useWindowWidth';

import Checkbox from '../../reuseables/inputs/Checkbox';

import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import Messages from '../../reuseables/Messages';

import errorStyles from '../../../styles/errors.module.css';
import modalStyles from '../../../styles/modals.module.css';
import styles from '../respondentDetail.module.css';

import { FaTrashAlt, FaCheck } from "react-icons/fa";
import { IoIosSave } from "react-icons/io";
import { BiSolidCommentAdd } from "react-icons/bi";
import { FcCancel } from "react-icons/fc";

export default function AddInteractions({ interactions, respondent, meta, onUpdate, onFinish, setAddingTask }) {
    //context
    const { setInteractions } = useInteractions();
    //fields used for managing creation
    const [interactionDate, setInteractionDate] = useState('');
    const [interactionLocation, setInteractionLocation] = useState('');
    const [number, setNumber] = useState({});
    const [subcats, setSubcats] = useState({});
    const [comments, setComments] = useState({});
    const [added, setAdded] = useState([]); //manages the list of added tasks

    //creation helpers that manage pop up modals for when additional into is required
    const [subcatModalActive, setSubcatModalActive] = useState(false);
    const [numberModalActive, setNumberModalActive] = useState(false);
    const [commentsModalActive, setCommentsModalActive] = useState(false);
    const [modalTask, setModalTask] = useState(null);

    const [active, setActive] = useState(false);
    
    //helper that controls which subcats are visible if there is a prerequisite condition (can be overwritten on editing at risk of a flag)
    const [allowedSubcats, setAllowedSubcats] = useState({});
    
    //page meta
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const width = useWindowWidth();

    //ref to autoscroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    //ref to keep interaction date current (since its used for checking prereqs)
    const interactionDateRef = useRef('');
    useEffect(() => {
        interactionDateRef.current = interactionDate;
    }, [interactionDate]);

    //modal for allowing users to enter comments
    function CommentModal({task}){
        const [localComment, setLocalComment] = useState('');


        const closeWindow = () => {
            if(localComment[task.id] == ''){
                setAdded(prev => prev.filter(added => added.id == task.id))
            }
            setComments(prev => ({...prev,[task.id]: localComment}))
            setCommentsModalActive(false);
        }
        if(!task) return<></>
        return(
            <div className={modalStyles.modal}>
                <h2>Additional Information Required</h2>
                <label htmlFor='comments'>Adding a Comment.</label>
                <textarea id='comments' value={localComment || ''} onChange={(e) => setLocalComment(e.target.value)}/>
                <div>
                    <button onClick={() => closeWindow()}><FaCheck /> Save</button>
                    <button onClick={() => setCommentsModalActive(false)}><FcCancel /> Cancel</button>
                </div>
            </div>
        )
    }

    //modal for when an indicator requires only a number
    function NumberModal({task}){
        const [modalErrors, setModalErrors] = useState('');
        const [localNumber, setLocalNumber] = useState('');

        //make sure a value is given
        const closeWindow = () => {
            if(localNumber === ''){
                setModalErrors('This field is required.');
                return;
            }
            setNumber(prev => ({...prev,[task.id]: localNumber}))
            setNumberModalActive(false);
        }
        const cancel = () => {
            setAdded(prev => {
                const updated = prev.filter(t => t.id !== task.id);
                onUpdate(updated.map(t => t.id));
                return updated;
            });
            setNumberModalActive(false);
        }

        return(
            <div className={modalStyles.modal}>
                <h2>Additional Information Required</h2>
                <Messages errors={modalErrors} />
                <label htmlFor='number'>The task {task.indicator.name} requires a numeric component.</label>
                <input id='number' type='number' value={localNumber || ''} onChange={(e) => setLocalNumber(e.target.value)} />
                <div>
                    <button onClick={() => closeWindow()}><FaCheck /> Confirm Choices</button>
                    <button onClick={() => cancel()}><FcCancel/> Cancel</button>
                </div>
            </div>
        )
    }

    //modal for allowing users to enter subcat information (including numbers as applicable)
    function SubcategoryModal({ task }) {
        // localSubcats = [{id: null, subcategory:  {id: 1, name: 'this'}, numeric_component: null}]
            //subcategory is from the indicator, id/numeric are specific to the interaciton

        const [modalErrors, setModalErrors] = useState('');
        const [localSubcats, setLocalSubcats] = useState([]); //mirrors higher level state but allows for more rapid editing

        //check/uncheck, compare based on the indicator subcategory
        const handleCheckbox = (checked, cat) => {
            setLocalSubcats(prev =>
                checked ? [...prev, {id: null, subcategory: {id: cat.id, name: cat.name}, numeric_component: ''}] : 
                    prev.filter(c => c.subcategory.id !== cat.id)
            );
        };

        //show/set number inputs if required bu the indoicator
        const handleNumeric = (cat, value) => {
            setLocalSubcats(prev => {
                const others = prev.filter(c => c.subcategory.id !== cat.id);
                return [...others, {id: null, subcategory: {id: cat.id, name: cat.name}, numeric_component: value}];
            });
        }
        
        //close on cancel
        const cancel = () => {
            setAdded(prev => {
                const updated = prev.filter(t => t.id !== task.id);
                onUpdate(updated.map(t => t.id));
                return updated;
            });
            setSubcatModalActive(false);
        };

        //close window, confirming that there are valid entries for numbers, then updating main subcats and closing
        const closeWindow = () => {
            if(task.indicator.require_numeric){
                let e = []
                localSubcats.forEach(c => {
                    if(!c.numeric_component || c.numeric_component === '' || isNaN(c.numeric_component)) e.push(`Category "${c.subcategory.name}" requires a valid number.`)
                })
                if(e.length > 0){
                    setModalErrors(e);
                    return;
                }
            }
            setSubcats(prev => ({...prev, [task.id]: localSubcats}));
            setSubcatModalActive(false);
        };
        
        //helper cat that determines if prereqs should be used
        const taskSubcats = allowedSubcats?.[task.id] || task.indicator.subcategories;

        return (
            <div className={modalStyles.modal}>
                <h2>Additional Information Required</h2>
                <Messages errors={modalErrors} />
                <p>Please select all relevant subcategories related to {task.indicator.name}.</p>
                {taskSubcats.map((cat) => (
                    <div key={cat.id} className={modalStyles.checkbox} style={{display: 'flex', flexDirection: 'row'}}>
                        <Checkbox key={cat.id}
                            label={cat.name}
                            value={localSubcats.filter(c => c.subcategory.id === cat.id).length > 0}
                            name={cat.name}
                            onChange={(checked) => handleCheckbox(checked, cat)}
                        />
                        {localSubcats.filter(c => c.subcategory.id ==cat.id).length > 0 && 
                            task.indicator.require_numeric && <input type="number" onChange={(e) => 
                                handleNumeric(cat, e.target.value)} 
                            value={localSubcats.find(c => c.subcategory.id==cat.id).numeric_component || ''} 
                        />}
                    </div>
                ))}
                <div>
                    <button disabled={localSubcats.length === 0} onClick={closeWindow}>
                        <FaCheck /> Confirm Choices
                    </button>
                    <button onClick={cancel}><FcCancel /> Cancel</button>
                </div>
            </div>
        );
    }


    //update the date on changes
    const handleDateChange = (e) => {
        const date = e.target.value;
        if(date === '' || isNaN(Date.parse(date)) || new Date(date) > new Date()){
            setWarnings(['Please enter a valid interaction date.'])
        }
        setInteractionDate(date)
        setWarnings([])

    }
    //drag and drop is supported, if so quicly work the package then pass to the main validation function
    const handleDrop = async (e) => {
        let dropWarnings = [];
        if(subcatModalActive || numberModalActive){
            dropWarnings.push(`Please fill out and close the modal form before adding another task.`);
            return;
        }
        e.preventDefault();
        const task = JSON.parse(e.dataTransfer.getData('application/json'));
        if (!active) setTimeout(() => setActive(true), 0);
        handleAdd(task);
    }
    // Required to allow drop
    const handleDragOver = (e) => {
        e.preventDefault(); 
    };

    useEffect(() => {
        setErrors([])
        setAddingTask(() => handleAdd)
        if (!active) setTimeout(() => setActive(true), 0);
    }, [setAddingTask])

    const getLabelFromValue = (field, value) => {
        if(!meta) return null
        const match = meta[field]?.find(range => range.value === value);
        return match ? match.label : null;
    };

    //validation function for when a new task is entered
    const handleAdd = async (task) => {
        setErrors([]);
        setWarnings([]);
        const date = interactionDateRef.current;
        let dropWarnings = [];

        //verify the task is not already in the included package
        let addedIDs = added.map((d) => (d.id));
        if(addedIDs.includes(task.id)){
            dropWarnings.push(`This task is already included in this interaction.`);
            return;
        }

        //show warnings if prerequisites are required
        if (task?.indicator?.prerequisites.length > 0) {
            //loop through each prereq if present
            for (const prereq of task.indicator.prerequisites) {
                if (!prereq || !prereq.id) continue; //gracefully catch bad info

                //see if the required task is added to this batch
                const inBatch = added.filter(t => t.indicator.id.toString() === prereq.id.toString())
                let found = false //see if a prerequisite is present

                if (inBatch.length > 0) {
                    found = true //if in the batch, we're good. 
                    //if subcats are present and supposed to be matched, auto limit them for convenience
                    if(task.indicator.match_subcategories_to === prereq.id){
                        const interSubcatIDs = subcats[inBatch[0].id]?.map((cat) => (cat?.subcategory?.id))
                        const interSubcats = task.indicator.subcategories.filter(cat => (interSubcatIDs.includes(cat.id)))
                        setAllowedSubcats(prev=> ({...prev, [task.id]: interSubcats}));
                    }
                } 
                //else if there are at least some interactions, try to find another record in the db
                else if (interactions?.length > 0) {
                    //try to find an interaction that matches the conditions
                    try{
                        const response = await fetchWithAuth(`/api/record/interactions/?respondent=${respondent.id}&task_indicator=${prereq.id}&before=${interactionDate}`);
                        const data = await response.json();
                        //if something is found
                        if(data.results.length > 0){
                            const validPastInt = data.results.find(inter => inter?.task?.indicator?.id == prereq.id);
                            if (validPastInt && validPastInt.interaction_date <= date) {
                                console.log(validPastInt)
                                found=true //if found, we're good. Just like above, set subcats if applicable
                                if(task.indicator.match_subcategories_to === prereq.id){
                                    setAllowedSubcats(prev=> ({...prev, [task.id]: validPastInt.subcategories.map((cat) => ({id: cat.subcategory.id, name: cat.subcategory.name}))}));
                                }
                            }
                        }
                    }
                    catch(err){ //catch a fail
                        console.error(err);
                        setErrors(['Something went wrong, please try again later.']);

                    }
                }
                //if not found, push a warning that it will be flagged.
                if (!found) {
                    dropWarnings.push(
                        `This indicator requires this respondent to have had an interaction associated with 
                        task ${prereq.display_name}, however, we could not find a prior record of this interaction. 
                        If you record this interaction, it wil be flagged for further review.
                        (HINT: Make sure you have a date set.)`
                    );
                }
            }
        }

        //if allow repeat is not ticked, check for an interaction in the past 30 days, as this will trigger a flag
        if (interactions?.length > 0 && !task.indicator.allow_repeat) {
            try{
                const response = await fetchWithAuth(`/api/record/interactions/?respondent=${respondent.id}&task_indicator=${task.id}`);
                const data = await response.json()
                const pastInt = data.results.filter(inter => inter?.task_detail?.indicator?.id === task.indicator.id);
                const now = new Date();
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(now.getMonth() - 1);

                const tooRecent = pastInt.filter(
                    inter => new Date(inter?.interaction_date) >= oneMonthAgo
                );
                if (tooRecent.length > 0) {
                    dropWarnings.push(
                        'This respondent has had this interaction in the last month. Please be sure you are not double recording.'
                    );
                }
                
            }
            catch(err){
                console.error(err);
                setErrors(['Something went wrong, please try again later.']);
            }
        }
        //if this task requires an attribute, make sure the respondent has it, and send a warning if not
        if(task.indicator.required_attributes?.length > 0){
            for(const attr of task.indicator.required_attributes){
                console.log(task.indicator.required_attributes)
                if(!respondent.special_attribute.find(a => a.id == attr.id)){
                    dropWarnings.push(
                        `This task requires that this respondent is a ${getLabelFromValue('special_attributes', attr.name)}, 
                        but they are not marked as such.
                        
                        Please confirm this is correct. This interaction will be flagged if the issue is not 
                        corrected. Thanks!`
                    )
                }
            }
        }

        setWarnings(dropWarnings);
        //push this task id to the list of those in the interaction
        addedIDs.push(task.id) //live var to prevent stale states
        setAdded(prev => [...prev, task]) //set the state
        onUpdate(addedIDs); //run the update function that goes back up to interactions --> respondent details --> tasks
        //remind/warn that a valid date is required
        if(date=='' || isNaN(Date.parse(date)) || new Date(date) > new Date()){
            dropWarnings.push('Interaction date must be a valid date and may not be in the future.');
        }
        //if additional inforation is required, show the appropriate modal
        if(task.indicator.subcategories.length > 0){
            setSubcatModalActive(true);
            setModalTask(task);
        }
        else if(task.indicator.require_numeric){
            setNumberModalActive(true);
            setModalTask(task)
        }
    }

    //remove a task from the batch
    const removeItem = (task) => {
        setAdded(prev => {
            const updated = prev.filter(t => t.id !== task.id);
            onUpdate(updated.map(t => t.id));
            return updated;
        });
        setErrors([]);
        setWarnings([]);
    };

    //when the user is done editing, call the submit function
    const handleSubmit = async () => {
        setErrors([]);
        setWarnings([]);
        //confirm theres a date/location
        let submissionErrors = [];
        if(interactionDate=='' || isNaN(Date.parse(interactionDate)) || new Date(interactionDate) > new Date()){
            submissionErrors.push('Interaction date must be a valid date and may not be in the future.');
        }
        if(!interactionLocation || interactionLocation == ''){
            submissionErrors.push('Interaction location is required.');
        }
        if(submissionErrors.length > 0){
            setErrors(submissionErrors)
            return;
        }

        //parse through each task to create an appropriate package
        const allTaskData = added.map((task) => ({
            task_id: task.id,
            numeric_component: number[task.id] || null,
            subcategories_data: subcats[task.id] || [],
            comments: comments[task.id] || null
        }))
        try{
            setSaving(true)
            console.log('submitting data...')
            const url = `/api/record/interactions/batch/`; 
            const response = await fetchWithAuth(url, {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'respondent': respondent.id,
                    'interaction_date': interactionDate,
                    'interaction_location': interactionLocation,
                    'tasks': allTaskData,
                })
            });

            const returnData = await response.json();
            if(response.ok){
                let interactions = []
                allTaskData.forEach((task) => {
                    interactions.push({
                        'interaction_date': interactionDate,
                        'interaction_location': interactionLocation,
                        'task': task,
                        'subcategories': task.subcategories,
                        'numeric_component': task.numeric_component,
                        'respondent': respondent.id,
                    })
                })
                setInteractions(prev => [...prev, interactions]);
                setAdded([]); //reset added
                onFinish(); //let parent components know that the operation happened
            }
            else{
                const serverResponse = []
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
                console.error(returnData)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record interactions: ', err)
        }
        finally{
            setSaving(false)
        }
    }

    return(
        <div>
            {modalTask && (
                <>
                    {commentsModalActive && <CommentModal task={modalTask} />}
                    {numberModalActive && <NumberModal task={modalTask} />}
                    {subcatModalActive && <SubcategoryModal task={modalTask} />}
                </>
            )}
            <h3>New Interaction</h3>
            <Messages errors={errors} warnings={warnings} />
            {!active && <i>Start dragging and dropping tasks to begin.</i>}
            <div style={{ display: 'flex', flexDirection: `${width > 500 ? 'row' : 'column'}`}}>
                <div style={{ display: 'flex', flexDirection: 'column'}}>
                    <label htmlFor="interaction_date">Interaction Date</label>
                    <input id='interaction_date' type='date' onChange={(e) => handleDateChange(e)}/>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column'}}>
                    <label htmlFor="interaction_location">Interaction Location</label>
                    <input id='interaction_location' type='text' onChange={(e) => setInteractionLocation(e.target.value)}/>
                </div>
            </div>

            <div className={styles.dropBox} onDrop={handleDrop} onDragOver={handleDragOver} style={{ border: '2px dashed gray' }}>
                {added.length === 0 && width >=768 && <p>Drag an indicator from the sidebar to start.</p>}
                {added.length === 0 && width < 768 && <p>Click the "Add to interaction" button on a task below to add it to the interaciton.</p>}
                {added.length > 0 && added.map((task) => (
                    <div className={styles.row} key={task.id}>
                        <div>
                            <p><b>{task.indicator.code + ': '} {task.indicator.name}</b></p>
                            {number[task.id] && <li>{number[task.id]}</li>}
                            <ul>
                                {subcats[task.id]?.length > 0 && subcats[task.id].map((c) => (<li key={c.subcategory.id}>{c.subcategory.name} {c?.numeric_component && `(${c.numeric_component})`}</li>))}
                            </ul>
                            {comments[task.id] && <p>{comments[task.id]}</p>}
                        </div>
                        <button onClick={() => {setCommentsModalActive(true); setModalTask(task)}}><BiSolidCommentAdd /> Add a Comment</button>
                        <button className={errorStyles.deleteButton} onClick={() => removeItem(task)}><FaTrashAlt /> Remove</button>
                    </div>
                ))}
            </div>

            <div style ={{ display: 'flex', flexDirection: 'row'}}>
            {active && added.length >0 && !saving && <ButtonHover callback={() => handleSubmit()} noHover={<IoIosSave />} hover={'Save'} />}
            {active && added.length >0 && !saving && <ButtonHover callback={() => setAdded([])} noHover={<FcCancel />} hover={'Cancel'} />}
            {saving && <ButtonLoading />}
            </div>
        </div>
    )
}