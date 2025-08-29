import styles from '../../styles/modals.module.css';

import errorStyles from '../../styles/errors.module.css';

import { useState } from 'react';
import ButtonLoading from './loading/ButtonLoading';

//modal for confirming delete of important data
export default function ConfirmDelete({ name, onConfirm, onCancel, statusWarning=null, allowEasy=false }){
    /*
    Modal that will pop up asking a user to confirm they want to delete this thing. Will ask the user
    to type a value to confirm.
    - name (string): name of the object the user is trying to delete
    - onConfirm (function): the user has confirmed they want to delete the item, delete it
    - onCancel (function): the user changed their mind, do not delete, just close the modal
    - statusWarning (string, optional): addition text to display if there is a specific message you want
        to display (like consider marking as deprecated instead)
    - allowEasy (boolean, optional): by default, the user will have to type "confirm" to delete,
        but allow easy will just ask them to press the button (for lower stakes items).
    */
    const [deleting, setDeleting] = useState(false); //loading state
    const [confirmDelete, setConfirmDelete] = useState(''); //user confirmation input

    return(
        <div className={styles.modal} >
            <h3>You are about to delete {name}.</h3>
            <p>
                Please be absolutely sure that you want to do this. This action cannot be undone.
            </p>
            {statusWarning && <p>{statusWarning}</p>}
            {!allowEasy && <label htmlFor='confirm'>Please type "confirm" to delete.</label>}
            {!allowEasy && <input id="confirm" type='text' value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} />}
            {!deleting && <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
                <button className={errorStyles.deleteButton} onClick={() => {setDeleting(true); onConfirm()}} disabled={allowEasy ? null : confirmDelete != 'confirm'}>Confirm</button>
                <button onClick={() => onCancel()}>Cancel</button>
            </div>}
            {deleting &&  <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
                <ButtonLoading forDelete={true} />
            </div>}
            <></>
        </div>
    )
}