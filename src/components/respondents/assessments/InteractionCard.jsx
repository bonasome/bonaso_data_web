import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

import fetchWithAuth from '../../../../services/fetchWithAuth';
import prettyDates from '../../../../services/prettyDates';
import theme from '../../../../theme/theme';

import { useAuth } from '../../../contexts/UserAuth'

import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ComponentLoading from '../../reuseables/loading/ComponentLoading';
import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import UpdateRecord from '../../reuseables/meta/UpdateRecord';
import FlagModal from '../../flags/FlagModal';
import FlagDetailModal from "../../flags/FlagDetailModal";
import Messages from '../../reuseables/Messages';

import styles from '../respondentDetail.module.css';
import errorStyles from '../../../styles/errors.module.css';

import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { MdFlag } from "react-icons/md";

export default function InteractionCard({ interaction, onUpdate, onDelete }){
    /*
    Card that displays information about an interaction and also allows for the user to edit this information.
    - interaction (object): the interaction to display information about
    - onUpdate (function): used for helping to refresh when flags are added or resolved
    - onDelete (function): what to do when the interaction is deleted
    */
    const { user } = useAuth();

    //page meta
    const [expanded, setExpanded] = useState(false);
    const [del, setDel] = useState(false);
    const [flagging, setFlagging] = useState(false); //controls when a user is flagging the interaction
    const [viewFlags, setViewFlags] = useState(false); //controls when a user is viewing flag information
    const [submissionErrors, setSubmissionErrors] = useState([]);
    

    //quick memo to check for an unresolved flag, will display a warning if so
    const activeFlags = useMemo(() => {
        if(!interaction) return false
        return interaction?.flags?.filter(f => !f.resolved).length > 0;
    }, [interaction]);

    
    //check if user is an meofficer/manager of the organizaiton or their parent org or is an admin
    //or check if they created the interaction, in which case they can edit
    const hasPerm = useMemo(() => {
        if(user.role == 'admin') return true;
        else if (user.role == 'meofficer' || user.role == 'manager'){
            if(interaction?.task?.organization?.id == user.organization_id || 
                interaction?.parent_organization == user.organization_id) return true;
        }
        else if(user?.id == interaction?.created_by?.id) return true;
        return false;
    }, [user, interaction]);

    //helper to build a list of responses. Will combine multiselects stored separtely
    const cleanedResponses = useMemo(() => {
        const seen = new Set();
        const consolidated = [];

        interaction.responses.forEach((r) => {
            // Check if this indicator was already handled
            let existing = consolidated.find(i => i.indicator.id === r.indicator.id);

            if (r.indicator.type === 'multi' && !r.response_none) {
                if (existing) {
                    // Combine response options
                    existing.response_option = [
                        ...(Array.isArray(existing.response_option) ? existing.response_option : [existing.response_option]),
                        r.response_option
                    ];
                } else {
                    // First occurrence — initialize as array
                    consolidated.push({
                        ...r,
                        response_option: [r.response_option]
                    });
                    seen.add(r.indicator.id);
                }
            } 
            else if(r.indicator.type == 'multint'){
                if(existing){
                    //append option/value as a single string
                    existing.response_value.push(`${r.response_option.name} - ${[null, ''].includes(r.response_value) ? '0' : r.response_value}`)
                }
                else {
                    // First occurrence — initialize as array
                    consolidated.push({
                        ...r,
                        response_value: [`${r.response_option.name} - ${[null, ''].includes(r.response_value) ? '0' : r.response_value}`]
                    });
                    seen.add(r.indicator.id);
                }
            }
            else {
                if (existing) {
                    //this shouldn't happen
                    console.warn('POSSIBLY SUSPECT RESPONSE DATA!');
                    return;
                }
                consolidated.push({ ...r });
                seen.add(r.indicator.id);
            }
        });

        return consolidated;
    }, [interaction]);

    //handle deleting an interaction
    const deleteInteraction = async() => {
        try {
            console.log('deleting interaction...');
            const response = await fetchWithAuth(`/api/record/interactions/${interaction.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onDelete(interaction.id)
                setSubmissionErrors([]);
            } 
            else {
                let data = {};
                try {
                    data = await response.json();
                } 
                catch {
                    // no JSON body or invalid JSON
                    data = { detail: 'Unknown error occurred' };
                }

                const serverResponse = [];
                for (const field in data) {
                    if (Array.isArray(data[field])) {
                    data[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                    });
                    } else {
                    serverResponse.push(`${field}: ${data[field]}`);
                    }
                }
                setSubmissionErrors(serverResponse);
            }
        } 
        catch (err) {
            console.error('Failed to delete interaction:', err);
            setSubmissionErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setDel(false)
        }
    }

    if(!interaction.task) return <ComponentLoading />
    //return these modals separetly if needed since the otherwise the hover features will mess with the modeal styles
    if(del){
        return(
            <ConfirmDelete name={`Interaction ${interaction?.display_name}`} statusWarning={'This cannot be undone, and this data will be lost. Consider flagging this instead if you are unsure.'} 
                onConfirm={() => deleteInteraction()} onCancel={() => setDel(false)} />
        )
    }
    //creating a flag
    if(flagging){
        return(
            <FlagModal id={interaction.id} model={'respondents.interaction'} onCancel={() => setFlagging(false)}
                onConfirm={() => {onUpdate(); setFlagging(false)}} />
        )
    }
    //viewing flags related to this interaction
    if(viewFlags){
        return(
            <FlagDetailModal flags={interaction.flags} displayName={interaction.display_name} 
                onClose={() => {onUpdate(); setViewFlags(false)}}/>
        )
    }
    return(
        <div className={styles.card} onClick={() => setExpanded(!expanded)}>
            <h3>{interaction.display_name}</h3>
            {interaction?.flags?.length > 0 && <div className={activeFlags ? errorStyles.warnings : errorStyles.success} onClick={() => setViewFlags(true)}>
                {interaction?.flags.filter(f => !f.resolved).length > 0 ? <h3>This interaction has active flags.</h3> : <h3>This interacion previously had flags.</h3>}
            </div>}
            <div>
                <h2>{interaction.task.display_name}</h2>
                <Messages errors={submissionErrors} />
                <p><i>With respondent {interaction.respondent.display_name}</i></p>
                <p>On: {prettyDates(interaction.interaction_date)}</p>
                <p>At: {interaction.interaction_location}</p>
            </div>

            {/* Map of responses */}
            {expanded && <div>
                <div>
                    <div>
                        <h3>Responses</h3>
                        <div style={{ padding: '2vh', backgroundColor: theme.colors.bonasoDarkAccent }}>
                            {cleanedResponses.sort((a, b) => (a.indicator.order - b.indicator.order)).map(r => {
                                const rDate = r.response_date != interaction.interaction_date ? `(${prettyDates(r.response_date)})` : '';
                                const rLoc = r.response_location != interaction.interaction_location ? `(${r.response_location})` : '';
                                const app = rDate + ' ' + rLoc;
                                if(r.response_none){
                                    return(
                                        <div>
                                            <h4>{r.indicator.order + 1}. {r.indicator.name}</h4>
                                            <ul><li>"<i>None Selected" {app}</i></li> </ul>
                                        </div>
                                    )
                                }
                                else if(r.indicator.type == 'multi'){
                                    return(<div>
                                        <h4>{r.indicator.order + 1}. {r.indicator.name}</h4>
                                        <ul>{r.response_option.map((o) => (<li>{o.name} {app}</li>))}</ul>
                                    </div>)
                                }
                                else if(r.indicator.type == 'multint'){
                                    return(<div>
                                        <h4>{r.indicator.order + 1}. {r.indicator.name}</h4>
                                        <ul>{r.response_value.map((v) => (<li>{v} {app}</li>))}</ul>
                                    </div>)
                                }
                                else{
                                    let val = '';
                                    if(r.indicator.type == 'single') val = r.response_option?.name;
                                    else if(r.indicator.type == 'boolean') val = r.response_boolean ? 'Yes' : 'No';
                                    else val = r.response_value;
                                    return(<div>
                                    <h4>{r.indicator.order + 1}. {r.indicator.name}</h4>
                                    <ul><li>"<i>{val}" {app}</i></li> </ul>
                                    </div>)
                                }
                                
                            })}
                        </div>
                        <p><strong>Comments</strong></p>
                        {interaction?.comments ? <p>{interaction.comments}</p> : <p><i>No comments.</i></p>}
                        
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'row'}}>
                        {hasPerm && <Link to={`/respondents/${interaction.respondent.id}/assessment/${interaction.task.id}/edit/${interaction.id}`}> 
                            <ButtonHover noHover={<ImPencil />} hover={`Edit Details`} />
                        </Link>}
                        {hasPerm && <ButtonHover callback={() => setFlagging(true)} noHover={<MdFlag />} hover={'Raise New Flag'} forWarning={true} />}
                        {user.role == 'admin' && <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Record'} forDelete={true} />}
                        {del && <ButtonLoading forDelete={true} /> }
                    </div>
                </div>
                
                <UpdateRecord created_at={interaction.created_at} created_by = {interaction.created_by}
                    updated_at={interaction.updated_at} updated_by={interaction.updated_by} 
                />
            </div>} 

        </div>
    )
}