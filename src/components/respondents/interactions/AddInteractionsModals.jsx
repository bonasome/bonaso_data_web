import { useState, useEffect } from 'react'

import MultiCheckbox from '../../reuseables/inputs/MultiCheckbox';
import MultiCheckboxNum from '../../reuseables/inputs/MultiCheckboxNum';
import Messages from '../../reuseables/Messages'
import modalStyles from '../../../styles/modals.module.css';

import { FaCheck } from 'react-icons/fa';
import { FcCancel } from 'react-icons/fc';
import { FaTrashAlt } from 'react-icons/fa';
export function CommentModal({ onUpdate, onCancel, onClear, existing='' }){
    /*
    Modal that will appear when the user wants to add a comment a specific interaction
    - task (object): the modal task
    */

    //store comments in a local state while editing for easier editing/state management
    const [comment, setComment] = useState(existing);

    //close the modal
    const handleUpdate = () => {
        onUpdate(comment);
        onCancel();
    }
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
                {existing != '' && <button onClick={handleClear}><FaTrashAlt /> Remove</button>}
            </div>
        </div>
    )
}

export function NumberModal({ onUpdate, onCancel, onClear,  existing='' }){
    const [number, setNumber] = useState(existing); //store number in a local state while editing

    //on save, pass the local state to the parent state
    const handleUpdate = () => {
        onUpdate(number);
        onCancel();
    }

    return(
        <div className={modalStyles.modal}>
            <h2>Additional Information Required</h2>
            <label htmlFor='number'>The task {task.indicator.name} requires a numeric component.</label>
            <input id='number' type='number' value={number || ''} onChange={(e) => setNumber(e.target.value)} placeholder='Enter a number...'/>
            <div>
                <button disabled={number==''} onClick={() => handleUpdate()}><FaCheck /> Confirm Choices</button>
                <button onClick={() => onCancel()}><FcCancel/> Cancel</button>
            </div>
        </div>
    )
}

export function SubcategoryModal({ options, onUpdate, onCancel, onClear, numeric=false, existing=[], overwriteError=[] }) {
    const [subcats, setSubcats] = useState(existing);

    useEffect(() => {
        if(!existing || existing?.length==0 || numeric) return;
        setSubcats(existing.map((c) => (c.subcategory.id)));
    }, [existing])

    const handleUpdate = () => {
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
    const handleClear = () => {
        onClear();
        onCancel();
    }
    return (
        <div className={modalStyles.modal}>
            <h2>Additional Information Required</h2>
            <Messages errors={overwriteError} />
           
            {numeric ? <MultiCheckboxNum options={options} name={'subcats'} value={subcats} 
                label={'Please select all relevant subcategories'} onChange={setSubcats} /> : 
                <MultiCheckbox options={options} name={'subcats'} value={subcats} 
                label={'Please select all relevant subcategories'} onChange={setSubcats}
                labelField='name' valueField='id' />}
            <div>
                <button disabled={subcats.length === 0} onClick={handleUpdate}>
                    <FaCheck /> Confirm Choices
                </button>
                {existing.length > 0 && <button disabled={subcats.length ===0} onClick={onCancel}><FcCancel /> Cancel</button>}
                {existing.length === 0 && <button onClick={handleClear}><FcCancel /> Cancel</button>}
            </div>
        </div>
    );
}