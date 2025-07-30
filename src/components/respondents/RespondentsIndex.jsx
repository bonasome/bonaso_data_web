import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

import { useRespondents } from '../../contexts/RespondentsContext';

import fetchWithAuth from '../../../services/fetchWithAuth';
import { initial, filterConfig } from './filterConfig';


import IndexViewWrapper from '../reuseables/IndexView';
import Loading from '../reuseables/loading/Loading';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import Filter from '../reuseables/Filter';

import styles from '../../styles/indexView.module.css';
import errorStyles from '../../styles/errors.module.css';

import { ImPencil } from 'react-icons/im';
import { IoPersonAddSharp } from "react-icons/io5";
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
    //context
    const { respondents, setRespondents, setRespondentsMeta, respondentsMeta } = useRespondents();

    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);

    //index view management
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const [filters, setFilters] = useState(initial);

    //ref to scroll to errors automatically
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    //load list of respondents. pagination is set to 25 by default, refresh on search/filter
    useEffect(() => {
        const loadRespondents = async () => {
            try {
                const filterQuery = 
                    (filters.sex ? `&sex=${filters.sex}` : '') + 
                    (filters.age_range ? `&age_range=${filters.age_range}` : '');
                
                const url = `/api/record/respondents/?search=${search}&page=${page}` + filterQuery;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                setRespondents(data.results);
            } 
            catch (err) {
                console.error('Failed to fetch respondents: ', err);
                setErrors(['Something went wrong. Please try again later.'])
            }
        };

        loadRespondents();
    }, [page, search, filters]);

    //get the meta
    useEffect(() => {
        const loadMeta = async () => {
            if(Object.keys(respondentsMeta).length > 0){
                setLoading(false);
                return;
            }
            try {
                const url = '/api/record/respondents/meta/';
                const response = await fetchWithAuth(url);
                const data = await response.json();
                console.log(data)
                setRespondentsMeta(data);
            } 
            catch (err) {
                console.error('Failed to fetch respondents: ', err);
                setErrors(['Something went wrong. Please try again later.'])
            }
            finally{
                setLoading(false);
            }
        };

        loadMeta();
    }, []);

    if(loading || !respondentsMeta) return <Loading />
    return(
        <div className={styles.index}>
            <h1>Respondents</h1> 
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} 
                filter={<Filter onFilterChange={(inputs) => {setFilters(inputs); setPage(1);}} 
                initial={initial} schema={filterConfig(respondentsMeta)} 
            />}>
                {errors.length != 0 && <div ref={alertRef} className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                <Link to='/respondents/new'><button> <IoPersonAddSharp style={{marginRight: '1vh'}}/> Create New Respondent</button></Link>
                {respondents.length === 0 ? <p>No respondents match your criteria.</p> : (
                    respondents.map(p => (
                        <RespondentCard key={p.id} respondent={p} meta={respondentsMeta} />
                    ))
                )}
            </IndexViewWrapper>
        </div>
    )
}