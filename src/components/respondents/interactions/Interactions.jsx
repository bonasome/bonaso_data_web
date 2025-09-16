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

export default function Interactions({ respondent, meta, onUpdate, buttonAdd, onAdd }){
    /*
    Component that displays a list of interactions and gives the user the ability to create new interactions
    via the AddInteraction component.
    - respondent (object): the respondent these interactions relate to
    - meta (object): the respondent model information
    - onUpdate (object): what to do when a new task is added in the AddInteraction component
    - setAddingTask (function): helper function to pass a task from respondents to AddInteraction
    - onAdd (function): what to do when a user submits a new batch of interactions from AddInteraction
    */
    const { user } = useAuth();
    const { interactions, setInteractions } = useInteractions();

    //page meta
    const [loading, setLoading] = useState(true);
    const[success, setSuccess] = useState('');

    //index helpers
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);


    //fetch a paginated list of interactions
    const getInteractions = async() => {
        try {
            console.log('fetching interactionss...');
            const response = await fetchWithAuth(`/api/record/interactions/?respondent=${respondent.id}&search=${search}&page=${page}`);
            const data = await response.json();
            setEntries(data.count); 
            setInteractions(data.results);
            setLoading(false)
        } 
        catch (err) {
            console.error('Failed to fetch respondent: ', err);
            setLoading(false)
        }
    }

    //load interactions on init/search or page change
    useEffect(() => {
        const initialLoad = async() => {
            await getInteractions();
        }
        initialLoad();
    }, [respondent, search, page])


    //refresh the api on creation of new indicators (get from server since flags may have been created/resolved)
    const onFinish = () => {
        getInteractions(); //refresh the api when new interactions are added
        onAdd(); //my parents should know about this (RespondentDetail)
    }
    
    //remove an interaction on delete (filtering works here)
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
                {!['client'].includes(user.role) && <AddInteractions meta={meta} respondent={respondent} interactions={interactions} onUpdate={onUpdate} onFinish={onFinish} buttonAdd={buttonAdd}/>}
                <div id={'previous-interactions'}>
                <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries}>
                    <h2>Previous Interactions</h2>
                    {interactions.length === 0 && <p>No interactions yet. Be the first to create one!</p>}
                    {interactions.length > 0 && interactions.map((interaction) => (<InteractionCard key={interaction.id} interaction={interaction} onUpdate={getInteractions} onDelete={onDelete}/>))}
                </IndexViewWrapper>
                </div>
        </div>
    )
}