import { useState, useEffect, useMemo } from "react";
import { Link } from 'react-router-dom';

import fetchWithAuth from '../../../../services/fetchWithAuth';
import prettyDates from '../../../../services/prettyDates';

import { useAuth } from '../../../contexts/UserAuth'
import { useInteractions } from '../../../contexts/InteractionsContext';

import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ComponentLoading from '../../reuseables/loading/ComponentLoading';
import Checkbox from '../../reuseables/inputs/Checkbox';
import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import UpdateRecord from '../../reuseables/meta/UpdateRecord';
import FlagModal from '../../flags/FlagModal';
import FlagDetailModal from "../../flags/FlagDetailModal";

import styles from '../respondentDetail.module.css';
import errorStyles from '../../../styles/errors.module.css';

import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { IoIosSave } from "react-icons/io";
import { MdFlag } from "react-icons/md";
import { FcCancel } from "react-icons/fc";

export default function InteractionCard({ interaction, onUpdate, onDelete }){
    
    const { user } = useAuth();
    const [perm, setPerm] = useState(false);

    //page meta
    const [editing, setEditing] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);
    const [flagging, setFlagging] = useState(false);
    const [viewFlags, setViewFlags] = useState(false);
    const [del, setDel] = useState(false);

    //states used when editing
    const[interactionDate, setInteractionDate] = useState('');
    const [interactionLocation, setInteractionLocation] = useState('')
    const[subcats, setSubcats] = useState([]);
    const[number, setNumber] = useState('');
    const {setInteractions} = useInteractions();
    

    //quick memo to check for an unresolved flag
    const activeFlags = useMemo(() => {
        if(!interaction) return false
        return interaction?.flags?.filter(f => !f.resolved).length > 0;
    }, [interaction])

    
    useEffect(() => {
        //check if user is the creator if the interaction, a high role at the organization 
        // that owns the interaction or an admin
        const permCheck = () => {
            if(user.role == 'admin'){
                setPerm(true);
            }
            else if (user.role == 'meofficer' || user.role == 'manager'){
                if(interaction?.task?.organization?.id === user.organization_id){
                    setPerm(true);
                }
            }
            else if(user?.id == interaction?.created_by?.id){
                    setPerm(true);
                
            }
        }
        permCheck();

        //also set a few states that will be used if editing
        setInteractionLocation(interaction.interaction_location)
        setInteractionDate(interaction.interaction_date);
        setSubcats(interaction.subcategories);
        
        //not every interaction will have this
        if(interaction.numeric_component){
            setNumber(interaction.numeric_component);
        }
    }, [user, interaction])

    //handle editing an interaction
    const handleSubmit = async() =>{
        console.log(subcats)
        let submissionErrors = []
        if(!interactionLocation || interactionLocation == ''){
            submissionErrors.push('Interaction location is required.');
        }
        if(submissionErrors.length > 0){
            setErrors(submissionErrors)
            return;
        }
        const data={
            'respondent': interaction.respondent,
            'task_id': interaction.task.id,
            'interaction_date': interactionDate,
            'interaction_location': interactionLocation,
            'numeric_component': number || null,
            'subcategories_data': subcats,
        }

        try{
            setSaving(true);
            console.log('submitting edits...')
            const url = `/api/record/interactions/${interaction.id}/`; 
            const response = await fetchWithAuth(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setInteractions(prev => {
                    const others = prev.filter(r => r.id !== interaction.id);
                    return [...others, returnData];
                });
                setEditing(false);
                onUpdate();
                setErrors([]);
            }
            else{
                console.log(returnData)
                const serverResponse = [];
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                    returnData[field].forEach(msg => {
                        serverResponse.push(`${msg}`);
                    });
                    } 
                    else {
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        }
        catch(err){
            console.error('Failed to apply changes to interaction:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setSaving(false);
        }
    }
    //handle deleting an interaction
    const deleteInteraction = async() => {
        try {
            console.log('deleting interaction...');
            const response = await fetchWithAuth(`/api/record/interactions/${interaction.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onDelete(interaction.id)
                setErrors([]);
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
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            console.error('Failed to delete interaction:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setDel(false)
        }
    }

    if(!interaction.task) return <ComponentLoading />
    //return this separetly if needed since the otherwise the hover features will mess with the modeal styles
    if(del){
        return(
            <div>
                {del && <div className={styles.backdrop}></div>}
                {del && 
                    <ConfirmDelete 
                        name={`Interaction related to task ${interaction?.task?.indicator?.name}`} 
                        statusWarning={'This cannot be undone, and this data will be lost. Consider flagging this instead if you are unsure.'} 
                        onConfirm={() => deleteInteraction()} onCancel={() => setDel(false)} 
                />}
            </div>
        )
    }
    if(flagging){
        return(
            <FlagModal id={interaction.id} model={'respondents.interaction'} onCancel={() => setFlagging(false)}
                onConfirm={() => {onUpdate(); setFlagging(false)}} />
        )
    }
    if(viewFlags){
        return(
            <FlagDetailModal flags={interaction.flags} displayName={interaction.display_name} 
                onClose={() => {onUpdate(); setViewFlags(false)}}/>
        )
    }

    return(
        <div className={styles.card} onClick={() => setExpanded(!expanded)}>
            <h3>{interaction.task.indicator.code + ' '} {interaction.task.indicator.name}</h3>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {interaction?.flags.length > 0 && <div className={activeFlags ? errorStyles.warnings : errorStyles.success} onClick={() => setViewFlags(true)}>
                <h3>FLAGS</h3>
            </div>}
            {!editing && <div>
                <p>{prettyDates(interaction.interaction_date)}</p>
                <p>{interaction.interaction_location}</p>
            </div>}

            {expanded && !editing && <div onClick={(e) => e.stopPropagation()}>
                <p>By {interaction.task.organization.name}</p>
                {interaction.subcategories && interaction.subcategories.length >0 &&
                    <div>
                        <p>Subcategories:</p>
                        <ul>
                            {interaction.subcategories.map((cat) => (<li key={cat.id}>{cat.subcategory.name} {cat.numeric_component && `(${cat.numeric_component})`}</li> ))}
                        </ul>
                    </div>
                }

                {interaction.numeric_component && <p>{interaction.numeric_component}</p>}

                {interaction.comments && <div>
                    <h3>Comments:</h3>
                    <p>{interaction.comments}</p>
                </div>}

                <div style={{ display: 'flex', flexDirection: 'row'}}>
                    {perm && <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit Details'} />}
                    {perm && <ButtonHover callback={() => setFlagging(true)} noHover={<MdFlag />} hover={'Raise New Flag'} forWarning={true} />}
                    {user.role == 'admin' && <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Record'} forDelete={true} />}
                    {del && <ButtonLoading forDelete={true} /> }
                </div>
                <UpdateRecord created_at={interaction.created_at} created_by = {interaction.created_by}
                    updated_at={interaction.updated_at} updated_by={interaction.updated_by} /> 
                
            </div>}

            {editing && <div onClick={(e) => e.stopPropagation()}>
                <label htmlFor='interaction_date'>Date</label>
                <input type='date' name='interaction_date' id='interaction_date' value={interactionDate} onChange={(e)=>setInteractionDate(e.target.value)}/>
                <label htmlFor='interaction_date'>Location</label>
                <input type='text' name='interaction_location' id='interaction_location' value={interactionLocation} onChange={(e)=>setInteractionLocation(e.target.value)}/>
                {interaction.numeric_component &&
                    <div>
                        <label htmlFor='number'>Enter a number.</label>
                        <input type='number' min="0" id='number' name='number' value={number} onChange={(e)=>setNumber(e.target.value)} />
                    </div>
                }
                {interaction.subcategories.length > 0 &&
                    interaction.task.indicator.subcategories.map((cat) => (
                        <div key={cat.id} style={{ display: 'flex', flexDirection: 'row', marginTop: 'auto', marginBottom: 'auto' }}>
                            <Checkbox key={cat.id}
                                label={cat.name}
                                checked={subcats.filter(c => c.subcategory.id == cat.id).length > 0}
                                name={cat.name}
                                callback={(checked) => setSubcats(prev =>
                                    checked ? [...prev, {id: null, subcategory: {id: cat.id, name: cat.name}}] : prev.filter(c => c.id !== cat.id)
                                )}
                            />
                            {interaction.task.indicator.require_numeric && subcats.filter(c => c.subcategory.id == cat.id).length > 0 && <div style={{ display: 'flex', flexDirection: 'row'}}>
                                <input type="number" id={cat.id} onChange={(e) => setSubcats(prev => {
                                    const others = prev.filter(c => c.subcategory.id !== cat.id);
                                    return [...others, {id: null, subcategory: {id: cat.id, name: cat.name}, numeric_component: e.target.value}];
                                })} value={subcats.find(c => c.subcategory.id==cat.id)?.numeric_component || ''} style={{maxWidth: 40}}/>
                                <label htmlFor={cat.id}>(Enter a Number)</label>
                            </div>}
                        </div>))}
                <div style={{ display: 'flex', flexDirection: 'row'}}>
                    {saving ? <ButtonLoading /> : <ButtonHover callback={() => handleSubmit()} noHover={<IoIosSave />} hover={'Save Changes'} />}
                    {!saving && <ButtonHover callback={() => setEditing(false)} noHover={<FcCancel />} hover={'Cancel'} />}
                </div>
            </div>}
        </div>
    )
}

//Deprecated code, since we no longer disallow mismatched subcats. Allow edits to select anything at risk of a flag
//const [allowedSubcats, setAllowedSubcats] = useState([]);
    /*
    const checkPrereqs = async() =>{
        const prereq = interaction.task.indicator.prerequisite
        try{
            const response = await fetchWithAuth(`/api/record/interactions/?respondent=${interaction.respondent}&task_indicator=${prereq.id}&before=${interaction.interaction_date}`);
            const data = await response.json();
            if(data.results.length > 0){
                const validPastInt = data.results.find(inter => inter?.task?.indicator?.id === prereq.id);
                if (validPastInt && validPastInt.interaction_date <= interactionDate) {
                    if (validPastInt?.subcategories) {
                        setAllowedSubcats(validPastInt.subcategories);
                    }
                }
                else{
                    setAllowedSubcats(interaction.task.indicator.subcategories)
                }
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error(err)
        }   
    }

        if(interaction.subcategories){
            setSubcats(interaction.subcategories);
            if(interaction.task.indicator.prerequisite){
                checkPrereqs();
            }
            else{
                setAllowedSubcats(interaction.task.indicator.subcategories);
            }
        }
    
        */