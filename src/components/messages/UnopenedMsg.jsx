import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth';

import styles from './messages.module.css';

import { TbMessageReportFilled } from "react-icons/tb";
import { BiSolidMessageAltCheck } from "react-icons/bi";
import { MdOutlineMarkChatUnread } from "react-icons/md";
import { IoCheckmarkDoneCircle  } from "react-icons/io5";
export default function UnopenedMsg({ msg, callback=null }){
    const { user } = useAuth();
    
    const checkRead = (msg) => {
        if(msg.recipients.find(r => r.recipient.id == user.id && !r.read)) return false;
        if(msg.replies.find(rep => rep.recipients.find(r => r.recipient.id == user.id && !r.read))) return false
        return true
    }

    const checkToDo = (msg) => {
        if(msg.recipients.find(r => r.recipient.id == user.id && r.actionable && !r.completed)) return true;
        if(msg.replies.find(rep => rep.recipients.find(r => r.recipient.id == user.id && r.actionable && !r.completed))) return true
        return false
    }
    const checkCompleted = (msg) => {
        const allRelevant = [
            ...msg.recipients,
            ...msg.replies.flatMap(rep => rep.recipients)
        ].filter(r =>
            r.recipient.id === user.id && r.actionable
        );

        if (allRelevant.length === 0) return false; // nothing assigned to this user

        return allRelevant.every(r => r.completed);
    };
    const checkCompletedSender = (msg) => {
        const allRelevant = [
            ...msg.recipients,
            ...msg.replies.flatMap(rep => rep.recipients)
        ].filter(r => r.actionable);

        if (allRelevant.length === 0) return false; // nothing assigned in thread

        return allRelevant.every(r => r.completed);
    };

    return(
        <div className={checkRead ? styles.sbCard : styles.unreadSBCard} onClick={() => {callback ? callback(msg) : null}}>
            {!checkRead(msg) && <MdOutlineMarkChatUnread fontSize={25} style={{ marginTop: 'auto', marginBottom: 'auto', marginRight: 5}} />}
            {checkToDo(msg) && <TbMessageReportFilled fontSize={25} style={{ marginTop: 'auto', marginBottom: 'auto', marginRight: 5}}/>}
            {checkCompleted(msg) && <BiSolidMessageAltCheck 
                fontSize={25} style={{ marginTop: 'auto', marginBottom: 'auto', marginRight: 5}}
            />}
            {user.id === msg.sender.id && checkCompletedSender(msg) && 
                <IoCheckmarkDoneCircle fontSize={25} 
                    style={{ marginTop: 'auto', marginBottom: 'auto', marginRight: 5}}
            />}

            {callback ? <h3>{msg.subject} - {msg.sender.display_name}</h3> :
             <Link to={`/messages/${msg.id}`}><h3>{msg.subject} - {msg.sender.display_name}</h3></Link>}
        </div>
    )
}