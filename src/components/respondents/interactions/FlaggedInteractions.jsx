import React from 'react';
import styles from '../../../styles/indexView.module.css'
import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import { useAuth } from '../../../contexts/UserAuth'
import FlaggedInteractionsFilters from './FlaggedInteractionsFilters';
import IndexViewWrapper from '../reuseables/IndexView';
import Loading from '../reuseables/Loading';
import { Link } from 'react-router-dom';
import { useInteractions } from '../../../contexts/InteractionsContext';

function InteractionCard({ interaction }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={styles.card}>
            <Link to={`/respondents/${interaction.respondent}`} style={{display:'flex', width:"fit-content"}}><h2>{interaction.date}</h2></Link>
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
        const loadOrgs = async () => {
            try {
                const filterQuery = 
                    (startFilter ? `&project=${startFilter}` : '') + 
                    (endFilter ? `&project=${endFilter}` : '') + 
                    (prereqFilter ? `&organization=${orgFilter}` : '') +
                    (projectFilter ? `&project=${projectFilter}` : '') + 
                    (indicatorFilter ? `&status=${indicatorFilter}` : '');
                
                const url = `/api/record/interactions/?search=${search}&page=${page}` + filterQuery;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                if (page === 1) {
                    setInterctions(data.results);
                } 
                else {
                    setInteractions((prev) => [...prev, ...data.results]);
                }
                setLoading(false);
            } 
            catch (err) {
                console.error('Failed to fetch projects: ', err)
                setLoading(false)
            }
        };
        loadOrgs();
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
            <IndexViewWrapper onSearchChange={setSearch} onPageChange={setPage} entries={entries} filter={<FlaggedInteractionsFilters onFilterChange={(inputs) => {setFilters(inputs); setPage(1);}}/>}>
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