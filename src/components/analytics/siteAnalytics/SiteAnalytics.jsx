import { useEffect, useState, useMemo } from 'react';

import fetchWithAuth from '../../../../services/fetchWithAuth';

import Loading from '../../reuseables/loading/Loading';
import { AvgTimeChart, MostRequested7d, AvgTimeChart7d } from './RequestsChart';

import theme from '../../../../theme/theme';
import errorStyles from '../../../styles/errors.module.css';

import { IoIosArrowDropup, IoIosArrowDropdownCircle } from "react-icons/io";
import prettyDates from '../../../../services/prettyDates';

export default function SiteAnalytics(){
    const [hackerData, setHackerData] = useState([]);

    const [showStatus, setShowStatus] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);



    useEffect(() => {
        const getData = async() => {
            try{
                const response = await fetchWithAuth('/api/analysis/meta/site-analytics/');
                const data = await response.json();
                data.forEach(r => {
                    r.path = r.path.replace(/\/\d+(?=\/|$)/g, "/:id").replace('/api/', '');
                });
                setHackerData(data);
            }
            catch(err){
                setErrors(['Something went wrong. Please try again later.']);
                console.error(err);
            }
            finally{
                setLoading(false);
            }
        }
        getData();
    }, []);

    //list of bad requests from the previous 24 hours (for identifying potential hotfixes)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const badRequest = useMemo(() => {
        return hackerData.filter((r) => (![200, 201, 207, 204, 401].includes(r.status_code) && new Date(r.timestamp) >= oneDayAgo));
    }, [hackerData])
        
    if(loading) return <Loading />
    return(
        <div>
            <h1 style={{ marginLeft: '2vh', marginRight: '2vh', marginTop: '4vh',marginBottom: '4vh'}}>Site Analytics Dashboard</h1>
            <div className={badRequest.length > 0 ? errorStyles.errors : errorStyles.success} style={{ padding: '2vh', margin: '2vh'}}>
                <div style={{ display: 'flex', flexDirection: 'row' }} onClick={() => setShowStatus(!showStatus)}>
                    <h3 style={{ textAlign: 'start'}}>{`${badRequest.length} bad requests`}</h3>
                    {showStatus ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                    <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                </div>

                {showStatus && <div>
                    {badRequest.length > 0 ? badRequest.map(r => (<div><ul>
                        <li>{r.path} ({r.status_code}): {prettyDates(r.timestamp,true)} ({r?.user?.display_name ?? 'Unidentified User'})</li>
                    </ul></div>)) : <p>No bad requsets...</p>}
                </div>}
            </div>

            <AvgTimeChart data={hackerData} />
            <AvgTimeChart7d data={hackerData.filter(r => (new Date(r.timestamp) >= oneWeekAgo))} />
            <MostRequested7d data={hackerData.filter(r => (new Date(r.timestamp) >= oneWeekAgo))} />
            
        </div>
    )
}