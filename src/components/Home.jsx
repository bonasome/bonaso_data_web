import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../contexts/UserAuth';

import fetchWithAuth from '../../services/fetchWithAuth';

import Loading from './reuseables/loading/Loading';
import UpdateBox from './home/UpdateBox';

import styles from './home.module.css';
import modalStyles from '../styles/modals.module.css';

function PopUp({ onClose }){
    return(
        <div className={modalStyles.modal}>
            <h1>Welcome!</h1>
            <p>
                Welcome to the BONASO data portal. Please note that any information you see in this portal
                is confidential, and may not be shared or distributed to anyone outside of your organization.
                <strong>Any violations of patient confidentiality is against the law and is punishable by fines
                and/or jail time.</strong> By entering this portal, you agree to maintain confidentiality of
                all data you see here and agree that you will not misuse any information here.
            </p>
            <p>Thank you for all the important work you do in the fight for a healthier Botswana!</p>
            <button onClick={() => onClose()}>I understand, and will not misuse any data I access on this portal.</button>
        </div>
    )
}

export default function Home() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState({})
    const [showWarning, setShowWarning] = useState(true);

    useEffect(() => {
        const getFavorites = async () => {
            try {
                console.log('fetching alerts...');
                const url = `/api/profiles/users/get-favorites/`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setFavorites(data);
                console.log('faves', data)
            } 
            catch (err) {
                console.error('Failed to get alerts:', err);
                setErrors(['Something went wrong. Please try again later.'])
            } 
            finally {
                setLoading(false);
            }
        };
        getFavorites();
    }, []);

    if(loading) return <Loading />
    return (
        <div className={styles.home}>
            {showWarning && <PopUp onClose={() => setShowWarning(false)}/>}
            <h1 className={styles.header}>Welcome, {user.username}!</h1>
            <UpdateBox />
            <div className={styles.content}>
                <div className={styles.faves}>
                    <h2>Favorites</h2>
                    {['client', 'meofficer', 'manager', 'admin'].includes(user.role) && <div> 
                        <h3>Projects</h3>
                        {!favorites?.projects || favorites?.projects?.length ===0 && <p><i>No favorited projects.</i></p>}
                        {favorites?.projects?.length > 0 && favorites.projects.map((proj) => (
                            <div key={proj.id} className={styles.favesCard}>
                                <Link to={`/projects/${proj.project.id}`}><h4>{proj.project.name}</h4></Link>
                            </div>
                        ))}
                    </div>}
                    {['client', 'meofficer', 'manager', 'admin'].includes(user.role) && <div> 
                        <h3>Events</h3>
                        {!favorites?.events || favorites?.events?.length ===0 && <p><i>No favorited events.</i></p>}
                        {favorites?.events?.length > 0 && favorites.events.map((e) => (
                            <div key={e.id} className={styles.favesCard}>
                                <Link to={`/events/${e.event.id}`}><h4>{e.event.name}</h4></Link>
                            </div>
                        ))}
                    </div>}
                    <div>
                        <h3>Respondents</h3>
                        {!favorites?.respondents || favorites?.respondents?.length ===0 && <p><i>No favorited respondents.</i></p>}
                        {favorites?.respondents?.length > 0 && favorites.respondents.map((r) => (
                            <div key={r.id} className={styles.favesCard}>
                                <Link to={`/respondents/${r.respondent.id}`}><h4>{r.respondent.is_anonymous ? `Anonymous Respondent ${r.respondent.uuid}` : 
                                    `${r.respondent.first_name} ${r.respondent.last_name}`}</h4></Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
