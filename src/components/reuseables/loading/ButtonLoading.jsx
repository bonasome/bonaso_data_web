import React from 'react';
import styles from './loading.module.css';

export default function ButtonLoading({ forDelete=false }) {
    return (
        <div className={forDelete ? styles.deleteButtonLoad : styles.buttonLoad}>
            <div className={forDelete ? styles.deleteButtonSpinner : styles.buttonSpinner} />
            <span className={styles.buttonLabel}>{forDelete ? 'Removing...' : 'Working...'}</span>
        </div>
    );
}