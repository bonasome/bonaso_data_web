import React from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth';

import Loading from '../reuseables/loading/Loading';

import styles from './viewOnly.module.css';
import bonasoWhite from '../../assets/bonasoWhite.png';


export default function ViewOnly() {
    const { user } = useAuth();
    console.log(user)
    if(!user) return <Loading />
    return (
        <div className={styles.content}>
            <img src={bonasoWhite} className={styles.image} />
            <h1>Welcome, {user.username}!</h1>
            <p>You have a registered account, but it has not been activated yet.</p>
            <p> 
                Please be patient, your account should be activated soon, and then you will be able to access the portal.
            </p>
            <Link to='/users/logout'><button>Logout</button></Link>
        </div>
    )
}