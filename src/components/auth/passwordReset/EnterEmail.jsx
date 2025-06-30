import { useState } from "react";
import errorStyles from '../../../styles/errors.module.css';

const baseUrl = import.meta.env.VITE_API_URL;
export default function EnterEmail(){
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState([]);
    const [submitted, setSubmitted] = useState(false)
    const handleSubmit = async () => {
        if(email === ''){
            setErrors(['Please enter the email associated with this account.'])
            return;
        }
        const pattern = /^[\w.-]+@[\w.-]+\.\w{2,}$/;
        if(!pattern.test(email)){
            setErrors(['Please enter a valid email address.'])
            return;
        }
        setSubmitted(true)
        fetch(`${baseUrl}/api/users/manage/users/reset_password/`, {
            method: 'POST',
            body: JSON.stringify({email: email}),
            headers: {
                'Content-Type': 'application/json',
            },
        });

    }
    return(
        <div>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <label htmlFor="email">Enter your email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {submitted ? <div className={errorStyles.success}>
                    <p>
                        We've got your request. If the email you entered is a valid email associated with your account,
                        you should receive an email soon with a link to reset your password.
                    </p>
                </div> :
                <button onClick={() => handleSubmit()}>Email me a link.</button>
                
            }
        </div>
    )
}