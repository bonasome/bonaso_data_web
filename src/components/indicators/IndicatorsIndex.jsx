import React from 'react';
import styles from '../../styles/indexView.module.css'
import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth'
import IndicatorFilters from './IndicatorFilters';
import IndexViewWrapper from '../reuseables/IndexView';
import Loading from '../reuseables/Loading';
import ComponentLoading from '../reuseables/ComponentLoading';
import { useIndicators } from '../../contexts/IndicatorsContext';
import { Link } from 'react-router-dom';

function IndicatorCard({ indicator, callback = null }) {
    const [loading, setLoading] = useState(false);
    const { indicatorDetails, setIndicatorDetails } = useIndicators();
    const [active, setActive] = useState(null);
    const [expanded, setExpanded] = useState(false);
    
    const handleClick = async () => {
        const willExpand = !expanded;
        setExpanded(willExpand);

        if (!willExpand) return;

        const found = indicatorDetails.find(ind => ind.id === indicator.id);
        if (found) {
            setActive(found);
            return;
        }

        try {
            setLoading(true);
            const response = await fetchWithAuth(`/api/indicators/${indicator.id}/`);
            const data = await response.json();
            setIndicatorDetails(prev => [...prev, data]);
            setActive(data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch indicators: ', err);
            setLoading(false);
        }
    };

    return (
        <div
            className={expanded ? styles.expandedCard : styles.card}
            onClick={handleClick}
        >
            <Link to={`/indicators/${indicator.id}`} style={{display:'flex', width:"fit-content"}}><h2>{indicator.code}: {indicator.name}</h2></Link>
            {callback && (
                <button onClick={(e) => { e.stopPropagation(); callback(indicator); }}>
                    Add to Project
                </button>
            )}
            {expanded && loading && <ComponentLoading />}
            {expanded && active && (
                <>
                    <p>{active.description}</p>
                    {active.prerequisite && (
                        <p>Prerequisite: {active.prerequisite.code}: {active.prerequisite.name}</p>
                    )}
                    <Link to={`/indicators/${indicator.id}`}>
                        <button onClick={(e) => e.stopPropagation()}>View Details</button>
                    </Link>
                    <Link to={`/indicators/${indicator.id}/edit`}>
                        <button onClick={(e) => e.stopPropagation()}>Edit Details</button>
                    </Link>
                </>
            )}
        </div>
    );
}

export default function IndicatorsIndex({ callback=null, blacklist=[] }){
    const { user } = useAuth()
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const { indicators, setIndicators } = useIndicators();
    const [loading, setLoading] = useState(true);
    const [orgFilter, setOrgFilter] = useState('');
    const [projectFilter, setProjectFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        const loadOrgs = async () => {
            try {
                const filterQuery = 
                    (orgFilter ? `&organization=${orgFilter}` : '') +
                    (projectFilter ? `&project=${projectFilter}` : '') + 
                    (statusFilter ? `&status=${statusFilter}` : '');
                
                const url = `/api/indicators/?search=${search}&page=${page}` + filterQuery;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                if (page === 1) {
                    setIndicators(data.results);
                } 
                else {
                    setIndicators((prev) => [...prev, ...data.results]);
                }
                setLoading(false);
            } 
            catch (err) {
                console.error('Failed to fetch projects: ', err)
                setLoading(false)
            }
        };
        loadOrgs();
    }, [page, search, orgFilter, projectFilter, statusFilter]);

    const setFilters = (filters) => {
        setOrgFilter(filters.organization);
        setProjectFilter(filters.project);
        setStatusFilter(filters.status);
    }
    const visibleIndicators = indicators?.filter(ind => !blacklist.includes(ind.id)) || [];
    if(loading) return <Loading />
    return(
        <div className={styles.index}>
            <h1>{user.role == 'admin' ? 'All Indicators' : 'My Indicators'}</h1> 
            <IndexViewWrapper onSearchChange={setSearch} onPageChange={setPage} entries={entries} filter={<IndicatorFilters indicators={indicators} onFilterChange={(inputs) => {setFilters(inputs); setPage(1);}}/>}>
                {['meofficer', 'manager', 'admin'].includes(user.role) && 
                <Link to='/indicators/new'><button>Create a New Indicator</button></Link>} 
                {visibleIndicators?.length === 0 ? 
                    <p>No indicators match your criteria.</p> :
                    visibleIndicators.map(ind => (
                        <IndicatorCard key={ind.id} indicator={ind} callback={callback ? (indicator)=> callback(indicator) : null}/>)
                    )
                }
            </IndexViewWrapper>
        </div>
    )
}