import React from 'react';
import styles from '../../styles/indexView.module.css'
import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth'
import Filter from '../reuseables/Filter';
import IndexViewWrapper from '../reuseables/IndexView';
import { useProjects } from '../../contexts/ProjectsContext';
import { Link } from 'react-router-dom';
import Loading from '../reuseables/loading/Loading';
import ComponentLoading from '../reuseables/loading/ComponentLoading';

function ProjectCard({ project, callback=null, callbackText }) {
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
            {callback && <button onClick={() => callback(project)}>{callbackText}</button>}
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

export default function ProjectsIndex({callback=null, callbackText='Select Project'}){
    const { user } = useAuth()
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const { projects, setProjects, setProjectsMeta, projectsMeta } = useProjects();
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState(initial);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const filterQuery = 
                    (filters.start ? `&start=${filters.start}` : '') + 
                    (filters.end ? `&end=${filters.end}` : '') + 
                    (filters.status ? `&status=${filters.status}` : '');

                const url = `/api/manage/projects/?search=${search}&page=${page}` + filterQuery;
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
    }, [page, search, filters]);

    useEffect(() => {
            const getProjectMeta = async () => {
                if(Object.keys(projectsMeta).length !== 0){
                    setLoading(false)
                    return;
                }
                else{
                    try{
                        console.log('fetching model info...')
                        const response = await fetchWithAuth(`/api/manage/projects/meta/`);
                        const data = await response.json();
                        setProjectsMeta(data);
                        setLoading(false);
                    }
                    catch(err){
                        console.error('Failed to fetch projects: ', err)
                        setLoading(false)
                    }
    
                }
            }
            getProjectMeta();
        }, []);
        
    if(loading) return callback ? <ComponentLoading /> :  <Loading />
    return(
        <div className={styles.index}>
            <h1>{user.role == 'admin' ? 'All Projects' : 'My Projects'}</h1> 
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} filter={<Filter onFilterChange={setFilters} schema={filterConfig(projectsMeta)} />}>
                {user.role == 'admin' && <Link to='/projects/new'><button>Create New Project</button></Link>}
                
                {(projects && projects?.length) == 0 ? 
                    <p>No projects match your criteria.</p> :
                    projects?.map(p => (
                    <ProjectCard key={p.id} project={p} callback={callback} callbackText={callbackText} />
                    ))
                }
            </IndexViewWrapper>
        </div>
    )
}