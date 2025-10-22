import { useState } from "react";
import { useParams, Link } from "react-router-dom";

import ButtonLoading from '../../reuseables/loading/ButtonLoading';

import errorStyles from '../../../styles/errors.module.css';


export default function ResetForm(){
    /*
    Form that a user will land on when they click an email link to reset their password.
    */
    //fetch domain name from env
    const baseUrl = import.meta.env.VITE_API_URL;

    //fetch reset information from params
    const { uid, token } = useParams();

    //manage password
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    //page meta
    const [errors, setErrors] = useState([]);
    const [submitted, setSubmitted] = useState(false); //on submit, hide inputs and let the user know they're good
    const [saving, setSaving] = useState(false); //the system is working

    //handle submission
    const handleSubmit = async () => {
        //make sure a password is entered and matches the confirm password
        if(password === ''){
            setErrors(['This field is required.']);
            return;
        }
        if(password !== confirmPassword){
            setErrors(['Your passwords must match']);
            return;
        }
        try{
            setSaving(true);
            response = await fetch(`${baseUrl}/api/users/manage/users/reset_password_confirm/`, {
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
            if(response.ok){
                setSubmitted(true); //only set submitted to true if the password is reset since this will hide the inputs
            }
        }
        catch(err){
            console.error(err);
            setErrors(['Something went wrong. Please try again later']);
        }
        finally{
            setSaving(false);
        }
        
    }
    return(
        <div>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <div>
                <h2>Enter your new password</h2>
            </div>
            <div>
                {!submitted && <div>
                    <label htmlFor="password">New Password</label>
                    <input id='password' type='password' value={password} onChange={(e) => setPassword(e.target.value)}/>

                    <label htmlFor="password">Confirm Password</label>
                    <input id='confirm_password' type='password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
                </div>}
                {submitted && <div className={errorStyles.success}>
                    <p>Your password has been reset. You may login again now with your new password.</p>
                    <Link to={'/users/login'} style={{ color: "black"}}>Login</Link>
                </div>} 
                {!submitted && !saving && <button onClick={() => handleSubmit()}>Reset Password</button>}
                {saving && <ButtonLoading />}
            </div>
        </div>
    )
}