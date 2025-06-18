import React from 'react';
import { useState, useEffect } from "react";
import fetchWithAuth from "../../../services/fetchWithAuth";
import styles from '../projects/projects.module.css';

export function ProjectOrgs({ projectOrgs, handleClick }){
    const [searchValue, setSearchValue] = useState('');

    if(projectOrgs.length == 0){
        return(
            <div className={styles.sidePanel}>
                <button onClick={() => handleClick('manageOrgs')}>Add An Organization to this Project</button>
                <p>No organizations yet...</p>
            </div>
        )
    }
    return(
        <div className={styles.sidePanel}>
            <input type='text' onChange={(e)=> {setSearchValue(e.target.value)}} placeholder={'search an indicator by code, name, or description'} />
            <button onClick={() => handleClick('manageOrgs')}>Add An Organization to this Project</button>
            {projectOrgs.map((org) => {
                const search=searchValue.toLocaleLowerCase()
                const name = (org.name || '').toLowerCase();
                    if(search == '' || name.includes(search)){
                        return <div className={styles.card} key={org.id} onClick={() => handleClick('orgDetail', org)}>
                            <h3>{org.name}</h3>
                        </div>
                    }
                }
            )}
        </div>
    )
}

export function OrgsList({ project, handleClick, existing }){
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
    const [messages, setMessages] = useState([])
    const addOrg = async(orgID) => {
        try{
            const response = await fetchWithAuth('projects/api/add-org/', {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({'organization': orgID, 'project': project.id})
            });
            const data = await response.json();
            setMessages(data.message);
        }
        catch(err){
            console.error('Could not record project: ', err)
        }
    }
    if(loading) return <p>Loading...</p>
        if(orgs.length == 0 && searchValue == '') {
            return(
                <div>
                    <p>No organizations exist yet. Create One!</p>
                    <button onClick={() => handleClick('createIndicator')} >Create New Indicator</button>
                </div>
            )
        }
        const availableOrgs = orgs.filter(org => !existing.includes(org.id.toString()));
        if(availableOrgs.length == 0){
            return(
                <div>
                    <input type='text' onChange={(e)=> {setSearchValue(e.target.value); setPage}} placeholder={'search an indicator by code, name, or description'} />
                    <p>No organizations left to add!</p>
                    <button onClick={() => handleClick('createOrg')} >Create New Org</button>
                </div>
            )
        }
        return (
            <div className={styles.orgsList}>
                {messages && <ul>{messages.map((msg)=><li key={msg}>{msg}</li>)}</ul>}
                <input type='text' onChange={(e)=> {setSearchValue(e.target.value); setPage}} placeholder={'search an indicator by code, name, or description'} />
                {availableOrgs.map(org => {
                    const name = org.name.toLowerCase()
                    const search = searchValue.toLowerCase()
                    if(!search == '' && !name.includes(search)) return
                    return(<div key={'cont_' + org.id}>
                        <h4>{org.name}</h4>
                        <button key={'button_' + org.id} onClick={() => addOrg(org.id)}>
                            Add to Project
                        </button>
                    </div>)
                })}
            </div>
        );
}

function TaskCard({ task }){
    const [count, setCount] = useState('');
    const [targetInfo, setTargetInfo] = useState([])
    const [targetCounts, setTargetCounts] = useState([]);
    const [categoryCount, setCategoryCount] = useState([]);

    useEffect(()=> {
        if(!task || !task.interactions || task.interactions.length == 0) return;

        //respondents should only appear once in the raw counts
        const respondents = task.interactions.map(item => item.respondent)
        const distinctCount = [...new Set(respondents)];
        setCount(distinctCount.length)
        //if categories, get counts for those
        let categories = {};
        if(task.interactions[0].category_id != null){
            task.interactions.forEach(item => {
                const catID = item.category_id;
                if(categories[catID] == undefined){
                    categories[catID] = {
                        'name': item.category_name,
                        'respondents': []
                    }
                }
                categories[catID].respondents.push(item.respondent);
            })
            const transformedCats = Array.from(Object.entries(categories), ([key, value]) => ({ key, value }));
            let nameDistinctCount = []
            transformedCats.map(item => {
                const distinctCount = [...new Set(item.value.respondents)];
                nameDistinctCount.push({'name': item.value.name, 'count': distinctCount.length});
            })
            setCategoryCount(nameDistinctCount);
        }
        //if targets, map target/actual acheivement
        if(task.targets.length > 0){
            const targetActual = []
            const targetInfo = []
            task.targets.forEach(target => {
                const seen = new Set();
                const distinctResponse = task.interactions.filter(item => {
                if (seen.has(item.respondent)) {
                    return false;
                }
                seen.add(item.respondent);
                return true;
                });
                let actual = 0
                distinctResponse.map(item => {
                    if(item.date >= target.start && item.date <= target.end){
                        actual +=1
                    }
                })
                targetInfo.push({'start': target.start, 'end': target.end});
                targetActual.push({'actual': actual, 'target': target.amount});
            })
            setTargetInfo(targetInfo)
            setTargetCounts(targetActual);
        }
    }, [task])
    return(
        <div>
            <h3>{task.code}: {task.name}</h3>
            <p>Reach over project: {count}</p>
            {categoryCount && <><p>By Category</p><ul>{categoryCount.map(category => <li>{category.name}: {category.count}</li>)}</ul></>}
            <p>Compared Against Targets:</p>
            <ul>
                {targetCounts && targetCounts.length > 0 && targetCounts.map((pair, index) => <li key={targetCounts.actual+targetCounts.target}>
                    Period {targetInfo[index].start}-{targetInfo[index].end}: Actual: {pair.actual} Target: {pair.target}</li>)}
            </ul>
        </div>
    )
}

export function OrgDetail({ org, tasks }){
    if(!org) return <p>Select an indicator to get started...</p>
    return(
        <div className={styles.details}>
            <h4>Viewing</h4>
            <h2>{org.name}</h2>
            {tasks ? tasks.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
            )) : 
                <p> This organization does not have any tasks </p>
            }
        </div>
    )
}

export function AddTask({ project, org }){

}