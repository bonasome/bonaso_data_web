import React from 'react';
import styles from '../../styles/indexView.module.css'
import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth'
import ProjectFilters from './ProjectFilters';
import IndexViewWrapper from '../reuseables/IndexView';
import { useProjects } from '../../contexts/ProjectsContext';
import { Link } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import ComponentLoading from '../reuseables/ComponentLoading';

function ProjectCard({ project }) {
    const [loading, setLoading] = useState(false);
    const { projectDetails, setProjectDetails } = useProjects();
    const [active, setActive] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const { user } = useAuth();
    const handleClick = async () => {
        const willExpand = !expanded;
        setExpanded(willExpand);

        if (!willExpand) return;

        const found =  projectDetails.find(p => p.id === project.id);
        if (found) {
            setActive(found);
            return;
        }

        try {
            setLoading(true);
            const response = await fetchWithAuth(`/api/manage/projects/${project.id}/`);
            const data = await response.json();
            setProjectDetails(prev => [...prev, data]);
            setActive(data);
            setLoading(false);
        } 
        catch (err) {
            console.error('Failed to fetch projectanizatons: ', err);
            setLoading(false);
        }
    };

    return (
        <div className={expanded ? styles.expandedCard : styles.card} onClick={handleClick}>
            <Link to={`/projects/${project.id}`} style={{display:'flex', width:"fit-content"}}><h2>{project.name}</h2></Link>
            {expanded && loading && <ComponentLoading />}
            {expanded && active && (
                <>
                    <i>Lasts from {active.start} to {active.end} {user.role =='admin' && '('+active.status+')'} </i>
                    {active?.client && <h4> For: {project.client.name}</h4>}
                    <p>{active.description}</p>
                    <Link to={`/projects/${project.id}`}> <button>Go to Project</button></Link>
                    <Link to={`/projects/${project.id}/edit`}> <button>Edit Details</button></Link>
                </>
            )}
        </div>
    );
}

export default function ProjectsIndex(){
    const { user } = useAuth()
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const { projects, setProjects } = useProjects();
    const [loading, setLoading] = useState(true);
    const [startFilter, setStartFilter] = useState('');
    const [endFilter, setEndFilter] = useState('');
    const [clientFilter, setClientFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const filterQuery = 
                    (startFilter ? `&start=${startFilter}` : '') + 
                    (endFilter ? `&end=${endFilter}` : '') + 
                    (clientFilter ? `&client=${clientFilter}` : '') + 
                    (statusFilter ? `&status=${statusFilter}` : '');
                
                const url = `/api/manage/projects/?search=${search}&page=${page}` + filterQuery;
                console.log(url)
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                if (page === 1) {
                    setProjects(data.results);
                } else {
                    setProjects((prev) => [...prev, ...data.results]);
                }
                setLoading(false);
            } 
            catch (err) {
                console.error('Failed to fetch projects: ', err)
                setLoading(false)
            }
        };
        loadProjects();
    }, [page, search, endFilter, startFilter, clientFilter, statusFilter, setProjects]);

    const setFilters = (filters) => {
        setStartFilter(filters.filter);
        setEndFilter(filters.end);
        setClientFilter(filters.client)
        setStatusFilter(filters.status)
    }

    if(loading) return <Loading />
    return(
        <div className={styles.index}>
            <h1>{user.role == 'admin' ? 'All Projects' : 'My Projects'}</h1> 
            <IndexViewWrapper onSearchChange={setSearch} onPageChange={setPage} entries={entries} filter={<ProjectFilters onFilterChange={(inputs) => {setFilters(inputs); setPage(1);}}/>}>
                {user.role == 'admin' && <Link to='/projects/new'><button>Create New Project</button></Link>}
                
                {projects && projects?.length == 0 ? 
                    <p>No projects match your criteria.</p> :
                    projects.map(p => (
                    <ProjectCard key={p.id} project={p} />
                    ))
                }
            </IndexViewWrapper>
        </div>
    )
}