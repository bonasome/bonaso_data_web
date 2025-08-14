import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { useAuth } from '../../contexts/UserAuth';
import { faveURL } from '../../../services/modelMap';

import fetchWithAuth from "../../../services/fetchWithAuth";

import ComponentLoading from "../reuseables/loading/ComponentLoading";

import styles from './home.module.css';

export default function Faves(){
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        const getFavorites = async () => {
            try {
                console.log('fetching alerts...');
                const url = `/api/profiles/users/get-favorites/`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setFavorites(data);
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

    if(loading) return <ComponentLoading />
    return(
        <div className={styles.faves}>
            <h2>Favorites</h2>
            {!favorites?.favorites || favorites?.favorites?.length === 0 && <p className={styles.favesSection}><i>
                Pro gamer tip: You can favorite projects, events, or
                respondents on their pages for easy access when you log in.
            </i></p>}
            {['client', 'meofficer', 'manager', 'admin'].includes(user.role) && favorites?.favorites.filter(f => (f.model_string == 'projects.project')).length > 0 &&
             <div className={styles.favesSection}> 
                <h3>Projects</h3>
                {favorites?.favorites.filter(f => (f.model_string == 'projects.project')).map((f) => (<div className={styles.favesCard}>
                    <Link to={faveURL(f.object_id, f.model_string)}><h3>{f.display_name}</h3></Link>
                </div>))}
            </div>}
            {['client', 'meofficer', 'manager', 'admin'].includes(user.role) && favorites?.favorites.filter(f => (f.model_string == 'events.event')).length > 0 &&
            <div className={styles.favesSection}> 
                <h3>Events</h3>
                {favorites?.favorites.filter(f => (f.model_string == 'events.event')).map((f) => (<div className={styles.favesCard}>
                    <Link to={faveURL(f.object_id, f.model_string)}><h3>{f.display_name}</h3></Link>
                </div>))}
            </div>}
            {favorites?.favorites.filter(f => (f.model_string == 'respondents.respondent')).length > 0 && <div className={styles.favesSection}>
                <h3>Respondents</h3>
                {favorites?.favorites.filter(f => (f.model_string == 'respondents.respondent')).map((f) => (<div className={styles.favesCard}>
                    <Link to={faveURL(f.object_id, f.model_string)}><h3>{f.display_name}</h3></Link>
                </div>))}
            </div>}
        </div>
    )
}