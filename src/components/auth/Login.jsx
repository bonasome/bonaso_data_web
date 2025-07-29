import React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth'

import Loading from '../reuseables/loading/Loading'

import styles from './login.module.css';
import bonasoWhite from '../../assets/bonasoWhite.png';

//pull the domain name form env (need this for login since fetchWithAuth may not work)
const baseUrl = import.meta.env.VITE_API_URL;

export default function Login() {
    const navigate = useNavigate();

    const { refreshAuth } = useAuth(); //context
    //page meta
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    //login states
    const[username, setUsername] = useState('');
    const[password, setPassword] = useState('');

    //login function to request a token
    const login = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${baseUrl}/api/users/request-token/`, {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                })
            });
            if (response.ok) {
                await refreshAuth();
                console.log('Login Successful!')
                navigate('/');
            } 
            else {
                const errorData = await response.json();
                setErrorMsg(errorData.message || "Incorrect Username or Password. Please try again.");
                setLoading(false);
            }
        } 
        catch (err) {
            console.error('Network or server error', err);
            setErrorMsg('We had some trouble logging you in. Please try again later. If this keeps happening, please contact an administrator.');
            setLoading(false);
        }
    };

    if(loading){
        return <Loading />
    }
    return (
        <div>
            <div className={styles.login}>
                <div className={styles.header}>
                    <img src={bonasoWhite} className={styles.headerImage} />
                    <h2>Welcome Back!</h2>
                </div>
                <form className={styles.inputs} onSubmit={(e) => {e.preventDefault(); login()}}>
                    <label htmlFor={'username'} className={styles.label}>Username</label>
                    <input type="text" id='username' name={'username'} value={username} onChange={(event) => setUsername(event.target.value)}/>
                    
                    <label htmlFor={'password'} className={styles.label}>Password</label>
                    <input name={'password'} id='password' type="password" value={password} onChange={(event) => setPassword(event.target.value)}/>
                    
                    <button type={'submit'} disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div>
                    {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
                </div>
            </div>
        </div>
    );
}

//We don't have a mailing system, but once we do we can insert this link
/*
<Link style={{ textAlign: "center", margin: 10 }} to={'/users/reset-password-get'}>Forgot your password?</Link>
*/