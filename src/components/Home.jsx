import React from 'react';
import styles from './home.module.css';
import { useAuth } from '../contexts/UserAuth';
import { useTasks } from '../contexts/TasksContext';
import { useState, useEffect, useMemo } from 'react';
import { Link, redirectDocument } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import fetchWithAuth from '../../services/fetchWithAuth';
import IndicatorChart from './reuseables/charts/IndicatorChart';
import ButtonLoading from './reuseables/ButtonLoading';
import Loading from './reuseables/Loading';

function MsgCard({ msg, type }){
    const { user } = useAuth();
    const [expanded, setExpanded] = useState(false);
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



    return(
        <div className={styles.msgCard} onClick={() => setExpanded(!expanded)}>
            <h4>{msg?.subject} {!expanded && type=='message' && `- ${msg.sender.first_name}`} {type=='message' && unread && 'NEW'}</h4>
            {expanded && <div>
                <p>{msg?.body}</p>
                {type == 'message' && <p><i>From {msg.sender.first_name}</i></p>}
                {type == 'message' && <p><i></i></p>}
                {type == 'message' && msg?.replies?.length > 0 && msg.replies.map((r) => (
                    <div>
                        <p>{r.body}</p>
                        <p><i>from {r.sender.first_name}</i></p>
                    </div>
                ))}
                {type == 'alert' && objectLink && <Link to={objectLink}>View</Link>}
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

    useEffect(() => {
        const getTasks = async () => {
            try {
                console.log('fetching respondent details...');
                const url = `/api/manage/tasks/`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                const myTasks = data.results.filter(task => task.organization.id == user.organization_id)
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
                const url = `/api/profiles/users/${user.id}/favorites/`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setFavorites(data);
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
            <h1 className={styles.header}>Welcome, {user.username}!</h1>
            <div className={styles.actions}>
                <h2>Where should we start today?</h2>
                <div>
                    <Link to={'/help'}><button>First time? Check out the tutorial!</button></Link> 
                    {!['client'].includes(user.role) && <Link to={'/respondents'}><button>Start Recording Data!</button></Link> }
                    {['meofficer', 'admin', 'manager'].includes(user.role) && <Link to={'/batch-record'}><button>Upload a file</button></Link> }
                    {['meofficer', 'admin', 'manager', 'client'].includes(user.role) && <Link to={'/projects'}><button>See My Projects</button></Link> }
                </div>
            </div>
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
                    {msgPane == 'announcements' && <div>
                        {announcements.map((a) => (<MsgCard type={'announcement'} msg={a} />))}
                    </div>}
                    {msgPane == 'messages' && <div>
                        {messages.map((msg) => (<MsgCard type={'message'} msg={msg} />))}
                    </div>}
                    {msgPane == 'alerts' && <div>
                        {alerts.map((alr) => (<MsgCard type={'alert'} msg={alr} />))}
                    </div>}
                </div>
                <div>
                    <h2>Favorites</h2>
                    {['client', 'meofficer', 'manager', 'admin'].includes(user.role) && <div> 
                        <h3>Projects</h3>
                        {!favorites?.projects || favorites?.projects?.length ===0 && <p><i>No favorited projects.</i></p>}
                        {favorites?.projects?.length > 0 && favorites.projects.map((proj) => (
                            <div key={proj.id}>
                                <Link to={`/projects/${proj.project.id}`}><h4>{proj.project.name}</h4></Link>
                            </div>
                        ))}
                    </div>}
                    {['client', 'meofficer', 'manager', 'admin'].includes(user.role) && <div> 
                        <h3>Events</h3>
                        {!favorites?.events || favorites?.events?.length ===0 && <p><i>No favorited events.</i></p>}
                        {favorites?.events?.length > 0 && favorites.events.map((e) => (
                            <div key={e.id}>
                                <Link to={`/events/${e.event.id}`}><h4>{e.event.name}</h4></Link>
                            </div>
                        ))}
                    </div>}
                    <div>
                        <h3>Respondents</h3>
                        {!favorites?.respondents || favorites?.respondents?.length ===0 && <p><i>No favorited respondents.</i></p>}
                        {favorites?.respondents?.length > 0 && favorites.respondents.map((r) => (
                            <div key={r.id}>
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
