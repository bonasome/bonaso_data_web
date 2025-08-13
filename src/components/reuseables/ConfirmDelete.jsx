import styles from '../../styles/modals.module.css';

import errorStyles from '../../styles/errors.module.css';

import { useState } from 'react';
import ButtonLoading from './loading/ButtonLoading';

//modal for confirming delete of important data
export default function ConfirmDelete({ name, onConfirm, onCancel, statusWarning=null, allowEasy=false }){
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState('');

    return(
        <div className={styles.modal} >
            <h3>You are about to delete {name}</h3>
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