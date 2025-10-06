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
    /*
    Displays information about an announcement. 
    - announcement (object): contains details about the announcement
    - onUpdate (function): what the parent component should do when the announcement is edited. 
    */

    const [annc, setAnnc] = useState(announcement); //details about the announcement (state allows for live updates)

    //component meta
    const [expanded, setExpanded] = useState(false);
    const [errors, setErrors] = useState([]);
    const [editing, setEditing] = useState(false);
    const [del, setDel] = useState(false);

    //set mutable state when announcement loads
    useEffect(() => {
        setAnnc(announcement);
    }, [announcement]);

    //set the announcement as read when clicked
    const handleRead = async () => {
        if(annc.read) return; //return if already read
        try{
            console.log('marking as read...');
            const response = await fetchWithAuth(`/api/messages/announcements/${announcement.id}/read/` , {
                method: 'PATCH',
            });
            if(response.ok){
                setAnnc(prev => ({...prev, read: true})); //update the state so it reflects as being read
                onUpdate(); //tell the parent component a change was made
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
                setErrors(serverResponse);
            }
        }
        catch(err){
            console.log('Failed to mark announcement as read', err);
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

    //determine if a user has edit perms
    const hasPerm = useMemo(() => {
        if(!user || !announcement) return false
        if(user.role === 'admin') return true; //admin has perm
        //otherwise check they are the corredt role and it is for their organization
        if(['meofficer', 'manager'].includes(user.role) && user.organization_id == announcement?.created_by.organization.id) return true
        return false
    }, [user, announcement]);

    if(!annc) return <></>
    //return delete/edit modals as a seperate component since the hovering card messes with the styling
    if(del) return <ConfirmDelete onConfirm={() => handleDelete()} onCancel={() => setDel(false)} name={'this announcement'} />
    if(editing) return <ComposeAnnouncementModal existing={announcement} onUpdate={(data) => {setAnnc(data); onUpdate(data)}} onClose={() => setEditing(false)} />
    
    return(
        <div onClick={() => {setExpanded(!expanded); handleRead()}} className={annc.read ? styles.card : styles.unreadCard}>
            <h3>{annc.subject}</h3>
            {expanded && <div>
                <Messages errors={errors} />
                <p>{annc.body}</p>
                <p><i>Sent by {annc.sent_by.display_name} on {prettyDates(annc.sent_on)}</i></p>
                {hasPerm && <div style={{ display: 'flex', flexDirection: 'row'}}>
                    <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit Details'} />
                    <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Announcement'} forDelete={true} />
                </div>}
                {annc.read && <p></p>}
            </div>}
        </div>
    )
}