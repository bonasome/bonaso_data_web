import React from 'react';
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

function InteractionCard({ interaction, onUpdate, onDelete }){
    const { user } = useAuth();
    const [edit, setEdit] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [perm, setPerm] = useState(false);
    const [errors, setErrors] = useState([]);
    const[interactionDate, setInteractionDate] = useState('');
    const[subcats, setSubcats] = useState('');
    const[number, setNumber] = useState('');
    const[availableSubcats, setAvailableSubcats] = useState([]);
    const [del, setDel] = useState(false);
    const [flagged, setFlagged] = useState(interaction.flagged)
    const {setInteractionDetails} = useInteractions();

    useEffect(() => {
        console.log(interaction)
        const permCheck = () => {
            console.log('user', user)
            if(user.role == 'admin'){
                setPerm(true);
            }
            else if (user.role == 'meofficer' || user.role == 'manager'){
                if(interaction?.task_detail?.organization?.id === user.organization_id || interaction?.task_detail?.parent_organization?.id === user.organization_id){
                    setPerm(true);
                }
            }
            else if(user.id == interaction.created_by){
                    setPerm(true);
                
            }
        }
        
        setInteractionDate(interaction.interaction_date)
        if (interaction.task_detail?.indicator?.subcategories?.length > 0) {
            const subcatNames = interaction.task_detail.indicator.subcategories.map(c => c.name);
            setAvailableSubcats(subcatNames);
            const existingSubcats = interaction.subcategories.map((cat) => (cat.name));
            setSubcats(existingSubcats)
        }
        if(interaction.numeric_component){
            setNumber(interaction.numeric_component);
        }
        permCheck();
    }, [user, interaction])

    
    const handleSubmit = async(flaggedOverride = flagged) =>{
        const data={
            'respondent': interaction.respondent,
            'task': interaction.task_detail.id,
            'interaction_date': interactionDate,
            'numeric_component': number || null,
            'subcategory_names': subcats,
            'flagged': flaggedOverride,
        }
        try{
            console.log('submitting edits', data)
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
                setInteractionDetails(prev => {
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
                console.log(serverResponse)
                setErrors(serverResponse);
            }
        }
        catch(err){
            console.error('Failed to apply changes to interaction:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
    }
    const flagInteraction = async() => {
        const newFlag = !flagged
        setFlagged(!flagged);
        handleSubmit(newFlag);
    }

    const deleteInteraction = async() => {
        try {
            console.log('deleting organization...');
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
        setDel(false)
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
                {interaction.numeric_component &&
                    <div>
                        <label htmlFor='number'>Enter a number.</label>
                        <input type='number' min="0" id='number' name='number' value={number} onChange={(e)=>setNumber(e.target.value)} />
                    </div>
                }
                {interaction.subcategories &&
                    <SimpleSelect name='subcategories' label='Subcategories' 
                        optionValues={availableSubcats} 
                        multiple={true}
                        defaultOption={subcats}
                        callback={(val) => {setSubcats(val);
                        }} 
                    />
                }
                <button onClick={() => handleSubmit()}>Save Changes</button>
                <button onClick={() => setEdit(!edit)}>Cancel</button>
                
            </div>
        )
    }
    return(
        <div className={styles.card} onClick={() => setExpanded(!expanded)}>
            
            <h3>{interaction.task_detail.indicator.code + ' '} {interaction.task_detail.indicator.name}</h3>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {flagged && <div className={errorStyles.warnings}><h3>FLAGGED</h3></div>}
            <p>{prettyDates(interaction.interaction_date)}</p>
            {expanded && 
                <div>
                <p>By {interaction.task_detail.organization.name}</p>
                {interaction.subcategories && interaction?.subcategories.length >0 &&
                    <div>
                        <p>Subcategories:</p>
                        <ul>
                            {interaction.subcategories.map((cat) => (<li key={cat.name}>{cat.name}</li> ))}
                        </ul>
                    </div>
                }
                {interaction.numeric_component && <p>{interaction.numeric_component}</p>}
                {perm && <button onClick={() => setEdit(!edit)}>{edit ? 'Cancel' : 'Edit Interaction'}</button>}
                {user.role == 'admin' && <button className={errorStyles.deleteButton} onClick={() => setDel(true)}>Delete</button>}
                {perm && <button className={errorStyles.warningButton} onClick={() => flagInteraction()} >{flagged ? 'Mark as OK' :'Flag'} </button>}
                </div>
            }
        </div>
    )
}

export default function Interactions({ id, tasks, onUpdate }){
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
                console.log(data)
                setEntries(data.count); 
                if (page === 1) {
                    setInteractions(data.results);
                    console.log(data.results)
                } 
                else {
                    setInteractions(prev => [...prev, ...data.results]);
                }
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
    }
    const onEdit = () => {
        setInteractionRefresh(prev => prev +1)
    }
    const onDelete = (id) => {
        const updated = interactions.filter(inter => inter.id != id)
        setInteractions(updated);
        setSuccess('Interaction Deleted.')
    }
    if(loading) return <p>Loading...</p>
    return(
        <div>
                {success && <div className={errorStyles.success}>{success}</div>}
                <AddInteractions id={id} tasks={tasks} interactions={interactions} onUpdate={onUpdate} onFinish={onFinish}/>
                <IndexViewWrapper onSearchChange={setSearch} onPageChange={setPage} entries={entries}>
                    <h4>Previous Interactions</h4>
                    {interactions.map((interaction) => (<InteractionCard key={interaction.id} interaction={interaction} onUpdate={onEdit} onDelete={onDelete}/>))}
                </IndexViewWrapper>
        </div>
    )
}