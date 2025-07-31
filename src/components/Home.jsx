import React from 'react';
import styles from './home.module.css';
import { useAuth } from '../contexts/UserAuth';
import { useTasks } from '../contexts/TasksContext';
import { useState, useEffect, useMemo } from 'react';
import { Link, redirectDocument } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import fetchWithAuth from '../../services/fetchWithAuth';
import ButtonLoading from './reuseables/loading/ButtonLoading';
import Loading from './reuseables/loading/Loading';
import errorStyles from '../styles/errors.module.css';
import ConfirmDelete from './reuseables/ConfirmDelete';
import modalStyles from '../styles/modals.module.css';

function PopUp({ onClose }){
    return(
        <div className={modalStyles.modal}>
            <h1>Welcome!</h1>
            <p>
                Welcome to the BONASO data portal. Please note that any information you see in this portal
                is confidential, and may not be shared or distributed to anyone outside of your organization.
                <strong>Any violations of patient confidentiality is against the law and is punishable by fines
                and/or jail time.</strong> By entering this portal, you agree to maintain confidentiality of
                all data you see here and agree that you will not misuse any information here.
            </p>
            <p>Thank you for all the important work you do in the fight for a healthier Botswana!</p>
            <button onClick={() => onClose()}>I understand, and will not misuse any data I access on this portal.</button>
        </div>
    )
}


function MsgCard({ msg, type, onDelete=null }){
    const { user } = useAuth();
    const [errors, setErrors] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [del, setDel] = useState(false);
    const [subject, setSubject] = useState(msg.subject);
    const [body, setBody] = useState(msg.body);
    const [saving, setSaving] = useState(false);

    const unread = useMemo(() => {
        if (type !== 'message') return false;
        const hasUnread = msg.recipients.some(r => r.recipient.id === user.id && !r.read);
        if (hasUnread) return true;
        const hasUnreadReplies = msg.replies?.some(reply =>
            reply.recipients.some(r => r.recipient.id === user.id && !r.read)
        );
        return hasUnreadReplies || false;
    }, [msg, user.id, type]);

    const objectLink = useMemo(() => {
        if (type !== 'alert') return;
        if(!msg?.content_object || !msg?.object_id) return
        if(msg.content_object.toLowerCase().includes('interaction')) return `/respondents/interaction/${msg.object_id}`;
        if(msg.content_object.toLowerCase().includes('event')) return `/events/${msg.object_id}`
    }, [msg, user.id, type]);

    const handleSubmit = async() => {
        setErrors([]);
        let sbWarnings = []
        if(user.role !== 'admin' && !organization) sbWarnings.push('You must select an organization to send this announcement to.')
        if(subject === '') sbWarnings.push('Please enter a subject.');
        if(body === '') sbWarnings.push('Please enter something in the body.');
        if(sbWarnings.length > 0){
            setErrors(sbWarnings);
            return;
        }
        try{
            const url = `/api/messages/announcements/${msg.id}/`
            const response = await fetchWithAuth(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    subject: subject,
                    body: body,
                })
            });
            const returnData = await response.json();
            if(response.ok){
                setEditing(false);
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
            setSaving(false);
        }
    }
    const handleDelete = async() => {
        try{
            const url = `/api/messages/announcements/${msg.id}/`
            const response = await fetchWithAuth(url, {
                method: 'DELETE',
            });
            if(response.ok){
                setDel(false);
            }
            else{
                const returnData = await response.json();
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
            setDel(false);
        }
    }
    
    if(del){
        return(
            <div>
                <ConfirmDelete name={'announcement'} onConfirm={() => handleDelete()} onCancel={() => setDel(false)} allowEasy={true} />
            </div>
        )
    }
    return(
        <div className={styles.msgCard} onClick={() => setExpanded(!expanded)}>
            {type==='message' && <Link to={`/messages/${msg.id}`}><h4>{subject} {!expanded && `- ${msg.sender.first_name}`} {unread && 'NEW'} </h4></Link> }
            {!editing && type !== 'message' && <h4>{subject} </h4>}
            {expanded && <div onClick={(e) => e.stopPropagation()}>
                {!editing && <div>
                    <p>{body}</p>
                    {type == 'message' && <p><i>From {msg.sender.first_name}</i></p>}
                    {type == 'message' && <p><i></i></p>}
                    {type == 'message' && msg?.replies?.length > 0 && msg.replies.map((r) => (
                        <div>
                            <p>{r.body}</p>
                            <p><i>from {r.sender.first_name}</i></p>
                        </div>
                    ))}
                    {type == 'alert' && objectLink && <Link to={objectLink}>View</Link>}
                    {type == 'announcement' && user.id == msg.sent_by && !editing && <button onClick={() => setEditing(true)}>Edit</button>}
                </div>}
                {type == 'announcement' && editing && <div>
                    <label htmlFor='subject'>Subject</label>
                    <input id='subject' type='text' onChange={(e) => setSubject(e.target.value)} value={subject} />
                    <label htmlFor='body'>Body</label>
                    <textarea id='body' type='textarea' onChange={(e) => setBody(e.target.value)} value={body} />
                    {!saving && <button onClick={() => handleSubmit()}>Save</button>}
                    {saving && <ButtonLoading/>}
                    <button onClick={() => setEditing(false)}>Cancel</button>
                    <button className={errorStyles.deleteButton} onClick={() => setDel(true)}>Delete</button>
                </div>}
            </div>}
            
        </div>
    )
}

