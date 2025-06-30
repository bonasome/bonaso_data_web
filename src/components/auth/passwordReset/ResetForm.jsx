import { useState } from "react";
import errorStyles from '../../../styles/errors.module.css';
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
const baseUrl = import.meta.env.VITE_API_URL;

export default function ResetForm(){
    const [errors, setErrors] = useState([]);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { uid, token } = useParams();
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if(password === ''){
            setErrors(['This field is required.']);
            return;
        }
        if(password !== confirmPassword){
            setErrors(['Your passwords must match']);
            return;
        }
        setSubmitted(true);
        fetch(`${baseUrl}/api/users/manage/users/reset_password_confirm/`, {
            method: 'POST',
            body: JSON.stringify({
                uid,
                token,
                new_password: password,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    return(
        <div>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <div>
                <h2>Enter your new password</h2>
            </div>
            <div>
                <label htmlFor="password">New Password</label>
                <input id='password' type='password' value={password} onChange={(e) => setPassword(e.target.value)}/>

                <label htmlFor="password">Confirm Password</label>
                <input id='confirm_password' type='password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
                {submitted ?
                    <div className={errorStyles.success}>
                        <p>Your password has been reset. You may login again now with your new password.</p>
                        <Link to={'/users/login'} style={{ color: "black"}}>Login</Link>
                    </div> : 
                    <button onClick={() => handleSubmit()}>Reset Password</button>
                }
            </div>
        </div>
    )
}