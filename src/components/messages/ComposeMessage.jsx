import { useState, useEffect, useRef } from 'react';

import fetchWithAuth from '../../../services/fetchWithAuth';

import MultiCheckbox from '../reuseables/inputs/MultiCheckbox';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import Messages from '../reuseables/Messages';

import styles from './messages.module.css';

import { IoSendSharp, IoPersonAdd, IoPersonRemove } from "react-icons/io5";

export default function ComposeMessage({ profiles=[], onUpdate, onCancel, admin=false, reply=false, parent=null, existing=null }){
    /*
    Component that allows a user to create a new message thread or reply to a message.
    - profiles (array): everyone in the thread
    - onUpdate (function): what to do when the message us updated/created
    - onCancel (function): what to do on cancel
    - admin (boolean, optional): is this supposed to be sent to all admins?
    - reply (boolean, optional): is this a reply
    - parent (object, optional): if it is a reply, what is the parent/original message
    - existing (object, optional): if editing, the message to edit
    */

    const [recipients, setRecipients] = useState([]); //array that adds information to profiles
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [actionable, setActionable] = useState([]); //is the message actionable

    //page meta
    const [errors, setErrors] = useState([]);
    const [warnings, setWarnings] = useState([])
    const [sending, setSending] = useState(false);
   

    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if ((errors.length > 0 || warnings.length > 0) && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors, warnings]);

    //set default values once existing loads
    useEffect(() => {
        setBody(existing?.body);
        setSubject(existing?.subject);
        setActionable([]);
    }, [existing]);

    //create the recipients array, which also includes information about who this message is assigned to as a task
    useEffect(() => {
        if(profiles && profiles.length > 0){
            const map = profiles.map((p) => ({'id': p.id, 'actionable': actionable.includes(p.id)}))
            setRecipients(map);
        }
    }, [profiles, actionable]);

    //handle sending the message
    const sendMessage = async() => {
        setErrors([]);
        let sbWarnings = []; //temp storage for errors

        //require subject if the message is not a reply, always require body
        if(subject === '' && !reply) sbWarnings.push('Please enter a subject.');
        if(body === '') sbWarnings.push('Please enter something in the body.');
        if(sbWarnings.length > 0){
            setWarnings(sbWarnings);
            return;
        }
        try{
            setSending(true);
            const url = existing ? `api/messages/dm/${existing.id}/` : '/api/messages/dm/'
            const response = await fetchWithAuth(url, {
                method: existing ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    subject: subject,
                    body: body,
                    recipient_data: recipients,
                    send_to_admin: admin,
                    parent: parent?.id ?? null, 
                })
            });
            const returnData = await response.json();
            if(response.ok){
                onUpdate(); //let the parent know the message was updated
                onCancel(); //run onCancel to edit parent states
            }
            else{
                const serverResponse = []
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${field}: ${returnData[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record organization: ', err)
        }
        finally{
            setSending(false)
        }
    }

    if(profiles.length === 0 && !admin) return <></>
    return(
        <div className={styles.compose}>
            {profiles.length > 0 && !reply && <h2>Conversation with {profiles.map((p) => (p.display_name)).join(', ')}</h2>}
            {profiles.length >0 && reply && <h3>Replying...</h3>}
            {admin && <h2>Write a Message to a Site Administrator</h2>}
            {admin && <p>We'll get back to you as soon as possible!</p>}

            <Messages warnings={warnings} errors={errors} ref={alertRef} />

            {!reply && <div className={styles.field}>
                <label htmlFor='subject'>Subject</label>
                <input id='subject' type='text' onChange={(e) => setSubject(e.target.value)} value={subject} />
            </div>}

            <div className={styles.field}>
                <label htmlFor='body'>Body</label>
                <textarea id='body' type='textarea' onChange={(e) => setBody(e.target.value)} value={body} />
            </div>

            {profiles.length > 0 && <MultiCheckbox label={'Assign as task?'} value={actionable} 
                options={profiles.map((p) => ({'value': p.id, 'label': p.display_name}))} 
                onChange={(vals) => setActionable(vals)} 
            />}
            
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <button onClick={() => sendMessage()}> < IoSendSharp /> Send!</button>
                <button onClick={(e) => {onCancel()}}>Cancel</button>
            </div>
        </div>
    )
}