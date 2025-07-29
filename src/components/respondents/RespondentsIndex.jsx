import React from 'react';
import styles from '../../styles/indexView.module.css'
import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import IndexViewWrapper from '../reuseables/IndexView';
import { useRespondents } from '../../contexts/RespondentsContext';
import { Link } from 'react-router-dom';
import Loading from '../reuseables/loading/Loading';
import { IoPersonAddSharp } from "react-icons/io5";
import ButtonHover from '../reuseables/inputs/ButtonHover';
import { ImPencil } from 'react-icons/im';
import Filter from '../reuseables/Filter';
import { initial, filterConfig } from './filterConfig';
import { GiJumpAcross } from "react-icons/gi";

function RespondentCard({ respondent, meta }) {
    //simple card to compartmentalize respondent information
    const [expanded, setExpanded] = useState(false);

    //convert db values to the corresponding label
    const getLabelFromValue = (field, value) => {
        if(!meta) return null
        const match = meta[field]?.find(range => range.value === value);
        return match ? match.label : null;
    };

    return (
        <div className={expanded ? styles.expandedCard : styles.card} onClick={() => setExpanded(!expanded)}>
            <Link to={`/respondents/${respondent.id}`} style={{display:'flex', width:"fit-content"}}><h2>{respondent.display_name}</h2></Link>
            {expanded && <div>
                    <h4>{respondent.village}, {getLabelFromValue('districts', respondent.district)}</h4>
                    <p>{getLabelFromValue('age_ranges', respondent?.current_age_range)}, {getLabelFromValue('sexs', respondent.sex)}</p>
                    <p>{respondent.citizenship}</p>
                    <p>{respondent.comments ? respondent.comments : 'No Comments'}</p>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <Link to={`/respondents/${respondent.id}`}> <ButtonHover noHover={<GiJumpAcross />} hover={'Go to Page'} /></Link>
                    <Link to={`/respondents/${respondent.id}/edit`}> <ButtonHover noHover={<ImPencil />} hover={'Edit Details'} /></Link>
                    </div>
            </div>}
        </div>
    );
}

export default function RespondentsIndex(){
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const { respondents, setRespondents, setRespondentsMeta, respondentsMeta } = useRespondents();
    const [loading, setLoading] = useState(true);
    const [sexFilter, setSexFilter] = useState('');
    const [districtFilter, setDistrictFilter] = useState('')
    const [ageRangeFilter, setAgeRangeFilter] = useState('')

    //load list of respondents. pagination is set to 25 by default, refresh on search/filter
    useEffect(() => {
        const loadRespondents = async () => {
            try {
                const filterQuery = 
                    (sexFilter? `&sex=${sexFilter}` : '') + 
                    (ageRangeFilter ? `&age_range=${ageRangeFilter}` : '');
                
                const url = `/api/record/respondents/?search=${search}&page=${page}` + filterQuery;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                setRespondents(data.results);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch respondents: ', err);
                setLoading(false);
            }
        };

        loadRespondents();
    }, [page, search, setRespondents, ageRangeFilter, sexFilter, districtFilter]);

    //get the meta
    useEffect(() => {
        const loadMeta = async () => {
            if(Object.keys(respondentsMeta).length > 0){
                return;
            }
            try {
                const url = '/api/record/respondents/meta/';
                const response = await fetchWithAuth(url);
                const data = await response.json();
                console.log(data)
                setRespondentsMeta(data);
                setLoading(false);
            } 
            catch (err) {
                console.error('Failed to fetch respondents: ', err);
            }
        };

        loadMeta();
    }, []);

    //update filters??
    const setFilters = (filters) => {
        setSexFilter(filters.sex);
        setAgeRangeFilter(filters.age_range)
    }

    if(loading || !respondentsMeta) return <Loading />
    return(
        <div className={styles.index}>
            <h1>Respondents</h1> 
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} filter={<Filter onFilterChange={(inputs) => {setFilters(inputs); setPage(1);}} initial={initial} schema={filterConfig(respondentsMeta)} />}>
                <Link to='/respondents/new'><button> <IoPersonAddSharp style={{marginRight: '1vh'}}/> Create New Respondent</button></Link>
                {Array.isArray(respondents) && respondents.length === 0 ? (
                        <p>No respondents match your criteria.</p>
                    ) : (
                        Array.isArray(respondents) ? respondents.map(p => (
                            <RespondentCard key={p.id} respondent={p} meta={respondentsMeta} />
                        )) : null
                )}
            </IndexViewWrapper>
        </div>
    )
}