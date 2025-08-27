import { useState } from "react";

import fetchWithAuth from "../../../../services/fetchWithAuth";

import ButtonLoading from '../../reuseables/loading/ButtonLoading';

import errorStyles from '../../../styles/errors.module.css';

export default function AdminResetPassword({ id }){
    /*
    Component that allows an admin to reset a users password. 
    - id (integer): The id of the user whose password is being reset
    */
    //page meta
    const [errors, setErrors] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);

    //pasword controls
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    //handle submission
    const handleSubmit = async () => {
        setErrors([]);
        //require pass
        if(password === ''){
            setErrors(['This field is required.']);
            return;
        }
        //pass must match
        if(password !== confirmPassword){
            setErrors(['Passwords must match']);
            return;
        }
        try{
            console.log('resetting password...')
            const response = await fetchWithAuth(`/api/users/admin-reset-password/`, {
                method: 'POST',
                body: JSON.stringify({
                    user_id: id,
                    new_password: password,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if(response.ok){
                setSubmitted(true);
            }
            else{
                const returnData = await response.json();
                console.log(returnData)
            }
        }
        catch(err){
            console.log(err)
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setSaving(false)
        }
    }
    
    return(
        <div>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <div>
                <h2>Enter your new password</h2>
            </div>
            {!submitted &&<div>
                <label htmlFor="password">New Password</label>
                <input id='password' type='password' value={password} onChange={(e) => setPassword(e.target.value)}/>

                <label htmlFor="password">Confirm Password</label>
                <input id='confirm_password' type='password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>  
                {!submitted && !saving && <button onClick={() => handleSubmit()}>Reset Password</button>}
                {saving && <ButtonLoading />}
            </div>}
            {submitted &&
                    <div className={errorStyles.success}>
                        <p>Password Reset!</p>
                    </div>
                } 
        </div>
    )
}