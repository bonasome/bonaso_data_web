import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { useAuth } from '../../contexts/UserAuth';
import { faveURL } from '../../../services/modelMap';

import fetchWithAuth from "../../../services/fetchWithAuth";

import ComponentLoading from "../reuseables/loading/ComponentLoading";

import styles from './home.module.css';

export default function Faves(){
    //Component used in the home page to display a list of favorited items with links to each items page.
    const { user } = useAuth();
    const [favorites, setFavorites] = useState([]); //array of favorited items
    const [loading, setLoading] = useState(true);

    //get an array of a users favorited items
    useEffect(() => {
        const getFavorites = async () => {
            try {
                console.log('fetching favorited items...');
                const url = `/api/profiles/users/get-favorites/`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setFavorites(data);
            } 
            catch (err) {
                console.error('Failed to get favorited items:', err);
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
            {/* Filter favorites to only include projects, if any exist, to create a projects section */}
            {['client', 'meofficer', 'manager', 'admin'].includes(user.role) && favorites?.favorites?.filter(f => (f.model_string == 'projects.project')).length > 0 &&
             <div className={styles.favesSection}> 
                <h3>Projects</h3>
                {favorites?.favorites?.filter(f => (f.model_string == 'projects.project')).map((f) => (<div className={styles.favesCard}>
                    <Link to={faveURL(f.object_id, f.model_string)}><h3>{f.display_name}</h3></Link>
                </div>))}
            </div>}

            {/* Filter favorites to only include events, if any exist, to create a events section */}
            {['client', 'meofficer', 'manager', 'admin'].includes(user.role) && favorites?.favorites?.filter(f => (f.model_string == 'events.event')).length > 0 &&
            <div className={styles.favesSection}> 
                <h3>Events</h3>
                {favorites?.favorites?.filter(f => (f.model_string == 'events.event')).map((f) => (<div className={styles.favesCard}>
                    <Link to={faveURL(f.object_id, f.model_string)}><h3>{f.display_name}</h3></Link>
                </div>))}
            </div>}

            {/* Filter favorites to only include respondents, if any exist, to create a respondents section */}
            {favorites?.favorites?.filter(f => (f.model_string == 'respondents.respondent')).length > 0 && <div className={styles.favesSection}>
                <h3>Respondents</h3>
                {favorites?.favorites?.filter(f => (f.model_string == 'respondents.respondent')).map((f) => (<div className={styles.favesCard}>
                    <Link to={faveURL(f.object_id, f.model_string)}><h3>{f.display_name}</h3></Link>
                </div>))}
            </div>}
        </div>
    )
}