import React from 'react';
import styles from '../../styles/indexView.module.css'
import { useEffect, useState, useRef } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth'
import Filter from '../reuseables/Filter';
import IndexViewWrapper from '../reuseables/IndexView';
import { useProjects } from '../../contexts/ProjectsContext';
import { Link } from 'react-router-dom';
import Loading from '../reuseables/loading/Loading';
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import { initial, filterConfig } from './filterConfig';
import Messages from '../reuseables/Messages';
import { HiLightBulb } from "react-icons/hi";

function ProjectCard({ project, callback=null, callbackText }) {
    //context
    const { user } = useAuth();
    const { projectDetails, setProjectDetails } = useProjects();
    //loaded project details
    const [active, setActive] = useState(null);
    //page meta
    const [errors, setErrors] = useState([])
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    
    //get the project details on click
    const handleClick = async () => {
        const willExpand = !expanded;
        setExpanded(willExpand);

        if (!willExpand) return;
        const found =  projectDetails.find(p => p.id === project.id); //try using context first
        if (found) {
            setActive(found);
            setLoading(false);
            return;
        }
        try {
            const response = await fetchWithAuth(`/api/manage/projects/${project.id}/`);
            const data = await response.json();
            setProjectDetails(prev => [...prev, data]); //update context
            setActive(data);
        } 
        catch (err) {
            console.error('Failed to fetch projectanizatons: ', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setLoading(false);
        }
    };

    return (
        <div className={expanded ? styles.expandedCard : styles.card} onClick={handleClick}>
            <Link to={`/projects/${project.id}`} style={{display:'flex', width:"fit-content"}}><h2>{project.name}</h2></Link>
            {callback && <button onClick={() => callback(project)}>{callbackText}</button>}
            {expanded && loading && <ComponentLoading />}
            {expanded && active && 
                <div>
                    <Messages errors={errors} />
                    <i>Lasts from {active.start} to {active.end} {user.role =='admin' && '('+active.status+')'} </i>
                    {active?.client && <h4> For: {project.client.name}</h4>}
                    <p>{active.description}</p>
                    <Link to={`/projects/${project.id}`}> <button>Go to Project</button></Link>
                    {user.role === 'admin' && <Link to={`/projects/${project.id}/edit`}> <button>Edit Details</button></Link>}
                </div>
            }
        </div>
    );
}

export default function ProjectsIndex({callback=null, callbackText='Select Project', blacklist=[]}){
    //context
    const { user } = useAuth();
    const { projects, setProjects, setProjectsMeta, projectsMeta } = useProjects();
    //index helpers
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const [filters, setFilters] = useState(initial);

    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);

    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    //load the projects
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
                setProjects(data.results);
            } 
            catch (err) {
                console.error('Failed to fetch projects: ', err)
                setErrors(['Something went wrong. Please try again later.']);
            }
            finally{
                setLoading(false);
            }
        };
        loadProjects();
    }, [page, search, filters]); //update on search/page/filter change

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

    const filteredProj = projects?.filter(p => !blacklist.includes(p.id));
    if(!projects || loading) return callback ? <ComponentLoading /> :  <Loading />
    return(
        <div className={styles.index}>
            {!callback && <h1>{user.role == 'admin' ? 'All Projects' : 'My Projects'}</h1>} 
            <Messages errors={errors} />
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} 
                filter={<Filter onFilterChange={(inputs) => {setFilters(inputs); setPage(1)}} initial={initial} config={filterConfig(projectsMeta)} />}>
                {user.role == 'admin' && <Link to='/projects/new'><button><HiLightBulb /> Create New Project</button></Link>}
                {filteredProj?.length == 0 ? 
                    <p>No projects match your criteria.</p> :
                    filteredProj?.map(p => (
                        <ProjectCard key={p.id} project={p} callback={callback} callbackText={callbackText} />
                    ))
                }
            </IndexViewWrapper>
        </div>
    )
}