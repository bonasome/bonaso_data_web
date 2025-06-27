import React from 'react';
import styles from '../../styles/indexView.module.css'
import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth'
import UserFilters from './UserFilters';
import IndexViewWrapper from '../reuseables/IndexView';
import Loading from '../reuseables/Loading';
import { Link } from 'react-router-dom';

function ProfileCard({ profile }) {
    const [expanded, setExpanded] = useState(false);
    const map = {
        'admin': 'Site Administrator',
        'meofficer': 'M&E Officer',
        'manager': 'Manager',
        'data_collector': 'Data Collector',
        'view_only': 'Uninitiated',
    }
    return (
        <div className={expanded ? styles.expandedCard : styles.card} onClick={()=>setExpanded(!expanded)}>
            <Link to={`/profiles/${profile.id}`} style={{display:'flex', width:"fit-content"}}><h2>{profile.first_name} {profile.last_name}</h2></Link>
            {expanded && (
                <>
                    <p>Organization: {profile?.organization?.name}</p>
                    <p>Role: {map[profile?.role]}</p>
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
    const [profiles, setProfiles] = useState(null);
    const [loading, setLoading] = useState(true);
    const [orgFilter, setOrgFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const[inactiveFilter, setInactiveFilter] = useState(false)
    useEffect(() => {
        const loadProfiles = async () => {
            try {
                const filterQuery = 
                    (orgFilter ? `&organization=${orgFilter}` : '') +
                    (roleFilter ? `&role=${roleFilter}` : '') + 
                    (inactiveFilter ? `&is_active=${!inactiveFilter}` : '')
                
                const url = `/api/profiles/users/?search=${search}&page=${page}` + filterQuery;
                console.log(url)
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                if (page === 1) {
                    console.log(data.results)
                    setProfiles(data.results);
                } 
                else {
                    setProfiles((prev) => [...prev, ...data.results]);
                }
                setLoading(false);
            } 
            catch (err) {
                console.error('Failed to fetch projects: ', err)
                setLoading(false)
            }
        };
        loadProfiles();

    }, [page, search, orgFilter, roleFilter, inactiveFilter]);

    const setFilters = (filters) => {
        console.log(filters)
        setOrgFilter(filters.organization);
        setRoleFilter(filters.role)
        setInactiveFilter(filters.inactive)
    }

    if(loading) return <Loading />
    return(
        <div className={styles.index}>
            <h1>{user.role == 'admin' ? 'All Users' : 'My Team'}</h1> 
            <IndexViewWrapper onSearchChange={setSearch} onPageChange={setPage} entries={entries}>
                <Link to='/profiles/new'><button>{user.role === 'admin' ? 'Create New User' : 'Apply For a New User'}</button></Link>
                <UserFilters onFilterChange={(inputs) => {setFilters(inputs); setPage(1);}}/>
                {profiles && profiles.map((profile) => (<ProfileCard key={profile.id} profile={profile}/>))}
            </IndexViewWrapper>
        </div>
    )
}