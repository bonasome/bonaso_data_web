import { useState } from 'react';
import FlagCard from './FlagCard';
import FlagModal from './FlagModal';

import modalStyles from '../../styles/modals.module.css';
import { GiExitDoor } from "react-icons/gi";

export default function FlagDetailModal({ flags, model, id, displayName=null, onClose }){
    const [flagging, setFlagging] = useState(false);
    if(flagging) return (<FlagModal model={model} id={id} onConfirm={onClose} onCancel={onClose}/>)
    if(!flags || flags.length === 0) return( <div className={modalStyles.modal}>
        <p>No Flags yet!</p>
        <button onClick={() => setFlagging(true)}>Raise one here.</button>
        <button onClick={() => onClose()}><GiExitDoor /> Close</button>
    </div>)
    return(
        <div className={modalStyles.modal}>
            {displayName ? <h3>Flags for {displayName}</h3> : <h3>Flags</h3>}
            {flags.map((flag) => <FlagCard flag={flag} />)}
            <button onClick={() => onClose()}><GiExitDoor /> Close</button>
        </div>
    )

}