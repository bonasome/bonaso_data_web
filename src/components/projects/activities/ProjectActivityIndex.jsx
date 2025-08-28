import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';

import { useAuth } from '../../../contexts/UserAuth';
import { useProjects } from '../../../contexts/ProjectsContext';

import fetchWithAuth from '../../../../services/fetchWithAuth';
import { initial, filterConfig } from './filterConfig';

import Messages from '../../reuseables/Messages';
import IndexViewWrapper from '../../reuseables/IndexView';
import ProjectActivityCard from './ProjectActivityCard';
import Filter from '../../reuseables/Filter';
import ComponentLoading from '../../reuseables/loading/ComponentLoading';
import ButtonHover from '../../reuseables/inputs/ButtonHover';

import styles from '../../../styles/indexView.module.css';

import { TbTimelineEventPlus, TbCalendarEvent } from "react-icons/tb";

export default function ProjectActivitiyIndex({ project }){
    /*
    Lightweight index component meant to display a paginated list of activities related to a specific
    project. 
    - project (object): the project that these activities are related to. 
    */

    //context
    const { user } = useAuth();
    const { projectsMeta, setProjectsMeta } = useProjects();

    const [activities, setActivities] = useState([]); //list of activities to display

    //index helpers
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const [filters, setFilters] = useState(initial);
    const [orgs, setOrgs] = useState([]); //for filters
    const [orgSearch, setOrgSearch] = useState('');

    //page meta
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleted, setDeleted] = useState([]);

    //get the meta
    useEffect(() => {
        const getProjectMeta = async () => {
            if(Object.keys(projectsMeta).length !== 0){
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/manage/projects/meta/`);
                    const data = await response.json();
                    setProjectsMeta(data);
                }
                catch(err){
                    console.error('Failed to fetch projects: ', err);
                    setErrors(['Something went wrong. Please try again later.']);
                }
                finally{
                    setLoading(false);
                }
            }
        }
        getProjectMeta();
    }, []);

    //load events
    useEffect(() => {
        const loadActivities = async () => {
            try {
                //convert filters object into a string for the URL
                const filterQuery = 
                    (filters.start ? `&start=${filters.start}` : '') + 
                    (filters.end ? `&end=${filters.end}` : '') + 
                    (filters.organization ? `&organizations=${filters.organization}` : '') +
                    (filters.public ? `&visible_to_all=${filters.public}` : '') +
                    (filters.status ? `&status=${filters.status}` : '') + 
                    (filters.visible_to_all ? `&visible_to_all=${filters.visible_to_all}` : '') +
                    (filters.category ? `&category=${filters.category}` : '');
                
                const url = `/api/manage/activities/?search=${search}&page=${page}&project=${project.id}` + filterQuery;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                setActivities(data.results);
                setLoading(false);
            } 
            catch (err) {
                setErrors(['Something went wrong, Please try again later.']);
                console.error('Failed to fetch events: ', err);
                setLoading(false)
            }
        };
        loadActivities();
    }, [page, search, filters]);

    //get orgs (for filtering)
    useEffect(() => {
        const loadOrgs = async () => {
            try {
                const url = `/api/organizations/?search=${search}`;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setOrgs(data.results);
            } 
            catch (err) {
                console.error('Failed to fetch organizations: ', err)
                setErrors(['Something went wrong, Please try again later.']);
            }
            finally {
                setLoading(false);
            }
        };
        loadOrgs();
    }, [orgSearch]);

    if(loading) return <ComponentLoading />
    //filter out any deleted activities
    const validActivities = activities?.filter(a => (!deleted.includes(a?.id)));
    return(
        <div className={styles.index}>
            <Messages errors={errors} />
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} filter={<Filter 
                onFilterChange={setFilters} config={filterConfig(projectsMeta, orgs, (s) => setOrgSearch(s))} initial={initial}  
            />}>
                {!['client'].includes(user.role) && <Link to={`/projects/${project.id}/activities/new`}><ButtonHover  noHover={<TbCalendarEvent />} hover={'New Activity'} /></Link>}
                {validActivities?.length === 0 ? 
                    <p>No activities match your criteria.</p> :
                    validActivities?.map(act => (
                        <ProjectActivityCard key={act.id} project={project.id} activity={act} onDelete={() => setDeleted(prev => [...prev, act.id])} />)
                    )
                }
            </IndexViewWrapper>
        </div>
    )
}