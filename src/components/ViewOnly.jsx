import React from 'react';
import styles from './viewOnly.module.css';
import bonasoWhite from '../assets/bonasoWhite.png';
import { useAuth } from '../contexts/UserAuth';
import { Link } from 'react-router-dom';
function ViewOnly() {
    const { user } = useAuth()
    return (
        <div className={styles.content}>
            <img src={bonasoWhite} className={styles.image} />
            <h1>Welcome, {user.username}!</h1>
            <p>You have a registered account, but it has not been activated yet.</p>
            <p> Please be patient, it should be activated soon, and you can access the portal.</p>
            <Link to='/users/logout'><button>Logout</button></Link>
        </div>
    )
}

export default ViewOnly