import React from 'react';
import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';


export function IndicatorCard({ indicator, handleClick=null, }){
    return(
        <div key={indicator.id} className={styles.card} onClick={handleClick ? () => handleClick('indicatorDetail', indicator) : null}>
            <h4>{indicator.code}: {indicator.name}</h4>
            {indicator.description ? <p>{indicator.description}</p> : <p>No description.</p>}
        </div>
    )
}

export function ProjectIndicators({ indicators, handleClick }){

    const [searchValue, setSearchValue] = useState('');

    return(
        <div>
            <input type='text' onChange={(e)=> {setSearchValue(e.target.value)}} placeholder={'search an indicator by code, name, or description'} />
            <button onClick={() => handleClick('manageIndicators', null)}>Add An Indicator</button>
            {indicators.map((ind) => {
                const search=searchValue.toLocaleLowerCase()
                const code = (ind.code || '').toLowerCase();
                const name = (ind.name || '').toLowerCase();
                const desc = (ind.description || '').toLowerCase();
                    if(search == '' || code.includes(search) || name.includes(search) || desc.includes(search) ){
                        return <IndicatorCard key={ind.code} indicator={ind} handleClick={handleClick} />
                    }
                }
            )}
        </div>
    )

}

//general view for adding any indicator
export function IndicatorsList({ project, handleClick, existing }){
    const [indicators, setIndicators] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchValue, setSearchValue] = useState('')
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([])

    useEffect(() => {
        const getIndicators = async() => {
            try{
                const response = await fetchWithAuth(`indicators/api/get-list/?q=${searchValue}&page=${page}`);
                const data = await response.json();
                if (page === 1) {
                    setIndicators(data.results);
                } 
                else {
                    setIndicators((prev) => [...prev, ...data.results]);
                }
                setHasMore(Boolean(data.next));
                setIndicators(data.results);
                
                setLoading(false);
            }
            catch(err){
                console.error('Failed to fetch indicators: ', err)
                setLoading(false)
            }
        }
        getIndicators();
    }, [searchValue, page])

    const loadMore = () => {
        if (hasMore && !loading) setPage((prev) => prev + 1);
    };

    const addIndicator = async(indID) => {
        try{
            const response = await fetchWithAuth('projects/api/add-indicator/', {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({'indicator': indID, 'project': project.id})
            });
            const data = await response.json();
            setMessages(data.message);
        }
        catch(err){
            console.error('Could not record project: ', err)
        }
    }

    if(loading) return <p>Loading...</p>
    if(indicators.length == 0 && searchValue == '') {
        return(
            <div>
                <p>No indicators exist yet. Create One!</p>
                <button onClick={() => handleClick('createIndicator')} >Create New Indicator</button>
            </div>
        )
    }
    const availableIndicators = indicators.filter(ind => !existing.includes(ind.id.toString()));
    if(availableIndicators.length == 0 && searchValue ==''){
        return(
            <div>
                <p>No indicators left to add!</p>
                <button onClick={() => handleClick('createIndicator')} >Create New Indicator</button>
            </div>
        )
        
    }
    const remainingIndicators = availableIndicators
    return (
        <div className={styles.indicatorList}>
            {messages && <ul>{messages.map((msg)=><li key={msg}>{msg}</li>)}</ul>}
            <input type='text' onChange={(e)=> {setSearchValue(e.target.value); setPage}} placeholder={'search an indicator by code, name, or description'} />
            {remainingIndicators.map(ind => {
                const code = ind.code.toLowerCase()
                const name = ind.name.toLowerCase()
                const desc = ind.description.toLowerCase()
                const search = searchValue.toLowerCase()
                if(!search == '' && !code.includes(search) && !name.includes(search) && !desc.includes(search)) return
                return(<div key={'cont_' + ind.id}>
                    <IndicatorCard key={ind.id} indicator={ind} />
                    <button key={'button_' + ind.id} onClick={() => addIndicator(ind.id)}>
                        Add to Project
                    </button>
                </div>)
            })}
        </div>
    );
}

export function IndicatorDetail({ indicator }){
    const [loading, setLoading] = useState(true);
    const [options, setOptions] = useState({
        statusValues: [],
        statusLabels: [],
    })

    useEffect(() => {
        const getOptions = async() => {
            try{
                const response = await fetchWithAuth(`indicators/api/get-model-info/`);
                const data = await response.json();
                setOptions({
                    statusValues: data.values.status,
                    statusLabels: data.labels.status,
                });
                setLoading(false);
            }
            catch(err){
                console.error('Could not connect to server: ', err);
                setLoading(false);
            }
        }
        getOptions();
    }, []);


    if(loading) return <p>Loading...</p>
    if(!indicator) return <p>Select an indicator to get started...</p>
    return(
        <div className={styles.details}>
            <h4>Viewing</h4>
            <h2>{indicator.name}</h2>
            <h4>{indicator.code}</h4>
            <p>{indicator.description}</p>
        </div>
    )
}