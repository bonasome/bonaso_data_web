import { useState, useEffect } from "react";

import fetchWithAuth from '../../../../services/fetchWithAuth';
import { useAuth } from '../../../contexts/UserAuth'
import { useInteractions } from '../../../contexts/InteractionsContext';
import IndexViewWrapper from '../../reuseables/IndexView';
import AddInteractions from './AddInteractions';
import ComponentLoading from '../../reuseables/loading/ComponentLoading';
import InteractionCard from './InteractionCard';
import errorStyles from '../../../styles/errors.module.css';

import styles from '../respondentDetail.module.css';

export default function Interactions({ respondent, meta, onUpdate, setAddingTask, onAdd }){
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    const { interactions, setInteractions } = useInteractions();
    const[success, setSuccess] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const [interactionRefresh, setInteractionRefresh] = useState(0);

    //load interactions, also refresh the call on edits/creation of new interactions (avoid stale states)
    useEffect(() => {
        const getInteractions = async() => {
            try {
                console.log('fetching respondent details...');
                const response = await fetchWithAuth(`/api/record/interactions/?respondent=${respondent.id}&search=${search}&page=${page}`);
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
    }, [respondent, search, page, interactionRefresh])


    //refresh the api on edits to get the latest information (prevent stale states, since this is important info)
    const onFinish = () => {
        setInteractionRefresh(prev => prev + 1)
        onAdd()
    }

    const onEdit = () => {
        setInteractionRefresh(prev => prev +1)
    }
    
    //remove an interaction on delete
    const onDelete = (id) => {
        const updated = interactions.filter(inter => inter.id != id)
        setInteractions(updated);
        setSuccess('Interaction Deleted.')
    }

    //all roles except clients can create interactions
    if(loading) return <ComponentLoading />
    return(
        <div>
                {success && <div className={errorStyles.success}>{success}</div>}
                {!['client'].includes(user.role) && <AddInteractions meta={meta} respondent={respondent} interactions={interactions} onUpdate={onUpdate} onFinish={onFinish} setAddingTask={setAddingTask}/>}
                <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries}>
                    <h2>Previous Interactions</h2>
                    {interactions.length === 0 && <p>No interactions yet. Be the first to create one!</p>}
                    {interactions.length > 0 && interactions.map((interaction) => (<InteractionCard key={interaction.id} interaction={interaction} onUpdate={onEdit} onDelete={onDelete}/>))}
                </IndexViewWrapper>
        </div>
    )
}