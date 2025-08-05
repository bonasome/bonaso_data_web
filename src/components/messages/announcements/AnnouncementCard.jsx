import { useEffect, useState } from 'react';

import fetchWithAuth from '../../../../services/fetchWithAuth';
import prettyDates from '../../../../services/prettyDates';

import Messages from '../../reuseables/Messages';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import ComposeAnnouncementModal from './ComposeAnnouncementModal';
import ConfirmDelete from '../../reuseables/ConfirmDelete';

import styles from './announcement.module.css';

import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";

//card displaying announcement details and the like
export default function AnnouncementCard({ announcement, onUpdate }){
    const [expanded, setExpanded] = useState(false);
    const [errors, setErrors] = useState([]);
    const [editing, setEditing] = useState(false);
    const [annc, setAnnc] = useState(announcement);
    const [del, setDel] = useState(false);

    useEffect(() => {
        setAnnc(announcement);
    }, [announcement])
    const handleRead = async () => {
        if(annc.read) return;
        try{
            console.log('marking as read...');
            const response = await fetchWithAuth(`/api/messages/announcements/${announcement.id}/read/` , {
                method: 'PATCH',
            });
            if(response.ok){
                setAnnc(prev => ({...prev, read: true}));
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

    //handle deletion
    const handleDelete = async () => {
        try {
            console.log('deleting announcement...');
            const response = await fetchWithAuth(`/api/messages/announcements/${announcement.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onUpdate(returnData);
            } 
            else {
                let data = {};
                try {
                    data = await response.json();
                } catch {
                    // no JSON body or invalid JSON
                    data = { detail: 'Unknown error occurred' };
                }

                const serverResponse = [];
                for (const field in data) {
                    if (Array.isArray(data[field])) {
                    data[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                    });
                    } 
                    else {
                    serverResponse.push(`${field}: ${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            console.error('Failed to delete organization:', err);
            setErrors(['Something went wrong. Please try again later.']);
        }
        finally{
            setDel(false);
        }
    }

    if(!annc) return <></>

    if(del) return <ConfirmDelete onConfirm={() => handleDelete()} onCancel={() => setDel(false)} name={'this announcement'} />
    if(editing) return <ComposeAnnouncementModal existing={announcement} onUpdate={(data) => {setAnnc(data); onUpdate(data)}} onClose={() => setEditing(false)} />
    
    return(
        <div onClick={() => {setExpanded(!expanded); handleRead()}} className={annc.read ? styles.card : styles.unreadCard}>
            <h3>{annc.subject}</h3>
            {expanded && <div>
                <Messages errors={errors} />
                <p>{annc.body}</p>
                <p><i>Sent by {annc.sent_by.display_name} on {prettyDates(annc.sent_on)}</i></p>
                <div style={{ display: 'flex', flexDirection: 'row'}}>
                    <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit Details'} />
                    <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Announcement'} forDelete={true} />
                </div>
                {annc.read && <p></p>}
            </div>}
        </div>
    )
}