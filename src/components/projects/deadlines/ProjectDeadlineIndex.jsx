import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';

import { useAuth } from '../../../contexts/UserAuth';

import fetchWithAuth from '../../../../services/fetchWithAuth';
import { initial, filterConfig } from './filterConfig';

import Messages from '../../reuseables/Messages';
import IndexViewWrapper from '../../reuseables/IndexView';
import ProjectDeadlineCard from './ProjectDeadlineCard';
import Filter from '../../reuseables/Filter';
import ComponentLoading from '../../reuseables/loading/ComponentLoading';
import ButtonHover from '../../reuseables/inputs/ButtonHover';

import styles from '../../../styles/indexView.module.css';

import { TbTimelineEventPlus } from "react-icons/tb";

export default function ProjectDeadlineIndex({ project, onDelete=null }){
    //context
    const { user } = useAuth();

    const [deadlines, setDeadlines] = useState([]);

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

    //load events
    useEffect(() => {
        const loadDeadlines = async () => {
            try {
                const filterQuery = 
                    (filters.start ? `&start=${filters.start}` : '') + 
                    (filters.end ? `&end=${filters.end}` : '') + 
                    (filters.organization ? `&organizations=${filters.organization}` : '') +
                    (filters.public ? `&visible_to_all=${filters.public}` : '') +
                    (filters.visible_to_all ? `&visible_to_all=${filters.visible_to_all}` : '');
                
                const url = `/api/manage/deadlines/?search=${search}&page=${page}&project=${project.id}` + filterQuery;
                console.log(url)
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                setDeadlines(data.results);
                setLoading(false);
            } 
            catch (err) {
                setErrors(['Something went wrong, Please try again later.']);
                console.error('Failed to fetch events: ', err);
                setLoading(false)
            }
        };
        loadDeadlines();
    }, [page, search, filters]);

    //get orgs (for filter)
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
    const validDeadlines = deadlines?.filter(d => (!deleted.includes(d?.id)))
    return(
        <div className={styles.index}>
            <Messages errors={errors} />
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} filter={<Filter 
                onFilterChange={setFilters} config={filterConfig(orgs, (s) => setOrgSearch(s))} initial={initial}  
            />}>
                {!['client'].includes(user.role) && <Link to={`/projects/${project.id}/deadlines/new`}><ButtonHover  noHover={<TbTimelineEventPlus />} hover={'New Deadline'} /></Link>}
                {validDeadlines?.length === 0 ? 
                    <p>No activities match your criteria.</p> :
                    validDeadlines?.map(d => (
                        <ProjectDeadlineCard key={d.id} project={project.id} deadline={d} onDelete={() => setDeleted(prev => [...prev, d.id])} />)
                    )
                }
            </IndexViewWrapper>
        </div>
    )
}