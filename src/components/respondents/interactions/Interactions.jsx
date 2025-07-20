import React, { useMemo } from 'react';
import { useState, useEffect } from "react";
import fetchWithAuth from '../../../../services/fetchWithAuth';
import { useAuth } from '../../../contexts/UserAuth'
import SimpleSelect from '../../reuseables/SimpleSelect';
import prettyDates from '../../../../services/prettyDates';
import IndexViewWrapper from '../../reuseables/IndexView';
import { useInteractions } from '../../../contexts/InteractionsContext';
import AddInteractions from './AddInteractions';
import styles from '../respondentDetail.module.css';
import errorStyles from '../../../styles/errors.module.css';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ComponentLoading from '../../reuseables/ComponentLoading';
import Checkbox from '../../reuseables/Checkbox';
import ButtonLoading from '../../reuseables/ButtonLoading';
import modalStyles from '../../../styles/modals.module.css';
import { Link } from 'react-router-dom';

function InteractionCard({ interaction, onUpdate, onDelete }){
    const { user } = useAuth();
    const [edit, setEdit] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [perm, setPerm] = useState(false);
    const [errors, setErrors] = useState([]);
    const[interactionDate, setInteractionDate] = useState('');
    const [interactionLocation, setInteractionLocation] = useState('')
    //const [allowedSubcats, setAllowedSubcats] = useState([]);
    const[subcats, setSubcats] = useState([]);
    const[number, setNumber] = useState('');
    const [del, setDel] = useState(false);
    const {setInteractions} = useInteractions();
    const [saving, setSaving] = useState(false);

    /*
    const checkPrereqs = async() =>{
        const prereq = interaction.task_detail.indicator.prerequisite
        try{
            const response = await fetchWithAuth(`/api/record/interactions/?respondent=${interaction.respondent}&task_indicator=${prereq.id}&before=${interaction.interaction_date}`);
            const data = await response.json();
            if(data.results.length > 0){
                const validPastInt = data.results.find(inter => inter?.task_detail?.indicator?.id === prereq.id);
                if (validPastInt && validPastInt.interaction_date <= interactionDate) {
                    if (validPastInt?.subcategories) {
                        setAllowedSubcats(validPastInt.subcategories);
                    }
                }
                else{
                    setAllowedSubcats(interaction.task_detail.indicator.subcategories)
                }
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error(err)
        }   
    }
        */

    const activeFlags = useMemo(() => {
        if(!interaction) return false
        return interaction?.flags?.filter(f => !f.resolved).length > 0;
    }, [interaction])

    useEffect(() => {
        const permCheck = () => {
            if(user.role == 'admin'){
                setPerm(true);
            }
            else if (user.role == 'meofficer' || user.role == 'manager'){
                if(interaction?.task_detail?.organization?.id === user.organization_id || interaction?.task_detail?.parent_organization?.id === user.organization_id){
                    setPerm(true);
                }
            }
            else if(user?.id == interaction?.created_by?.id){
                    setPerm(true);
                
            }
        }
        const loc = interaction?.interaction_location ? interaction.interaction_location : '';
        setInteractionLocation(loc)
        setInteractionDate(interaction.interaction_date);
        setSubcats(interaction.subcategories);

        /*
        if(interaction.subcategories){
            setSubcats(interaction.subcategories);
            if(interaction.task_detail.indicator.prerequisite){
                checkPrereqs();
            }
            else{
                setAllowedSubcats(interaction.task_detail.indicator.subcategories);
            }
        }
        */

        if(interaction.numeric_component){
            setNumber(interaction.numeric_component);
        }
        permCheck();
    }, [user, interaction])

    const handleSubmit = async() =>{
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
            'task': interaction.task_detail.id,
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
                setEdit(false);
                onUpdate();
                setErrors([]);
            }
            else{
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

    if(!interaction.task_detail) return <></>
    if(del){
        return(
            <div>
                {del && <div className={styles.backdrop}></div>}
                {del && 
                    <ConfirmDelete 
                        name={`Interaction related to task ${interaction?.task_detail?.indicator?.name}`} 
                        statusWarning={'This cannot be undone, and this data will be lost. Consider flagging this instead if you are unsure.'} 
                        onConfirm={() => deleteInteraction()} onCancel={() => setDel(false)} 
                />}
            </div>
        )
        
    }
    if(edit){
        return(
            <div className={styles.card}>
                <h3>{interaction.task_detail.indicator.code + ' '} {interaction.task_detail.indicator.name}</h3>
                {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
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
                    interaction.subcategories.map((cat) => (
                        <div style={{ display: 'flex', flexDirection: 'row', marginTop: 'auto', marginBottom: 'auto' }}>
                            <Checkbox key={cat.id}
                                label={cat.name}
                                checked={subcats.filter(c => c.id === cat.id).length > 0}
                                name={cat.name}
                                callback={(checked) => setSubcats(prev =>
                                    checked ? [...prev, cat] : prev.filter(c => c.id !== cat.id)
                                )}
                            />
                            {interaction.task_detail.indicator.require_numeric && subcats.filter(c => c.id ==cat.id).length > 0 &&
                                <div>
                                <label>Number</label>
                                <input type="number" onChange={(e) => setSubcats(prev => {
                                    const others = prev.filter(c => c.id !== cat.id);
                                    return [...others, {id: cat.id, name: cat.name, numeric_component: e.target.value}];
                                })} value={subcats.find(c => c.id==cat.id)?.numeric_component || ''}/>
                                </div>
                            }
                        </div>
                    ))
                }
                {saving ? <ButtonLoading /> : <button onClick={() => handleSubmit()}>Save Changes</button>}
                <button onClick={() => setEdit(!edit)}>Cancel</button>
                
            </div>
        )
    }
    return(
        <div className={styles.card} onClick={() => setExpanded(!expanded)}>
            <h3>{interaction.task_detail.indicator.code + ' '} {interaction.task_detail.indicator.name}</h3>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {interaction?.flags.length > 0 && <div className={activeFlags ? errorStyles.warnings : errorStyles.success}>
                <Link to={`/respondents/interaction/${interaction.id}`}><h3>FLAGS</h3></Link>
            </div>}
            <p>{prettyDates(interaction.interaction_date)}</p>
            <p>{interaction.interaction_location ? interaction.interaction_location : 'No Location on Record'}</p>
            {expanded && 
                <div>
                <p>By {interaction.task_detail.organization.name}</p>
                {interaction.subcategories && interaction?.subcategories.length >0 &&
                    <div>
                        <p>Subcategories:</p>
                        <ul>
                            {interaction.subcategories.map((cat) => (<li key={cat.name}>{cat.name} {cat.numeric_component && `(${cat.numeric_component})`}</li> ))}
                        </ul>
                    </div>
                }
                {interaction.numeric_component && <p>{interaction.numeric_component}</p>}
                {perm && <button onClick={() => setEdit(!edit)}>{edit ? 'Cancel' : 'Edit Interaction'}</button>}
                {user.role == 'admin' && <button className={errorStyles.deleteButton} onClick={() => setDel(true)}>Delete</button>}
                {perm && <Link to={`/respondents/interaction/${interaction.id}`}><button className={errorStyles.warningButton}>Raise New Flag </button></Link>}
                {user.role == 'admin' && !del &&
                    <div>
                        <p><i>Created by: {interaction.created_by?.first_name} {interaction.created_by?.last_name} at {new Date(interaction.created_at).toLocaleString()}</i></p>
                        {interaction.updated_by && interaction.updated_by && <p><i>Updated by: {interaction.updated_by?.first_name} {interaction.updated_by?.last_name} at {new Date(interaction.updated_at).toLocaleString()}</i></p>}
                    </div>
                } 
                {del && <ButtonLoading forDelete={true} /> }
                </div>
            }
        </div>
    )
}

export default function Interactions({ id, tasks, onUpdate, setAddingTask, onAdd }){
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    const { interactions, setInteractions } = useInteractions();
    const[success, setSuccess] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const [interactionRefresh, setInteractionRefresh] = useState(0);

    useEffect(() => {
        const getInteractions = async() => {
            try {
                console.log('fetching respondent details...');
                const response = await fetchWithAuth(`/api/record/interactions/?respondent=${id}&search=${search}&page=${page}`);
                const data = await response.json();
                console.log(data.results);
                setEntries(data.count); 
                setInteractions(data.results);
                setLoading(false)
            } 
            catch (err) {
                console.error('Failed to fetch respondent: ', err);
                setLoading(false)
            }
        }
        getInteractions();
    }, [id, search, page, interactionRefresh])



    const onFinish = () => {
        setInteractionRefresh(prev => prev + 1)
        onAdd()
    }
    const onEdit = () => {
        setInteractionRefresh(prev => prev +1)
    }
    const onDelete = (id) => {
        const updated = interactions.filter(inter => inter.id != id)
        setInteractions(updated);
        setSuccess('Interaction Deleted.')
    }

    if(loading) return <ComponentLoading />
    return(
        <div>
                {success && <div className={errorStyles.success}>{success}</div>}
                {!['client'].includes(user.role) && <AddInteractions id={id} tasks={tasks} interactions={interactions} onUpdate={onUpdate} onFinish={onFinish} setAddingTask={setAddingTask}/>}
                <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries}>
                    <h4>Previous Interactions</h4>
                    {interactions.length === 0 && <p>No interactions yet.</p>}
                    {interactions.length > 0 && interactions.map((interaction) => (<InteractionCard key={interaction.id} interaction={interaction} onUpdate={onEdit} onDelete={onDelete}/>))}
                </IndexViewWrapper>
        </div>
    )
}