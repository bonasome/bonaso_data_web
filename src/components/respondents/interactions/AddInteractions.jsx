import { useState, useEffect, useRef } from "react";

import { useInteractions} from '../../../contexts/InteractionsContext';

import fetchWithAuth from "../../../../services/fetchWithAuth";
import useWindowWidth from '../../../../services/useWindowWidth';

import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import { CommentModal, SubcategoryModal, NumberModal } from "./AddInteractionsModals";
import Messages from '../../reuseables/Messages';


import errorStyles from '../../../styles/errors.module.css';
import styles from '../respondentDetail.module.css';

import { FaTrashAlt, FaCheck } from "react-icons/fa";
import { IoIosSave } from "react-icons/io";
import { BiSolidCommentAdd } from "react-icons/bi";
import { FcCancel } from "react-icons/fc";
import { ImPencil } from "react-icons/im";
export default function AddInteractions({ respondent, meta, onUpdate, onFinish, setAddingTask }) {
    /*
    Component that allows a user to add a task(s) (either from a drag and drop or callback from a parent component)
    and record it as an interaction or a set of interactions with the same date/location/respondent. 
    - respondent (object): respondent these interactions relate to
    - meta (object): model information
    - onUpdate (function): what to do when the user adds a new task to the list of interactions
    - onFinish (function): what to do when the user submits the list of interactions
    - setAddingTask (function): helper function that passes information about a task to this component
        for processing when a button-click method is used
    */

    //contexts
    const { setInteractions } = useInteractions();
    //fields used for managing user inputs
    const [interactionDate, setInteractionDate] = useState('');
    const [interactionLocation, setInteractionLocation] = useState('');

    const [overwriteError, setOverwriteError] = useState([]); //field that tracks error when a user's edits to a parent interaction would invalidate a downstream interaction with matched subcats
    const [selected, setSelected] = useState([]); //manages the list of selected tasks and associated information

    //creation helpers that manage pop up modals for when additional into is required
    const [subcatModalActive, setSubcatModalActive] = useState(false);
    const [numberModalActive, setNumberModalActive] = useState(false);
    const [commentsModalActive, setCommentsModalActive] = useState(false);
    const [modalTask, setModalTask] = useState(null); //task/interaction that is currently being added and needs modal information

    //state to control whether the user is actively adding tasks to create new interactions
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

    //update the date on changes
    const handleDateChange = (e) => {
        const date = e.target.value;
        if(date === '' || isNaN(Date.parse(date)) || new Date(date) > new Date()){
            setWarnings(['Please enter a valid interaction date.'])
        }
        setInteractionDate(date)
        setWarnings([])
    }

    //set the state as active when the user clicks a button to add a task
    useEffect(() => {
        setErrors([])
        setAddingTask(() => handleAdd)
        if (!active) setTimeout(() => setActive(true), 0);
    }, [setAddingTask])


    //drag and drop is supported, if so quickly parse package then pass to the main validation function
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

    //validation function for when a new task is submitted (either via drag and drop or from the setAddingTask triggered on a button press)
    const handleAdd = async (task) => {
        setErrors([]);
        setWarnings([]);
        setOverwriteError([]);

        const date = interactionDateRef.current; //get the current date
        let dropWarnings = [];

        //verify the task is not already in the included package
        const exists = selected.find(t => t.id == task.id);
        if(exists){
            dropWarnings.push(`This task is already included in this interaction.`);
            return;
        }
        //by default allow all subcategories
        if(task.indicator.subcategories.length > 0) setAllowedSubcats(prev => ({...prev, [task.id]: task.indicator.subcategories}));
        //show warnings if prerequisites are required and not met
        if (task?.indicator?.prerequisites.length > 0) {
            //loop through each prereq if present
            for (const prereq of task.indicator.prerequisites) {
                if (!prereq || !prereq.id) continue; //gracefully catch bad info
                //see if the required task is added to this batch
                const inBatch = selected.find(t => t.task.indicator.id == prereq.id);
                let found = false //see if a prerequisite is present

                if (inBatch) {
                    found = true //if in the batch, we're good. 
                    //if subcats are present and supposed to be matched, auto limit them for convenience
                    if(task.indicator.match_subcategories_to === prereq.id){
                        const interSubcatIDs = inBatch.subcategories_data.map((cat) => (cat?.subcategory?.id));
                        const interSubcats = task.indicator.subcategories.filter(cat => (interSubcatIDs.includes(cat.id)));
                        setAllowedSubcats(prev=> ({...prev, [task.id]: interSubcats}));
                    }
                } 

                //try to find an interaction that matches the conditions from the server
                try{
                    const response = await fetchWithAuth(`/api/record/interactions/?respondent=${respondent.id}&task_indicator=${prereq.id}&before=${interactionDate}`);
                    const data = await response.json();
                    //if something is found
                    if(data.results.length > 0){
                        const validPastInt = data.results.find(inter => inter?.task?.indicator?.id == prereq.id);
                        if (validPastInt && validPastInt.interaction_date <= date) {
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
        if (!task.indicator.allow_repeat) {
            try{
                const response = await fetchWithAuth(`/api/record/interactions/?respondent=${respondent.id}&indicator=${task.indicator.id}`);
                const data = await response.json();
                const msInDay = 1000 * 60 * 60 * 24; //convert ms to days
                // check if any interaction was within the past 30 days of interactionDate
                const tooRecent = data.results.some(inter => {
                    const diffInDays = Math.abs(new Date(inter?.interaction_date) - new Date(date)) / msInDay;
                    return diffInDays <= 30;
                });
                if (tooRecent) {
                    dropWarnings.push(
                        'This respondent has had this another interaction with this task within the past 30 days. Please be sure you are not double recording.'
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
        //update the warnings box
        setWarnings(dropWarnings);

        //create a new package containing all the fields the interaction may need
        const newIr = {id: task.id, task: task, subcategories_data: [], numeric_component: '', comments: ''}
        const ids = [selected.map(s => s.id), task.id]
        //push this task id to the list of those in the interaction
        setSelected(prev => [...prev, newIr]) //update the state

        onUpdate(ids); //run the update function that goes back up to interactions --> respondent details --> tasks
        
        //remind/warn that a valid date/location is required
        if(date=='' || isNaN(Date.parse(date)) || new Date(date) > new Date()){
            dropWarnings.push('Interaction date must be a valid date and may not be in the future.');
        }
        if(location==''){
            dropWarnings.push('Interaction location is required.');
        }
        //if additional information is required, show the appropriate modal
        if(task.indicator.subcategories.length > 0){
            setSubcatModalActive(true);
            setModalTask(newIr);
        }
        //if it has subcategories and requires numeric, the subcategory modal will handle it
        else if(task.indicator.require_numeric){
            setNumberModalActive(true);
            setModalTask(newIr)
        }
    }

    //remove a task from the batch
    const removeItem = (task) => {
        setOverwriteError([]);
        setSelected(prev => {
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
        setOverwriteError([]);
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

        //parse through each item in selected to create an appropriate package
        const allTaskData = selected.map((ir) => ({
            task_id: ir.id,
            numeric_component: ir.numeric_component == '' ? null : ir.numeric_component,
            subcategories_data: ir.subcategories_data,
            comments: ir.comments,
        }));

        //create at the batch interaction endpoint
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
                //update the context
                let interactions = [];
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
                setSelected([]); //reset selected tasks
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
                setErrors(serverResponse);
                console.error(returnData);
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

    //handle a user changing the number of selected components
    const handleSubcatEdit = (ir, val) => {
        //check for potetial downstream tasks that rely on this as a parent interaction
        for(const sel of selected){
            //check if this item uses this as a match subcats
            if(sel.task.indicator.match_subcategories_to == ir.task.indicator.id){
                const selIDs = sel.subcategories_data.map((cat) => cat?.subcategory?.id);
                const interSubcatIDs = val.map((cat) => (cat?.subcategory?.id));
                //check if the new list removes a choice that the downstream interaction was relying on (prevents flags)
                if(!selIDs.every(id => interSubcatIDs.includes(id))){
                    setOverwriteError([`Cannot make these changes without invalidating a depending task (${sel.task.display_name}). Please edit that interaction first.`]);
                    return;
                }
                //if its still a subset, set the downstream tasks allowed subcats to the selected cats
                //this works since the subcategories for task and sel.task should be identical
                const interSubcats = ir.task.indicator.subcategories.filter(cat => (interSubcatIDs.includes(cat.id)));
                setAllowedSubcats(prev=> ({...prev, [sel.id]: interSubcats}));
            }
        }
        //edit the actual state once verification is complete
        setSelected(prev =>
            prev.map(item => item.id === modalTask.id ? { ...item, subcategories_data: val } : item)
        )
        setSubcatModalActive(false);
    }


    //converts a db value to a corresponding label from the meta
    const getLabelFromValue = (field, value) => {
        if(!meta) return null
        const match = meta[field]?.find(range => range.value === value);
        return match ? match.label : null;
    };

    return(
        <div>
        {/* Manages the popup modals for additional details */}
            {modalTask && (
                <>
                    {commentsModalActive && <CommentModal onUpdate={(val) => setSelected(prev =>
                            prev.map(item => item.id === modalTask.id ? { ...item, comments: val } : item)
                        )} 
                        onCancel={() => setCommentsModalActive(false)} 
                        onClear={(val) => setSelected(prev =>
                            prev.map(item => item.id === modalTask.id ? { ...item, comments: '' } : item)
                        )}
                        existing={modalTask?.comments ?? ''} />}
                    {numberModalActive && <NumberModal onUpdate={(val) => setSelected(prev =>
                            prev.map(item => item.id === modalTask.id ? { ...item, numeric_component: val } : item)
                        )} 
                        onClear={() => {removeItem(modalTask)}}
                        onCancel={() => setNumberModalActive(false)} existing={modalTask?.numeric_component ?? ''} />}
                    {subcatModalActive && <SubcategoryModal onUpdate={(val) => {handleSubcatEdit(modalTask, val)}} 
                        onClear={() => {removeItem(modalTask)}}
                        onCancel={() => setSubcatModalActive(false)} existing={modalTask?.subcategories_data ?? []}
                        overwriteError={overwriteError} options={allowedSubcats[modalTask.id]} numeric={modalTask.task.indicator.require_numeric} />}
                </>
            )}
            <h3>New Interaction</h3>
            <Messages errors={errors} warnings={warnings} ref={alertRef} />
            {!active && <i>Start dragging and dropping tasks to begin.</i>}
            <div style={{ display: 'flex', flexDirection: `${width > 500 ? 'row' : 'column'}`}}>
                <div style={{ display: 'flex', flexDirection: 'column'}}>
                    <label htmlFor="interaction_date">Interaction Date</label>
                    <input id='interaction_date' type='date' onChange={(e) => handleDateChange(e)}/>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column'}}>
                    <label htmlFor="interaction_location">Interaction Location</label>
                    <input id='interaction_location' type='text' onChange={(e) => setInteractionLocation(e.target.value)} placeholder='ex. Gaborone Clinic' />
                </div>
            </div>

            <div className={styles.dropBox} onDrop={handleDrop} onDragOver={handleDragOver} style={{ border: '2px dashed gray' }}>
                {selected.length === 0 && width >=768 && <p>Drag an indicator from the sidebar to start.</p>}
                {selected.length === 0 && width < 768 && <p>Click the "Add to interaction" button on a task below to add it to the interaciton.</p>}
                {selected.length > 0 && selected.map((ir) => (
                    <div className={styles.row} key={ir.id}>
                        <div>
                            <p><b>{ir.task.display_name}</b></p>
                            {/* show numeric information/edit buttom if applicable (if it has subcats, the subcat modal will handle it) */}
                            {ir.task.indicator.require_numeric && ir?.task?.indicator?.subcategories?.length == 0 && <div>
                                <button onClick={() => {setNumberModalActive(true); setModalTask(ir)}}><ImPencil /></button>
                                <li>{ir.numeric_component}</li>
                            </div>}
                            {/* show subcat information/edit butto if applicable */}
                                {ir.subcategories_data.length > 0 && <div>
                                    <ul>
                                        {ir.subcategories_data.map((c) => 
                                            (<li key={c.subcategory.id}>{c.subcategory.name} {c?.numeric_component && `(${c.numeric_component})`}</li>))}
                                    </ul>
                                    <button onClick={() => {setSubcatModalActive(true); setModalTask(ir)}}><ImPencil /></button>
                                </div>}
                            {/* show comments */}
                            <div>
                                <strong>Comments:</strong>
                                {ir.comments == '' ? <p><i>No Comments</i></p> : <p>{ir.comments}</p>}
                            </div>
                            
                        </div>
                        {/* butons to remove/comment */}
                        <button onClick={() => {setCommentsModalActive(true); setModalTask(ir)}}><BiSolidCommentAdd /> {width > 575 && 'Add a Comment'}</button>
                        <button className={errorStyles.deleteButton} onClick={() => removeItem(ir)}><FaTrashAlt /> {width > 575 && 'Remove'}</button>
                    </div>
                ))}
            </div>

            <div style ={{ display: 'flex', flexDirection: 'row'}}>
            {active && selected.length >0 && !saving && <button onClick={() => handleSubmit()}><IoIosSave /> Save</button>}
            {active && selected.length >0 && !saving && <button onClick={() => {setSelected([]); setErrors([]); setWarnings([]);}}><FcCancel /> Cancel</button>}
            {saving && <ButtonLoading />}
            </div>
        </div>
    )
}