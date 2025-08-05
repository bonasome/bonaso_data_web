import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth'
import { useProfiles } from "../../contexts/ProfilesContext";

import fetchWithAuth from '../../../services/fetchWithAuth';
import { initial, filterConfig } from './filterConfig';

import Filter from '../reuseables/Filter';
import IndexViewWrapper from '../reuseables/IndexView';
import Loading from '../reuseables/loading/Loading';
import ButtonHover from '../reuseables/inputs/ButtonHover';

import styles from '../../styles/indexView.module.css';
import errorStyles from '../../styles/errors.module.css';

import { ImPencil } from 'react-icons/im';
import { IoPersonAddSharp } from "react-icons/io5";
import { GiJumpAcross } from "react-icons/gi";

function ProfileCard({ profile, meta }) {
    //contorl expansion
    const [expanded, setExpanded] = useState(false);
    
    //convert db values to the corresponding label
    const getLabelFromValue = (field, value) => {
        if(!meta) return null
        const match = meta[field]?.find(range => range.value === value);
        return match ? match.label : null;
    };
        
    return (
        <div className={expanded ? styles.expandedCard : styles.card} onClick={()=>setExpanded(!expanded)}>
            <Link to={`/profiles/${profile.id}`} style={{display:'flex', width:"fit-content"}}><h2>{profile.display_name}</h2></Link>
            {expanded && (
                <>
                    <p>Organization: {profile?.organization_detail?.name}</p>
                    <p>Role: {getLabelFromValue('roles', profile.role)}</p>
                    <div style={{ display: 'flex', flexDirection: 'row'}}>
                        <Link to={`/profiles/${profile.id}`}><ButtonHover noHover={<GiJumpAcross />} hover={'Go to Page'} /></Link>
                        <Link to={`/profiles/${profile.id}/edit`}><ButtonHover noHover={<ImPencil />} hover={'Edit Details'} /></Link>
                    </div>
                </>
            )}
        </div>
    );
}

export default function ProfilesIndex(){
    //context
    const { profiles, setProfiles, profilesMeta, setProfilesMeta } = useProfiles();
    const { user } = useAuth();

    //index helpers
    const [filters, setFilters] = useState(initial);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);

    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);

    //filter helpers
    const [orgs, setOrgs] = useState([]);
    const [clients, setClients] = useState([]);
    const [orgSearch, setOrgSearch] = useState('');
    const [clientSearch, setClientSearch] = useState('');

    //ref to scroll to errors automatically
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    //load the user profiles
    useEffect(() => {
        const loadProfiles = async () => {
            try {
                const filterQuery = 
                    (filters.organization ? `&organization=${filters.organization}` : '') +
                    (filters.role ? `&role=${filters.role}` : '') + 
                    (filters.client ? `&client_organization=${filters.client}` : '') + 
                    (filters.active ? `&is_active=${filters.active}` : '');
                
                const url = `/api/profiles/users/?search=${search}&page=${page}` + filterQuery;
                console.log(url)
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                setProfiles(data.results);
            } 
            catch (err) {
                setErrors(['Something went wrong. Please try again later.']);
                console.error('Failed to fetch projects: ', err)
            }
            finally{
                setLoading(false);
            }
        };
        loadProfiles();
    }, [page, search, filters]);

    //load the meta
    useEffect(() => {
        const getProfilesMeta = async() => {
            if(Object.keys(profilesMeta).length != 0){
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/profiles/users/meta/`);
                    const data = await response.json();
                    setProfilesMeta(data);
                }
                catch(err){
                    setErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch profiles meta: ', err);
                }
            }
        }
        getProfilesMeta();
    }, []);

    //load orgs (for filters)
    useEffect(() => {
        const getOrganizations = async () => {
            try{
                console.log('fetching organizations...')
                const response = await fetchWithAuth(`/api/organizations/?${orgSearch}`);
                const data = await response.json();
                setOrgs(data.results);
            }
            catch(err){
                console.error('Failed to fetch organizations: ', err);
                setErrors(['Something went wrong. Please try again later.']);
            }
        }
        getOrganizations();
    }, [orgSearch]);

    //load clients (for filters)
    useEffect(() => {
        const getClients = async () => {
            try{
                console.log('fetching clients...')
                const response = await fetchWithAuth(`/api/manage/clients/?${clientSearch}`);
                const data = await response.json();
                setClients(data.results);
            }
            catch(err){
                console.error('Failed to fetch clients: ', err);
                setErrors(['Something went wrong. Please try again later.']);
            }
        }
        getClients();
    }, [clientSearch]);

    if(loading) return <Loading />
    return(
        <div className={styles.index}>
            <h1>{user.role == 'admin' ? 'All Users' : 'My Team'}</h1> 
            {errors.length != 0 && <div ref={alertRef} className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} 
                filter={<Filter onFilterChange={(inputs) => {setFilters(inputs); setPage(1);}}
                    config={filterConfig(profilesMeta, orgs, clients, (s) => setOrgSearch(s), (s)=>setClientSearch(s))}
                    initial={initial}
                />}>
                <Link to='/profiles/new'><button><IoPersonAddSharp /> Add New Team Member</button></Link>

                {profiles && profiles.map((profile) => (<ProfileCard key={profile.id} profile={profile} meta={profilesMeta}/>))}
            </IndexViewWrapper>
        </div>
    )
}