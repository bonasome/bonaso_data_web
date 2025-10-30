import React from 'react';
import { useState, useEffect } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth';

import Faves from './Favorites';
import UpdateBox from './UpdateBox';

import styles from './home.module.css';
import modalStyles from '../../styles/modals.module.css';

function PopUp({ onClose }){
    //modal to cover our bases
    return(
        <div className={modalStyles.modal}>
            <h1>Welcome!</h1>
            <p>
                Welcome to the BONASO data portal. Please note that any information you see in this portal
                is confidential, and may not be shared or distributed to anyone outside of your organization.
                <strong> Any violations of client confidentiality is against the law and is punishable by fines
                and/or jail time.</strong> By entering this portal, you agree to maintain confidentiality of
                all data you see here and also agree that you will not misuse any information here.
            </p>
            <p>Thank you for all the important work you do in the fight for a healthier Botswana!</p>
            <button onClick={() => onClose()}>I understand, and will not misuse any data I access on this portal.</button>
        </div>
    )
}

export default function Home() {
    //default landing page the user sees when they first log in
    const { user } = useAuth();
    const [showWarning, setShowWarning] = useState(true); //manage the PopUp state
    
    return (
        <div className={styles.home}>
            {showWarning && <PopUp onClose={() => setShowWarning(false)}/>}
            <h1 className={styles.header}>Welcome, {user.username}!</h1>
            <div className={styles.content}>
                <UpdateBox />
                <Faves />
            </div>
        </div>
    )
}
