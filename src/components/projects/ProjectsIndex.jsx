import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth'
import { useProjects } from '../../contexts/ProjectsContext';

import fetchWithAuth from '../../../services/fetchWithAuth';
import { initial, filterConfig } from './filterConfig';

import Filter from '../reuseables/Filter';
import IndexViewWrapper from '../reuseables/IndexView';
import Messages from '../reuseables/Messages';
import Loading from '../reuseables/loading/Loading';
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import ButtonHover from '../reuseables/inputs/ButtonHover';

import styles from '../../styles/indexView.module.css'

import { HiLightBulb } from "react-icons/hi";
import { GiJumpAcross } from 'react-icons/gi';
import { ImPencil } from 'react-icons/im';

function ProjectCard({ project, callback=null }) {
    /*
    Component that displays a paginated list of projects. Can be used either as a standalone component
    or within a model select component. 
    - project (object): information about the project to display
    - callback (function, optional): if being used with a model select, function pass the project's information 
        to another component.
    - callbackText (string, optional): text to display on button that triggers the callback function
    */

    //context
    const { user } = useAuth();
    const { projectDetails, setProjectDetails } = useProjects();
    //loaded project details
    const [active, setActive] = useState(null);
    //page meta
    const [errors, setErrors] = useState([])
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    
    //get the project details on click, since the project object passed is from a lightweight list serializer
    const handleClick = async () => {
        const willExpand = !expanded; //helper var since expanded has changed but the state may not have updated
        setExpanded(willExpand);

        if (!willExpand) return; //return if collapsing
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
            {callback ? <h2>{project.name}</h2> : <Link to={`/projects/${project.id}`} style={{display:'flex', width:"fit-content"}}><h2>{project.name}</h2></Link>}
            {callback && <button type="button" onClick={() => callback(project)}>{project.name}</button>}
            {expanded && loading && <ComponentLoading />}
            {expanded && active && 
                <div>
                    <Messages errors={errors} />
                    <i>Lasts from {active.start} to {active.end} {user.role =='admin' && '('+active.status+')'} </i>
                    {active?.client && <h4> For: {project.client.name}</h4>}
                    <p>{active.description ? active.description : 'No Description'}</p>
                    {/* Hide link on callback */}
                    {!callback && <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <Link to={`/projects/${active.id}`}>
                            <ButtonHover noHover={<GiJumpAcross />} hover={'Go to Page'} />
                        </Link>
                        {user.role === 'admin' && <Link to={`/projects/${active.id}/edit`}>
                            <ButtonHover noHover={<ImPencil />} hover={'Edit Details'} />
                        </Link>}
                    </div>}
                </div>
            }
        </div>
    );
}

export default function ProjectsIndex({callback=null, callbackText='Select Project', blacklist=[]}){
    /*
    Component that displays a paginated list of projects. 
    - callback (function, optional): function to pass a project value to another component (i.e., model select)
    - callbackText (string, optional): text to display on the callback button
    - blacklist (array, optional): array of IDs to explicitly hide from the index
    */
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
                //convert filter object to a string for the URL params
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
            //try context first
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

    //remove blacklisted IDs
    const filteredProj = projects?.filter(p => !blacklist.includes(p.id));
    if(!projects || loading) return callback ? <ComponentLoading /> :  <Loading />
    return(
        <div className={styles.index}>
            {!callback && <h1>{user.role == 'admin' ? 'All Projects' : 'My Projects'}</h1>} 
            {!callback && <p>
                Here you can view all of your projects. Within a project, you can view announcements for 
                that project, activities related to that project, organizations in that project,
                and tasks and targets for each organization in the project.    
            </p>}
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