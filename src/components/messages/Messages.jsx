import { useState, useEffect, useMemo } from 'react';
import Loading from '../reuseables/Loading';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth';
import styles from './messages.module.css';
import errorStyles from '../../styles/errors.module.css';
import Checkbox from '../reuseables/Checkbox';

function ComposeMessage({ profiles=[], admin=false, replying=false, replyingTo=null, onSave, onCancel, existing=null }){
    const [errors, setErrors] = useState([]);
    const [warnings, setWarnings] = useState([])
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [actionable, setActionable] = useState(false);
    console.log(actionable)
    useEffect(() => {
        setBody(existing?.body);
        setSubject(existing?.subject);
        setActionable(existing?.recipients.filter(rec => rec.actionable).length > 0);
    }, [existing])
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
        const recipient_ids = profiles.length > 0 ? profiles.map((p) => p.id) : []
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
                    recipient_ids: recipient_ids,
                    send_to_admin: admin,
                    parent: replyingTo,
                    actionable: actionable,
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
        <div onClick={(e) => e.stopPropagation()}>
            {profiles.length > 0 && <h2>Conversation with {profiles.map((p) => (p.first_name)).join(', ')}</h2>}
            {admin && <h2>Write a Message to a Site Administrator</h2>}
            {admin && <p>We'll get back to you as soon as possible!</p>}
            {errors.length != 0 && <div role='alert' className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {success && <div className={errorStyles.success}><p>Message Sent!</p></div>}
            {warnings.length != 0 && <div role='alert' className={errorStyles.warnings}><ul>{warnings.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {!replying && <div>
                <label htmlFor='subject'>Subject</label>
                <input id='subject' type='text' onChange={(e) => setSubject(e.target.value)} value={subject} />
            </div>}
            <label htmlFor='body'>Body</label>
            <textarea id='body' type='textarea' onChange={(e) => setBody(e.target.value)} value={body} />
            <Checkbox checked={actionable} callback={(c) => setActionable(c)} name={'actionable'} label={'Assign as task?'} />
            <div>
                <button onClick={(e) => {sendMessage()}}>{existing ? 'Save' : 'Send!'}</button>
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
        <div key={reply.id}>
            <h4>{reply.sender.first_name}:</h4>
            {!editing && <p>{reply.body}</p>}
            {!editing && actionable && <button onClick ={() => markComplete(reply.id)}>Mark as complete</button>}
            {!editing && completed && <p>Task Completed!</p>}
            {!editing && reply.sender.id === user.id && reply.recipients.filter(r => (r.actionable && !r.completed)).length > 0 && 
                <p>Assigned to: {reply.recipients.filter(r => (r.actionable && !r.completed)).map((r) => (r.recipient.first_name)).join(', ')}</p>
            }
            {!editing && reply.sender.id === user.id && reply.recipients.filter(r => (r.actionable && r.completed)).length > 0 && 
                <p>Completed by: {reply.recipients.filter(r => (r.actionable && r.completed)).map((r) => (r.recipient.first_name)).join(', ')}</p>
            }
            {editing && <ComposeMessage profiles={thread} existing={reply} replying={true} replyingTo={parent.id} onSave={() => onUpdate} onCancel={() => setEditing(false)} />}
            {user.id === reply.sender.id && reply.recipients.filter(mr => mr.read).length > 0 && <p><i>Read by {reply.recipients.filter(mr => mr.read).map((mr) => (mr.recipient.first_name)).join(', ')}</i></p>}
            {user.id ===reply.sender.id && !editing && <button onClick={(e) => {e.stopPropagation(); setEditing(!editing)}}>Edit</button>}
            {user.id === reply.sender.id && !editing && <button className={errorStyles.deleteButton} onClick={() => onDelete(reply.id)}>Delete</button>}
        </div>
    )
}
function MessageCard({ message, onUpdate, reply=false }){
    const [errors, setErrors] = useState([])
    const { user } = useAuth();
    const [expanded, setExpanded] = useState(false)
    const [replying, setReplying] = useState(false);
    const [read, setRead] = useState(false);
    const [editing, setEditing] = useState(false);
    const inThread = useMemo(() => {
        const recipients = message.recipients.filter(r => r.id !== user.id).map((r) => (r.recipient))
        recipients.push(message.sender)
        return recipients.filter(r => r.id !== user.id)
    }, [message])

    const actionable = useMemo(() => {
        return message.recipients.filter(r => (r.recipient.id === user.id && r.actionable && !r.completed)).length > 0
    }, [message])

    const handleRead = async() => {
        if(read) return;
        const isDirectRecipient = message?.recipients.some(mr => mr.recipient.id === user.id);
        const isRecipientInAnyReply = message.replies.some(r => r.recipients.some(rec => rec.recipient.id === user.id));
        if (!isDirectRecipient && !isRecipientInAnyReply) return;
        try{
            console.log('updating message status...')
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
        <div onClick={() => {setExpanded(!expanded); handleRead()}}>
            <h3>{message.subject}</h3>
            <p><i>From {message.sender.first_name} {message.sender.last_name}</i></p>
            {errors.length != 0 && <div role='alert' className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            
            {expanded && <div onClick={(e) => e.stopPropagation()}>
                <p>{message.body}</p>
                {!editing && message.sender.id === user.id && message.recipients.filter(r => (r.actionable && !r.completed)).length > 0 && 
                    <p>Assigned to: {message.recipients.filter(r => (r.actionable && !r.completed)).map((r) => (r.recipient.first_name)).join(', ')}</p>
                }
                {!editing && message.sender.id === user.id && message.recipients.filter(r => (r.actionable && r.completed)).length > 0 && 
                    <p>Completed by: {message.recipients.filter(r => (r.actionable && r.completed)).map((r) => (r.recipient.first_name)).join(', ')}</p>
                }
                <div>
                    {actionable && <button onClick={() => handleComplete()}>Mark as Complete</button>}
                    {!editing && !replying && user.id === message.sender.id && <button onClick={(e) => {e.stopPropagation(); setEditing(true)}}>Edit</button>}
                    {editing && <ComposeMessage profiles={inThread} replying={false} onSave={() => onUpdate()} onCancel={() => setEditing(false)} existing={message}/>}
                    {!editing && !replying && user.id === message.sender.id && <button className={errorStyles.deleteButton} onClick={(e) => {e.stopPropagation(); deleteMessage()}}>Delete</button>}
                </div>
                {user.id === message.sender.id && message.recipients.filter(mr => mr.read).length > 0 && <p><i>Read by {message.recipients.filter(mr => mr.read).map((mr) => (mr.recipient.first_name)).join(', ')}</i></p>}
                {message.replies.length > 0 && message.replies.map((r) => (
                    <ReplyCard reply={r} parent={message} thread={inThread} onUpdate={onUpdate} onDelete={(id) => handleDelete(id)} markComplete={(id) => handleComplete(id)}/>
                ))}
                <div>
                    {!replying && <button onClick={(e) => {e.stopPropagation(); setReplying(true)}}>Reply</button>}
                    {replying && <ComposeMessage profiles={inThread} replying={true} replyingTo={message.id} onSave={() => onUpdate()} onCancel={() => setReplying(false)}/>}
                </div>
            </div>}
        </div>
    )
}
export default function Messages(){
    const [errors, setErrors] = useState([])
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState();
    const [updateThreads, setUpdateThreats] = useState(0);
    const [composing, setComposing] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [toAdmin, setToAdmin] = useState(false);
    const { user } = useAuth();
    useEffect(() => {
        const getMsgs = async () => {
            try {
                const response = await fetchWithAuth(`/api/messages/dm/`);
                const data = await response.json();
                setMessages(data.results);
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

    const handleUpdate = () => {
        setUpdateThreats(prev => prev+=1);
    }
    if(loading) return <Loading />
    return(
        <div className={styles.container}>
            <div>
                <h2>Start a New Message</h2>
                {profiles.length > 0 ? profiles.map((p) => (<div onClick={() => setComposing(prev => [...prev, p])}>
                    <h4>{p.first_name} {p.last_name}</h4>
                    {composing.length > 0 && <button onClick={(e) => {e.stopPropagation(); composing.filter(im => im.id === p.id).length > 0 ?
                        setComposing(composing.filter(im => im.id != p.id)) :
                        setComposing(prev => [...prev, p])}}>
                        {composing.filter(im => im.id === p.id).length > 0 ? 'Remove from Conversation' : 'Add to conversation'}
                    </button>}
                </div>)) : <p>No possible recipients.</p>
                }
                {!toAdmin && <button onClick={() => {setToAdmin(!toAdmin); setComposing([])}}>Write an Administrator</button>}
            </div>
            <div>
                {composing.length > 0 && <ComposeMessage profiles={composing} onSave={() => handleUpdate()} onCancel={() => setComposing([])}/>}
                {toAdmin && <ComposeMessage profiles={[]} admin={true} onSave={() => handleUpdate()} onCancel={() => setToAdmin(false)} />}
                {composing.length ===0 && !toAdmin && messages?.length > 0 && <div>
                    {messages.map((m) => (<MessageCard key={m.id} message={m} onUpdate={() => handleUpdate()} />))}
                </div>}
            </div>
        </div>
    )
}