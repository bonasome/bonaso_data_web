import { useState } from "react";
import errorStyles from '../../../styles/errors.module.css';
import { Link } from "react-router-dom";
import fetchWithAuth from "../../../../services/fetchWithAuth";

export default function AdminResetPassword({ id }){
    const [errors, setErrors] = useState([]);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        setSubmitted(false);
        if(password === ''){
            setErrors(['This field is required.']);
            return;
        }
        if(password !== confirmPassword){
            setErrors(['Passwords must match']);
            return;
        }
        setSubmitted(true);
        setErrors([])
        console.log('resetting password...')
        fetchWithAuth(`/api/users/admin-reset-password/`, {
            method: 'POST',
            body: JSON.stringify({
                user_id: id,
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
                {submitted &&
                    <div className={errorStyles.success}>
                        <p>Password Reset!</p>
                    </div>
                }   
                <button onClick={() => handleSubmit()}>Reset Password</button>
            </div>
        </div>
    )
}