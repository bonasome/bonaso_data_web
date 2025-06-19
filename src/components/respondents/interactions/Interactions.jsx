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

function InteractionCard({ interaction }){
    const { user } = useAuth();
    const [edit, setEdit] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [perm, setPerm] = useState(false);

    const[interactionDate, setInteractionDate] = useState('');
    const[subcats, setSubcats] = useState('');
    const[number, setNumber] = useState('');
    const[availableSubcats, setAvailableSubcats] = useState([]);
    useEffect(() => {
        console.log(interaction)
        const permCheck = () => {
            if(user.role == 'admin'){
                setPerm(true);
            }
            else if (interaction?.task_detail?.organization?.id == user.organization_id){
                if (user.role == 'meofficer' || user.role == 'manager'){
                    setPerm(true);
                }
                else if(user.id == interaction.created_by){
                    setPerm(true);
                }
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

    if(!interaction.task_detail) return <></>
    const handleSubmit = async() =>{
        const data={
            'respondent': interaction.respondent,
            'task': interaction.task_detail.id,
            'interaction_date': interactionDate,
            'numeric_component': number || null,
            'subcategory_names': subcats
        }
        try{
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
                window.location.reload();
            }
            else{
                console.log(returnData);
            }
        }
        catch(err){
            console.error('Could not save changes to interaction: ', err)
        }
    }

    if(edit){
        return(
            <div className={styles.card}>
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
                </div>
            }
        </div>
    )
}


export default function Interactions({ id, tasks, onUpdate }){
    const [loading, setLoading] = useState(true);

    const {interactions, setInteractions} = useInteractions();

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
    if(loading) return <p>Loading...</p>
    return(
        <div>
                <AddInteractions id={id} tasks={tasks} interactions={interactions} onUpdate={onUpdate} onFinish={onFinish}/>
                <IndexViewWrapper onSearchChange={setSearch} onPageChange={setPage} entries={entries}>
                    <h4>Previous Interactions</h4>
                    {interactions.map((interaction) => (<InteractionCard interaction={interaction} />))}
                </IndexViewWrapper>
        </div>
    )
}