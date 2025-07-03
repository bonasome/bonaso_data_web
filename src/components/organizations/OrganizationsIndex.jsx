import React from 'react';
import styles from '../../styles/indexView.module.css'
import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth'
import OrganizationFilters from './OrganizationFilters';
import IndexViewWrapper from '../reuseables/IndexView';
import { useOrganizations } from '../../contexts/OrganizationsContext';
import { Link } from 'react-router-dom';
import ComponentLoading from '../reuseables/ComponentLoading';

function OrganizationCard({ org, callback = null }) {
    const [loading, setLoading] = useState(false);
    const { organizationDetails, setOrganizationDetails } = useOrganizations();
    const [active, setActive] = useState(null);
    const [expanded, setExpanded] = useState(false);

    const handleClick = async () => {
        const willExpand = !expanded;
        setExpanded(willExpand);

        if (!willExpand) return;

        const found =  organizationDetails.find(org => org.id === org.id);
        if (found) {
            setActive(found);
            return;
        }

        try {
            setLoading(true);
            const response = await fetchWithAuth(`/api/organizations/${org.id}/`);
            const data = await response.json();
            setOrganizationDetails(prev => [...prev, data]);
            setActive(data);
            setLoading(false);
        } 
        catch (err) {
            console.error('Failed to fetch organizatons: ', err);
            setLoading(false);
        }
    };

    if(loading) return <ComponentLoading />
    return (
        <div className={expanded ? styles.expandedCard : styles.card} onClick={handleClick}>
            <Link to={`/organizations/${org.id}`} style={{display:'flex', width:"fit-content"}}><h2>{org.name}</h2></Link>
            {callback && <button onClick={() => callback(org)}>Add to Project</button>}
            {expanded && active && (
                <>
                    {active && org?.parent_organization && <h4> Parent: {org.parent_organization.name}</h4>}
                    {active &&
                        <Link to={`/organizations/${org.id}`}> <button>View Details</button></Link>
                    }
                    {active &&
                        <Link to={`/organizations/${org.id}/edit`}> <button>Edit Details</button></Link>
                    }
                </>
            )}
        </div>
    );
}

export default function OrganizationsIndex( { callback=null, blacklist=[] }){
    const { user } = useAuth()
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const { organizations, setOrganizations } = useOrganizations();
    const [loading, setLoading] = useState(true);
    const [parentFilter, setParentFilter] = useState('');
    const [projectFilter, setProjectFilter] = useState('')

    useEffect(() => {
        const loadOrgs = async () => {
            try {
                const filterQuery = 
                    (parentFilter ? `&parent_organization=${parentFilter}` : '') +
                    (projectFilter ? `&project=${projectFilter}` : '');
                
                const url = `/api/organizations/?search=${search}&page=${page}` + filterQuery;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                if (page === 1) {
                    setOrganizations(data.results);
                } 
                else {
                    setOrganizations((prev) => [...prev, ...data.results]);
                }
                setLoading(false);
            } 
            catch (err) {
                console.error('Failed to fetch projects: ', err)
                setLoading(false)
            }
        };
        loadOrgs();
    }, [page, search, parentFilter, projectFilter]);

    const setFilters = (filters) => {
        setParentFilter(filters.parent_organization);
        setProjectFilter(filters.project)
    }
    const visibleOrgs = organizations?.filter(org => !blacklist.includes(org.id)) || [];
    if(loading) return <ComponentLoading />
    return(
        <div className={styles.index}>
            <h1>{user.role == 'admin' ? 'All Organizations' : 'My Organizations'}</h1> 
            <IndexViewWrapper onSearchChange={setSearch} onPageChange={setPage} entries={entries} filter={<OrganizationFilters organizations={organizations} onFilterChange={(inputs) => {setFilters(inputs); setPage(1);}}/>}>
                {['meofficer', 'manager', 'admin'].includes(user.role) && 
                <Link to='/organizations/new'><button>Add an Organiation</button></Link>}
                {visibleOrgs?.length == 0 ? 
                    <p>No organizations match your criteria.</p> :
                    visibleOrgs.map(org => (
                    <OrganizationCard key={org.id} org={org} callback={callback ? callback : null}/>
                    ))
                }
            </IndexViewWrapper>
        </div>
    )
}