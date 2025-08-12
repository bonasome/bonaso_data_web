import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/UserAuth';


import fetchWithAuth from '../../../services/fetchWithAuth';

import ComposeAnnouncementModal from '../messages/announcements/ComposeAnnouncementModal';
import UnopenedMsg from '../messages/UnopenedMsg';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import Messages from '../reuseables/Messages';
import AnnouncementCard from '../messages/announcements/AnnouncementCard';

import styles from './home.module.css';

import { GrAnnounce } from "react-icons/gr";
import { AiFillAlert } from "react-icons/ai";
import { HiMiniBellAlert, HiMiniBellSnooze } from "react-icons/hi2";
import { BiSolidMessageError, BiSolidMessageAltCheck } from "react-icons/bi";
import { FaClipboardCheck } from "react-icons/fa";
//simple alert card since these don't show up anywhere else
function AlertCard({ alert, onUpdate }){
    const [alr, setAlr] = useState(null);
    const [errors, setErrors] = useState([]);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        setAlr(alert);
    }, [alert])

    const handleRead = async () => {
        if(alr.read) return;
        try{
            console.log('marking as read...');
            const response = await fetchWithAuth(`/api/messages/alerts/${alr.id}/read/` , {
                method: 'PATCH',
            });
            if(response.ok){
                setAlr(prev => ({...prev, read: true}));
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
            console.log('Failed to mark message as read', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
    }

    if(!alr) return <></>

    return(
        <div className={alr.read ? styles.msgCard : styles.unreadCard} onClick={() => {setExpanded(!expanded); handleRead()}}>
            <Link to={'/flags'}  style={{display:'flex', width:"fit-content"}}><h3>{alert.subject}</h3></Link>
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


    const unreadAnnc = useMemo(() => {
        if(!announcements) return []
        return announcements.some((a) => (!a.read));
    }, [announcements]);

    const unreadMsg = useMemo(() => {
        if(!messages) return []
        return messages.some(msg => 
            msg.recipients?.some(r => r.recipient.id === user.id && !r.read) ||
            msg.replies?.some(rep => 
                rep.recipients?.some(r => r.recipient.id === user.id && !r.read)
            )
        );
    }, [messages, user.id]);

    const unreadAlert = useMemo(() => {
        if(!alerts) return []
        return alerts.some((a) => (!a.read));
    }, [alerts]);

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

        getAlerts();
    }, []);

    const handleAdd = (data) => {
        setAnnouncements(prev => [...prev, data])
    };
    if(loading) return <ComponentLoading />
    return(
        <div className={styles.board}>
            <div className={styles.tabs}>
                <div className={msgPane == 'announcements' ? styles.activeTab : (unreadAnnc ? styles.unreadTab : styles.tab)} onClick={() => setMsgPane('announcements')}>
                    {unreadAnnc ? <AiFillAlert style={{ marginRight: 10}} /> : <FaClipboardCheck style={{ marginRight: 10}} />}<h4>Announcements</h4>
                </div>
                <div className={msgPane == 'messages' ? styles.activeTab : (unreadMsg ? styles.unreadTab : styles.tab)} onClick={() => setMsgPane('messages')}>
                    {unreadMsg ? <BiSolidMessageError style={{ marginRight: 10}} /> : <BiSolidMessageAltCheck style={{ marginRight: 10}} /> }<h4>Messages</h4>
                </div>
                <div className={msgPane == 'alerts' ? styles.activeTab : (unreadAlert ? styles.unreadTab : styles.tab)} onClick={() => setMsgPane('alerts')}>
                    {unreadAlert ? <HiMiniBellAlert style={{ marginRight: 10}} /> : <HiMiniBellSnooze style={{ marginRight: 10}} />}<h4>Alerts</h4>
                </div>
            </div>
            <Messages errors={errors} />

            {msgPane == 'announcements' && <div className={styles.msgPane}>
                {user.role == 'admin' && <ButtonHover callback={() => setAdding(true)} noHover={<GrAnnounce />} hover={'New Announcement'} />}
                {announcements?.length == 0 && <p className={styles.placeholder}>No announcements yet.</p>}
                {announcements?.map((a) => (<AnnouncementCard key={a.id} announcement={a} onUpdate={getAnnouncements}/>))}

                {adding && <ComposeAnnouncementModal onClose={() => setAdding(false)} onUpdate={handleAdd} /> }
            
            </div>}

            {msgPane == 'messages' && <div className={styles.msgPane}>
                {messages?.length == 0 && <p className={styles.placeholder}>No messages yet. It's lonely here!</p>}
                {messages?.map((msg) => (<UnopenedMsg key={msg.id} msg={msg} />))}
            </div>}

            {msgPane == 'alerts' && <div className={styles.msgPane}>
                {alerts?.length == 0 && <p className={styles.placeholder}>Phew! No alerts.</p>}
                {alerts?.map((alr) => (<AlertCard key={alr.id} alert={alr} onUpdate={getAlerts} />))}
            </div>}
        </div>
    )
}