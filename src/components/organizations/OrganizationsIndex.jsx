import React from 'react';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth'
import { useOrganizations } from '../../contexts/OrganizationsContext';
import { useProjects } from '../../contexts/ProjectsContext';

import fetchWithAuth from '../../../services/fetchWithAuth';
import { initial, filterConfig } from './filterConfig';

import IndexViewWrapper from '../reuseables/IndexView';
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import Loading from '../reuseables/loading/Loading';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import Filter from '../reuseables/Filter';

import styles from '../../styles/indexView.module.css'
import errorStyles from '../../styles/errors.module.css';
import { ImPencil } from 'react-icons/im';
import { GiJumpAcross } from 'react-icons/gi';
import { BsBuildingFillAdd } from "react-icons/bs";

function OrganizationCard({ org, callback }) {
    //context
    const { organizationDetails, setOrganizationDetails } = useOrganizations();

    //store organization details
    const [active, setActive] = useState(null);

    //page meta
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [errors, setErrors] = useState([]);

    //expand and load all content on load
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
        } 
        catch (err) {
            console.error('Failed to fetch organizatons: ', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setLoading(false);
        }
    };

    return (
        <div className={expanded ? styles.expandedCard : styles.card} onClick={handleClick}>
            {callback ? <h2>{org.name}</h2> : <Link to={`/organizations/${org.id}`} style={{display:'flex', width:"fit-content"}}><h2>{org.name}</h2></Link>}
            {callback && <button type="button" onClick={() => callback(org)}>Select {org.name}</button>}
            {expanded && loading && <ComponentLoading />}
            {expanded && active && 
                <div>
                    {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                    {active.full_name && <h3>{active.full_name}</h3>}
                    {active.description ? <p><i>{active.description}</i></p> :
                        <p><i>No Description</i></p>}
                    {active.executive_director && <p>Executive Director: {active.executive_director}</p>}
                    {!callback && <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <Link to={`/organizations/${org.id}`}><ButtonHover noHover={<GiJumpAcross />} hover={'Go to page'} /></Link>
                        <Link to={`/organizations/${org.id}/edit`}><ButtonHover noHover={<ImPencil />} hover={'Edit Details'} /></Link>
                    </div>}
                </div>
            }
        </div>
    );
}

export default function OrganizationsIndex( { callback=null, includeParams=[], excludeParams=[], updateTrigger=null,  blacklist=[], projAdd=null, addRedirect=null, }){
    /*
    Component that displays a paginated list of organizations.
    - callback (function, optional): a callback function that allows information about this org to be selected and 
        passed to another component 
    - includeParams (array, optional): specify explicitly certain URL param filters
    - excludeParams (array, optional): specify explicitly certain URL params to not include in the index
    - updateTrigger (function, optional): provide a variable that will refetch the list of orgs
    - blacklist (array, optional): provide an array of ids to exclue from the list. 
    - projAdd (integer): this index is used when users are trying to add organizations to projects, in which case
        they need access to view orgs they normally should not be able to see. If a value is provided here the backend
        will use a seperate endpoint. 
    -addRedirect (object, optional): provide optional params to redirect the user if they create an org
    */
    //context
    const { user } = useAuth();
    const { organizations, setOrganizations } = useOrganizations();
    const { projects, setProjects } = useProjects();

    //index helpers
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const [filters, setFilters] = useState(initial);
    const [projectSearch, setProjectSearch] = useState(''); //helps control filter select search

    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    
    //ref to scroll to errors automatically
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);
    
    //take include/exclude params and conver them to a string for the URL
    const params = useMemo(() => {
        //sepereate from filters, these are passed as params
        const allowedFields = ['project', 'event'];
        const include = includeParams?.filter(p => (allowedFields.includes(p?.field) && p?.value))
        ?.map(p => `&${p?.field}=${p?.value}`)
        .join('') ?? '';
        console.log(excludeParams)
        const exclude = excludeParams?.filter(p => (allowedFields.includes(p?.field) && p?.value))
        ?.map(p => `&exclude_${p?.field}=${p?.value}`)
        .join('') ?? '';

        return include + exclude

    }, [includeParams, excludeParams]);

    //load the list of orgs
    useEffect(() => {
        const loadOrgs = async () => {
            try {
                //convert filter object to a string for the URL
                const filterQuery = 
                    (filters.project ? `&project=${filters.project}` : '');
                
                //if projAdd is selected (and the user is not an admin), use a different endpoint
                const url = projAdd ? 
                    (user.role == 'admin' ? `/api/organizations/?search=${search}&page=${page}` + filterQuery + params : 
                        `/api/manage/projects/${projAdd}/get-orgs/?search=${search}&page=${page}`) :  
                    `/api/organizations/?search=${search}&page=${page}` + filterQuery + params;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                setOrganizations(data.results);
            } 
            catch (err) {
                console.error('Failed to fetch projects: ', err)
                setErrors(['Something went wrong, Please try again later.']);
            }
            finally {
                setLoading(false);
            }
        };
        loadOrgs();
    }, [page, search, filters, updateTrigger, params]);

    //load list of projects (for filter select), refresh on projectSearch change
    useEffect(() => {
        const getProjects = async() => {
            try{
                console.log('fetching projects...')
                const response = await fetchWithAuth(`/api/manage/projects/?search=${projectSearch}`);
                const data = await response.json();
                setProjects(data.results)
            }
            catch(err){
                console.error('Failed to fetch projects: ', err);
                setErrors(['Something went wrong, Please try again later.']);
            }
        }
        getProjects();
    }, [projectSearch]);

    //if the user is viewing this while adding subgrantees, redirect them back there if they try to create a new org
    const redirect = useMemo(() => {
        if(!addRedirect) return '/organizations/new'
        return `/organizations/new?to=${addRedirect?.to}&projectID=${addRedirect.projectID}&orgID=${addRedirect.orgID}`
    }, [addRedirect]);

    //filter out any blacklisted IDs
    const filteredOrgs = organizations?.filter(org => !blacklist.includes(org.id));

    if(loading) return callback ? <ComponentLoading /> : <Loading />
    return(
        <div className={styles.index}>
            {!callback && <h1>{user.role == 'admin' ? 'All Organizations' : 'My Organizations'}</h1>} 
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} 
                filter={<Filter onFilterChange={(inputs) => {setFilters(inputs); setPage(1);}} initial={initial} 
                config={filterConfig(projects, (v) => setProjectSearch(v))} 
            />}>
                {errors.length != 0 && <div ref={alertRef} className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                {['meofficer', 'manager', 'admin'].includes(user.role) && 
                <Link to={redirect || '/organizations/new'}><button><BsBuildingFillAdd /> Add an Organization</button></Link>}
                {filteredOrgs?.length == 0 ? 
                    <p>No organizations match your criteria.</p> :
                    filteredOrgs?.map(org => (
                        <OrganizationCard key={org.id} org={org} callback={callback ? callback : null} />
                    ))
                }
            </IndexViewWrapper>
        </div>
    )
}