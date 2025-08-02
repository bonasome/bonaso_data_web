import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/UserAuth';


import fetchWithAuth from '../../../services/fetchWithAuth';

import ComposeAnnouncementModal from '../messages/announcements/ComposeAnnouncementModal';
import UnopenedMsg from '../messages/UnopenedMsg';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import Messages from '../reuseables/Messages';
import ConfirmDelete from '../reuseables/ConfirmDelete';
import AnnouncementCard from '../messages/announcements/AnnouncementCard';

import styles from '../home.module.css';

import { GrAnnounce } from "react-icons/gr";
import { ImPencil } from 'react-icons/im';

//simple alert card since these don't show up anywhere else
function AlertCard({ alert }){
    const [expanded, setExpanded] = useState(false);
    if(!alert) return <></>
    return(
        <div className={styles.msgCard} onClick={() => setExpanded(!expanded)}>
            <Link to={'/flags'}  style={{display:'flex', width:"fit-content"}}><h4>{alert.subject}</h4></Link>
            {expanded && <div>
                {alert.body}
            </div>}
        </div>
    )
}

//box with tabs that show differnet lists of messages
export default function UpdateBox(){
    const { user } = useAuth();
    //determine what to display
    const [msgPane, setMsgPane] = useState('announcements');
    //content for different message types
    const [announcements, setAnnouncements] = useState([]);
    const [messages, setMessages] = useState([]);
    const [alerts, setAlerts] = useState([]);
    //meta
    const [adding, setAdding] = useState(false);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
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
    }, []);

    const handleAdd = (data) => {
        setAnnouncements(prev => [...prev, data])
    };

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
                {announcements.length == 0 && <p>No announcements yet.</p>}
                {announcements.map((a) => (<AnnouncementCard key={a.id} announcement={a} onUpdate={getAnnouncements}/>))}

                {user.role == 'admin' && <ButtonHover callback={() => setAdding(true)} noHover={<GrAnnounce />} hover={'New Announcement'} />}
                {adding && <ComposeAnnouncementModal onClose={() => setAdding(false)} onUpdate={handleAdd} /> }
            
            </div>}

            {msgPane == 'messages' && <div className={styles.msgPane}>
                {messages.length == 0 && <p>It's lonely here!</p>}
                {messages.map((msg) => (<UnopenedMsg key={msg.id} msg={msg} />))}
            </div>}

            {msgPane == 'alerts' && <div className={styles.msgPane}>
                {alerts.length == 0 && <p>Phew! No alerts.</p>}
                {alerts.map((alr) => (<AlertCard key={alr.id} alert={alr} />))}
            </div>}
        </div>
    )
}