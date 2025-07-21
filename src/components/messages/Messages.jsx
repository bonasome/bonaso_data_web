import { useState, useEffect, useMemo } from 'react';
import Loading from '../reuseables/Loading';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth';
import styles from './messages.module.css';
import errorStyles from '../../styles/errors.module.css';
import Checkbox from '../reuseables/Checkbox';
import { IoIosChatboxes } from "react-icons/io";
import { MdSupportAgent } from "react-icons/md";
import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { IoSendSharp, IoPersonAdd, IoPersonRemove } from "react-icons/io5";
import MultiCheckbox from '../reuseables/MultiCheckbox';
import ButtonHover from '../reuseables/ButtonHover';
import prettyDates from '../../../services/prettyDates';
import { useParams } from 'react-router-dom';

function ComposeMessage({ profiles=[], admin=false, replying=false, replyingTo=null, onSave, onCancel, existing=null }){
    const [errors, setErrors] = useState([]);
    const [warnings, setWarnings] = useState([])
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [recipients, setRecipients] = useState([])
    const [actionable, setActionable] = useState([]);

    useEffect(() => {
        setBody(existing?.body);
        setSubject(existing?.subject);
        setActionable([]);
    }, [existing]);

    useEffect(() => {
        if(profiles && profiles.length > 0){
            const map = profiles.map((p) => ({'id': p.id, 'actionable': actionable.includes(p.id)}))
            setRecipients(map);
        }
    }, [profiles, actionable])
    const sendMessage = async() => {
        setSuccess(false);
        setErrors([]);
        let sbWarnings = []
        if(subject === '' && !replying) sbWarnings.push('Please enter a subject.');
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
                    parent: replyingTo,
                })
            });
            const returnData = await response.json();
            if(response.ok){
                onCancel();
                onSave();
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
        finally{
            setSending(false)
        }
    }

    if(profiles.length === 0 && !admin) return <></>
    return(
        <div className={styles.compose}>
            {profiles.length > 0 && !replying && <h2>Conversation with {profiles.map((p) => (p.first_name)).join(', ')}</h2>}
            {profiles.length >0 && replying && <h3>Replying...</h3>}
            {admin && <h2>Write a Message to a Site Administrator</h2>}
            {admin && <p>We'll get back to you as soon as possible!</p>}
            {errors.length != 0 && <div role='alert' className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {success && <div className={errorStyles.success}><p>Message Sent!</p></div>}
            {warnings.length != 0 && <div role='alert' className={errorStyles.warnings}><ul>{warnings.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {!replying && <div className={styles.field}>
                <label htmlFor='subject'>Subject</label>
                <input id='subject' type='text' onChange={(e) => setSubject(e.target.value)} value={subject} />
            </div>}
            <div className={styles.field}>
                <label htmlFor='body'>Body</label>
                <textarea id='body' type='textarea' onChange={(e) => setBody(e.target.value)} value={body} />
            </div>
            {profiles.length > 0 && <MultiCheckbox label={'Assign as task?'} existing={actionable} 
                optionValues={profiles.map((p) => (p.id))} optionLabels={profiles.map((p) => (`${p.first_name} ${p.last_name}`))} 
                callback={(vals) => setActionable(vals)} 
            />}
            
            
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <ButtonHover callback={() => sendMessage()} noHover={< IoSendSharp />} hover={'Send!'} />
                <button onClick={(e) => {onCancel()}}>Cancel</button>
            </div>
        </div>
    )
}

function ReplyCard({ reply, thread, parent, onUpdate, markComplete, onDelete }){
    const [errors, setErrors] = useState([])
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);

    const actionable = useMemo(() => {
        return reply.recipients.filter(r => (r.recipient.id === user.id && r.actionable && !r.completed)).length > 0
    }, [reply]);
    const completed = useMemo(() => {
        return reply.recipients.filter(r => (r.recipient.id === user.id && r.actionable && r.completed)).length > 0
    }, [reply]);

    return(
        <div className={styles.msgContent}>
            <h3>From {reply.sender.first_name}:</h3>
            {!editing && <p style={{ margin: 30 }}>{reply.body}</p>}
            {!editing && actionable && <button onClick ={() => markComplete(reply.id)}>Mark as complete</button>}
            {!editing && completed && <p style={{ fontSize: 14 }}><i>Task Completed!</i></p>}
            {!editing && reply.sender.id === user.id && reply.recipients.filter(r => (r.actionable && !r.completed)).length > 0 && 
                <p style={{ fontSize: 14 }}><i>Assigned to: {reply.recipients.filter(r => (r.actionable && !r.completed)).map((r) => (r.recipient.first_name)).join(', ')}</i></p>
            }
            {!editing && reply.sender.id === user.id && reply.recipients.filter(r => (r.actionable && r.completed)).length > 0 && 
                <p style={{ fontSize: 14 }}><i>Completed by: {reply.recipients.filter(r => (r.actionable && r.completed)).map((r) => (r.recipient.first_name)).join(', ')}</i></p>
            }
            {user.id === reply.sender.id && reply.recipients.filter(mr => mr.read).length > 0 && <p style={{ fontSize: 14 }}><i>Read by {reply.recipients.filter(mr => mr.read).map((mr) => (mr.recipient.first_name)).join(', ')}</i></p>}
            {editing && <ComposeMessage profiles={thread} existing={reply} replying={true} replyingTo={parent.id} onSave={() => onUpdate} onCancel={() => setEditing(false)} />}

            {user.id ===reply.sender.id && !editing && <div style={{ display: 'flex', flexDirection: 'row' }}>
                <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit Reply'} />
                <ButtonHover  callback={() => onDelete(reply.id)} forDelete={true} noHover={<FaTrashAlt />} hover={'Delete Reply'}/>
            </div>}
        </div>
    )
}
function MessageCard({ message, onUpdate, reply=false }){
    const [errors, setErrors] = useState([])
    const { user } = useAuth();
    const [replying, setReplying] = useState(false);
    const [read, setRead] = useState(false);
    const [editing, setEditing] = useState(false);
    const inThread = useMemo(() => {
        const recipients = message?.recipients.filter(r => r.id !== user.id).map((r) => (r.recipient))
        recipients.push(message.sender)
        return recipients.filter(r => r.id !== user.id)
    }, [message])

    const actionable = useMemo(() => {
        return message.recipients.filter(r => (r.recipient.id === user.id && r.actionable && !r.completed)).length > 0
    }, [message, onUpdate])

    useEffect(() => {
        const handleRead = async() => {
            if(read) return;
            const isDirectRecipient = message?.recipients.some(mr => mr.recipient.id === user.id);
            const isRecipientInAnyReply = message.replies.some(r => r.recipients.some(rec => rec.recipient.id === user.id));
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
    if(!message) return <></>
    return(
        <div className={styles.message}>
            <h3>with {inThread.map((r) => (r.first_name)).join(', ')}</h3>
            <h1>{message.subject}</h1>
            {errors.length != 0 && <div role='alert' className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <div className={styles.msgContent}>
                <p>{message.body}</p>
                <p><i>From {message.sender.first_name} {message.sender.last_name} on {prettyDates(message.sent_on, true)}</i></p>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    {actionable && <button onClick={() => handleComplete()}>Mark as Complete</button>}
                    {message.recipients.some((rec) => (rec.recipient.id === user.id && rec.completed)) && <p style={{ fontSize: 14 }}><i>Task Completed!</i></p>}
                    {!editing && !replying && user.id === message.sender.id && 
                        <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit Message'} />
                    }
                    {!editing && !replying && user.id === message.sender.id && 
                        <ButtonHover  callback={() => deleteMessage()} forDelete={true} noHover={<FaTrashAlt />} hover={'Delete Message'}/>
                    }
                </div>

                {!editing && message.sender.id === user.id && message.recipients.filter(r => (r.actionable && !r.completed)).length > 0 && 
                    <p style={{ fontSize: 14 }}><i>Assigned to: {message.recipients.filter(r => (r.actionable && !r.completed)).map((r) => (r.recipient.first_name)).join(', ')}</i></p>
                }
                {!editing && message.sender.id === user.id && message.recipients.filter(r => (r.actionable && r.completed)).length > 0 && 
                    <p style={{ fontSize: 14 }}><i>Completed by: {message.recipients.filter(r => (r.actionable && r.completed)).map((r) => (r.recipient.first_name)).join(', ')}</i></p>
                }
                {user.id === message.sender.id && message.recipients.filter(mr => mr.read).length > 0 && <p style={{ fontSize: 14 }}><i>Read by {message.recipients.filter(mr => mr.read).map((mr) => (mr.recipient.first_name)).join(', ')}</i></p>}
                
                {editing && <ComposeMessage profiles={inThread} replying={false} onSave={() => onUpdate()} onCancel={() => setEditing(false)} existing={message}/>}
            </div>
            {message.replies.length > 0 && <h2>Replies</h2>}
            {message.replies.length > 0 && message.replies.map((r) => (
                <ReplyCard reply={r} parent={message} thread={inThread} onUpdate={onUpdate} onDelete={(id) => handleDelete(id)} markComplete={(id) => handleComplete(id)}/>
            ))}
            <div>
                {!replying && <button onClick={(e) => {e.stopPropagation(); setReplying(true)}}>Reply</button>}
                {replying && <ComposeMessage profiles={inThread} replying={true} replyingTo={message.id} onSave={() => onUpdate()} onCancel={() => setReplying(false)}/>}
            </div>

        </div>
    )
}
export default function Messages(){
    const { id } = useParams();
    const [errors, setErrors] = useState([])
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState();
    const [updateThreads, setUpdateThreats] = useState(0);
    const [composing, setComposing] = useState(false);
    const [sendTo, setSendTo] = useState([])
    const [profiles, setProfiles] = useState([]);
    const [toAdmin, setToAdmin] = useState(false);
    const { user } = useAuth();
    const [activeThread, setActiveThread] = useState(null);

    useEffect(() => {
        const getMsgs = async () => {
            try {
                console.log('getting messages...')
                const response = await fetchWithAuth(`/api/messages/dm/`);
                const data = await response.json();
                setMessages([...data.results]);
                console.log(data.results)
            } 
            catch (error) {
                setErrors(['Something went wrong. Please try again later.']);
                console.error('Fetch failed:', error);
            } 
            finally {
                setLoading(false);
            }
        };
        getMsgs();
    }, [updateThreads]);

    useEffect(() => {
        const getProfiles = async () => {
            try {
                const response = await fetchWithAuth(`/api/messages/dm/recipients/`);
                const data = await response.json();
                setProfiles(data.filter(p => p.id != user.id));
                console.log(data)
            } 
            catch (error) {
                setErrors(['Failed to get recipients']);
                console.error('Fetch failed:', error);
            } 
            finally {
                setLoading(false);
            }
        };
        getProfiles();
    }, []);

    useEffect(() => {
        if(messages && id && !activeThread){
            const active = messages.filter(msg => msg.id == id)
            if(active.length === 1){
                setActiveThread(active[0]);
            }
        }
    }, [messages, id]);

    const handleUpdate = () => {
        setUpdateThreats(prev => prev+=1);
    }
    if(loading) return <Loading />
    return(
        <div className={styles.container}>
            {composing && <div className={styles.sidebar}>
                <h2>Start a New Message</h2>
                {profiles.length > 0 ? profiles.map((p) => (<div className={styles.pCard}>
                    <h4>{p.first_name} {p.last_name}</h4>
                    {sendTo.some(im => im.id === p.id) ? (
                        <ButtonHover
                            callback={() => setSendTo(sendTo.filter(im => im.id !== p.id))}
                            noHover={<IoPersonRemove />}
                            hover="Remove from Conversation"
                        />
                        ) : (
                        <ButtonHover
                            callback={() => setSendTo(prev => {
                                if (prev.some(im => im.id === p.id)) return prev;  // already added
                                return [...prev, p];  // safe to add
                            })}
                            noHover={<IoPersonAdd />}
                            hover="Add to Conversation"
                        />
                    )}
                </div>)) : <p>No possible recipients.</p>
                }
                {!toAdmin && <button onClick={() => {setToAdmin(!toAdmin); setComposing([])}}>Write an Administrator</button>}
            </div>}

            {!composing && <div className={styles.sidebar}>
                <h2>Your Conversations</h2>
                <div className={styles.actions}>
                    {!toAdmin && <ButtonHover callback={()=> setComposing(true)} noHover={<IoIosChatboxes />} hover={' New Message'} />}
                    {!composing && <ButtonHover callback={() => {setToAdmin(!toAdmin); setActiveThread([])}} noHover={<MdSupportAgent />} hover={'Write an Administrator'} />}
                </div>
                {messages?.length > 0 &&messages.map((m) => (<div className={styles.sbCard} onClick={() => setActiveThread(m)}>
                    <h3>{m.subject} - {m.sender.first_name} {m.sender.last_name}</h3>
                </div>))}
            </div>}

            <div className={styles.mainPanel}>
                {composing && sendTo.length === 0 && <h2>You can't have a conversation with one person! Add people from the sidebar.</h2>}
                {composing && sendTo.length > 0 && <h2>Starting a new conversation with {sendTo.map((r) => (r.first_name)).join(', ')}</h2>}
                {composing && <ComposeMessage profiles={sendTo} onSave={() => handleUpdate()} onCancel={() => setComposing(false)}/>}
                {toAdmin && <ComposeMessage profiles={[]} admin={true} onSave={() => handleUpdate()} onCancel={() => setToAdmin(false)} />}
                {!composing && !toAdmin && activeThread && <MessageCard message={activeThread} onUpdate={() => handleUpdate()} />}
            </div>

        </div>
    )
}