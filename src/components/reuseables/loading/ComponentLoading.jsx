import React from 'react';
import styles from './loading.module.css';

export default function ComponentLoading (){
    /*
    Moving bars that signify a component is loading. Use for individual components.
    */
    return( 
        <div className={styles.componentLoading}>
            <div className={styles.loadingBars}>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    )
};