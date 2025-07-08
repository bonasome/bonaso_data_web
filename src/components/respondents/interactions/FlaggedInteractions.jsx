import React from 'react';
import styles from '../../../styles/indexView.module.css'
import { useEffect, useState, useMemo } from 'react';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import { useAuth } from '../../../contexts/UserAuth'
import FlaggedInteractionsFilters from './FlaggedInteractionsFilters';
import IndexViewWrapper from '../../reuseables/IndexView';
import Loading from '../../reuseables/Loading';
import { Link } from 'react-router-dom';
import { useInteractions } from '../../../contexts/InteractionsContext';
import { useRespondents } from '../../../contexts/RespondentsContext';
import ComponentLoading from '../../reuseables/ComponentLoading';
import prettyDates from '../../../../services/prettyDates';

function InteractionCard({ interaction }) {
    const [expanded, setExpanded] = useState(false);
    const { respondentDetails, setRespondentDetails } = useRespondents();
    const [activeRespondent, setActiveRespondent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getRespondentDetails = async () => {
            const found = respondentDetails.find(r => r?.id.toString() === interaction.respondent.toString());
                if (found) {
                    setActiveRespondent(found);
                    setLoading(false);
                    return;
                }
                try {
                    console.log('fetching respondent details...');
                    const response = await fetchWithAuth(`/api/record/respondents/${interaction.respondent}/`);
                    const data = await response.json();
                    if(response.ok){
                        setRespondentDetails(prev => [...prev, data]);
                        setActiveRespondent(data);
                    }
                    else{
                        navigate(`/not-found`);
                    }
                    
                } catch (err) {
                    console.error('Failed to fetch respondent: ', err);
                } finally {
                    setLoading(false);
                }
            };
            getRespondentDetails();
    }, []);

    const respondentLine = useMemo(() => {if(activeRespondent) return activeRespondent?.is_anonymous ? `Anonymous Respondent ${activeRespondent?.uuid}` : `${activeRespondent?.first_name} ${activeRespondent?.last_name}`},
    [activeRespondent]);
    if(loading) return <ComponentLoading />

    return (
        <div className={styles.card}>
            <Link to={`/respondents/${interaction.respondent}`} style={{display:'flex', width:"fit-content"}}><h2>{interaction.task_detail.indicator.name} with {respondentLine} on {prettyDates(interaction.interaction_date)}</h2></Link>
        </div>
    );
}

export default function FlaggedInteractions({ callback=null, blacklist=[] }){
    const { user } = useAuth()
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const { interactions, setInteractions } = useInteractions();
    const [loading, setLoading] = useState(true);
    const [orgFilter, setOrgFilter] = useState('');
    const [projectFilter, setProjectFilter] = useState('');
    const [indicatorFilter, setIndicatorFilter] = useState('');
    const [startFilter, setStartFilter] = useState('');
    const [endFilter, setEndFilter] = useState('');

    useEffect(() => {
        const loadFlagged = async () => {
            try {
                const filterQuery = 
                    (startFilter ? `&project=${startFilter}` : '') + 
                    (endFilter ? `&project=${endFilter}` : '') + 
                    (orgFilter ? `&organization=${orgFilter}` : '') +
                    (projectFilter ? `&project=${projectFilter}` : '') + 
                    (indicatorFilter ? `&status=${indicatorFilter}` : '');
                
                const url = `/api/record/interactions/flagged/?search=${search}&page=${page}` + filterQuery;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                setInteractions(data.results);
                setLoading(false);
            } 
            catch (err) {
                console.error('Failed to fetch projects: ', err)
                setLoading(false)
            }
        };
        loadFlagged();
    }, [page, search, indicatorFilter, projectFilter, orgFilter, startFilter, endFilter]);

    const setFilters = (filters) => {
        setIndicatorFilter(filters.prereq);
        setProjectFilter(filters.project);
        setOrgFilter(filters.organization);
        setStartFilter(filters.start);
        setEndFilter(filters.end);
    }

    if(loading) return <Loading />
    return(
        <div className={styles.index}>
            <h1>Flagged Interactions</h1> 
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} filter={<FlaggedInteractionsFilters onFilterChange={(inputs) => {setFilters(inputs); setPage(1);}}/>}>
                {interactions?.length === 0 ? 
                    <p>No flagged interactions. Great work!</p> :
                    interactions.map(ir => (
                        <InteractionCard key={ir.id} interaction={ir} />)
                    )
                }
            </IndexViewWrapper>
        </div>
    )
}