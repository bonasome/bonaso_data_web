import { useState, useEffect } from "react";
import { IndicatorCard } from "../indicators/Indicators";
import fetchWithAuth from "../../../services/fetchWithAuth";
import styles from '../projects/projects.module.css';

export function ProjectOrgs({ project, handleClick }){
    const [orgs, setOrgs] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const getIndicators = async() => {
            try{
                const response = await fetchWithAuth(`projects/api/${project.id}/get-orgs/`);
                const data = await response.json();
                setOrgs(data.results);
                setLoading(false);
            }
            catch(err){
                console.error('Failed to fetch indicators: ', err)
                setLoading(false)
            }
        }
        getIndicators();
    }, [])
    if(loading) return <p>Loading...</p>
    if(orgs.length == 0){
        return(
            <div>
                <button onClick={() => handleClick('manageOrgs')}>Add An Organization to this Project</button>
                <p>No organizations yet...</p>
            </div>
        )
    }
    return(
        <div className={styles.organizationsList}>
            <input type='text' onChange={(e)=> {setSearchValue(e.target.value)}} placeholder={'search an indicator by code, name, or description'} />
            <button onClick={() => handleClick('manageOrgs')}>Add An Organization to this Project</button>
            {orgs.map((org) => {
                const search=searchValue.toLocaleLowerCase()
                const name = (org.name || '').toLowerCase();
                    if(search == '' || name.includes(search)){
                        return <div key={org.id} onClick={() => handleClick('orgDetail', org)}>
                            <h3>{org.name}</h3>
                        </div>
                    }
                }
            )}
        </div>
    )
}

export function OrgsList({ addClick=null }){
    const [orgs, setOrgs] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchValue, setSearchValue] = useState('')
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getRespondents = async() => {
            try{
                const response = await fetchWithAuth(`organizations/api/get-list/?q=${searchValue}&page=${page}`);
                const data = await response.json();
                if (page === 1) {
                    setOrgs(data.results);
                } 
                else {
                    setOrgs((prev) => [...prev, ...data.results]);
                }
                setHasMore(Boolean(data.next));
                setOrgs(data.results);
                
                setLoading(false);
            }
            catch(err){
                console.error('Failed to fetch organizations: ', err)
                setLoading(false)
            }
        }
        getRespondents();
    }, [searchValue, page])

    const loadMore = () => {
        if (hasMore && !loading) setPage((prev) => prev + 1);
    };
    if(loading) return <p>Loading...</p>
    if(orgs.length == 0) {
        return(
            <p>No organizations yet. Create one!</p>
        )
    }
    return(
        <div className={styles.indicatorsList}>
            <input type='text' onChange={(e)=> {setSearchValue(e.target.value); setPage}} placeholder={'search an indicator by code, name, or description'} />
            {orgs.map((org) => {
                    return(
                        <div key={'cont_'+org.id}>
                            <h3>{org.name}</h3>
                            {addClick && <button key={'button_'+org.id} onClick={() => addClick(org.id)}>Add to Project</button>}
                        </div>
                    )
                }
            )}
            {hasMore && (
                <button onClick={loadMore} disabled={loading}>
                    {loading ? 'Loading...' : 'Load More'}
                </button>
            )}
        </div>
    )
}

export function OrgDetail({ org, tasks }){
    const [loading, setLoading] = useState(false);
    if(loading) return <p>Loading...</p>
    if(!org) return <p>Select an indicator to get started...</p>
    return(
        <div className={styles.details}>
            <h4>Viewing</h4>
            <h2>{org.name}</h2>
            {tasks ? tasks.map((task) => {
                return <IndicatorCard indicator={task} handleClick={null} key={'task_'+task.id}/>
            }) : <p>This organization has no indicators assigned to it...</p>
            }
        </div>
    )
}

export function AddTask({ project, org }){

}