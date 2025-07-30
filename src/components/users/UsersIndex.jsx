import React from 'react';
import styles from '../../styles/indexView.module.css'
import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth'
import Filter from '../reuseables/Filter';
import IndexViewWrapper from '../reuseables/IndexView';
import Loading from '../reuseables/loading/Loading';
import { Link } from 'react-router-dom';
import { useProfiles } from "../../contexts/ProfilesContext";
import { initial, filterConfig } from './filterConfig';

function ProfileCard({ profile }) {
    const [expanded, setExpanded] = useState(false);
    const { profilesMeta, setProfilesMeta } = useProfiles();
    const [labels, setLabels] = useState({});
    useEffect(() => {
        const getMeta = async() => {
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
                    console.error('Failed to fetch profiles meta: ', err)
                }
            }
        }
        getMeta()
    }, [])

    useEffect(() => {
        if (!profilesMeta?.roles) return;
        const roleIndex = profilesMeta.roles.indexOf(profile.role);
        setLabels({
            role: profilesMeta.role_labels[roleIndex],
        })
    }, [profilesMeta, profile])
        
    return (
        <div className={expanded ? styles.expandedCard : styles.card} onClick={()=>setExpanded(!expanded)}>
            <Link to={`/profiles/${profile.id}`} style={{display:'flex', width:"fit-content"}}><h2>{profile.first_name} {profile.last_name}</h2></Link>
            {expanded && (
                <>
                    <p>Organization: {profile?.organization_detail?.name}</p>
                    <p>Role: {labels.role}</p>
                    <Link to={`/profiles/${profile.id}`}><button>View Details</button></Link>
                    <Link to={`/profiles/${profile.id}/edit`}><button>Edit Details</button></Link>
                </>
            )}
        </div>
    );
}

export default function ProfilesIndex(){
    const { user } = useAuth()
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const { profiles, setProfiles, profilesMeta, setProfilesMeta } = useProfiles();
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState(initial);
    const [errors, setErrors] = useState([]);

    //filter helpers
    const [orgs, setOrgs] = useState([]);
    const [clients, setClients] = useState([]);
    const [orgSearch, setOrgSearch] = useState('');
    const [clientSearch, setClientSearch] = useState('');

    useEffect(() => {
        const loadProfiles = async () => {
            try {
                const filterQuery = 
                    (orgFilter ? `&organization=${orgFilter}` : '') +
                    (roleFilter ? `&role=${roleFilter}` : '') + 
                    (clientFilter ? `&client_organization=${clientFilter}` : '') + 
                    (inactiveFilter ? `&is_active=${!inactiveFilter}` : '')
                
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

    useEffect(() => {
        const getOrganizations = async () => {
            try{
                console.log('fetching organizations...')
                const response = await fetchWithAuth(`/api/organizations/?${orgSearch}`);
                const data = await response.json();
                setOrgs(data.results);
            }
            catch(err){
                console.error('Failed to fetch projects: ', err);
                setErrors(['Something went wrong. Please try again later.']);
            }
        }
        getOrganizations();
    }, [orgSearch]);

    useEffect(() => {
        const getClients = async () => {
            try{
                console.log('fetching clients...')
                const response = await fetchWithAuth(`/api/manage/clients/?${clientSearch}`);
                const data = await response.json();
                setClients(data.results);
            }
            catch(err){
                console.error('Failed to fetch projects: ', err);
                setErrors(['Something went wrong. Please try again later.']);
            }
        }
        getClients();
    }, [clientSearch]);

    if(loading) return <Loading />
    return(
        <div className={styles.index}>
            <h1>{user.role == 'admin' ? 'All Users' : 'My Team'}</h1> 
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} 
                filter={<Filter onFilterChange={(inputs) => {setFilters(inputs); setPage(1);}}
                    schema={filterConfig(profilesMeta, orgs, clients, (s) => setOrgSearch(s), (s)=>setClientSearch(s))}
                />}>
                <Link to='/profiles/new'><button>{user.role === 'admin' ? 'Create New User' : 'Apply For a New User'}</button></Link>
                {profiles && profiles.map((profile) => (<ProfileCard key={profile.id} profile={profile}/>))}
            </IndexViewWrapper>
        </div>
    )
}