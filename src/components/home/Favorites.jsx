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
    console.log(favorites);
    if(loading || !favorites) return <ComponentLoading />
    return(
        <div className={styles.faves}>
            <h2>Favorites</h2>
            {['client', 'meofficer', 'manager', 'admin'].includes(user.role) &&favorites.favorites.filter(f => (f.content_type == 4)).length > 0 &&
             <div className={styles.favesSection}> 
                <h3>Projects</h3>
                {favorites.favorites.filter(f => (f.content_type == 4)).map((f) => (<div className={styles.favesCard}>
                    <Link to={faveURL(f.object_id, f.content_type)}><h3>{f.display_name}</h3></Link>
                </div>))}
            </div>}
            {['client', 'meofficer', 'manager', 'admin'].includes(user.role) && favorites.favorites.filter(f => (f.content_type == 40)).length > 0 &&
            <div className={styles.favesSection}> 
                <h3>Events</h3>
                {favorites.favorites.filter(f => (f.content_type == 40)).map((f) => (<div className={styles.favesCard}>
                    <Link to={faveURL(f.object_id, f.content_type)}><h3>{f.display_name}</h3></Link>
                </div>))}
            </div>}
            {favorites.favorites.filter(f => (f.content_type == 10)).length > 0 && <div className={styles.favesSection}>
                <h3>Respondents</h3>
                {favorites.favorites.filter(f => (f.content_type == 10)).map((f) => (<div className={styles.favesCard}>
                    <Link to={faveURL(f.object_id, f.content_type)}><h3>{f.display_name}</h3></Link>
                </div>))}
            </div>}
        </div>
    )
}