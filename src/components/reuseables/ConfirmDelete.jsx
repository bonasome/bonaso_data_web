import styles from '../../styles/modals.module.css';
import errorStyles from '../../styles/errors.module.css';
import { useState } from 'react';


export default function ConfirmDelete({ name, onConfirm, onCancel, statusWarning=null, allowEasy=false }){
    const [confirmDelete, setConfirmDelete] = useState('');

    return(
        <div className={styles.modal} >
            <h3>You are about to delete {name}</h3>
            <p>
                Please be absolutely sure that you want to do this. This action cannot be undone.
            </p>
            {statusWarning && <p>{statusWarning}</p>}
            {!allowEasy && <p>Please type "confirm" to delete.</p>}
            {!allowEasy && <input type='text' value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} />}
            <button className={errorStyles.deleteButton} onClick={() => onConfirm()} disabled={allowEasy ? null : confirmDelete != 'confirm'}>Confirm</button>
            <button onClick={() => onCancel()}>Cancel</button>
            <></>
        </div>
    )
}