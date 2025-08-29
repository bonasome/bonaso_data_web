import React from 'react';
import styles from './loading.module.css';

export default function ButtonLoading({ forDelete=false }) {
    /*
    Displays a thing resembling a button with a spinner to signify that a click has 
    been received and is being processed.
    - forDelete (boolean, optional): change style to the red used for delete buttons.
    */
    return (
        <div className={forDelete ? styles.deleteButtonLoad : styles.buttonLoad}>
            <div className={forDelete ? styles.deleteButtonSpinner : styles.buttonSpinner} />
            <span className={styles.buttonLabel}>{forDelete ? 'Removing...' : 'Working...'}</span>
        </div>
    );
}