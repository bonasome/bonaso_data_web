import { useState } from 'react';
import FlagCard from './FlagCard';
import FlagModal from './FlagModal';

import modalStyles from '../../styles/modals.module.css';
import errorStyles from '../../styles/errors.module.css';

import { GiExitDoor } from "react-icons/gi";
import { MdFlag } from "react-icons/md";

//similar to a flag component for items that do not have a dedicated page.
export default function FlagDetailModal({ flags, model, id, onClose, displayName=null }){
    /*
    Simple modal that can be used to display an index of flags related to an item if there is no space
    to do it inline. Uses the FlagCard component.
    - flags (array): the list of flags to display
    - model (string): what model does this relate to, so that the user can raise a new flag
    - id (integer): the id of the object these flags belong to (so the user can raise a new flag)
    - onClose (function): how to close the modal
    - displayName (string, optional): name to display at the top of the modal (the object the flags relate to)
    */
    const [flagging, setFlagging] = useState(false); //the user is creating a new flag for this object

    //if flagging, return the FlagModal component for creating a flag
    if(flagging) return (<FlagModal model={model} id={id} onConfirm={onClose} onCancel={onClose}/>)
    
    //if no flags, do not displat any flag cards
    if(!flags || flags.length === 0) return( <div className={modalStyles.modal}>
        <p>No Flags yet!</p>
        <button className={errorStyles.warningButton} onClick={() => setFlagging(true)}> <MdFlag /> Raise one here.</button>
        <button onClick={() => onClose()}><GiExitDoor /> Close</button>
    </div>)
    
    return(
        <div className={modalStyles.modal}>
            {displayName ? <h3>Flags for {displayName}</h3> : <h3>Flags</h3>}
            {flags.map((flag) => <FlagCard flag={flag} />)}
            <div styles={{ display: 'flex', flexDirection: 'row'}}>
                <button className={errorStyles.warningButton} onClick={() => setFlagging(true)}><MdFlag /> Raise New Flag.</button>
                <button onClick={() => onClose()}><GiExitDoor /> Close</button>
            </div>
        </div>
    )

}