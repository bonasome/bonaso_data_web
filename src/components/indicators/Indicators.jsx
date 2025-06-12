import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import styles from './indicators.module.css';


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
        <div className={styles.indicatorsList}>
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

export function IndicatorsList({ addClick=null, existing=null }){
    const [indicators, setIndicators] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchValue, setSearchValue] = useState('')
    const [loading, setLoading] = useState(true);
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
    if(loading) return <p>Loading...</p>
    if(indicators.length == 0) {
        return(
            <p>No indicators yet. Create one!</p>
        )
    }
    return(
        <div className={styles.indicatorsList}>
            <input type='text' onChange={(e)=> {setSearchValue(e.target.value); setPage}} placeholder={'search an indicator by code, name, or description'} />
            {indicators.map((ind) => {
                    if(existing && existing.includes(ind.code)) return
                    return(
                        <div key={'cont_'+ind.id}>
                            <IndicatorCard key={ind.id} indicator={ind} />
                            {addClick && <button key={'button_'+ind.id} onClick={() => addClick(ind.id)}>Add to Project</button>}
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