import { useState, useEffect, useRef } from "react";
import Checkbox from '../../reuseables/Checkbox';
import fetchWithAuth from "../../../../services/fetchWithAuth";
import errorStyles from '../../../styles/errors.module.css';
import modalStyles from '../../../styles/modals.module.css';
import { useInteractions} from '../../../contexts/InteractionsContext';
import styles from '../respondentDetail.module.css';
import useWindowWidth from '../../../../services/useWindowWidth';

export default function AddInteractions({ id, tasks, interactions, onUpdate, onFinish, setAddingTask }) {
    const { setInteractions } = useInteractions();
    const [interactionDate, setInteractionDate] = useState('');
    const [number, setNumber] = useState({});
    const [subcats, setSubcats] = useState({});
    const [comments, setComments] = useState({});
    const [active, setActive] = useState(false);
    const [added, setAdded] = useState([]);
    const[ allowedSubcats, setAllowedSubcats] = useState({});
    const [numberModalActive, setNumberModalActive] = useState(false);
    const [commentsModalActive, setCommentsModalActive] = useState(false);
    const [modalTask, setModalTask] = useState(null);
    const [subcatModalActive, setSubcatModalActive] = useState(false);
    const[errors, setErrors] = useState([]);
    const[warnings, setWarnings] = useState([]);
    const width = useWindowWidth();
    const interactionDateRef = useRef('');

    useEffect(() => {
        interactionDateRef.current = interactionDate;
    }, [interactionDate]);

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
    function SubcategoryModal({ task }) {
        const [modalErrors, setModalErrors] = useState('');
        const [localSubcats, setLocalSubcats] = useState([]);

        const handleCheckbox = (checked, value) => {
            setLocalSubcats(prev =>
                checked ? [...prev, value] : prev.filter(v => v !== value)
            );
        };

        const cancel = () => {
            setAdded(prev => {
                const updated = prev.filter(t => t.id !== task.id);
                onUpdate(updated.map(t => t.id));
                return updated;
            });
            setSubcatModalActive(false);
        };

        const closeWindow = () => {
            setSubcats(prev => ({...prev, [task.id]: localSubcats}));
            setSubcatModalActive(false);
        };

        const taskSubcats = allowedSubcats?.[task.id] || task.indicator.subcategories.map(c => c.name);

        return (
            <div className={modalStyles.modal}>
                <h2>Additional Information Required</h2>
                {modalErrors && (
                    <div role='alert' className={errorStyles.errors} style={{ width: '30vw' }}>
                        <p>{modalErrors}</p>
                    </div>
                )}
                <p>Please select all relevant subcategories related to {task.indicator.name}.</p>
                {taskSubcats.map((cat) => (
                    <div key={cat} className={modalStyles.checkbox}>
                        <Checkbox key={cat}
                            label={cat}
                            checked={localSubcats.includes(cat)}
                            name={cat}
                            callback={(checked) => handleCheckbox(checked, cat)}
                        />
                    </div>
                ))}
                <div>
                    <button disabled={localSubcats.length === 0} onClick={closeWindow}>
                        Confirm Choices
                    </button>
                    <button onClick={cancel}>Cancel</button>
                </div>
            </div>
        );
    }

    const handleDateChange = (e) => {
        const date = e.target.value;
        if(date === '' || isNaN(Date.parse(date)) || new Date(date) > new Date()){
            setWarnings(['Please enter a valid interaction date.'])
        }
        setInteractionDate(date)
        setWarnings([])

    }
    const handleDrop = async (e) => {
        setErrors([])
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

    useEffect(() => {
        setErrors([])
        setAddingTask(() => handleAdd)
        if (!active) setTimeout(() => setActive(true), 0);
    }, [setAddingTask])

    const handleAdd = async (task) => {
        const date = interactionDateRef.current;
        let dropWarnings = [];
        let addedIDs = added.map((d) => (d.id))
        if(addedIDs.includes(task.id)){
            dropWarnings.push(`This task is already recorded for this interaction.`);
            return;
        }

        if (task?.indicator?.prerequisite) {
            const prereq = task.indicator.prerequisite;
            const requiredTask = tasks.find(t => t.indicator.id === prereq.id);
            let isValid = false;
            const inBatch = added.filter(t => t.indicator.id.toString() === requiredTask?.indicator.id.toString())
            if (inBatch.length > 0) {
                isValid = true;
                const interSubcats = subcats[inBatch[0].id]
                setAllowedSubcats(prev=> ({...prev, [task.id]: interSubcats}));
            } 
            else if (interactions?.length > 0) {
                const response = await fetchWithAuth(`/api/record/interactions/?respondent=${interactions[0].respondent}&task_indicator=${prereq.id}&before=${interactionDate}`);
                const data = await response.json()
                console.log(data)
                if(data.results.length > 0){
                    const validPastInt = data.results.find(inter => inter?.task_detail?.indicator?.id === prereq.id);
                    console.log(validPastInt)
                    if (validPastInt && validPastInt.interaction_date <= date) {
                        isValid = true;
                        if (validPastInt?.subcategories) {
                            const interSubcats = validPastInt.subcategories.map(t => t.name);
                            setAllowedSubcats(prev=> ({...prev, [task.id]: interSubcats}));
                        }
                    }
                }
            }
            if (!isValid) {
                dropWarnings.push(
                    `This indicator requires this respondent to have been ${prereq.name}, however, we could not find a prior record of this interaction (HINT: If you haven't already, please set an interaciton date so that we can verify that the prerequisite interaction took place before or on the same date as this one.).`
                );
                setWarnings(dropWarnings);
                return;
            }
        }
        addedIDs.push(task.id)
        setAdded(prev => [...prev, task])
        onUpdate(addedIDs);
        if(date=='' || isNaN(Date.parse(date)) || new Date(date) > new Date()){
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
            const response = await fetchWithAuth(`/api/record/interactions/?respondent=${interactions[0].respondent}&task_indicator=${task.id}`);
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
        setWarnings(dropWarnings);
    }

    const handleDragOver = (e) => {
        e.preventDefault(); // Required to allow drop
    };

    const handleSubmit = async () => {
        setErrors([])
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
        if(submissionErrors.length > 0){
            setErrors(submissionErrors)
            return;
        }
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
                        serverResponse.push(`${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
                console.log(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record interactions: ', err)
        }
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
            <h3>New Interaction</h3>
            {errors.length != 0 && <div role='alert' className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {warnings.length != 0 && <div role='alert' className={errorStyles.warnings}><ul>{warnings.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {!active && <i>Start dragging and dropping tasks to begin.</i>}
            {active && <label htmlFor="interaction_date">Interaction Date</label>}
            {active && <input id='interaction_date' type='date' onChange={(e) => handleDateChange(e)}/>}
            <div className={styles.dropBox} onDrop={handleDrop} onDragOver={handleDragOver} style={{ border: '2px dashed gray' }}>
                {added.length === 0 && width >=768 && <p>Drag an indicator from the sidebar to start.</p>}
                {added.length === 0 && width < 768 && <p>Click the "Add to interaction" button on a task below to add it to the interaciton.</p>}
                {added.length > 0 && added.map((task) => (
                    <div className={styles.row} key={task.id}>
                        <div>
                            <p><b>{task.indicator.code + ': '} {task.indicator.name}</b></p>
                            {number[task.id] && <li>{number[task.id]}</li>}
                            <ul>
                                {subcats[task.id]?.length >0 && subcats[task.id].map((c) => (<li key={c}>{c}</li>))}
                            </ul>
                            {comments[task.id] && <p>{comments[task.id]}</p>}
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