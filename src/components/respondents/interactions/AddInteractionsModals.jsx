import { useState, useEffect } from 'react'

import MultiCheckbox from '../../reuseables/inputs/MultiCheckbox';
import MultiCheckboxNum from '../../reuseables/inputs/MultiCheckboxNum';
import Messages from '../../reuseables/Messages'
import modalStyles from '../../../styles/modals.module.css';

import { FaCheck } from 'react-icons/fa';
import { FcCancel } from 'react-icons/fc';
import { FaTrashAlt } from 'react-icons/fa';


/*
Helper modals that are used to input additional information about an interaction within the add interaction
component. The three are
- comments (for adding/editing comments)
- number (for writing a single number)
- subcats (for selecting subcats and entering associated numeric values as required)

For all three of these modals, the parent component, AddInteraction, will manage the selected state to make
sure information about the correct interaction/task is being edited. 
*/

export function CommentModal({ onUpdate, onCancel, onClear, existing='' }){
    /*
    Modal that will appear when the user wants to add a comment a specific interaction. The parent component
    will manage which interaction is being edited
    - onUpdate (function): what to do when changes are made
    - onCancel (function): what to do when closing the modal
    - onClear (function): after adding, allows a user to clear the comment
    - existing (string, optional): the existing comment value
    */

    //store comments in a local state while editing for easier editing/state management
    //it will get passed up through onUpdate
    const [comment, setComment] = useState(existing);

    //update + close
    const handleUpdate = () => {
        onUpdate(comment);
        onCancel();
    }
    //clear + close
    const handleClear = () => {
        onClear();
        onCancel();
    }

    return(
        <div className={modalStyles.modal}>
            <h2>Comment Manager</h2>
            <label htmlFor='comments'>Adding a Comment.</label>
            <textarea id='comments' value={comment || ''} onChange={(e) => setComment(e.target.value)}/>
            <div>
                <button disabled={comment == ''} onClick={() => handleUpdate()}><FaCheck /> Save</button>
                <button onClick={() => onCancel()}><FcCancel /> Cancel</button>
                {/* If a comment exists, cancel should make no changes while clear will deliberate erase the comment */}
                {existing != '' && <button onClick={handleClear}><FaTrashAlt /> Remove</button>}
            </div>
        </div>
    )
}

export function NumberModal({ onUpdate, onCancel, onClear,  existing='' }){
    /*
    Modal that will appear when ta single numeric input is required. The parent component
    will manage which interaction is being edited
    - onUpdate (function): what to do when changes are made
    - onCancel (function): what to do when closing the modal
    - onClear (function): on initial load, allows a user to click cancel to undo the operation of adding the interaction,
        since this field is required to proceed. After initial load, users should remove the interaction
    - existing (string, optional): the existing number
    */
    const [number, setNumber] = useState(existing); //store number in a local state while editing

    //on save, pass the local state to the parent state, then close
    const handleUpdate = () => {
        onUpdate(number);
        onCancel();
    }
    //remove ir from parent list, then close
    const handleClear = () => {
        onClear();
        onCancel();
    }

    return(
        <div className={modalStyles.modal}>
            <h2>Additional Information Required</h2>
            <label htmlFor='number'>This task requires a numeric component.</label>
            <input id='number' type='number' value={number || ''} onChange={(e) => setNumber(e.target.value)} placeholder='Enter a number...'/>
            <div>
                <button disabled={number==''} onClick={() => handleUpdate()}><FaCheck /> Confirm Choices</button>
                {/* if this is just being added, cancel should close without making edits */}
                {existing != '' && <button onClick={() => onCancel()}><FcCancel/> Cancel</button>}
                {/* on first time add, cancel will remove the interaction, since this field is required, 
                so by clicking cancel we assume the user is trying to cancel the operation of 
                adding the task */}
                {existing == '' && <button onClick={handleClear}><FcCancel/> Cancel</button>}
            </div>
        </div>
    )
}

export function SubcategoryModal({ options, onUpdate, onCancel, onClear, numeric=false, existing=[], overwriteError=[] }) {
    /*
    Modal that will appear when ta single numeric input is required. The parent component
    will manage which interaction is being edited
    - options (array): array of objects contaning subcategory iptions
    - onUpdate (function): what to do when changes are made
    - onCancel (function): what to do when closing the modal
    - onClear (function): on initial load, allows a user to click cancel to undo the operation of adding the interaction,
        since this field is required to proceed. After initial load, users should remove the interaction
    - existing (array, optional): array of existing selected values
    */
    
    const [subcats, setSubcats] = useState(existing);

    //if the value is not numeric, edit the passed existing prop to a format that MultiCheckbox can read (just the ids)
    useEffect(() => {
        if(!existing || existing?.length==0 || numeric) return;
        setSubcats(existing.map((c) => (c.subcategory.id)));
    }, [existing])

    //handle saving these subcategories
    const handleUpdate = () => {
        //if the value is being passed form MultiCheckbox, it will have just the ids as values, so map it to the format AddInteraction is expecting
        if(!numeric){
            const values = subcats.map(c => {
                const name = options.find(o => o.id == c)?.name
                return {id: null, subcategory: {id: c, name: name}, numeric_component: null};
            })
            onUpdate(values);
        }
        else{
            onUpdate(subcats);
        }
    }
    //remove the interaction
    const handleClear = () => {
        onClear();
        onCancel();
    }
    return (
        <div className={modalStyles.modal}>
            <h2>Additional Information Required</h2>
            <Messages errors={overwriteError} />
            {/* check if a numeric value is required, and if so pass a specialized checkbox comp to handle it */}
            {numeric ? <MultiCheckboxNum options={options} name={'subcats'} value={subcats} 
                label={'Please select all relevant subcategories'} onChange={setSubcats} /> : 
                <MultiCheckbox options={options} name={'subcats'} value={subcats} 
                label={'Please select all relevant subcategories'} onChange={setSubcats}
                labelField='name' valueField='id' />}
            <div>
                <button disabled={subcats.length === 0} onClick={handleUpdate}>
                    <FaCheck /> Confirm Choices
                </button>
                {/* if this is just being added, cancel should close without making edits */}
                {existing.length > 0 && <button onClick={onCancel}><FcCancel /> Cancel</button>}
                {/* on first time add, cancel will remove the interaction, since this field is required, 
                so by clicking cancel we assume the user is trying to cancel the operation of 
                adding the task */}
                {existing.length === 0 && <button onClick={handleClear}><FcCancel /> Cancel</button>}
            </div>
        </div>
    );
}