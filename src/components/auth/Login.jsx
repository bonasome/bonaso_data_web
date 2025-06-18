import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/UserAuth'
import styles from './login.module.css';
import bonasoWhite from '../../assets/bonasoWhite.png'
import Loading from '../reuseables/Loading'

export default function Login() {
    const { refreshAuth } = useAuth();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const[username, setUsername] = useState('');
    const[password, setPassword] = useState('');

    const navigate = useNavigate();

    const login = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/request-token/`, {
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