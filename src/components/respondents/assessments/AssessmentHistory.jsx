import { useState, useEffect } from "react";

import fetchWithAuth from '../../../../services/fetchWithAuth';
import { useAuth } from '../../../contexts/UserAuth'
import { useInteractions } from '../../../contexts/InteractionsContext';
import IndexViewWrapper from '../../reuseables/IndexView';
import ComponentLoading from '../../reuseables/loading/ComponentLoading';
import InteractionCard from './InteractionCard';
import errorStyles from '../../../styles/errors.module.css';

import styles from '../respondentDetail.module.css';

export default function AssessmentHistory({ respondent, meta }){
    /*
    Component that displays a list of interactions and view responses within that interaction.
    - respondent (object): the respondent these interactions relate to
    - meta (object): the respondent model information
    */

    const { interactions, setInteractions } = useInteractions();

    //page meta
    const [loading, setLoading] = useState(true);

    //index helpers
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);


    //fetch a paginated list of interactions
    const getInteractions = async() => {
        try {
            console.log('fetching interactions...');
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

    //all roles except clients can create interactions
    if(loading) return <ComponentLoading />
    return(
        <div>
                <div id={'previous-interactions'}>
                <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries}>
                    <h2>Previous Interactions</h2>
                    <p>
                        Here you can find a history of assessments this person has completed. Click on the 
                        card with the assessment you are interested in to view more information.
                    </p>
                    {interactions.length === 0 && <p>No interactions yet. Be the first to create one!</p>}
                    {interactions.length > 0 && interactions.map((interaction) => (<InteractionCard key={interaction.id} interaction={interaction} onDelete={getInteractions} onUpdate={getInteractions}/>))}
                </IndexViewWrapper>
                </div>
        </div>
    )
}