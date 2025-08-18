import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth';

import fetchWithAuth from '../../../services/fetchWithAuth';
import prettyDates from '../../../services/prettyDates';

import ButtonHover from '../reuseables/inputs/ButtonHover';
import Messages from '../reuseables/Messages';
import ComposeMessage from './ComposeMessage';

import styles from './messages.module.css';

import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { IoCheckmarkDoneCircle  } from "react-icons/io5";
import { RiReplyAllFill } from "react-icons/ri";

export default function MessageCard({ message, onUpdate, reply=false, parent=null }){
    const [errors, setErrors] = useState([])
    const { user } = useAuth();
    const [replying, setReplying] = useState(false);
    const [read, setRead] = useState(false);
    const [editing, setEditing] = useState(false);

    const inThread = useMemo(() => {
        if(!message || !message?.recipients) return;
        const recipients = message?.recipients.map((r) => (r.recipient))
        recipients.push(message.sender)
        return recipients.filter(r => r.id !== user.id)
    }, [message])

    const actionable = useMemo(() => {
        if(!message || !message?.recipients) return;
        return message.recipients.filter(r => (r.recipient.id === user.id && r.actionable && !r.completed)).length > 0
    }, [message, onUpdate])

    useEffect(() => {
        const handleRead = async() => {
            if(!message || !message?.recipients) return;
            if(read) return;
            const isDirectRecipient = message?.recipients?.some(mr => mr.recipient.id === user.id && !mr.read);
            const isRecipientInAnyReply = message?.replies?.some(r => r.recipients.some(rec => rec.recipient.id === user.id && !rec.read));
            console.log(isDirectRecipient, !isRecipientInAnyReply)
            if (!isDirectRecipient && !isRecipientInAnyReply) return;
            try{
                console.log('marking as read...')
                const response = await fetchWithAuth(`/api/messages/dm/${message.id}/read/`, {
                    method: 'PATCH',
                });
                const returnData = await response.json();
                if(response.ok){
                    onUpdate();
                    setRead(true)
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
                    setErrors(serverResponse)
                }
            }
            catch(err){
                setErrors(['Something went wrong. Please try again later.'])
                console.error('Could not record organization: ', err)
            }
        }
        handleRead();
    }, []);
    

    const handleComplete = async(id) => {
        if(!id) id = message.id
        try{
            console.log('updating message status...')
            const response = await fetchWithAuth(`/api/messages/dm/${id}/complete/`, {
                method: 'PATCH',
            });
            const returnData = await response.json();
            if(response.ok){
                onUpdate();
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
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record organization: ', err)
        }
    }
    const deleteMessage = async() => {
        try{
            const response = await fetchWithAuth(`/api/messages/dm/${message.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    deleted_by_sender: true
                })
            });
            const returnData = await response.json();
            if(response.ok){
                onUpdate();
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
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record organization: ', err)
        }
    }   

    console.log(message)
    if(!message || !inThread) return<></>
    console.log(inThread)
    return(
        <div className={styles.message}>
            {!reply && <h3>with {inThread?.map((r) => (r.display_name)).join(', ')}</h3>}
            {!reply && <h1>{message.subject}</h1>}
            <Messages errors={errors} />
            <div className={styles.msgContent}>
                <p>{message.body}</p>
                <p style={{ fontSize: 14}}><i>From {message.sender.display_name} {message.sender.last_name} on {prettyDates(message.sent_on, true)}</i></p>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    {actionable && <ButtonHover callback={() => handleComplete()} noHover={<IoCheckmarkDoneCircle />} hover={'Mark as Complete'} />}
                    
                    {message.recipients.some((rec) => (rec.recipient.id === user.id && rec.completed)) && <p style={{ fontSize: 14 }}><i>Task Completed!</i></p>}
                    
                    {!editing && !replying && user.id === message.sender.id && 
                        <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit Message'} />
                    }
                    
                    {!editing && !replying && user.id === message.sender.id && 
                        <ButtonHover  callback={() => deleteMessage()} forDelete={true} noHover={<FaTrashAlt />} hover={'Delete Message'}/>
                    }
                
                </div>

                {!editing && message.sender.id === user.id && message.recipients.filter(r => (r.actionable && !r.completed)).length > 0 && 
                    <p style={{ fontSize: 14 }}><i>Assigned to: {message.recipients.filter(r => (r.actionable && !r.completed)).map((r) => (r.recipient.display_name)).join(', ')}</i></p>
                }
                {!editing && message.sender.id === user.id && message.recipients.filter(r => (r.actionable && r.completed)).length > 0 && 
                    <p style={{ fontSize: 14 }}><i>Completed by: {message.recipients.filter(r => (r.actionable && r.completed)).map((r) => (r.recipient.display_name)).join(', ')}</i></p>
                }
                {user.id === message.sender.id && message.recipients.filter(mr => mr.read).length > 0 && <p style={{ fontSize: 14 }}>
                    <i>Read by {message.recipients.filter(mr => mr.read).map((mr) => (mr.recipient.display_name)).join(', ')}</i></p>}
                
                {editing && <ComposeMessage profiles={inThread} reply={reply} onSave={() => onUpdate()} onCancel={() => setEditing(false)} existing={message} parent={parent} />}
            </div>
            {!reply && message.replies.length > 0 && <h2>Replies</h2>}
            {!reply && message.replies.length > 0 && message.replies.map((r) => (
                <MessageCard message={r} reply={true} parent={message} onUpdate={onUpdate} />
            ))}
            {!reply && <div>
                {!replying && <button onClick={(e) => {e.stopPropagation(); setReplying(true)}}><RiReplyAllFill /> Reply</button>}
                {replying && <ComposeMessage profiles={inThread} reply={true} parent={message} onSave={() => onUpdate()} onCancel={() => setReplying(false)}/>}
            </div>}

            {!reply && <div className={styles.spacer}></div>}
        </div>
    )
}