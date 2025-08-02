import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth';

import fetchWithAuth from '../../../services/fetchWithAuth';

import Loading from '../reuseables/loading/Loading';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import Messages from '../reuseables/Messages';
import IndexViewWrapper from '../reuseables/IndexView';
import MessageCard from './MessageCard';
import ComposeMessage from './ComposeMessage';
import styles from './messages.module.css';

import { IoIosChatboxes } from "react-icons/io";
import { MdSupportAgent } from "react-icons/md";
import { IoPersonAdd, IoPersonRemove  } from "react-icons/io5";
import { TiMessages } from "react-icons/ti";
import UnopenedMsg from './UnopenedMsg';

export default function MyMessages(){
    const { id } = useParams(); //optional param that directs to a specific message on load
    const { user } = useAuth();
    //list of messages
    const [messages, setMessages] = useState();
    //set main panel to show new compose
    const [composing, setComposing] = useState(false);
    //thread currently in the main panel
    const [activeThread, setActiveThread] = useState(null);
    //list of people in a persons address book
    const [profiles, setProfiles] = useState([]);
    //currently in thread/composition thread
    const [sendTo, setSendTo] = useState([]);
    //special button to send to all admins
    const [toAdmin, setToAdmin] = useState(false);
    //index helpers
    const [entries, setEntries] = useState(0)
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    
    //for simplicity, keep profile index info seperate
    const [entriesP, setEntriesP] = useState(0)
    const [pageP, setPageP] = useState(1);
    const [searchP, setSearchP] = useState('');

    //meta
    const [errors, setErrors] = useState([])
    const [loading, setLoading] = useState(true);
    
    const getMsgs = async () => {
        try {
            console.log('getting messages...')
            const response = await fetchWithAuth(`/api/messages/dm/?search=${search}&page=${page}`);
            const data = await response.json();
            setMessages(data.results);
            setEntries(data.count);
            if(activeThread){
                setActiveThread(data.results.find(msg => msg.id == activeThread.id))
            }
        } 
        catch (error) {
            setErrors(['Something went wrong. Please try again later.']);
            console.error('Fetch failed:', error);
        } 
        finally {
            setLoading(false);
        }
    };

    //load once on load
    useEffect(() => {
        const initialLoad = async() => {
            await getMsgs();
        }
        initialLoad();
    }, [search, page]);

    //load possible recipients
    useEffect(() => {
        const getProfiles = async () => {
            try {
                const response = await fetchWithAuth(`/api/messages/dm/recipients/?search=${searchP}&page=${pageP}`);
                const data = await response.json();
                setEntriesP(data.count)
                setProfiles(data.results?.filter(p => p.id != user.id));
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
    }, [searchP, pageP]);

    //load active thread from id param
    useEffect(() => {
        if(messages && id && !activeThread){
            const active = messages.filter(msg => msg.id == id)
            if(active.length === 1){
                setActiveThread(active[0]);
            }
        }
    }, [messages, id]);

    
    if(loading || !messages) return <Loading />
    return(
        <div className={styles.container}>

            {composing && <div className={styles.sidebar}>
                <h2>Start a New Message</h2>
                <IndexViewWrapper onSearchChange={setSearchP} page={page} onPageChange={setPageP} entries={entriesP} >
                    {profiles.length > 0 ? profiles.map((p) => (<div className={styles.pCard}>
                        <h4>{p.display_name} {p.last_name}</h4>
                        {sendTo.some(im => im.id === p.id) ? (
                            <ButtonHover
                                callback={() => setSendTo(sendTo.filter(im => im.id !== p.id))}
                                noHover={<IoPersonRemove />} forDelete={true}
                            />
                            ) : (
                            <ButtonHover
                                callback={() => setSendTo(prev => {
                                    if (prev.some(im => im.id === p.id)) return prev;  // already added
                                    return [...prev, p];  // safe to add
                                })}
                                noHover={<IoPersonAdd />}
                            />
                        )}
                    </div>)) : <p>No possible recipients.</p>}
                </IndexViewWrapper>
                <div className={styles.spacer}></div>
            </div>}

            {!composing && <div className={styles.sidebar}>
                <h2>Your Conversations</h2>
                <div className={styles.actions}>
                    {!toAdmin && <ButtonHover callback={()=> setComposing(true)} noHover={<IoIosChatboxes />} hover={' New Message'} />}
                    {!composing && <ButtonHover callback={() => {setToAdmin(!toAdmin); setActiveThread([])}} noHover={<MdSupportAgent />} hover={'Write an Administrator'} />}
                </div>

                <div>
                     <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} >
                        {messages.length > 0 ? messages.map((m) => (<UnopenedMsg msg={m} callback={(msg) => setActiveThread(msg)} />)) : 
                        <p>No messages yet. Click the button above to start talking!</p>}
                    </IndexViewWrapper>
                    <div className={styles.spacer}></div>
                </div>
            </div>}

            <div className={styles.mainPanel}>
                {composing && sendTo.length === 0 && <div>
                    <h2>You can't have a conversation with one person! Add people from the sidebar.</h2>
                    <button onClick={(e) => {setComposing(false)}}>Cancel</button>
                </div>}
                {!composing && !toAdmin && (!activeThread || activeThread.length ===0) && <div className={styles.placeholder}>
                    <TiMessages fontSize={180} />
                    {messages.length > 0 &&<h2>Select a conversation from the sidebar to view, or...</h2>}
                    <h2>Create a new message by clicking the buttons.</h2>
                </div>}
                {composing && sendTo.length > 0 && <h2>Starting a new conversation with {sendTo.map((r) => (r.display_name)).join(', ')}</h2>}
                {composing && <ComposeMessage profiles={sendTo} onSave={getMsgs} onCancel={() => setComposing(false)}/>}
                {toAdmin && <ComposeMessage profiles={[]} admin={true} onSave={getMsgs} onCancel={() => {setToAdmin(false)}} />}
                {!composing && !toAdmin && activeThread && <MessageCard message={activeThread} onUpdate={getMsgs} />}
            </div>

        </div>
    )
}