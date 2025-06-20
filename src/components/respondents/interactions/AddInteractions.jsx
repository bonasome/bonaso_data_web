import { useState, useMemo } from "react";
import Checkbox from '../../reuseables/Checkbox';
import fetchWithAuth from "../../../../services/fetchWithAuth";
import errorStyles from '../../../styles/errors.module.css';
import modalStyles from '../../../styles/modals.module.css';
import { useInteractions} from '../../../contexts/InteractionsContext';
import styles from '../respondentDetail.module.css';


export default function AddInteractions({ id, tasks, interactions, onUpdate, onFinish }) {
    const { setInteractions } = useInteractions();
    const [interactionDate, setInteractionDate] = useState('');
    const [number, setNumber] = useState({});
    const [subcats, setSubcats] = useState({});
    const [comments, setComments] = useState({});
    const [active, setActive] = useState(false);
    const [added, setAdded] = useState([]);
    const[ allowedSubcats, setAllowedSubcats] = useState([]);
    const [numberModalActive, setNumberModalActive] = useState(false);
    const [commentsModalActive, setCommentsModalActive] = useState(false);
    const [modalTask, setModalTask] = useState(null);
    const [subcatModalActive, setSubcatModalActive] = useState(false);
    const[errors, setErrors] = useState([]);
    const[warnings, setWarnings] = useState([]);

    function CommentModal({task}){
        const [localComment, setLocalComment] = useState('');
        const closeWindow = () => {
            if(localComment[task.id] == ''){
                setAdded(prev => prev.filter(added => added.id == task.id))
            }
            setComments(prev => ({...prev,[task.id]: localComment}))
            setCommentsModalActive(false);
        }
        console.log(task)
        if(!task) return<></>
        return(
            <div className={modalStyles.modal}>
                <h2>Additional Information Required</h2>
                <label htmlFor='comments'>Adding a Comment.</label>
                <textarea id='comments' value={localComment || ''} onChange={(e) => setLocalComment(e.target.value)}/>
                <div>
                    <button onClick={() => closeWindow()}>Save</button>
                    <button onClick={() => setCommentsModalActive(false)}>Cancel</button>
                </div>
            </div>
        )
    }
    function NumberModal({task}){
        const [modalErrors, setModalErrors] = useState('');
        const [localNumber, setLocalNumber] = useState('');
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
                {modalErrors && <div role='alert' className={errorStyles.errors} style={{width: '30vw'}}><p>{modalErrors}</p></div>}
                <label htmlFor='number'>The task {task.indicator.name} requires a numeric component.</label>
                <input id='number' type='number' value={localNumber || ''} onChange={(e) => setLocalNumber(e.target.value)} />
                <div>
                    <button onClick={() => closeWindow()}>Confirm Choices</button>
                    <button onClick={() => cancel()}>Cancel</button>
                </div>
            </div>
        )
    }
    function SubcategoryModal({task}){
        const [modalErrors, setModalErrors] = useState('');
        const handleCheckbox = (checked, value) => {
            setSubcats(prev => {
                const currentList = prev[task.id] || [];

                const updatedList = checked
                ? [...currentList, value]
                : currentList.filter(v => v !== value);

                return {
                    ...prev,
                    [task.id]: updatedList,
                };
            });
        };
        const cancel = () => {
            setAdded(prev => {
                const updated = prev.filter(t => t.id !== task.id);
                onUpdate(updated.map(t => t.id));
                return updated;
            });
            setSubcatModalActive(false);
        }
        const closeWindow = () => {
            if(subcats[task.id].length === 0){
                setModalErrors('This field is required.');
                return;
            }
            setSubcatModalActive(false);
        }

        return(
            <div className={modalStyles.modal}>
                <h2>Additional Information Required</h2>
                {modalErrors && <div role='alert' className={errorStyles.errors} style={{width: '30vw'}}><p>{modalErrors}</p></div>}
                <p>Please select all relevent subcategories related to this interaction.</p>
                {task.indicator.subcategories.map((cat) => (<div key={cat.name} className={modalStyles.checkbox}> <Checkbox label={cat.name} checked={subcats[task.id]?.includes(cat.name)} name={cat.name} callback={(checked) => handleCheckbox(checked, cat.name)}/></div> ))}
                <div>
                    <button onClick={() => closeWindow()}>Confirm Choices</button>
                    <button onClick={() => cancel()}>Cancel</button>
                </div>
            </div>
        )
    }

    const handleDateChange = (e) => {
        const date = e.target.value;
        if(date === '' || isNaN(Date.parse(date)) || new Date(date) > new Date()){
            setWarnings(['Please enter a valid interaction date.'])
        }
        setInteractionDate(date)
        setWarnings([])

    }
    const handleDrop = (e) => {
        let dropWarnings = [];
        if(subcatModalActive || numberModalActive){
            dropWarnings.push(`Please fill out and close the modal form before adding another task.`);
            return;
        }
        e.preventDefault();
        const task = JSON.parse(e.dataTransfer.getData('application/json'));
        if(!active) setActive(true);

        let addedIDs = added.map((d) => (d.id))
        if(addedIDs.includes(task.id)){
            dropWarnings.push(`This task is already recorded for this interaction.`);
            return;
        }

        addedIDs.push(task.id)
        setAdded(prev => [...prev, task])
        onUpdate(addedIDs);

        if (task?.indicator?.prerequisite) {
            const prereq = task.indicator.prerequisite;
            const requiredTask = tasks.find(t => t.indicator.id === prereq.id);
            let isValid = false;
            if (addedIDs.includes(requiredTask?.id?.toString())) {
                isValid = true;
            } 
            else if (interactions?.length > 0) {
                const validPastInt = interactions.find(inter => inter?.task_detail?.indicator?.id === prereq.id);
                if (validPastInt && validPastInt.date <= interactionDate) {
                    isValid = true;
                    if (validPastInt?.subcategories) {
                        const interSubcats = validPastInt.subcategories.map(t => t.name);
                        setAllowedSubcats(interSubcats);
                    }
                }
            }
            if (!isValid) {
                dropWarnings.push(
                    `This indicator requires this respondent to have been ${prereq.name}, however, we could not find a prior record of this interaction.`
                );
            }
        }
        if(interactionDate=='' || isNaN(Date.parse(interactionDate)) || new Date(interactionDate) > new Date()){
            dropWarnings.push('Interaction date must be a valid date and may not be in the future.');
        }
        if(task.indicator.require_numeric){
            setNumberModalActive(true);
            setModalTask(task)
        }
        if(task.indicator.subcategories.length > 0){
            setSubcatModalActive(true);
            setModalTask(task);
        }
        if (interactions?.length > 0) {
            const pastInt = interactions.filter(inter => inter?.task_detail?.indicator?.id === task.indicator.id);
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
        setWarnings(dropWarnings);
    }

    const handleDragOver = (e) => {
        e.preventDefault(); // Required to allow drop
    };

    const handleSubmit = async () => {
        let submissionErrors = [];
        if(interactionDate=='' || isNaN(Date.parse(interactionDate)) || new Date(interactionDate) > new Date()){
            submissionErrors.push('Interaction date must be a valid date and may not be in the future.');
        }
        const allTaskData = added.map((task) => ({
            task: task.id,
            numeric_component: number[task.id] || null,
            subcategory_names: subcats[task.id] || [],
            comments: comments[task.id] || null
        }))
        if(submissionErrors.length > 0){return;}
        try{
            console.log('submitting data...',)
            const url = `/api/record/interactions/batch/`; 
            const response = await fetchWithAuth(url, {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'respondent': id,
                    'interaction_date': interactionDate,
                    'tasks': allTaskData,
                })
            });
            const returnData = await response.json();
            if(response.ok){
                let interactions = []

                allTaskData.forEach((task) => {
                    interactions.push({
                        'interaction_date': interactionDate,
                        'task_detail': task,
                        'subcategories': task.subcategories,
                        'numeric_component': task.numeric_component,
                        'respondent': id,
                    })
                })
                setInteractions(prev => [...prev, interactions]);
                setAdded([]);
                onFinish()
            }
            else{
                const serverResponse = []
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
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record respondent: ', err)
        }
        setErrors(submissionErrors);
    }
    const removeItem = (task) => {
        setAdded(prev => {
            const updated = prev.filter(t => t.id !== task.id);
            onUpdate(updated.map(t => t.id));
            return updated;
        });
    };

    return(
        <div>
            {modalTask && (
                <>
                    {commentsModalActive && <CommentModal task={modalTask} />}
                    {numberModalActive && <NumberModal task={modalTask} />}
                    {subcatModalActive && <SubcategoryModal task={modalTask} />}
                </>
            )}
            <h3>Adding Tasks to Interaction</h3>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {warnings.length != 0 && <div className={errorStyles.warnings}><ul>{warnings.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {!active && <i>Start dragging and dropping tasks to begin.</i>}
            {active && <input type='date' onChange={(e) => handleDateChange(e)}/>}
            <div className={styles.dropBox} onDrop={handleDrop} onDragOver={handleDragOver} style={{ border: '2px dashed gray' }}>
                {added.length === 0 && <p>Drag an indicator from the sidebar to start.</p>}
                {added.length > 0 && added.map((task) => (
                    <div className={styles.row}>
                        <div>
                            <p><b>{task.indicator.code + ': '} {task.indicator.name}</b></p>
                            {number[task.id] && <li>{number[task.id]}</li>}
                            <ul>
                                {subcats[task.id]?.length >0 && subcats[task.id].map((c) => (<li key={c}>{c}</li>))}
                            </ul>
                            {comments[task.id] && <p>comments[task.id]</p>}
                        </div>
                        <button onClick={() => {setCommentsModalActive(true); setModalTask(task)}}>Add a comment</button>
                        <button onClick={() => {removeItem(task)}}>Remove From List</button>
                    </div>
                ))}
            </div>
            {active && added.length >0 && <button onClick={() => handleSubmit()} >Save</button>}
        </div>
    )
}