import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/UserAuth'

export default function LoginComponent() {
    const {setLoggedIn, setUser} = useAuth();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const[username, setUsername] = useState('');
    const[password, setPassword] = useState('');

    const navigate = useNavigate();

    const login = async () => {
        setLoading(true);
        try {
            const dns = import.meta.env.VITE_DNS;
            const response = await fetch(`${dns}/users/api/request-token/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("access", data.access);
                localStorage.setItem("refresh", data.refresh);
                setLoggedIn(true);
                setUser(data.user);
                console.log(data)
                setLoading(false);
                console.log('Login Successful!')
                navigate('/');
            } 
            else {
                const errorData = await response.json();
                setErrorMsg(errorData.message || "Login failed");
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
        return(
            <>
                <p>Loading...</p>
            </>
        );
    }
    return (
        <div>
            <div>
            <h1>Login</h1>
            <label>Username or Email</label>
            <input type="text" value={username} onChange={(event) => setUsername(event.target.value)}/>
            
            <label>Password</label>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)}/>
            
            <button onClick={login}>Login</button>
            <div>
                {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
            </div>
            </div>
        </div>
    );
}