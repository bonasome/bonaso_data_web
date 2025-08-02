import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/UserAuth';

import ComponentLoading from '../reuseables/loading/ComponentLoading';
import Messages from '../reuseables/Messages';
import fetchWithAuth from '../../../services/fetchWithAuth';

import styles from '../home.module.css';

function MsgCard({ msg, type, onDelete=null }){
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
            {type==='message' && <Link to={`/messages/${msg.id}`}><h4>{msg.subject} {!expanded && `- ${msg.sender.first_name}`} {unread && 'NEW'} </h4></Link> }
            {type !== 'message' && <h4>{msg.subject} </h4>}
            {expanded && <div onClick={(e) => e.stopPropagation()}>
                <div>
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
                </div>
            </div>}
            
        </div>
    )
}

export default function UpdateBox(){
    const [errors, setErrors] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [messages, setMessages] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [msgPane, setMsgPane] = useState('announcements');
    const [loading, setLoading] = useState(true);

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
        };
        getAnnouncements();

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
        };
        getMessages();

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
    }, [])

    if(loading) return <ComponentLoading />
    return(
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
            <Messages errors={errors} />
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
    )
}