function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { tasks, setTasks } = useTasks();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [messages, setMessages] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [favorites, setFavorites] = useState({})
    const [msgPane, setMsgPane] = useState('announcements')
    const [showWarning, setShowWarning] = useState(true);

    useEffect(() => {
        const getTasks = async () => {
            try {
                console.log('fetching respondent details...');
                const url = `/api/manage/tasks/`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                const myTasks = data.results?.filter(task => task.organization.id == user.organization_id)
                setTasks(myTasks);
            } 
            catch (err) {
                console.error('Failed to delete organization:', err);
                setErrors(['Something went wrong. Please try again later.'])
            } 
            finally {
                setLoading(false);
            }
        };
        getTasks();
    }, [])
    useEffect(() => {
        const getAnnouncements = async () => {
            try {
                console.log('fetching announcements...');
                const url = `/api/messages/announcements/`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setAnnouncements(data.results);
            } 
            catch (err) {
                console.error('Failed to delete organization:', err);
                setErrors(['Something went wrong. Please try again later.'])
            } 
            finally {
                setLoading(false);
            }
        };
        getAnnouncements();
    }, [])

    useEffect(() => {
        const getMessages = async () => {
            try {
                console.log('fetching messages...');
                const url = `/api/messages/dm/`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setMessages(data.results);
            } 
            catch (err) {
                console.error('Failed to delete organization:', err);
                setErrors(['Something went wrong. Please try again later.'])
            } 
            finally {
                setLoading(false);
            }
        };
        getMessages();
    }, [])
    useEffect(() => {
        const getAlerts = async () => {
            try {
                console.log('fetching alerts...');
                const url = `/api/messages/alerts/`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setAlerts(data.results);
            } 
            catch (err) {
                console.error('Failed to get alerts:', err);
                setErrors(['Something went wrong. Please try again later.'])
            } 
            finally {
                setLoading(false);
            }
        };
        getAlerts();
    }, []);

    useEffect(() => {
        const getFavorites = async () => {
            try {
                console.log('fetching alerts...');
                const url = `/api/profiles/users/get-favorites/`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setFavorites(data);
                console.log('faves', data)
            } 
            catch (err) {
                console.error('Failed to get alerts:', err);
                setErrors(['Something went wrong. Please try again later.'])
            } 
            finally {
                setLoading(false);
            }
        };
        getFavorites();
    }, []);

    console.log(alerts)

    if(loading) return <Loading />
    return (
        <div className={styles.home}>
            {showWarning && <PopUp onClose={() => setShowWarning(false)}/>}
            <h1 className={styles.header}>Welcome, {user.username}!</h1>
            <div className={styles.content}>
                <div className={styles.board}>
                    <div className={styles.tabs}>
                        <div className={msgPane == 'announcements' ? styles.activeTab : styles.tab} onClick={() => setMsgPane('announcements')}>
                            <h4>Announcements</h4>
                        </div>
                        <div className={msgPane == 'messages' ? styles.activeTab : styles.tab} onClick={() => setMsgPane('messages')}>
                            <h4>Messages</h4>
                        </div>
                        <div className={msgPane == 'alerts' ? styles.activeTab : styles.tab} onClick={() => setMsgPane('alerts')}>
                            <h4>Alerts</h4>
                        </div>
                    </div>
                    {msgPane == 'announcements' && <div className={styles.msgPane}>
                        {<Link to={'/messages/announcements/new'}><button>New Announcement</button></Link>}
                        {announcements.length == 0 && <p>No announcements yet.</p>}
                        {announcements.map((a) => (<MsgCard key={a.id} type={'announcement'} msg={a} onDelete={() => setAnnouncements(prev => prev.filter(a => (a.id != id)))}/>))}
                    </div>}
                    {msgPane == 'messages' && <div className={styles.msgPane}>
                        {messages.length == 0 && <p>It's lonely here!</p>}
                        {messages.map((msg) => (<MsgCard key={msg.id} type={'message'} msg={msg} />))}
                    </div>}
                    {msgPane == 'alerts' && <div className={styles.msgPane}>
                        {messages.length == 0 && <p>Phew! No alerts.</p>}
                        {alerts.map((alr) => (<MsgCard key={alr.id} type={'alert'} msg={alr} />))}
                    </div>}
                </div>
                <div className={styles.faves}>
                    <h2>Favorites</h2>
                    {['client', 'meofficer', 'manager', 'admin'].includes(user.role) && <div> 
                        <h3>Projects</h3>
                        {!favorites?.projects || favorites?.projects?.length ===0 && <p><i>No favorited projects.</i></p>}
                        {favorites?.projects?.length > 0 && favorites.projects.map((proj) => (
                            <div key={proj.id} className={styles.favesCard}>
                                <Link to={`/projects/${proj.project.id}`}><h4>{proj.project.name}</h4></Link>
                            </div>
                        ))}
                    </div>}
                    {['client', 'meofficer', 'manager', 'admin'].includes(user.role) && <div> 
                        <h3>Events</h3>
                        {!favorites?.events || favorites?.events?.length ===0 && <p><i>No favorited events.</i></p>}
                        {favorites?.events?.length > 0 && favorites.events.map((e) => (
                            <div key={e.id} className={styles.favesCard}>
                                <Link to={`/events/${e.event.id}`}><h4>{e.event.name}</h4></Link>
                            </div>
                        ))}
                    </div>}
                    <div>
                        <h3>Respondents</h3>
                        {!favorites?.respondents || favorites?.respondents?.length ===0 && <p><i>No favorited respondents.</i></p>}
                        {favorites?.respondents?.length > 0 && favorites.respondents.map((r) => (
                            <div key={r.id} className={styles.favesCard}>
                                <Link to={`/respondents/${r.respondent.id}`}><h4>{r.respondent.is_anonymous ? `Anonymous Respondent ${r.respondent.uuid}` : 
                                    `${r.respondent.first_name} ${r.respondent.last_name}`}</h4></Link>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h2>My Tasks</h2>
                    <div className={styles.tasks}>
                        {tasks.length == 0 && <h3>No tasks, great work!</h3>}
                        {tasks.length > 0 && tasks.map((task) =>  (
                            <div key={task.id} 
                                className={['meofficer', 'admin', 'manager'].includes(user.role) ? styles.taskLink : styles.task}
                                onClick={['meofficer', 'admin', 'manager'].includes(user.role) ? () => navigate(`/projects/${task.project.id}`) : null}
                            >
                                <h3>{task.indicator.code}: {task.indicator.name}</h3>
                                <i>For Project {task.project.name}</i>
                            </div>

                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home
