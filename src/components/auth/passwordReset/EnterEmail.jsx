import { useState } from "react";

import ButtonLoading from "../../reuseables/loading/ButtonLoading";

import errorStyles from '../../../styles/errors.module.css';


export default function EnterEmail(){
    //fetch domain from env
    const baseUrl = import.meta.env.VITE_API_URL;

    //page meta
    const [errors, setErrors] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);

    //collect email
    const [email, setEmail] = useState('');

    //on submit
    const handleSubmit = async () => {
        //make sure email is not blank and is at least kind of valid
        if(email === ''){
            setErrors(['Please enter the email associated with this account.'])
            return;
        }
        const pattern = /^[\w.-]+@[\w.-]+\.\w{2,}$/;
        if(!pattern.test(email)){
            setErrors(['Please enter a valid email address.'])
            return;
        }
        try{
            console.log('Submitting email...');
            setSaving(true);
            const response = await fetch(`${baseUrl}/api/users/manage/users/reset_password/`, {
                method: 'POST',
                body: JSON.stringify({email: email}),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if(response.ok){
                setSubmitted(true);
            }
        }
        catch(err){
            console.error(err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setSaving(false);
        }
    }
    return(
        <div>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <label htmlFor="email">Enter your email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {submitted && <div className={errorStyles.success}>
                    <p>
                        We've got your request. If the email you entered is a valid email associated with your account,
                        you should receive an email soon with a link to reset your password.
                    </p>
            </div>}
            {!saving && !submitted && <button onClick={() => handleSubmit()}>Email me a link.</button>}
            {saving && <ButtonLoading />}
        </div>
    )
}